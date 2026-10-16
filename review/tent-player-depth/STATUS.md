# Player/tent depth correction

The released starter tent repainted its opaque foreground after the entire room, including actors. This hid the player's torso at the entrance. The new regression test fails on released commit 240b3ee with a covered-player pixel at the starter tent's front edge. before-player-front.png preserves the reproduction; player-front.png shows the correction in the actual public/index.html renderer.

Removed the final room repaint and its duplicate tint cache. The roof, sides and tray still occlude internal equipment/pots in the tent-local pass. A shared per-space aperture hook now clips late grow-light effects in the bedroom and grow room. Future tent renderers can register their opening/door mask without repainting over actors. The normal scene applies ambient tint once.

tests/tent-player-depth.test.cjs covers 132 front-approach cases across all four current tent sizes and their shell tiers, open/zipped doors and day/night, plus two checks that players behind grow-room tents remain correctly occluded. tests/starter-tent.test.cjs retains coverage for 24 internal-layer combinations, 12 interaction cases, nine zip frames, reduced motion, indicators, store/purchase/fitting and save reload.

The original drawings, shell choices, price and logical grow contents are unchanged. See graphics/tents/README.md for the rendering contract and required coverage for future tents. This is the user's requested functional correction to the already-approved starter tent update, with no new art design.

Validation passed: npm run check (99 script blocks, original baseline and character payload), starter-tent.test.cjs, tent-player-depth.test.cjs (132 front and two behind cases), and grow-pot-garden.test.cjs. starter-regression.json retains the detailed existing tent-feature report. modules.json verifies unchanged image assets and 20 other embedded modules. Player preview and original bug reproduction are retained alongside the reports.
