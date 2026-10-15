# Supplied pose sheets 08 and 13 — local integration

These two sheets add ten canonical smell-reaction appearances, bringing the completed total from 22 to 32 of the 67 additional cast appearances. They cover Jules, Dev, Sasha, Ari, Rosalind Ortega (purple tee and jeans), the business representative, Dr. Amani, Grandma Green, Pixel Seeds and Moon Medicine Genetics. Rosalind's separate cardigan/skirt appearance remains on its previous renderer.

The untouched supplied sheets are retained as `graphics/production/actions/batch-06/review-sheet.png` (review 08) and `batch-07/review-sheet.png` (review 13). `sheet.json` records explicit cells and exact appearance IDs. `import-review-sheet.py` removes edge-connected paper; `register-batch.py` isolates each complete drawing, scales it to existing character conventions and anchors the feet. No character artwork is redrawn. Standing-reference columns are excluded from the action import.

`registered.png` shows all four reaction directions, 32×36 world-scale previews and reaction portraits against a contrasting background. The left direction mirrors the supplied right view, including the raised hand. Custom outfits retain the existing generic reaction renderer.

Reproduce from the repository root with Python (Pillow and NumPy) and Node:

```text
python graphics/production/actions/import-review-sheet.py batch-06
python graphics/production/actions/import-review-sheet.py batch-07
python graphics/production/actions/register-batch.py batch-06
python graphics/production/actions/register-batch.py batch-07
python graphics/production/actions/preview-batches.py review/poses-batch-06-07/registered.png batch-06 batch-07
python graphics/production/sources/encode.py
node graphics/production/sources/build.cjs
node tools/check.mjs
node tools/verify-action-batch.cjs
node --test --test-concurrency=1 tests/*.test.cjs
```

On Windows, set `BAGSEED_BROWSER_PATH` to the installed Chrome/Chromium executable for browser checks. The project uses LF line endings for checksum-protected HTML on every platform. The playable result is `public/index.html`; no extra 30 MB HTML review copy is needed for each local batch. The previous batch-05 candidate remains the regression comparison. This update is local; no GitHub push or deployment is performed.
