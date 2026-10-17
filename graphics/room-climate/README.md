# Bedroom window climate station

Shared bedroom heaters and coolers sit beside the watering can and reservoir by the window. The watering jug moves left to x=291 (x=290 for the long-spout can), the cooler centers at x=314 and the heater at x=331, all with floor y=113. Extra owned units use the same columns 18 units further forward, preserving side-by-side placement for the primary set. HVAC remains wall mounted by that window. Grow-room positions, equipment ownership, saves and climate calculations retain their native behavior. Cooler artwork remains the existing design pending its separate art batch.

Floor items use their actual foot depth, collision footprint and click target. The doorway stays clear. Nearby controls permit only heater/cooler/HVAC temperature and power actions; they do not grant access to tent doors or plants. Controls cease working from another room or beyond the station range.

Build with `npm run build:bedroom`; verify with `npm run check` and `node --test --test-concurrency=1 tests/room-climate.test.cjs tests/heaters.test.cjs`. Actual index.html day/night proof: ../../review/heaters/approval-window-station.png. Placement, controls, temperature inputs, unrelated-access restrictions, doorway clearance and save/reload results are in ../../review/heaters/window-station-validation.json.
