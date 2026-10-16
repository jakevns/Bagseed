# 4×4 tent — artwork samples awaiting approval

This batch covers the existing GrowHut 4×4 tent and its three shell appearances: Standard included with the $249 tent, Pro replacement $119, Premium replacement $219. Four slots, current grow-room location, prices, unlock rules and the 132×128 logical bounds are retained. The frame is broader than the approved 2×2, with charcoal cloth and sage trim, reinforced moss Pro details, and padded brass/diamond-lining Premium details.

assets/tents-atlas.png is the original generated atlas, retained unchanged. sources/manifest.json records complete open/closed sprite crops, dimensions and SHA-256. The original source contains transparent gutters. No plants or equipment are painted into these shells.

sources/proposal.js is injected into an isolated browser using public/index.html. It draws the empty lining, soft local light, clipped equipment and four live plants, then front roof, side columns, floor lip and zipped flap. Pots are recessed by 24 logical pixels with click targets moved together; approach points remain outside the physical frame. TentArt.draw remains in the native depth-sorted furniture pass, before a player standing in front. No fabric is repainted after actors. The existing 5×5 and all bedroom artwork are unchanged.

The proposal uses the native nine-step zipper timing and independently drawn gear, keeps current outside climate devices, controller and wall-mounted AC handling, and supplies matching shell, base-store and grow-space icons. It is not yet a production module or published game update.

Run `node tools/preview-tents-4x4.cjs` for real grow-room and store captures and checks. Outputs are in review/tents-4x4/. After artwork approval, production integration still needs a verified compiler, startup readiness gate, build/source integrity, complete purchase/package/inventory/fitting/save tests and the standard tent regression suites before publishing.
