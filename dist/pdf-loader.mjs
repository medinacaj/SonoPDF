const MAX_PDF_BYTES = 30 * 1024 * 1024;
const VENDOR_URL = new URL('./vendor/pdfjs/', import.meta.url);
let pdfjsPromise;

export function validatePdf(file) {
  if (!file || typeof file.name !== 'string' || !/\.pdf$/i.test(file.name)) {
    throw new Error('Selecciona un archivo PDF válido (.pdf).');
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error('El PDF está vacío. Selecciona otro archivo.');
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('El PDF supera el límite de 30 MB. Selecciona un archivo más pequeño.');
  }
}

// Preserve PDF.js reading order and its explicit word spacing. Font changes can
// split a single word into adjoining items, so do not blindly join with spaces.
export function textItemsToText(items) {
  let text = '';
  let previous = null;
  for (const item of items) {
    if (typeof item.str !== 'string') continue;
    const str = item.str.replace(/\s+/gu, ' ');
    if (str && previous && text && !/\s$/u.test(text) && !/^\s/u.test(str)) {
      const a = previous.transform;
      const b = item.transform;
      let separator = ' ';
      if (a?.length === 6 && b?.length === 6) {
        const height = Math.max(Math.hypot(a[2], a[3]), Math.hypot(b[2], b[3]), 1);
        if (Math.abs(a[5] - b[5]) > height * 0.5) {
          separator = '\n';
        } else {
          const gap = item.dir === 'rtl'
            ? a[4] - (b[4] + (item.width || 0))
            : b[4] - (a[4] + (previous.width || 0));
          separator = gap > height * 0.15 ? ' ' : '';
        }
      }
      text += separator;
    }
    text += str;
    if (item.hasEOL) text += '\n';
    if (str) previous = item;
  }
  return text.replace(/[^\S\n]+/gu, ' ').replace(/ *\n */gu, '\n').replace(/\n+/gu, '\n').trim();
}

async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('./vendor/pdfjs/legacy/build/pdf.mjs').then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('legacy/build/pdf.worker.mjs', VENDOR_URL).href;
      return pdfjs;
    }).catch(error => {
      pdfjsPromise = undefined;
      throw new Error('No se pudo iniciar el lector de PDF. Recarga la página e inténtalo de nuevo.', { cause: error });
    });
  }
  return pdfjsPromise;
}

function abortError() {
  return new DOMException('La lectura del PDF se ha cancelado.', 'AbortError');
}

export async function readPdf(file, { onProgress, signal } = {}) {
  validatePdf(file);
  if (signal?.aborted) throw abortError();

  let loadingTask;
  let destruction;
  let passwordRequired = false;
  const destroy = () => {
    if (loadingTask && !destruction) {
      // LoadingTask owns the document transport and worker, including after load.
      destruction = loadingTask.destroy();
      destruction.catch(() => {});
    }
    return destruction;
  };
  let rejectAbort;
  const cancellation = new Promise((_, reject) => { rejectAbort = reject; });
  cancellation.catch(() => {});
  const abort = () => {
    rejectAbort(abortError());
    destroy();
  };
  signal?.addEventListener('abort', abort, { once: true });
  const wait = promise => Promise.race([promise, cancellation]);
  const checkAbort = () => { if (signal?.aborted) throw abortError(); };

  try {
    const [pdfjs, bytes] = await wait(Promise.all([loadPdfJs(), file.arrayBuffer()]));
    checkAbort();
    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(bytes),
      cMapUrl: new URL('cmaps/', VENDOR_URL).href,
      cMapPacked: true,
      standardFontDataUrl: new URL('standard_fonts/', VENDOR_URL).href,
      wasmUrl: new URL('wasm/', VENDOR_URL).href,
      // Only text is extracted: scripts, form actions and attachments are unused.
      enableXfa: false,
      verbosity: 0,
    });
    loadingTask.onPassword = updatePassword => {
      passwordRequired = true;
      updatePassword(new Error('Este PDF está protegido con contraseña. Abre una copia sin protección.'));
    };
    const pdf = await wait(loadingTask.promise);
    checkAbort();
    const pages = [];
    onProgress?.({ current: 0, total: pdf.numPages });
    for (let number = 1; number <= pdf.numPages; number++) {
      checkAbort();
      const page = await wait(pdf.getPage(number));
      try {
        const content = await wait(page.getTextContent());
        checkAbort();
        pages.push(textItemsToText(content.items));
      } finally {
        page.cleanup();
      }
      onProgress?.({ current: number, total: pdf.numPages });
    }
    checkAbort();
    return { pages, fingerprint: pdf.fingerprints[0] };
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw abortError();
    if (passwordRequired || error?.name === 'PasswordException') {
      throw new Error('Este PDF está protegido con contraseña. Abre una copia sin protección.', { cause: error });
    }
    if (error?.message?.startsWith('No se pudo iniciar el lector')) throw error;
    throw new Error('No se puede leer este PDF. Puede estar dañado o no ser un PDF válido. Prueba con otro archivo.', { cause: error });
  } finally {
    signal?.removeEventListener('abort', abort);
    await destroy()?.catch(() => {});
  }
}
