# Lector PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Build and publish the approved Spanish browser PDF reader with speech controls.
**Architecture:** Static HTML/CSS/ES modules. PDF.js legacy distribution for extraction, browser speech synthesis, local preferences and document positions.
**Tech Stack:** JavaScript, Node built-in test runner, Python Playwright browser QA.
**Spec:** `docs/superpowers/specs/2026-10-24-lector-pdf-design.md`

## Global Constraints
- Web, mobile and desktop; Spanish interface; PDF size limit 30 MB.
- No document upload, OCR, MP3 export, account, or cross-device sync.
- Rates 0.5–2; available system voices; highlight chunks; local position and preference persistence.
- Owner-private publication through Sites. Existing new project directory supplies isolation.

## Review Focus
- Cancelled speech callbacks must not advance a replaced document.
- Invalid, protected and entirely scanned PDFs need understandable errors and a recoverable UI.
- Page navigation to empty pages must not silently show another page.
- Voice loading and unavailable browser speech must preserve usable reading controls.
- Long filenames, narrow screens and disabled storage must not break reading.

### Task 1: Text and playback core
Files: `dist/reader-core.mjs`, `tests/reader-core.test.mjs`.
Interfaces: `chunkText(text,max=260) -> string[]`; `SpeechPlayer({synth,createUtterance,onChange,onError})`; methods `load(chunks,index=0)`, `play()`, `pause()`, `stop()`, `seek(index)`, `configure({rate,voice})`; public `index`, `status`, `chunks`, `rate`, `voice`. Chunks are `{text,page}`. Status `ready|playing|paused|ended`.
- [x] Write meaningful tests for text integrity, length limit, stale cancellation, pause/resume, seek, configuration, completion and speech failures.
- [x] Verify failures before implementing.
- [x] Implement chunking and a single active utterance, generation-based cancellation, pause via cancel and restart current chunk for reliable mobile behavior.
- [x] Run `node --test tests/reader-core.test.mjs` and review.

### Task 2: PDF extraction
Files: `dist/pdf-loader.mjs`, `tests/pdf-loader.test.mjs`, vendor assets.
Interfaces: `readPdf(file,{onProgress,signal}={}) -> Promise<{pages:string[],fingerprint:string}>`; `validatePdf(file)` throws localized error for >30 MB or wrong extension. Local lazy PDF.js import, assets from `/vendor/`.
- [x] Write tests for limits, whitespace/line extraction helper and corrupt/protected/scanned handling as applicable.
- [x] Verify failures before implementation.
- [x] Implement local PDF extraction with progress, cancellation and document cleanup. Passwords rejected clearly. Preserve blank pages; app explains empty/scanned states.
- [x] Verify node tests and browser extraction with real PDF fixtures.

### Task 3: User interface and integration
Files: `dist/index.html`, `dist/styles.css`, `dist/app.mjs`, `dist/icon.svg`, `README.md`.
- [x] Define approved reference lock and design tokens before styling.
- [x] Implement upload, demo, page selection, clickable chunks, playback controls, voice selection, speed, font size, progress, errors and help dialog.
- [x] Store settings and latest 30 document positions defensively. Reopening same PDF restores chunk; text/Blob never saved.
- [x] Run core and PDF unit tests, syntax checks and Playwright real-PDF, mock-voice and responsive tests at 320, 390, 768, 1440 px. Check no document HTTP uploads.
- [x] Fresh independent review; fix material defects and rerun affected checks.
- [ ] Commit exact source, push, archive `.openai/hosting.json` and `dist`, save and deploy private Site, confirm terminal success and deliver URL.
