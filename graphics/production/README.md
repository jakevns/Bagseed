# Illustrated character production sources

The user approved the revised five-character Study 02 and requested integration and a GitHub push. This release expands that illustrated direction to the audited human appearance roster. The approved five use their original illustrated walking sheets; 67 additional appearance records use individually authored four-view character drawings and three expression portraits. Counts describe appearance variants, including aliases and alternate looks, rather than 72 unique people.

`assets/` and `cast/assets/` retain the generated source PNGs. Generation prompts and roster inputs are under the corresponding `sources/` folders. `registered/` and `cast/registered/` contain technical crops normalized to fixed feet anchors. The two `asset-manifest.json` files record source SHA-256 hashes, crop bounds and registration scales. Approved sample sources remain under `review/characters-v2/`.

`sources/renderer.js` supplies the game's existing sprite and portrait entry points. It reads copies of appearance data, preserves all existing option IDs and renders authored parts for customization. Named canonical looks use matching full drawings. The 60 haircuts have distinct authored sheets; clothing, face, facial hair, hat and footwear parts retain their option IDs. Small jewelry, marks and garment patterns are overlays.

World art uses a 96×108 transparent canvas displayed at 32×36 world units, with feet at (48,108). A threefold world render target preserves detail while retaining logical coordinates, collision, camera calculations and interaction distances. Portraits use 192×192 art at the existing CSS sizes. The renderer integrates breathing, blinking, sitting, holding-nose reactions and the existing flashlight carrier/obstacle system.

Additional cast walking uses continuous figure motion applied to authored standing drawings. These are not new full walk sheets for all 67 records. Remy, Doug, Priya and Poppy retain their generated walking frames; the customizable player uses a consistent modular rendering path. The current customization repair and its visual evidence are documented in `review/customization-v4/README.md` at the repository root.

Rebuild from the repository root using `npm run build:graphics` with the pinned Python requirements installed. `sources/encode.py` verifies identical decoded RGBA for every lossless WebP against its retained PNG. Its cache is ignored. `sources/build.cjs` compiles the renderer, protects the immutable baseline and last generated output, embeds all artwork, and writes `public/index.html` plus `build.json`.

The baseline gameplay source remains unchanged in this graphics release. The compatibility test creates a save with the old build, then loads the same disposable browser storage with the new one. It does not access the user's live save. The outdoor plant-yield update still requires the user's playtest; no plant balancing or approval is included here.

Final evidence is under `review/final/`. Automated coverage and viewport emulation do not establish physical-phone performance, long-duration gameplay or visual perfection across every possible customization combination.
