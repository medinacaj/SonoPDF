# SDD ledger — plan: docs/superpowers/plans/2026-10-24-lector-pdf.md

Approved by user: 2026-10-24, “Si”.
Base: d56a80d.
Ruling: use the already isolated new Site directory and feature branch — there is no existing user code to protect.
Ruling: execute after design approval without another planning approval — user already authorized creation.
Ruling: parallel core/PDF work in separate files — higher-level instructions require delegation when it saves time; root owns integration, Git and publication.
Ruling: Sites helper scripts absent from executor and inaccessible as skill resources — use supported ordinary Git for work_proxy and manually package exact static output.

## Reference lock
Live Refero searches failed with NO_SUBSCRIPTION. Fallback research: Refero typography.md, color.md, craft-details.md and visual-workflow.md, plus Speechify's official PDF-reader flow description (https://speechify.com/blog/pdf-to-voice-reader/).
Primary: Refero's restrained product-UI guidance; preserve neutral canvas, high contrast, semantic accents, one sans family and visible keyboard focus.
Borrow only: text-following and persistent floating playback pattern from Speechify's documented workflow.
Tokens: canvas #f6f8fb, surface #fff, text #192438, secondary #536178, border #dce3ed, primary #2563eb, primary-tint #eff6ff; radius 12–20 px; no decorative photos, gradients or serif display type.
Media: code-native sound-wave mark and SVG interface icons only.
Distinctive detail: reading fragment appears as a blue-edged text strip; progress track has a matching reading marker.
Reject: marketing hero, price cards, ornamental illustrations, made-up voice quality claims, violet accents.

## Progress
- Plan and approved design committed.
- Core: complete; 17 tests green, final review approved.
- PDF: complete; 11 real-PDF extraction tests green, final review approved.
- UI/integration: complete; browser QA green, final review approved after explicit default voice regression fix.

Verification: node --test 28/28; browser_qa.py passed real PDFs, speech simulation, errors, storage denial, speech absence, responsive widths 320/390/768/1440 and no file HTTP uploads.
Visual QA: desktop empty state and mobile reader inspected against approved neutral/blue reference lock. Mobile player overlap resolved; no remaining P0/P1/P2.
Review: independent final reviewer approved entire app, with scoped re-review approving default-voice fix.
Publication: pending exact-source push and private deployment.
