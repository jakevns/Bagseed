# Pocket Dwarf components

Status: **user-approved gameplay implementation**.

Cushion and upright-compact forms shorten the upper axis and branch reach while retaining mature fan detail. The renderer uses the plant’s actual saved height; it does not multiply the simulation height down a second time. A stage/node-aware mature leaf floor avoids uniformly shrinking every organ. Painted opposite node collars remain attached after leaf cleanup, and lower flowers retain native graded popcorn sites.

Both forms derive deterministically from the existing saved art seed and foliage traits. Host leaf and flower kit identities remain pinned; clones, snapshots, older saves, stress, training, supports, canopy cleanup and wind reuse the native systems. No inheritance probabilities, reproductive rules, yield/speed/mold statistics, catalog entries or saved heights were changed. The Triploid field-guide description now matches the approved reference-based artwork; its existing seed/pollen restrictions are explicitly described as Bagseed rules.

Original generated PNGs live in `assets/`. Registration preserves their pixels and emits RGBA-exact lossless WebP with SHA-256 hashes under `public/assets/plants/mutations/pocketdwarf/`. The existing external image pipeline for `public/assets/embedded/` is retained. Both new atlases participate in startup readiness; all fifteen native mutation families now have component manifests locally.

Study references: supplied `Bagseed_Mutation_References.zip`, R24 and R22 (compact stature analogues, not proof of a specific dwarf gene). Approved concept: `review/mutation-detail/photo-based-batch-03/structure-and-color-studies-03.png`. Original source photos remain outside the repository; new graphics are original game art.

Register with `python3 tools/compile-mutation-components.py`, build with `npm run build:bedroom`, then run `npm run check`. Actual game samples and assertions: `node tools/preview-mutation-batch-06.cjs --animate`. Review evidence: `review/mutation-detail/implemented-batch-06/`.
