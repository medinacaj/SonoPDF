#!/usr/bin/env python3
"""Browser acceptance smoke: local PDF, read-aloud controls and network privacy."""
from pathlib import Path
from urllib.parse import urlparse
import tempfile
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/"

def document(text: str) -> bytes:
    stream = f"BT /F1 12 Tf 60 700 Td ({text}) Tj ET"
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Count 1 /Kids [4 0 R] >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>",
        f"<< /Length {len(stream)} >>\\nstream\\n{stream}\\nendstream",
    ]
    data = "%PDF-1.7\\n"
    offsets = [0]
    for idx, obj in enumerate(objects, start=1):
        offsets.append(len(data))
        data += f"{idx} 0 obj\\n{obj}\\nendobj\\n"
    xref = len(data)
    data += f"xref\\n0 {len(objects) + 1}\\n0000000000 65535 f \\n"
    data += "".join(f"{offset:010d} 00000 n \\n" for offset in offsets[1:])
    data += f"trailer\\n<< /Size {len(objects) + 1} /Root 1 0 R >>\\nstartxref\\n{xref}\\n%%EOF"
    return data.encode("latin-1")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    requests = []
    page.on("request", lambda req: requests.append(req.url))
    response = page.goto(BASE, wait_until="domcontentloaded", timeout=30000)
    assert response and response.status == 200
    assert page.title()
    assert page.locator("#file-input").get_attribute("accept").find(".pdf") >= 0

    for width in (320, 390, 768, 1280):
        page.set_viewport_size({"width": width, "height": 844})
        overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        assert overflow <= 2, ("horizontal overflow", width, overflow)

    # Help and keyboard affordances work without uploading anything.
    page.locator("#help").click()
    assert page.locator("#help-dialog").is_visible()
    page.locator("#close-help").click()

    with tempfile.TemporaryDirectory() as tmp:
        file = Path(tmp) / "prueba-local.pdf"
        file.write_bytes(document("Hola SonoPDF"))
        page.locator("#file-input").set_input_files(str(file))
        page.locator("#reader").wait_for(state="visible", timeout=30000)
        assert "Hola SonoPDF" in page.locator("#reading-text").inner_text()
        assert page.locator("#document-name").inner_text().strip()
        assert page.locator("#play").is_enabled() or page.locator("#speech-warning").is_visible()

    # PDF bytes stay in browser memory: network requests may load only app assets.
    escaped = [url for url in requests if urlparse(url).netloc != urlparse(BASE).netloc]
    assert not escaped, ("third-party requests", escaped)
    assert not any("prueba-local.pdf" in url for url in requests)
    print("SonoPDF: local PDF, privacy boundary, help controls and 320–1280 px validated")
    browser.close()
