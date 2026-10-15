# Natural fringe, footwear and hat fit

Historical v6 evidence. The user reported further hair size/centering defects; current fitting work and validation are in [v7](../customization-v7/README.md).

The user found remaining forehead cuts, inconsistent footwear proportions and hat-fit problems in v5. This revision corrects the renderer and registrations using the retained transparent artwork. No new artwork was generated in this revision. The playable local file is `public/index.html` at the repository root. User visual acceptance remains pending.

The forehead cut came from a broad face plate drawn over the hair. It has been removed. Hair's original transparent opening now reveals the face, with the full strand silhouette composited above the bald anatomy. Registration fits that opening to eye landmarks and uses the front crown as a placement reference while turning. It does not erase pixels to expose the face. Hat occlusion is retained where hair belongs under the worn crown. Each hat has its own brim clearance, lowered to sit against the forehead rather than float above it.

The shoe sheets had all been normalized to the same height, including their ankles and boot shafts. A shared width scale consequently made boots and rain boots much narrower than sneakers. The renderer now measures each source pair's actual opaque footprint and registers it to the same stance: 32 logical pixels from the front/back, 28 from profiles. Boot shafts overlap the leg and the selected shoes remain the sole footwear layer. High-resolution source detail is retained.

Evidence from the running renderer:

- `reported-outfit-before.png` / `reported-outfit-after.png`: reconstructed purple spiky hair with dark striped shorts, silver quiff with cargo pants, and the four hats shown by the user, all four directions. Outfit colors approximate the screenshots.
- `natural-fringe-before.png` / `natural-fringe-after.png`: transparent source hair alongside composed heads. The original forehead strands remain visible.
- `footwear-before.png` / `footwear-after.png`: all four shoes on jeans, shorts and skirts, in four directions. JSON companions retain measured footprint widths.
- `mirror-none.png`, `mirror-beanie.png`, `mirror-cap.png`, `mirror-bucket.png`, `mirror-straw.png`, `mirror-purple-shorts.png`: actual wardrobe mirror screenshots using disposable browser storage. `reconstructed-appearance.json` records the selected values.
- `gameplay.png`: the reconstructed custom character in the actual bedroom.
- `hair-colors-1.png` through `hair-colors-7.png`, `hats.png`, `animation-frames.png`, `facial-hair.png`, `outfits.png`: full customization boards after the correction.

Recreate with `node tools/review-character-fit.cjs` and `node tools/review-layered-characters.cjs review/customization-v6`. Run `npm test` and `npm run check` with Playwright/Chrome configured. The final build and validation results are recorded in `validation.json`.

The new regression checks compare the forehead composition against the complete transparent hair layer, including translucent strand edges, and measure footwear extents across designs, outfits and directions. Existing checks cover face geometry, hat/eye placement, blink locality, body joins, creation, wardrobe changes, save/reload and gameplay. Approved cast artwork and all completed smell poses are checked separately for preservation.

Final validation: all 27 browser tests passed, including direct standalone-file creation/save/reload and both phone viewport layouts. The fringe comparison checked 936,576 hair pixels across 183 style/direction combinations with no repainted or erased pixels. All 48 footwear design/outfit/direction measurements match the fixed stance widths. Hat/eye comparisons (1,464), local eye blinks (549), head canvas margins (732), independent hair layers (244) and joined outfit/body/direction checks (300) passed. All seven hair/color sheets and the focused outfit, fringe, footwear, hat and mirror evidence were visually reviewed. The baseline checksum matches and all 80 built game script blocks parse.

The underlying transparent sources and prompts remain in `graphics/production/customization-v5/`. This revision changes registration and code composition, not the original source paintings. The prior source generation used the built-in image tool; this revision used no image generator. Generic movement still uses continuous figure motion rather than newly authored walk cycles. No live user saves were accessed and no push or deployment was performed.
