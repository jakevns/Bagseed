# Individual top repairs

The prior shared-layer fix preserved arm pixels but did not repair the remaining source drawings. Each of the twelve affected tops was inspected separately and its opposite-contact source pose (index 4) replaced. Both side directions use the correction. The approved cardigan, crop and tank atlases are byte-identical to release `c6864e5`; all other seven side poses and front/back parts remain unchanged (1,402 part comparisons).

| Top | Source finding and correction |
|---|---|
| Flannel | Rear cuff pinched against waist; restored shoulder-connected sleeve and retained painted plaid. |
| Garden | Rear sleeve buried beside apron; restored shoulder/elbow contour behind apron. |
| Hoodie | Rear arm tucked into torso; corrected sleeve anatomy and fixed compositor loading the old separate hoodie source. |
| Jacket | Rear cuff appeared against lower torso; restored full backward sleeve. |
| Lab coat | Rear arm hidden against coat hem; restored shoulder attachment outside coat silhouette. |
| Officer | Short sleeve and bare forearm compressed against torso; restored continuous upper arm/elbow. |
| Overalls | Rear arm obscured beside bib; restored cream sleeve and bare forearm. |
| Pajamas | Rear sleeve merged into shirt side; restored full connected sleeve. |
| Suit | Rear blazer sleeve merged into waist; restored shoulder-to-cuff contour. |
| Sweater | Rear knit cuff pinched against waistband; restored backward sleeve. |
| T-shirt | Rear short sleeve/forearm lacked the approved back swing; restored shoulder-connected arm. |
| Work shirt | Rear hand appeared at back waist; restored continuous long sleeve from shoulder. |

All retain the intact upper-body compositing introduced for the cardigan. The source drawings, rather than only layering, needed correction. Per-contact fabric luminance normalization prevents replacement fabric colors from flashing relative to the untouched poses. Source pixels are uniformly registered once; limbs are not mesh-warped or painted in code.

`index.html` shows synchronized before/after playback at native resolution with direction, slow motion, pause and individual pose controls. `right/` and `left/` contain captures through the built game's real compositor. Source filmstrips are in `items/`. Automated geometry and pixel checks supplement visual inspection; they do not alone prove a natural gait.

Original generated assets, exact prompts and registration records are in `graphics/production/walk/wardrobe-v5/arm-v7/`. To reproduce one replacement, run `python graphics/production/walk/wardrobe-v5/sources/repair_one.py STYLE`. Full wardrobe registration reapplies these overrides after its base pass. The palette reference is pinned to `c6864e5` so subsequent commits do not change the normalization target.

Validation: `preserved-art.json`, `pixel-validation.json`, `live-wardrobe-validation.json`, and `stride-live-validation.json`. The production build and `node tools/check.mjs` verify that the published character data matches its sources. The companion character data file remains separate from HTML for GitHub's file-size limit.
