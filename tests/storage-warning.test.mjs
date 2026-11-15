import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('un fallo de guardado del progreso muestra advertencia persistente y accesible', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../dist/app.mjs', import.meta.url), 'utf8');
  assert.match(html, /id="storage-warning"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /El navegador no pudo guardar tus ajustes o tu punto de lectura/);
  assert.match(app, /set\(key, value\) \{ try \{ localStorage\.setItem\(key, JSON\.stringify\(value\)\); return true; \} catch \{ return false; \} \}/);
  assert.match(app, /function warnUnsaved\(\) \{ \$\('storage-warning'\)\.hidden = false; \}/);
  assert.match(app, /if \(!storage\.set\('avv-settings', settings\)\) warnUnsaved\(\)/);
  assert.match(app, /if \(!storage\.set\('avv-positions', recent\)\) warnUnsaved\(\)/);
  assert.ok(!/function warnUnsaved\([\s\S]*?\{[\s\S]*?showMessage\(/.test(app),
    'la advertencia no debe sobrescribir errores del lector');
});
