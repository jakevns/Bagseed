# Approved seedling desks

The user approved the three-design board with “Great job!! Send it :)”. This increment updates the existing `workbench` equipment slot: Folding Card Table (included), Used Writing Desk ($49), and Gardener's Bench ($149). Their mixing bonuses remain 0, 0.05 and 0.12. This is separate from the decorative Potting Bench item.

`assets/approved-concept.png` retains the approved bedroom/store board. `assets/desks-atlas.png` is the original transparent production image generated from that board. The source PNG is preserved unchanged; `sources/manifest.json` records its hash, dimensions, crop rectangles and tabletop anchors. Registration excludes transparent padding and aligns the furniture with the existing supplies and floor shadow. The pegboard belongs to tier 2's frame; loose tabletop supplies, seed storage and the supply box continue to render separately from game state.

`sources/renderer.js` wraps `Gear.bench` and `drawGearIcon`. Room frames, store cards, inventory/museum icons and delivery previews use the same artwork. The preview canvas is 240×180 for every tier, with a common frame that includes the entire pegboard. Other equipment falls through to its existing renderer, and legacy art remains available while the atlas loads. `BagseedDesks.ready` exposes artwork readiness.

Rebuild with `npm run build:bedroom`. Both this build and the full graphics build use `tools/compile-desks.cjs`, which verifies the original source hash and registration before embedding the image in the standalone game. Existing character, room-shell and bed modules are retained unchanged.

Run `node --test tests/seedling-desks.test.cjs` for the focused browser check. It covers all three distinct frames/previews, original bench/storage/supply interactions, inventory-sensitive supplies, actual store cards and checkout, delivery previews, installation, mixing-panel access, save/reload and phone proportions. Captures are written to `artifacts/seedling-desks/`; reviewed captures and the report are retained under `review/seedling-desks/`. Full validation uses `npm run check` and `npm test`.
