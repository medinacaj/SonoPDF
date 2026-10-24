import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkText, SpeechPlayer } from '../dist/reader-core.mjs';

const chunks = [
  { text: 'Primera frase.', page: 1 },
  { text: 'Segunda frase.', page: 2 },
  { text: 'Última frase.', page: 2 },
];

function harness({ cancelEvents = false, synthAvailable = true } = {}) {
  const spoken = [];
  const errors = [];
  const states = [];
  let active;
  let cancelCount = 0;
  const synth = {
    speak(utterance) { spoken.push(utterance); active = utterance; },
    cancel() {
      cancelCount++;
      const cancelled = active;
      active = null;
      if (cancelEvents && cancelled) {
        cancelled.onend?.();
        cancelled.onerror?.({ error: 'canceled' });
      }
    },
  };
  const player = new SpeechPlayer({
    synth: synthAvailable ? synth : null,
    createUtterance: text => ({ text }),
    onChange(...args) {
      assert.equal(args.length, 0);
      states.push({ index: player.index, status: player.status });
    },
    onError: message => errors.push(message),
  });
  return { player, spoken, errors, states, synth, get cancelCount() { return cancelCount; } };
}

test('chunking normalizes whitespace and preserves sentence punctuation', () => {
  assert.deepEqual(chunkText('  Hola\n mundo.\t¿Qué tal?  Todo bien. ', 22), [
    'Hola mundo. ¿Qué tal?', 'Todo bien.',
  ]);
  assert.deepEqual(chunkText(' \n\t '), []);
});

test('chunking never exceeds max and retains long words and all non-whitespace content', () => {
  const input = `Inicio ${'a'.repeat(601)} 🦉 final. Más texto, con signos: ¿sí?`;
  for (const max of [1, 7, 17, 260]) {
    const result = chunkText(input, max);
    assert.ok(result.every(chunk => chunk.length > 0 && chunk.length <= max));
    assert.equal(result.join('').replace(/\s/g, ''), input.replace(/\s/g, ''));
  }
});

test('chunking uses a sentence boundary before splitting the next sentence', () => {
  assert.deepEqual(chunkText('Hola. Una frase que sigue después.', 14), [
    'Hola.', 'Una frase que', 'sigue después.',
  ]);
});

test('invalid chunk size is rejected instead of looping', () => {
  for (const max of [0, -1, NaN, Infinity, 1.5]) {
    assert.throws(() => chunkText('Texto', max), RangeError);
  }
});

test('load initializes a clamped position without autoplay', () => {
  const h = harness();
  h.player.load(chunks, 99);
  assert.equal(h.player.index, 2);
  assert.equal(h.player.status, 'ready');
  assert.deepEqual(h.player.chunks, chunks);
  assert.equal(h.spoken.length, 0);
  assert.equal(h.player.rate, 1);
  assert.equal(h.player.voice, null);
});

test('play reads one chunk at a time and finishes on the last chunk', () => {
  const h = harness();
  h.player.load(chunks);
  h.player.play();
  h.player.play();
  assert.equal(h.spoken.length, 1);
  assert.equal(h.spoken[0].text, chunks[0].text);
  h.spoken[0].onend();
  assert.equal(h.player.index, 1);
  assert.equal(h.spoken.length, 2);
  h.spoken[1].onend();
  h.spoken[2].onend();
  assert.equal(h.player.index, 2);
  assert.equal(h.player.status, 'ended');
  h.player.play();
  assert.equal(h.player.index, 0);
  assert.equal(h.spoken.at(-1).text, chunks[0].text);
});

test('pause cancels and resumes from the same chunk despite synchronous cancelled events', () => {
  const h = harness({ cancelEvents: true });
  h.player.load(chunks, 1);
  h.player.play();
  const previous = h.spoken[0];
  h.player.pause();
  assert.equal(h.player.status, 'paused');
  assert.equal(h.player.index, 1);
  h.player.play();
  previous.onend();
  previous.onerror({ error: 'interrupted' });
  assert.equal(h.player.status, 'playing');
  assert.equal(h.player.index, 1);
  assert.equal(h.spoken.length, 2);
  assert.equal(h.spoken[1].text, chunks[1].text);
  assert.deepEqual(h.errors, []);
});

test('loading a replacement invalidates callbacks from the old document', () => {
  const h = harness({ cancelEvents: true });
  h.player.load(chunks);
  h.player.play();
  const previous = h.spoken[0];
  h.player.load([{ text: 'Documento nuevo', page: 1 }]);
  previous.onend();
  previous.onerror({ error: 'network' });
  assert.equal(h.player.status, 'ready');
  assert.equal(h.player.index, 0);
  assert.equal(h.spoken.length, 1);
  assert.deepEqual(h.errors, []);
});

test('seeking while playing cancels current speech and starts only the selected chunk', () => {
  const h = harness({ cancelEvents: true });
  h.player.load(chunks);
  h.player.play();
  const previous = h.spoken[0];
  h.player.seek(2);
  previous.onend();
  assert.equal(h.player.status, 'playing');
  assert.equal(h.player.index, 2);
  assert.equal(h.spoken.length, 2);
  assert.equal(h.spoken[1].text, chunks[2].text);
});

test('seeking while paused retains pause and clamps the requested position', () => {
  const h = harness();
  h.player.load(chunks);
  h.player.play();
  h.player.pause();
  h.player.seek(-4);
  assert.equal(h.player.index, 0);
  h.player.seek(8);
  assert.equal(h.player.index, 2);
  assert.equal(h.player.status, 'paused');
  assert.equal(h.spoken.length, 1);
});

test('configure restarts the current chunk with new voice and rate and invalidates old events', () => {
  const h = harness({ cancelEvents: true });
  const voice = { name: 'Español', lang: 'es-ES' };
  h.player.load(chunks, 1);
  h.player.play();
  const previous = h.spoken[0];
  h.player.configure({ rate: 1.5, voice });
  previous.onend();
  assert.equal(h.player.index, 1);
  assert.equal(h.spoken.length, 2);
  assert.equal(h.spoken[1].rate, 1.5);
  assert.equal(h.spoken[1].voice, voice);
  assert.equal(h.spoken[1].text, chunks[1].text);
  h.player.configure({ rate: 1.5, voice });
  assert.equal(h.spoken.length, 2);
});

test('configuration clamps rate and does not autoplay when ready or paused', () => {
  const h = harness();
  h.player.load(chunks);
  h.player.configure({ rate: 9 });
  assert.equal(h.player.rate, 2);
  h.player.configure({ rate: 0.1 });
  assert.equal(h.player.rate, 0.5);
  h.player.configure({ rate: NaN });
  assert.equal(h.player.rate, 0.5);
  assert.equal(h.spoken.length, 0);
  h.player.play();
  h.player.pause();
  h.player.configure({ rate: 1 });
  assert.equal(h.player.status, 'paused');
  assert.equal(h.spoken.length, 1);
});

test('stop resets to the beginning and makes delayed callbacks inert', () => {
  const h = harness({ cancelEvents: true });
  h.player.load(chunks, 1);
  h.player.play();
  const previous = h.spoken[0];
  h.player.stop();
  previous.onend();
  assert.equal(h.player.status, 'ready');
  assert.equal(h.player.index, 0);
  assert.equal(h.spoken.length, 1);
});

test('speech errors pause in place, notify in Spanish and permit retry', () => {
  const h = harness();
  h.player.load(chunks, 1);
  h.player.play();
  h.spoken[0].onerror({ error: 'network' });
  h.spoken[0].onend();
  assert.equal(h.player.status, 'paused');
  assert.equal(h.player.index, 1);
  assert.match(h.errors[0], /voz|lectura|reproduc/i);
  assert.equal(h.errors.length, 1);
  h.player.play();
  assert.equal(h.spoken.at(-1).text, chunks[1].text);
});

test('synchronous synthesis failure becomes a recoverable paused state', () => {
  const h = harness();
  h.synth.speak = () => { throw new Error('device failed'); };
  h.player.load(chunks);
  assert.doesNotThrow(() => h.player.play());
  assert.equal(h.player.status, 'paused');
  assert.equal(h.errors.length, 1);
});

test('unavailable synthesis reports an understandable error only when play is requested', () => {
  const h = harness({ synthAvailable: false });
  h.player.load(chunks);
  assert.deepEqual(h.errors, []);
  assert.doesNotThrow(() => h.player.play());
  assert.equal(h.player.status, 'paused');
  assert.match(h.errors[0], /navegador.*voz|voz.*navegador/i);
});

test('empty documents remain ready and never create an utterance', () => {
  const h = harness();
  h.player.load([], 4);
  h.player.play();
  h.player.seek(2);
  h.player.pause();
  assert.equal(h.player.index, 0);
  assert.equal(h.player.status, 'ready');
  assert.equal(h.spoken.length, 0);
});

test('starting playback from silence speaks without cancelling first (iOS Safari drops that speech)', () => {
  const h = harness();
  h.player.load(chunks);
  h.player.play();
  assert.equal(h.cancelCount, 1, 'only the cancel from load() is expected');
  assert.deepEqual(h.spoken.map(u => u.text), ['Primera frase.']);
  assert.equal(h.player.status, 'playing');
});

test('starting playback cancels leftover speech and resumes a paused engine first', () => {
  const h = harness();
  h.player.load(chunks);
  const calls = [];
  h.synth.speaking = true;
  h.synth.paused = true;
  h.synth.resume = () => calls.push('resume');
  const speak = h.synth.speak;
  h.synth.speak = utterance => { calls.push('speak'); speak(utterance); };
  h.player.play();
  assert.equal(h.cancelCount, 2);
  assert.deepEqual(calls, ['resume', 'speak']);
  assert.equal(h.player.status, 'playing');
});

test('word boundaries advance the position within the chunk and reset when moving on', () => {
  let boundaries = 0;
  const h = harness();
  h.player.onBoundary = () => boundaries++;
  h.player.load(chunks);
  h.player.play();
  h.spoken[0].onboundary({ charIndex: 8 });
  assert.equal(h.player.charIndex, 8);
  assert.equal(boundaries, 1);
  h.spoken[0].onend();
  assert.equal(h.player.index, 1);
  assert.equal(h.player.charIndex, 0);
  h.spoken[0].onboundary({ charIndex: 3 });
  assert.equal(h.player.charIndex, 0, 'stale utterances must not move the position');
  assert.equal(boundaries, 1);
  h.player.seek(2);
  assert.equal(h.player.charIndex, 0);
});
