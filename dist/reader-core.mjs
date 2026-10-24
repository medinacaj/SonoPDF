/** Split normalized text at sentence/word boundaries, with a hard length limit. */
export function chunkText(text, max = 260) {
  if (!Number.isInteger(max) || max < 1) throw new RangeError('El tamaño del fragmento debe ser un entero positivo.');
  const normalized = String(text ?? '').replace(/\s+/gu, ' ').trim();
  const result = [];
  let offset = 0;
  while (offset < normalized.length) {
    if (normalized.length - offset <= max) {
      result.push(normalized.slice(offset));
      break;
    }
    const window = normalized.slice(offset, offset + max + 1);
    let end = 0;
    for (const match of window.matchAll(/[.!?…;:]["'»”’)]*(?=\s)/gu)) {
      const boundary = match.index + match[0].length;
      if (boundary <= max) end = boundary;
    }
    if (!end) end = window.lastIndexOf(' ', max);
    if (end <= 0) end = max;
    result.push(normalized.slice(offset, offset + end).trim());
    offset += end;
    if (normalized[offset] === ' ') offset++;
  }
  return result;
}

/** Browser speech orchestration. Pauses deliberately restart the current chunk. */
export class SpeechPlayer {
  constructor({
    synth = globalThis.speechSynthesis,
    createUtterance = text => new globalThis.SpeechSynthesisUtterance(text),
    onChange = () => {},
    onError = () => {},
  } = {}) {
    this.synth = synth;
    this.createUtterance = createUtterance;
    this.onChange = onChange;
    this.onError = onError;
    this.chunks = [];
    this.index = 0;
    this.status = 'ready';
    this.rate = 1;
    this.voice = null;
    this._generation = 0;
    this._utterance = null;
  }

  load(chunks, index = 0) {
    this._cancel();
    this.chunks = [...chunks];
    this.index = this._clampIndex(index);
    this.status = 'ready';
    this.onChange();
  }

  play() {
    if (!this.chunks.length || this.status === 'playing') return;
    if (this.status === 'ended') this.index = 0;
    // iOS Safari silently drops speak() right after cancel(), so only cancel real speech.
    if (this.synth?.speaking || this.synth?.pending) this._cancel();
    else this._generation++;
    this._speak();
  }

  pause() {
    if (this.status !== 'playing') return;
    this._cancel();
    this.status = 'paused';
    this.onChange();
  }

  stop() {
    this._cancel();
    this.index = 0;
    this.status = 'ready';
    this.onChange();
  }

  seek(index) {
    const wasPlaying = this.status === 'playing';
    this._cancel();
    this.index = this._clampIndex(index);
    if (wasPlaying && this.chunks.length) {
      this._speak();
    } else {
      if (this.status === 'ended') this.status = 'paused';
      this.onChange();
    }
  }

  configure({ rate, voice } = {}) {
    const nextRate = Number.isFinite(rate) ? Math.min(2, Math.max(0.5, rate)) : this.rate;
    const nextVoice = voice === undefined ? this.voice : voice;
    if (nextRate === this.rate && nextVoice === this.voice) return;
    this.rate = nextRate;
    this.voice = nextVoice;
    if (this.status === 'playing') {
      this._cancel();
      this._speak();
    } else {
      this.onChange();
    }
  }

  _clampIndex(index) {
    const value = Number.isFinite(index) ? Math.trunc(index) : 0;
    return Math.min(Math.max(0, this.chunks.length - 1), Math.max(0, value));
  }

  _cancel() {
    // Invalidate first: browser cancel() may synchronously dispatch old callbacks.
    this._generation++;
    this._utterance = null;
    try { this.synth?.cancel(); } catch { /* Failed cancellation must not revive callbacks. */ }
  }

  _fail(message) {
    this._cancel();
    this.status = 'paused';
    this.onChange();
    this.onError(message);
  }

  _speak() {
    if (!this.synth || typeof this.synth.speak !== 'function') {
      this._fail('Este navegador no permite reproducir voz. Puedes seguir leyendo el texto.');
      return;
    }
    const generation = this._generation;
    try {
      const utterance = this.createUtterance(this.chunks[this.index].text);
      utterance.rate = this.rate;
      if (this.voice) utterance.voice = this.voice;
      utterance.lang = this.voice?.lang || 'es-ES';
      this._utterance = utterance;
      const isCurrent = () => generation === this._generation && this._utterance === utterance && this.status === 'playing';
      utterance.onend = () => {
        if (!isCurrent()) return;
        this._utterance = null;
        if (this.index + 1 < this.chunks.length) {
          this.index++;
          this._speak();
        } else {
          this.status = 'ended';
          this.onChange();
        }
      };
      utterance.onerror = () => {
        if (isCurrent()) this._fail('No se pudo reproducir la voz. Pulsa reproducir para volver a intentarlo.');
      };
      this.status = 'playing';
      this.onChange();
      // A consumer may synchronously pause or replace the document in onChange.
      if (isCurrent()) {
        // Some engines stay paused after an interruption and ignore new speech until resumed.
        if (this.synth.paused) this.synth.resume?.();
        this.synth.speak(utterance);
      }
    } catch {
      if (generation === this._generation) {
        this._fail('No se pudo reproducir la voz. Pulsa reproducir para volver a intentarlo.');
      }
    }
  }
}
