# Ducksfoot, Monophylla and Moonmarble — native gameplay review

Status: **gameplay artwork approved by the user for production**. This batch follows the approved Freakshow implementation. The three approved implementations are included in the production build. Eleven other mutations retain their existing rendering.

## Samples

- [Three mature vegetative plants](three-mutations.png): actual native renderer at a common scale, each 50 inches tall.
- [Runtime leaf details](runtime-leaf-details.png): magnified processed game tiles for two mature forms, young growth and sugar leaves.
- Full growth cycles at a shared scale: [Ducksfoot](ducksfoot-growth.png), [Monophylla](monophylla-growth.png), [Moonmarble](moonmarble-growth.png).
- [Color and finishing families](phenotype-colors.png): green and blue vegetative palettes, purple and red late-flower finishing, existing eligible cool-night pigmentation.
- [Growth and wind MP4](growth-and-wind.mp4) / [GIF](growth-and-wind.gif): 72 native frames over six seconds. Review stage/height inputs grow the real branch model from 3 to 50 inches, then hold height to show wind. This is a renderer demonstration, not a complete simulated growing season.
- [Care and training](training-and-stress.png): SCROG, bamboo, canopy cleanup and droop/yellowing for each mutation.
- [Combined mutations](combined-mutations.png): expressed leaf-shape traits retain their anatomy under Moonmarble sectors.
- [Actual bedroom](bedroom-gameplay.png), [mobile gameplay](mobile-gameplay.png), and [native mutation guide/card art](native-guide.png).

## Anatomy and identity

Ducksfoot has joined webbing with serrated lobe margins and veins radiating from the petiole. Monophylla follows the supplied AD17 analogue: one undivided blade, smooth-to-wavy margins and quilted lateral veins. Moonmarble has ordinary serrated fan anatomy with irregular pale sectors that retain tissue/veins. Its predominant marbled or sectorial family and per-organ pattern choices are deterministic; sectors do not move independently of the leaf.

The original `fiveLeaf`/`sevenLeaf` role names are engine maturity slots, not a fixed leaflet-count claim. Each new atlas supplies juvenile, young, mature and sugar organs in two forms. Both mature fan slots share an appropriate mature organ. Monophylla stays single-bladed as an adult. Native seeds, cotyledons, male flowers and strain flower kits remain in use. Sugar leaves follow their own flower attachment through growth and wind.

Moonmarble is a tissue treatment separate from shape: Monophylla > Ducksfoot > Freakshow retains established single-blade/webbed precedence, while cream sectors can coexist with any of these and the existing Fernfrond shape. Cream tissue is protected from healthy palette and senescence/dark-pigment overlays. Reference evidence does not verify every proposed pigment pairing or establish a new inheritance mechanism. Existing genes, mutation names, tradeoffs, strain catalog and saved visual recipes are retained.

Sources: approved [batch 01 concepts](../photo-based-batch-01/README.md), supplied photographs R05/R13, R14/R15 and R26/R28/R13. Credits and provenance URLs are in the companion review manifest. Original game sprite atlases are generated art; supplied photographs remain outside the repository.

## Verification

`verification.json` records real startup asset gating, source-atlas use, seedling through drying/cured stages, all 38 current catalog records per family, growing 50/90-inch models, deterministic forms, connected organs, both sexes, SCROG/topping/LST, supports, cleanup, stress, wind/reduced motion, fixed roots, clones/snapshots, save/reload and pre-art saves. A source-versus-shader pixel check verifies pale Moonmarble tissue survives blue leaves, Inkleaf pigment and late-flower finishing. No JavaScript errors occurred.

Build/check passed. Seventeen existing growth, canopy and night-color model tests passed. Three browser regressions passed (live painted plants, mutation genetics, person scale). The approved Freakshow native capture/assertion workflow also passed using a temporary output directory.

Regenerate samples/assertions with `node tools/preview-mutation-batch-02.cjs --animate`; run the same functional assertions without media export using `node --test tests/mutation-batch-02-renderer.test.cjs` (temporary artifacts only).
