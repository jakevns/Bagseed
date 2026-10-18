# Triploid components

Status: **user-approved gameplay implementation**.

The plant keeps its host strain’s natural anatomy, leaf/flower palettes and branching. The previous live-renderer dark tint and forced leaf/bud widening are removed. A small copper or verdigris 3x plaque identifies the game’s known genetics after the normal mutation discovery event. Unrevealed plants render identically to matched controls, and the sprite cache updates on reveal. The badge is a game identity convention; it does not diagnose chromosome count from appearance.

Both forms derive deterministically from the existing saved art seed and foliage traits. Host leaf and flower kit identities remain pinned; clones, snapshots, older saves, stress, training, supports, canopy cleanup and wind reuse the native systems. No inheritance probabilities, reproductive rules, yield/speed/mold statistics, catalog entries or saved heights were changed. The Triploid field-guide description now matches the approved reference-based artwork; its existing seed/pollen restrictions are explicitly described as Bagseed rules.

Original generated PNGs live in `assets/`. Registration preserves their pixels and emits RGBA-exact lossless WebP with SHA-256 hashes under `public/assets/plants/mutations/triploid/`. The existing external image pipeline for `public/assets/embedded/` is retained. Both new atlases participate in startup readiness; all fifteen native mutation families now have component manifests locally.

Study references: supplied `Bagseed_Mutation_References.zip`, R09 (scientific whole-plant comparison) and R10 (DNA content/chromosomes). Approved concept: `review/mutation-detail/photo-based-batch-03/structure-and-color-studies-03.png`. Original source photos remain outside the repository; new graphics are original game art.

Register with `python3 tools/compile-mutation-components.py`, build with `npm run build:bedroom`, then run `npm run check`. Actual game samples and assertions: `node tools/preview-mutation-batch-06.cjs --animate`. Review evidence: `review/mutation-detail/implemented-batch-06/`.
