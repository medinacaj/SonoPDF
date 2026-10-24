import assert from 'node:assert/strict';
import test from 'node:test';

// Every expectation names user-visible corruption or a rejected invalid file.
// The fixture builds an actual PDF, so the parser integration uses no mocks.
const loader = await import('../dist/pdf-loader.mjs');
const file = (name, size, type = 'application/pdf') => ({ name, size, type });

test('accepts a PDF at the 30 MiB limit regardless of MIME case or missing MIME', () => {
  assert.equal(typeof loader.validatePdf, 'function');
  assert.doesNotThrow(() => loader.validatePdf(file('Libro.PDF', 30 * 1024 * 1024, '')));
});

test('rejects missing, empty, oversized, and misleading extension files', () => {
  assert.equal(typeof loader.validatePdf, 'function');
  for (const invalid of [null, file('libro.pdf', 0), file('libro.pdf', 30 * 1024 * 1024 + 1), file('libro.pdf.exe', 99), file('libro.txt', 99)]) {
    assert.throws(() => loader.validatePdf(invalid), /PDF|vacío|30/);
  }
});

test('text extraction preserves lines and normalizes PDF whitespace', () => {
  assert.equal(typeof loader.textItemsToText, 'function');
  assert.equal(loader.textItemsToText([
    { str: '  Hola\t', hasEOL: false },
    { str: 'mundo', hasEOL: true },
    { type: 'beginMarkedContent' },
    { str: ' Otra   línea ', hasEOL: true },
    { str: '', hasEOL: true },
  ]), 'Hola mundo\nOtra línea');
});

test('text extraction joins touching font runs without splitting words or punctuation', () => {
  assert.equal(typeof loader.textItemsToText, 'function');
  const item = (str, x, width) => ({ str, width, transform: [12, 0, 0, 12, x, 100], hasEOL: false });
  assert.equal(loader.textItemsToText([item('lec', 10, 18), item('tor', 28, 18), item(',', 46, 3), item('hola', 55, 24)]), 'lector, hola');
});

test('text extraction recognizes line movement when EOL metadata is absent', () => {
  assert.equal(typeof loader.textItemsToText, 'function');
  assert.equal(loader.textItemsToText([
    { str: 'Primera', width: 40, transform: [12, 0, 0, 12, 10, 100] },
    { str: 'Segunda', width: 45, transform: [12, 0, 0, 12, 10, 80] },
  ]), 'Primera\nSegunda');
});

function pdfFile(pageTexts) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Count ${pageTexts.length} /Kids [${pageTexts.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  for (const text of pageTexts) {
    const contentId = objects.length + 2;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    const stream = text ? `BT /F1 12 Tf 60 700 Td (${text}) Tj ET` : '';
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  let pdf = '%PDF-1.7\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new File([pdf], 'lectura.pdf', { type: 'application/pdf' });
}

test('reads real PDF pages in order, preserving blank pages and reporting progress', async () => {
  assert.equal(typeof loader.readPdf, 'function');
  const progress = [];
  const result = await loader.readPdf(pdfFile(['Hola mundo.', '', 'Ultima pagina.']), { onProgress: value => progress.push(value) });
  assert.deepEqual(result.pages, ['Hola mundo.', '', 'Ultima pagina.']);
  assert.match(result.fingerprint, /^[a-f0-9]{32}$/i);
  assert.deepEqual(progress, [{ current: 0, total: 3 }, { current: 1, total: 3 }, { current: 2, total: 3 }, { current: 3, total: 3 }]);
});

test('entirely blank or scanned documents return empty page strings for the UI OCR notice', async () => {
  assert.equal(typeof loader.readPdf, 'function');
  const result = await loader.readPdf(pdfFile(['', '']));
  assert.deepEqual(result.pages, ['', '']);
});

test('corrupt files produce an understandable Spanish error', async () => {
  assert.equal(typeof loader.readPdf, 'function');
  await assert.rejects(loader.readPdf(new File(['This is not a PDF.'], 'roto.pdf')), /PDF.*(dañado|válido|leer)/i);
});

test('rejects cancellation before reading the file', async () => {
  assert.equal(typeof loader.readPdf, 'function');
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loader.readPdf(pdfFile(['Hola']), { signal: controller.signal }), { name: 'AbortError' });
});

test('cancellation during page progress stops extraction with AbortError', async () => {
  assert.equal(typeof loader.readPdf, 'function');
  const controller = new AbortController();
  await assert.rejects(loader.readPdf(pdfFile(['Hola', 'Adios']), {
    signal: controller.signal,
    onProgress: ({ current }) => { if (current === 1) controller.abort(); },
  }), { name: 'AbortError' });
});

// Real password-encrypted PDF generated with pypdf; no document text is included.
const protectedPdf = "JVBERi0xLjMKJeLjz9MKMSAwIG9iago8PAovUHJvZHVjZXIgPDAyYjczMTEwZWY+Cj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovQ291bnQgMQovS2lkcyBbIDQgMCBSIF0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9SZXNvdXJjZXMgPDwKPj4KL01lZGlhQm94IFsgMC4wIDAuMCAxMDAgMTAwIF0KL1BhcmVudCAyIDAgUgo+PgplbmRvYmoKNSAwIG9iago8PAovViAyCi9SIDMKL0xlbmd0aCAxMjgKL1AgNDI5NDk2NzI5MgovRmlsdGVyIC9TdGFuZGFyZAovTyA8MGU1MjI5MjVhM2U0ZTg3NGMzY2ZhY2JlZjUxMWE3M2FjNGVjMmJkODY1ZGNkM2Q0NjI3NjE0OTE3YWJmZDdlND4KL1UgPGI3ZDVmNzQ3NTY1ZmJiOWM0NjNjYjU5OWQ4NmNmYjEzMjhiZjRlNWU0ZTc1OGE0MTY0MDA0ZTU2ZmZmYTAxMDg+Cj4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA1OSAwMDAwMCBuIAowMDAwMDAwMTE4IDAwMDAwIG4gCjAwMDAwMDAxNjcgMDAwMDAgbiAKMDAwMDAwMDI2MSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMyAwIFIKL0luZm8gMSAwIFIKL0lEIFsgPDMwMzkzNTMzMzE2NjYzMzg2MTM3MzAzMTYzMzczMDYyMzc2MzM3MzIzMzMwMzAzNjM4MzUzNjMyMzYzODY0NjM+IDwzMDM5MzUzMzMxNjY2MzM4NjEzNzMwMzE2MzM3MzA2MjM3NjMzNzMyMzMzMDMwMzYzODM1MzYzMjM2Mzg2NDYzPiBdCi9FbmNyeXB0IDUgMCBSCj4+CnN0YXJ0eHJlZgo0NzYKJSVFT0YK";
test('password-protected files reject promptly with a Spanish protection message', async () => {
  assert.equal(typeof loader.readPdf, 'function');
  const file = new File([Buffer.from(protectedPdf, 'base64')], 'protegido.pdf');
  await assert.rejects(loader.readPdf(file), /protegido|contraseña/i);
});
