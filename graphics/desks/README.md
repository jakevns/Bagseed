# Approved seedling desks

The user approved the three-design board with “Great job!! Send it :)”. This increment updates the existing `workbench` equipment slot: Folding Card Table (included), Used Writing Desk ($49), and Gardener's Bench ($149). Their mixing bonuses remain 0, 0.05 and 0.12. This is separate from the decorative Potting Bench item.

`assets/approved-concept.png` retains the approved bedroom/store board. `assets/desks-atlas.png` is the original transparent production image generated from that board. The source PNG is preserved unchanged; `sources/manifest.json` records its hash, dimensions, crop rectangles and tabletop anchors. Registration excludes transparent padding and aligns the furniture with the existing supplies and floor shadow. The pegboard belongs to tier 2's frame; loose tabletop supplies, seed storage and the supply box continue to render separately from game state.

`sources/renderer.js` wraps `Gear.bench` and `drawGearIcon`. Room frames, store cards, inventory/museum icons and delivery previews use the same artwork. The preview canvas is 240×180 for every tier, with a common frame that includes the entire pegboard. Other equipment falls through to its existing renderer, and legacy art remains available while the atlas loads. `BagseedDesks.ready` exposes artwork readiness.

Rebuild with `npm run build:bedroom`. Both this build and the full graphics build use `tools/compile-desks.cjs`, which verifies the original source hash and registration before embedding the image in the standalone game. Existing character, room-shell and bed modules are retained unchanged.

Run `node --test tests/seedling-desks.test.cjs` for the focused browser check. It covers all three distinct frames/previews, original bench/storage/supply interactions, inventory-sensitive supplies, actual store cards and checkout, delivery previews, installation, mixing-panel access, save/reload and phone proportions. Captures are written to `artifacts/seedling-desks/`; reviewed captures and the report are retained under `review/seedling-desks/`. Full validation uses `npm run check` and `npm test`.

## Approved supplies cleanup

The user requested cleaner, centered tabletop supplies after sharing a phone screenshot. `assets/supplies-atlas.png` preserves the new transparent source image; the manifest records each prop crop, display width and original atlas hash. `Gear.benchSupplies` is now a separate hook in the working source, with the original fallback retained. The illustrated override centers only the currently visible items with even spacing and a common tabletop baseline. Nutrient, organic feed, active/brewing jug and pH-pen visibility still follows game inventory. Desk frames and store/package artwork remain as approved.

The browser check covers all 16 optional-supply combinations on each of the three desks (48 layouts), checking centering, edge clearance, spacing, baseline alignment and unchanged inventory. `review/seedling-desk-supplies/centered-supplies-preview.png` shows actual rendered everyday and fully stocked desks. The user approved this preview and requested a pull before pushing. The remote was checked and the pull reported main already up to date. All 21 browser tests passed, including 48 supply layouts; the baseline checksum and 84 script blocks passed validation.

## Approved tabletop depth and upper-ledge placement

The user clarified that the lava lamp should remain ABOVE the green desk's pegboard and that the old ability to stack decorations must stay available. The upper decoration surface is therefore aligned to the illustrated pegboard's top trim at room y=52, x=231–286. The other two desk tiers retain the original windowsill at y=56. The supply row stays centered across the main tabletop's depth at y=74.5, with two-pixel gaps.

Original decoration placement and stacking rules remain available, including placement on the main desk and on custom tables/shelves. This revision removes the proposed restriction against placing decor over the built-in supply row. Saved items above the pegboard retain their horizontal positions and align to its top edge; items on the old main-table plane align to the new tabletop. Changing to another workbench tier returns upper decorations to the windowsill, and changing back restores the upper ledge. Custom attachments and other desks are preserved, and repeated alignment is idempotent.

`tests/desk-tabletop-placement.test.cjs` covers all 48 desk/supply combinations, both usable surface levels, normal main-desk placement, custom-furniture stacking, three upper-ledge decorations placed through the actual UI, legacy save alignment, tier switching and reload. `review/desk-tabletop-placement/pegboard-top-preview.png` shows the actual game rendering. The user approved this follow-up with “Go ahead and push the updates”. All 22 browser tests passed; the pull before committing reported main already up to date at `c5b0e24`. Use `public/index.html` for web previews.
