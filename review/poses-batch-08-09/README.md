# Supplied pose sheets 14 and 11 — local integration

Ten new canonical smell-reaction appearances are integrated locally: AutoPilot Genetics, Swamp Wizard, Rosalind Ortega in her cardigan/skirt with knitting, Theo Park in his dark casual outfit, Marisol Vega in her overalls and bucket hat, Cure Corner, Lumen & Loam LIVE, Ana, Wes and Dez. The completed total is 42 of the 67 additional cast appearances, leaving 25.

The untouched sheets are retained as `graphics/production/actions/batch-08/review-sheet.png` (review 14) and `batch-09/review-sheet.png` (review 11). Each `sheet.json` records explicit source cells and exact appearance IDs. Rosalind, Theo and Marisol have alternate roster entries, so the import and validation use exact IDs rather than names. Their other outfits stay on their existing paths.

`registered.png` shows four reaction directions, actual 32×36 world scale and reaction portraits. Source cell bounds include the full hair, hats and shoes without table lines. The left profile mirrors the supplied right view, including the raised hand and carried knitting. Standing-reference columns are excluded; custom outfits retain the existing generic reaction renderer.

Reproduce from the repository root using Python with Pillow/NumPy and Node:

```text
python graphics/production/actions/import-review-sheet.py batch-08
python graphics/production/actions/import-review-sheet.py batch-09
python graphics/production/actions/register-batch.py batch-08
python graphics/production/actions/register-batch.py batch-09
python graphics/production/actions/preview-batches.py review/poses-batch-08-09/registered.png batch-08 batch-09
node graphics/production/sources/build.cjs
node tools/check.mjs
node tools/verify-action-batch.cjs
node --test --test-concurrency=1 tests/*.test.cjs
```

The existing ignored encoding cache is reused because the new action PNGs are embedded directly. If the cache is missing, first run `python graphics/production/sources/encode.py`.

For comparison with the exact previous 32-appearance local build, this session retained `artifacts/poses-batch-08-09-before.html`; pass that path as the verifier's first argument. Without an argument, it compares with the retained batch-05 candidate and the original illustrated build. The current verifier checks all 67 cast appearances and all 42 integrated action sets.

Set `BAGSEED_BROWSER_PATH` to the installed Chrome/Chromium executable on Windows. The playable result is `public/index.html`; no extra tracked HTML review copy is created. `checkpoint.json` records validation and source/game checksums. No GitHub push or deployment is performed.
