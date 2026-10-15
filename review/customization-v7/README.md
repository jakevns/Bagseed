# Hair proportions and head-shape fitting

This is the historical hair-fitting checkpoint. The current facial-detail work and build evidence are in [customization v8](../customization-v8/README.md).

The user reported oversized back views and off-center profiles in v6, particularly flat-top, swept cuts and fades. V7 re-registers the retained transparent hair artwork against skull proportions and roots. The local playable file is `public/index.html`. User visual acceptance is pending.

The old fitter treated outer wig dimensions as skull dimensions. The new registration assigns appropriate volume to close cuts, layers, curls, long hair and up-dos; it scores the original eye/ear opening and anchors the back at the nape. Loose hair's front length also constrains profile/rear length, preventing locs and long bobs from growing dramatically when turned. Complete source silhouettes and fringe edges remain intact.

Each head shape now applies a stable anatomical transform around the neck, shared by the bald anatomy, hair roots, facial hair and hat. Previously, large hair could change that transform by forcing a bounding-box clamp, shrinking or moving the face. Shape-specific composed variants are cached by appearance. These changes fit the existing transparent art without generating separate painted hair files for every face shape.

Review images:

- `reported-four-before.png` / `reported-four-after.png`: the four reported cut families on the reconstructed outfit, front/side/back.
- `reported-cuts-before.png` / `reported-cuts-after.png`: eight close cuts, including all four directions.
- `head-shapes-1-after.png` through `head-shapes-3-after.png`: all 15 head shapes beside their bald anatomy, with flat-top, side-swept pixie and fade. Before images retain the rejected behavior for comparison.
- `mirror-flattop.png`, `mirror-slick.png`, `mirror-fade.png`, `mirror-sidepixie.png`, `mirror-quiff.png`: actual wardrobe mirror captures.
- `mirror-sidepixie-wide.png`, `mirror-sidepixie-long.png`, `mirror-sidepixie-petite.png`: actual mirror captures on contrasting head shapes.
- `hair-colors-1.png` through `hair-colors-7.png`: all 61 choices, four directions and three colors.
- `hats.png`, `bald-hair-hat-layers.png`, `animation-frames.png`, `outfits.png`, `facial-hair.png`: checks of the retained composition and customization features.

Recreate with `node tools/review-head-fit.cjs` and `node tools/review-layered-characters.cjs review/customization-v7`. Tests use disposable storage and do not access the live player save. No new artwork was generated, no live save was changed, and no GitHub push or deployment was performed. The sources and prompts remain in `graphics/production/customization-v5/sources/`.

Final validation and exact build checksum are recorded in `validation.json`.

The final head suite passed all 11 tests. Hair margins and stable face geometry each passed all 3,660 style/shape/direction combinations. The fringe check retained 918,909 inspected hair pixels across 183 views; close-cut skull dimensions (16), shoe footprints (48), hat/eye placement (1,464) and blink locality (549) passed. The full game suite's other 17 checks passed, including bedroom/bedding, creation, wardrobe save/reload, standalone-file use and phone layouts. Its initial wide-head/big-afro margin failure was corrected in four hair assets, then verified by rerunning the complete head suite. The final source parses all 80 script blocks and retains the archived baseline checksum.

Cast preservation checks passed 1,872 comparisons for 71 NPC standing/portrait appearances and 260 direct asset checks for all 52 authored smell-pose owners, with no browser errors. The 21 retained source image hashes are unchanged. All hair/color boards, head-shape comparisons and the reported wardrobe cuts were visually inspected.
