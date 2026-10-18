# Flannel v12 - shared material palette

The user explicitly authorized direct palette correction on 2026-10-18: "Yes - apply a shared palette". This supersedes the prior restriction against changing generated pixel colors for this correction. Original raw outputs and v11 registered images remain unchanged.

`tools/apply-flannel-shared-palette.py` produces ten color-only derivatives from v11: eight walks and two idle views. It samples one common front-frame0 reference and builds smooth material ramps for flannel, jeans, skin, leather and cream footwear. Each material's midtone is aligned to that reference; lightness gain is limited to0.8-1.2 to avoid amplifying faint source noise. Spatial/material masks follow the hem rather than clipping across the figure. Protected warm dark outlines are left byte-identical. No geometry, cropping, alpha or resampling operations occur.

Outputs:
- Walks: `graphics/production/walk/sources/rerender-v6/registered/flannel-v12/top-flannel/`.
- Idles: `graphics/production/walk/registered/flannel-idle-v12/`.
- Before/after animated review: `review/flannel-proportions-v12/index.html`.
- Reference ramps: `review/flannel-proportions-v12/shared-palette.json`.
- Pixel/source hash and per-material verification: `review/flannel-proportions-v12/measurements.json`.
- Segmentation evidence: `review/flannel-proportions-v12/material-masks.png`.

All ten corrected images have the same measured material medians: flannel RGB60/81/133, jeans59/63/80, skin209/134/85. Every mapped pixel belongs to its material's shared ramp. Footwear material medians vary at most0.5RGB levels. Shading and plaid coverage can vary with pose; this is not a claim of pixel-identical clothing patterns.

Three Python regression tests verify source hashes, exact alpha/dimension/outline preservation, unchanged pixels outside masks, shared-ramp membership and material midtone drift <=2RGB levels. Three existing guide/provenance tests pass. Chrome verified all images, phase selection, wrap and idle toggle without script errors.

Source review only: no live atlas installation, build, commit or push. The existing v11 proportions are preserved exactly. No other outfits changed.
