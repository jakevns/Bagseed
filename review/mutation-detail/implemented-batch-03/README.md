# Snowtip, Fernfrond and Goldleaf — native gameplay review

Status: **gameplay artwork approved by the user for production**. The earlier four painted mutation implementations remain approved and live. These three are included in the production build; eight other families retain their current rendering.

## Samples

- [Three mature plants](three-mutations.png): actual native renderer, 50-inch vegetative plants at a common physical scale.
- [Runtime leaf details](runtime-leaf-details.png): actual processed leaf tiles for two mature forms, young fans and sugar leaves.
- [Snowtip leaf aging](snowtip-leaf-aging.png): the same attached organ (`fan:4:-1`) as later nodes develop above it. Pale, intermediate and green tissue share the original source, shape, petiole and phenotype. Mature tissue preserves painted shading and veins.
- Growth stages: [Snowtip](snowtip-growth.png), [Fernfrond](fernfrond-growth.png), [Goldleaf](goldleaf-growth.png). Shared scale from seedling through late flowering.
- [Color and finishing variants](phenotype-colors.png): green/blue vegetative palettes and purple/red late-flower colors, including existing eligible cool-night pigmentation.
- [Growth and wind MP4](growth-and-wind.mp4) / [GIF](growth-and-wind.gif): 72 real renderer frames over six seconds. Stage/height inputs demonstrate 3-to-50-inch growth, then hold height for wind. This is a renderer demonstration, not a full simulated growing season.
- [SCROG, bamboo, cleanup and stress](training-and-stress.png).
- [Combined expressed traits](combined-mutations.png): Monophylla + Snowtip, Fernfrond + Moonmarble, Ducksfoot + Goldleaf.
- [Actual bedroom](bedroom-gameplay.png), [mobile game](mobile-gameplay.png), [native guide/card images](native-guide.png).

## Reference and rendering choices

Snowtip follows the approved partial-pale interpretation of R25/R26: ivory or green-edged new leaves above green supporting foliage. Its existing game convention of greening is derived from later node development, without a new saved age counter. It is not a claim that a fully albino adult is viable or that photographs prove a distinct inherited trait or inevitable recovery.

Fernfrond follows the finer dissected fan forms of R02/R17 and the approved concept, with connected rays and regularly repeated narrow divisions. It replaces the synthetic fern mask. Its more regular, finer distinction from Freakshow is an explicit game-art convention within the photographed dissected-leaf family.

Goldleaf follows R18's yellow-green tissue with retained green areas, plus the approved green-veined/golden-olive variations. Healthy golden tissue does not depend on hunger, burn or senescence. Existing health effects and finishing colors still apply. Pigment combinations are game-art proposals, not new inheritance claims.

All three have original painted juvenile, young, mature and sugar organs in two forms. The engine's `fiveLeaf`/`sevenLeaf` role names are maturity slots sharing a suitable mature organ. Moonmarble patterning, Snowtip pale growth and Goldleaf tissue can layer on the existing anatomical shapes. Shape precedence: Monophylla > Ducksfoot > Freakshow > Fernfrond. Seeds, cotyledons, male flowers and strain flower kits remain native. Sugar leaves attach to flower-bearing branches and respond to support, cleanup, stress, finishing and wind.

Native mutation IDs, genes, tradeoffs, catalog records and pinned visual seeds remain unchanged. Cuttings keep the mother's form; no visual mutation roll is added. Source photographs remain outside the repository. Only new original game art is shipped; supplied source credits/URLs and atlas hashes are recorded in `review-manifest.json`.

## Verification

`verification.json` records real startup asset gating, all 38 catalog records per family, seedling through drying/cured stages, attached organs, 50/90-inch growth, both sexes, training/support/cleanup/stress, wind/reduced motion, fixed roots, snapshots/clones, save/reload, pre-art saves and combined expressed traits. A real stamped-leaf pixel check confirms gradual Snowtip greening without rerolling its form, and healthy golden Goldleaf tissue. Moonmarble pale-tissue preservation remains covered under dark pigment and finishing overlays. No JavaScript errors occurred.

Build/check passed. Seventeen growth/canopy/night-color model tests passed. Four browser regressions passed: live painted plants, mutation genetics, person scale and the previous three mutation families. The approved Freakshow capture/assertion workflow also passed in a temporary directory.

Regenerate this review with `node tools/preview-mutation-batch-03.cjs --animate`. Run the same native assertions without animation export using `node --test tests/mutation-batch-03-renderer.test.cjs`; its artifacts use a temporary directory.
