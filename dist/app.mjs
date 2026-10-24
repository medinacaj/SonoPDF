import { chunkText, SpeechPlayer } from './reader-core.mjs';
import { readPdf, validatePdf } from './pdf-loader.mjs';

const $ = id => document.getElementById(id);
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Reading works without storage. */ } },
};
const rawSettings = storage.get('avv-settings', {});
const settings = { rate: [0.5,0.75,1,1.25,1.5,1.75,2].includes(rawSettings?.rate) ? rawSettings.rate : 1,
  font: [18,21,25].includes(rawSettings?.font) ? rawSettings.font : 21,
  voiceURI: typeof rawSettings?.voiceURI === 'string' ? rawSettings.voiceURI : null };
let currentDoc = null;
let visiblePage = 0;
let renderedPage = -1;
let voices = [];
let busy = false;
let loadGeneration = 0;
let loadController = null;
let lastHighlighted = -1;
let lastStatus = '';
let scrubbing = false;
const PROGRESS_STEPS = 1000;
const WORDS_PER_MINUTE = 160;
const canSpeak = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
$('speech-warning').hidden = canSpeak;
const player = new SpeechPlayer({
  synth: window.speechSynthesis,
  onChange: updatePlayback,
  onError: message => showMessage(message, 'error'),
  onBoundary: updateProgress,
});

function showMessage(text, kind = '') {
  $('message').textContent = text;
  $('message').className = `message ${kind}`;
  $('message').hidden = !text;
}
function saveSettings() { storage.set('avv-settings', settings); }
function savePosition() {
  if (!currentDoc || currentDoc.isDemo) return;
  const stored = storage.get('avv-positions', {});
  const positions = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  positions[currentDoc.fingerprint] = { index: player.index, page: visiblePage, completed: player.status === 'ended', at: Date.now() };
  const recent = Object.fromEntries(Object.entries(positions).sort((a,b) => (b[1]?.at || 0) - (a[1]?.at || 0)).slice(0,30));
  storage.set('avv-positions', recent);
}
const formatRate = rate => `${String(rate).replace('.', ',')}×`;
function formatTime(seconds) {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
function totalSeconds() {
  return currentDoc ? currentDoc.wordCount / (WORDS_PER_MINUTE * player.rate) * 60 : 0;
}
/** Reading position as a 0–1 fraction of the document's characters. */
function fractionAt(index, charIndex = 0) {
  if (!currentDoc?.totalChars) return 0;
  const within = Math.min(charIndex, currentDoc.chunks[index]?.text.length || 0);
  return Math.min(1, (currentDoc.offsets[index] + within) / currentDoc.totalChars);
}
function chunkAtFraction(fraction) {
  const target = fraction * currentDoc.totalChars;
  let index = 0;
  while (index + 1 < currentDoc.offsets.length && currentDoc.offsets[index + 1] <= target) index++;
  return index;
}
function setProgressBar(fraction) {
  $('progress').value = Math.round(fraction * PROGRESS_STEPS);
  $('progress').style.setProperty('--progress', `${fraction * 100}%`);
  const total = totalSeconds();
  $('progress-label').textContent = currentDoc?.chunks.length ? `${formatTime(fraction * total)} / ${formatTime(total)}` : '0:00';
}
function updateProgress() {
  // While the finger is on the slider, the preview belongs to the user.
  if (scrubbing) return;
  const hasText = !!currentDoc?.chunks.length;
  const fraction = !hasText ? 0 : player.status === 'ended' ? 1 : fractionAt(player.index, player.charIndex);
  setProgressBar(fraction);
  const state = { ready: 'Listo para escuchar', playing: 'Leyendo', paused: 'En pausa', ended: 'Lectura completada' }[player.status];
  $('playback-status').textContent = hasText ? `${state} · Fragmento ${player.index + 1} de ${player.chunks.length}` : currentDoc ? 'No hay texto disponible para escuchar' : 'Esperando tu documento';
  $('progress').setAttribute('aria-valuetext', hasText ? `${formatTime(fraction * totalSeconds())} de ${formatTime(totalSeconds())}, fragmento ${player.index + 1} de ${player.chunks.length}` : 'Sin documento');
}
function previewScrub() {
  if (!currentDoc?.chunks.length) return;
  scrubbing = true;
  const fraction = Number($('progress').value) / PROGRESS_STEPS;
  const index = chunkAtFraction(fraction);
  setProgressBar(fraction);
  $('playback-status').textContent = `Suelta para ir al fragmento ${index + 1} de ${currentDoc.chunks.length}`;
}
function commitScrub() {
  if (!scrubbing) return;
  scrubbing = false;
  if (currentDoc?.chunks.length) seekTo(chunkAtFraction(Number($('progress').value) / PROGRESS_STEPS));
  updateProgress();
}
function setRate(rate) {
  settings.rate = rate;
  $('speed').value = String(rate);
  player.configure({ rate });
  saveSettings();
}
function toggleRateMenu(open = $('rate-menu').hidden) {
  $('rate-menu').hidden = !open;
  $('player-rate').setAttribute('aria-expanded', String(open));
  if (open) $('rate-menu').querySelector('[aria-pressed=true]')?.focus();
}
function renderPage() {
  if (!currentDoc || renderedPage === visiblePage) return;
  renderedPage = visiblePage;
  lastHighlighted = -1;
  const fragment = document.createDocumentFragment();
  currentDoc.chunks.forEach((chunk, index) => {
    if (chunk.page !== visiblePage) return;
    const button = document.createElement('button');
    button.className = 'reading-chunk';
    button.dataset.index = index;
    button.textContent = chunk.text;
    button.title = 'Leer desde este fragmento';
    button.addEventListener('click', () => { seekTo(index); if(canSpeak && !busy) player.play(); });
    fragment.append(button);
  });
  if (!fragment.childNodes.length) {
    const note = document.createElement('div');
    note.className = 'blank-page';
    const title = document.createElement('strong');
    title.textContent = 'Esta página no contiene texto seleccionable.';
    const body = document.createElement('p');
    body.textContent = 'Puede ser una página vacía o una imagen escaneada. Al reproducir, se continuará en la siguiente página con texto, si la hay.';
    note.append(title, body); fragment.append(note);
  }
  $('reading-text').replaceChildren(fragment);
  $('reading-text').scrollTop = 0;
  $('page-select').value = String(visiblePage);
  $('prev-page').disabled = visiblePage === 0 || busy;
  $('next-page').disabled = visiblePage >= currentDoc.pages.length - 1 || busy;
}
function updatePlayback() {
  const hasText = !!currentDoc?.chunks.length;
  const active = player.chunks[player.index];
  if (player.status === 'playing' && active && currentDoc && visiblePage !== active.page) {
    visiblePage = active.page;
  }
  renderPage();
  const isPlaying = player.status === 'playing';
  $('play').disabled = !hasText || !canSpeak || busy;
  $('play').setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
  $('play-label').textContent = isPlaying ? 'Pausar' : 'Reproducir';
  $('play').querySelector('use').setAttribute('href', isPlaying ? '#i-pause' : '#i-play');
  $('previous').disabled = !hasText || player.index <= 0 || busy;
  $('next').disabled = !hasText || player.index >= player.chunks.length - 1 || busy;
  $('progress').disabled = !hasText || busy;
  updateProgress();
  const rateLabel = formatRate(player.rate);
  $('player-rate').textContent = rateLabel;
  $('player-rate').setAttribute('aria-label', `Velocidad: ${rateLabel}. Cambiar velocidad`);
  document.querySelectorAll('[data-rate]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.rate) === player.rate)));
  if (currentDoc) {
    const words = currentDoc.wordCount;
    $('time-estimate').textContent = words ? `≈ ${Math.max(1,Math.ceil(words / (WORDS_PER_MINUTE * player.rate)))} min` : 'Sin texto';
    $('time-estimate').title = 'Duración total estimada; depende de la voz elegida';
  }
  if (lastHighlighted !== player.index || lastStatus !== player.status) {
    $('reading-text').querySelectorAll('.reading-chunk').forEach(button => {
      const isActive = Number(button.dataset.index) === player.index;
      button.setAttribute('aria-current', String(isActive));
      if (isActive && isPlaying) {
        // Scroll within the text panel without moving the surrounding page.
        const panel = $('reading-text');
        const top = button.offsetTop - panel.offsetTop;
        if (top < panel.scrollTop || top + button.offsetHeight > panel.scrollTop + panel.clientHeight) {
          panel.scrollTo({ top: Math.max(0,top - 30), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }
      }
    });
    lastHighlighted = player.index;
    lastStatus = player.status;
  }
  savePosition();
}
function seekTo(index) {
  if (!currentDoc?.chunks.length || busy) return;
  const target = Math.max(0,Math.min(currentDoc.chunks.length - 1,Number(index)));
  visiblePage = currentDoc.chunks[target].page;
  player.seek(target);
  renderPage();
  updatePlayback();
}
function changePage(page) {
  if (!currentDoc || busy) return;
  const target = Math.max(0,Math.min(currentDoc.pages.length - 1,Number(page)));
  const index = currentDoc.chunks.findIndex(chunk => chunk.page === target);
  if (index >= 0) { visiblePage = target; player.seek(index); }
  else { player.pause(); visiblePage = target; }
  renderPage();
  updatePlayback();
}
function openDocument({ name, pages, fingerprint, isDemo = false }) {
  const chunks = pages.flatMap((text,page) => chunkText(text).map(text => ({ text, page })));
  const positions = storage.get('avv-positions', {});
  const saved = !isDemo && positions?.[fingerprint];
  const index = saved && !saved.completed && Number.isInteger(saved.index) ? Math.max(0,Math.min(chunks.length - 1,saved.index)) : 0;
  visiblePage = saved && !saved.completed && Number.isInteger(saved.page) ? Math.max(0,Math.min(pages.length - 1,saved.page)) : chunks[index]?.page || 0;
  const offsets = [];
  let totalChars = 0;
  for (const chunk of chunks) { offsets.push(totalChars); totalChars += chunk.text.length + 1; }
  currentDoc = { name, pages, fingerprint, isDemo, chunks, offsets, totalChars, wordCount:pages.join(' ').trim().split(/\s+/u).filter(Boolean).length };
  renderedPage = -1;
  document.body.classList.add('has-doc');
  $('empty-state').hidden = true;
  $('reading-text').hidden = false;
  $('page-bar').hidden = false;
  $('document-name').textContent = name;
  $('document-name').title = name;
  $('document-detail').textContent = `${pages.length} ${pages.length === 1 ? 'página' : 'páginas'} · ${currentDoc.wordCount.toLocaleString('es')} palabras${isDemo ? ' · Demostración' : ''}`;
  $('document-tag').textContent = isDemo ? 'EJEMPLO' : 'PDF';
  $('choose-label').textContent = isDemo ? 'Elegir un PDF' : 'Cambiar PDF';
  $('page-select').replaceChildren(...pages.map((_,index) => {
    const option = document.createElement('option'); option.value = index; option.textContent = `${index+1} de ${pages.length}`; return option;
  }));
  $('reader-note').textContent = 'Toca un fragmento para escucharlo desde ahí.';
  player.load(chunks,index);
  renderPage();
  if (!chunks.length) showMessage('Este PDF no contiene texto seleccionable. Si está escaneado, necesita reconocimiento de texto (OCR), que esta versión no incluye.', 'warning');
  else if (saved && !saved.completed && (saved.index > 0 || saved.page > 0)) showMessage('Hemos recuperado tu punto de lectura en este navegador.');
  else showMessage('');
  if (matchMedia('(max-width: 760px)').matches) requestAnimationFrame(() => $('reader').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
}
function setBusy(value) {
  busy = value;
  $('load-progress').hidden = !value;
  $('choose-file').setAttribute('aria-busy',String(value));
  $('choose-label').textContent = value ? 'Abriendo…' : currentDoc && !currentDoc.isDemo ? 'Cambiar PDF' : 'Elegir un PDF';
  $('page-select').disabled = value;
  $('reading-text').setAttribute('aria-busy',String(value));
  // Disable clickable chunks during replacement, retaining the previous document on failure.
  $('reading-text').querySelectorAll('button').forEach(button => { button.disabled = value; });
  if(currentDoc) {
    $('prev-page').disabled = value || visiblePage === 0;
    $('next-page').disabled = value || visiblePage === currentDoc.pages.length - 1;
  }
  updatePlayback();
}
async function loadFile(file) {
  if (!file) return;
  try { validatePdf(file); } catch(error) { showMessage(error.message,'error'); return; }
  const generation = ++loadGeneration;
  loadController?.abort();
  loadController = new AbortController();
  player.pause();
  showMessage('');
  $('load-label').textContent = 'Abriendo tu PDF…';
  setBusy(true);
  try {
    const result = await readPdf(file, {
      signal: loadController.signal,
      onProgress: ({current,total}) => {
        if (generation === loadGeneration) $('load-label').textContent = `Leyendo página ${current} de ${total}…`;
      },
    });
    if (generation !== loadGeneration) return;
    openDocument({ name:file.name, ...result });
  } catch(error) {
    if (generation === loadGeneration && error.name !== 'AbortError') showMessage(error.message || 'No se pudo abrir el PDF. Inténtalo de nuevo.','error');
  } finally {
    if (generation === loadGeneration) setBusy(false);
  }
}
function loadDemo() {
  ++loadGeneration; loadController?.abort(); setBusy(false);
  openDocument({ name:'El placer de escuchar',fingerprint:'demo',isDemo:true,pages:[
    'Escuchar también es una forma de leer. A veces, solo necesitamos apartar la mirada de la pantalla y dejar que las palabras nos acompañen. Un libro, unos apuntes o ese artículo pendiente pueden encontrar un nuevo ritmo.\n\nCon SonoPDF puedes elegir una voz, ajustar la velocidad y seguir el texto mientras lo escuchas. Cada fragmento se ilumina para que siempre sepas dónde estás.\n\nNo hay prisa. Puedes hacer una pausa, volver a una idea o saltar al siguiente fragmento. La lectura se adapta a ti, a tus tiempos y a tu manera de descubrir.\n\nEste texto es una demostración. Cuando quieras empezar tu propia lectura, selecciona un PDF con texto y pulsa Reproducir. Tu próxima historia ya te está esperando.'
  ] });
}
function refreshVoices() {
  if (!canSpeak) return;
  try { voices = window.speechSynthesis.getVoices(); } catch { voices=[]; }
  voices = [...voices].sort((a,b) => Number(b.lang.startsWith('es')) - Number(a.lang.startsWith('es')) || a.name.localeCompare(b.name));
  // An empty string is the user's explicit choice of the browser default.
  let selected = null;
  if (settings.voiceURI !== '') {
    selected = voices.find(v => v.voiceURI === settings.voiceURI) || voices.find(v => v.lang.startsWith('es') && v.localService) || voices.find(v => v.lang.startsWith('es')) || voices.find(v => v.default) || voices[0] || null;
  }
  // Browsers may return fresh voice objects on voiceschanged. Retain an unchanged voice.
  if (selected && player.voice?.voiceURI === selected.voiceURI) selected = player.voice;
  const defaultOption = document.createElement('option'); defaultOption.value=''; defaultOption.textContent='Voz predeterminada';
  $('voice').replaceChildren(defaultOption,...voices.map(voice => {
    const option = document.createElement('option'); option.value=voice.voiceURI; option.textContent=`${voice.name} · ${voice.lang}`; return option;
  }));
  $('voice').value = selected?.voiceURI || '';
  player.configure({ voice:selected || null });
  updateVoiceNote(selected);
}
function updateVoiceNote(voice) {
  $('voice-note').textContent = voice ? voice.localService ? 'Voz del dispositivo · Procesamiento local de voz.' : 'Esta voz usa un servicio en línea del proveedor y puede enviarle el texto.' : 'Voz predeterminada: puede usar un servicio en línea. Las voces dependen de tu dispositivo.';
}
$('choose-file').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', event => { const file=event.target.files[0]; event.target.value=''; loadFile(file); });
$('demo').addEventListener('click',loadDemo);
$('play').addEventListener('click', () => {
  if(busy) return;
  showMessage('');
  if(player.status === 'playing') { player.pause(); return; }
  if(currentDoc?.chunks.length && currentDoc.chunks[player.index]?.page !== visiblePage) {
    const next = currentDoc.chunks.findIndex(chunk => chunk.page >= visiblePage);
    if(next < 0) { showMessage('No hay más texto después de esta página. Elige una página anterior para seguir escuchando.'); return; }
    seekTo(next);
  }
  player.play();
});
$('previous').addEventListener('click',() => seekTo(player.index-1));
$('next').addEventListener('click',() => seekTo(player.index+1));
// Dragging only previews the target; the jump happens when the slider is released.
$('progress').addEventListener('input',previewScrub);
$('progress').addEventListener('change',commitScrub);
$('progress').addEventListener('blur',commitScrub);
$('player-rate').addEventListener('click',() => toggleRateMenu());
document.querySelectorAll('[data-rate]').forEach(button => button.addEventListener('click',() => {
  setRate(Number(button.dataset.rate)); toggleRateMenu(false); $('player-rate').focus();
}));
document.addEventListener('click',event => { if (!$('rate-menu').hidden && !event.target.closest('.rate-wrap')) toggleRateMenu(false); });
$('rate-menu').addEventListener('keydown',event => { if (event.key === 'Escape') { toggleRateMenu(false); $('player-rate').focus(); } });
$('page-select').addEventListener('change',event => changePage(Number(event.target.value)));
$('prev-page').addEventListener('click',() => changePage(visiblePage-1));
$('next-page').addEventListener('click',() => changePage(visiblePage+1));
$('speed').value = String(settings.rate);
$('speed').addEventListener('change',event => setRate(Number(event.target.value)));
$('voice').addEventListener('change',event => {
  settings.voiceURI=event.target.value;
  const voice=voices.find(v => v.voiceURI === settings.voiceURI) || null;
  player.configure({voice}); updateVoiceNote(voice); saveSettings();
});
function setFont(font) {
  settings.font=font; document.documentElement.style.setProperty('--reading-size',`${font}px`);
  document.querySelectorAll('[data-font]').forEach(button => button.setAttribute('aria-pressed',String(Number(button.dataset.font)===font)));
}
document.querySelectorAll('[data-font]').forEach(button => button.addEventListener('click',() => {setFont(Number(button.dataset.font));saveSettings();}));
setFont(settings.font);
player.configure({rate:settings.rate});
refreshVoices();
window.speechSynthesis?.addEventListener('voiceschanged',refreshVoices);
let dragDepth=0;
$('dropzone').addEventListener('dragenter',event => { event.preventDefault(); dragDepth++; $('dropzone').classList.add('dragging'); });
$('dropzone').addEventListener('dragover',event => event.preventDefault());
$('dropzone').addEventListener('dragleave',event => { event.preventDefault(); if(--dragDepth<=0) {dragDepth=0;$('dropzone').classList.remove('dragging');} });
$('dropzone').addEventListener('drop',event => {
  event.preventDefault(); dragDepth=0;$('dropzone').classList.remove('dragging');
  if(event.dataTransfer.files.length>1) showMessage('Elige un solo PDF cada vez.','warning');
  else loadFile(event.dataTransfer.files[0]);
});
// Dropping a file outside the target must not navigate away from the reader.
window.addEventListener('dragover',event => {if(event.dataTransfer.types.includes('Files'))event.preventDefault();});
window.addEventListener('drop',event => {if(event.dataTransfer.types.includes('Files'))event.preventDefault();});
const dialog = $('help-dialog');
$('help').addEventListener('click',()=>dialog.showModal());
$('close-help').addEventListener('click',()=>dialog.close());
$('help-done').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event => {if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
window.addEventListener('pagehide',()=>{savePosition();player.pause();loadController?.abort();});
