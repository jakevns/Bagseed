# Supplied pose sheets 15 and 07 — local integration

Ten new smell-reaction sets are integrated locally: the canonical player, Remy Alvarez, Doug Haskell, Priya Raman, Poppy Serrano-Patel, Dev Imani, Ari Bell, Sam Bell, Talia and Luz. The total is now 52 of 72 authored appearances: 47 of the 67 additional cast appearances plus all five original samples. Twenty additional cast appearances remain.

The untouched sheets are `graphics/production/actions/batch-10/review-sheet.png` (review 15) and `batch-11/review-sheet.png` (review 07). Their `sheet.json` files retain source cell bounds and exact appearance IDs. Registration and the builder now support the original sample group as well as the additional cast. Doug retains his original 96px height; Poppy, Ari and Sam use the 82px child height. All drawings use the existing 96×108 transparent canvas and feet anchor at y=107.

`registered.png` shows the four directions, actual 32×36 world scale and reaction portraits. Doug's watering can and Dev's headphones remain part of their complete drawings. Left profiles mirror the supplied right views, including hand/prop side. The walking stance drawn into some sample reaction poses is preserved; this update adds no new walk frames. Standing art, walking frames and regular portraits are preserved. Only canonical appearances use these reaction drawings; customized player outfits continue using the existing generic renderer.

Reproduce from the repository root using Python with Pillow/NumPy and Node:

```text
python graphics/production/actions/import-review-sheet.py batch-10
python graphics/production/actions/import-review-sheet.py batch-11
python graphics/production/actions/register-batch.py batch-10
python graphics/production/actions/register-batch.py batch-11
python graphics/production/actions/preview-batches.py review/poses-batch-10-11/registered.png batch-10 batch-11
node graphics/production/sources/build.cjs
node tools/check.mjs
node tools/verify-action-batch.cjs
node --test --test-concurrency=1 tests/*.test.cjs
```

The ignored encoding cache is reused because action PNGs are embedded directly. If absent, first run `python graphics/production/sources/encode.py`. Set `BAGSEED_BROWSER_PATH` to the installed Chrome/Chromium executable on Windows.

This session retains the exact previous local build at `artifacts/poses-batch-10-11-before.html`; pass that path as the verifier's first argument to compare directly with the earlier 42 sets. Without an argument, the verifier compares with the retained batch-05 build and original illustrated build. It now covers all 72 appearances and 52 integrated reaction sets.

The playable result is `public/index.html`. `checkpoint.json` retains validation and source/game checksums; `graphics/production/actions/progress.json` lists remaining appearances. No additional tracked HTML review copy, GitHub push or deployment is created.
