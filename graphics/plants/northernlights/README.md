# Northern Lights dedicated plant components

Status: user-approved production artwork, 2026-10-19. Native line: `cl_northernlights`.

Broad forest-green fans; dense rounded olive flower clusters and amber pistils. The native default is Forest green with broad foliage. Late-flower fans follow the existing golden senescence palette; this update adds no purple pigment eligibility.

Sixteen original connected organs cover seed, radicle, cotyledon, four juvenile/mature fan forms, sugar leaf, stem, junction, three female flower stages, two male stages and bamboo. Source PNG pixels are retained exactly; the compiler verifies lossless RGBA WebP and measured nonoverlapping crops. The approved sources also remain in `review/strain-batch-06/kits/northernlights/`.

The production native PlantArt renderer selects these parts for new plants. Existing living plants of this native line upgrade at create/load/save boundaries when the saved expressed leaf/flower traits match; identity seeds, physical height and simulation genomes remain unchanged. Incompatible expressed traits keep their compatible donor parts. Historical photo recipes stay pinned. Clones, saved recipes, attached branching, popcorn buds, cleanup, wind, training, supports, stress, mutation overlays and drying reuse the shared systems. No native genetics, timing, yields or balance rules changed.

Review: `review/strain-batch-06/README.md`. Rebuild: `python3 tools/compile-plant-components.py northernlights`, then `npm run build:bedroom`.
