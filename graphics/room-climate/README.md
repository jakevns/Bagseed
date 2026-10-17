# Bedroom window climate station

Shared bedroom heaters and coolers sit beside the watering can and reservoir by the window. Owned units form a column at x=323, starting at floor y=113 with 18 units of spacing; heaters precede coolers. HVAC remains wall mounted by that window. Grow-room positions, equipment ownership, saves and climate calculations retain their native behavior. Cooler artwork remains the existing design pending its separate art batch.

Floor items use their actual foot depth, collision footprint and click target. The doorway stays clear. Nearby controls permit only heater/cooler/HVAC temperature and power actions; they do not grant access to tent doors or plants. Controls cease working from another room or beyond the station range.

Build with `npm run build:bedroom`; verify with `npm run check` and `node --test --test-concurrency=1 tests/room-climate.test.cjs tests/heaters.test.cjs`. Actual index.html day/night proof: ../../review/heaters/approval-window-station.png. Placement, controls, temperature inputs, unrelated-access restrictions, doorway clearance and save/reload results are in ../../review/heaters/window-station-validation.json.
