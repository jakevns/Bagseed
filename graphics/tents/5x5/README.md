# 5×5 tent — samples awaiting approval

This batch covers the existing six-slot GrowHut 5×5 Pro base tent ($489, Standard shell included), Pro replacement shell ($189) and Premium replacement shell ($339). The frame remains at x178/y2, 182×142 in the grow room, larger than the approved 132×128 4×4. Catalog names, prices, unlocks, capacity, growth and collision bounds remain unchanged.

assets/tents-atlas.png is the corrected original generated sprite sheet, retained unchanged. sources/manifest.json records its SHA-256, dimensions and the six complete open/closed crop rectangles. Charcoal cloth/sage seams match the approved tent family; Pro adds moss reinforcement and double seams; Premium adds padded brass corners and diamond lining. The broad doorway has a four-strap roll and twin zipper closure. No plants or equipment are painted into the shells.

sources/proposal.js is injected only into an isolated public/index.html browser. It draws the lining, soft light for two fixtures, clipped independent equipment and six live plants, then the roof, columns, liner lip and door fabric. Slot art is recessed 24 pixels and its centers pulled inward by 10/6/2/−2/−6/−10 pixels to keep every pot inside the frame. Visual targets follow those offsets while walk destinations stay outside. Native logical slot positions are restored after drawing, and the original actor/furniture sorting is retained. Front fabric is never repainted after actors.

The existing 380 ms, nine-step zipper timing, reduced motion, outside climate units/controller and wear/drying tags are retained. Matching artwork is provided for the base tent, replacement shell store cards, inventory and grow-space icons. The existing approved 4×4 is visible alongside it in the full-room screenshots.

Run node tools/preview-tents-5x5.cjs for approval-5x5.png, real grow-room/store screenshots, nine closing frames per tier and report.json under review/tents-5x5/. Run python tools/animate-tents-5x5.py to package those runtime frames into a slowed review GIF. This is a local proposal. Production compiler/startup/build integration, complete purchase/delivery/fitting/save checks and publishing follow artwork approval.
