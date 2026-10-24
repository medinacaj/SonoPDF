#!/usr/bin/env python3
"""Reproduce the local PDF.js assets from the integrity-pinned npm release."""
import base64
import hashlib
import io
from pathlib import Path
import tarfile
import urllib.request

VERSION = '6.4.299'
INTEGRITY = 'AVl138zALtfaAPvADulE0PZThbYzCBS79nL4pOSL/6Sm/4AH5A21BD9VHt97OlCuzJuCpmeZtAtkinisF4Vb1g=='
TARGET = Path(__file__).resolve().parents[1] / 'dist/vendor/pdfjs'
archive = urllib.request.urlopen(f'https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-{VERSION}.tgz').read()
if base64.b64encode(hashlib.sha512(archive).digest()).decode() != INTEGRITY:
    raise SystemExit('PDF.js archive failed SHA-512 integrity verification')
files = {'LICENSE', 'legacy/build/pdf.mjs', 'legacy/build/pdf.worker.mjs'}
with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as package:
    for member in package.getmembers():
        relative = member.name.removeprefix('package/')
        if not member.isfile() or not (relative in files or relative.startswith(('standard_fonts/', 'cmaps/', 'wasm/'))):
            continue
        path = Path(relative)
        if path.is_absolute() or '..' in path.parts:
            raise SystemExit('Unexpected archive path')
        target = TARGET / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(package.extractfile(member).read())
(TARGET / 'VERSION').write_text(f'pdfjs-dist {VERSION}\nsha512-{INTEGRITY}\n')
print(f'Verified and copied PDF.js {VERSION} to {TARGET}')
