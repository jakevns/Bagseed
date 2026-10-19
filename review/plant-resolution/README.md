# Tent plant resolution correction

Status: user-approved production integration.

At mobile DPR 2 / close zoom, the published room used a 1440×540 backing canvas for a 480×180 room (3×), then displayed it at 8× zoom with nearest-neighbor scaling. Small tent foliage lost detail before enlargement. Outdoor giant proxies occupy more room pixels and show the problem less strongly.

`graphics/plants/sources/scene-resolution.js` renders bedroom/growroom at a zoom-aware 3–6× density, bounded to four million world pixels, and smooths only their final room-to-screen draw. At the captured settings the room is 2880×1080 (6×). Its wrapper normalizes the character renderer's former fixed-3× source rectangle to the actual backing size. Camera destinations, transforms and interaction coordinates stay native. Other scenes retain their existing world render path. Character artwork and payload are unchanged.

Plant animation surfaces also use the requested draw density, capped at 6×, retaining the existing eight-frame-per-second cache and a single current animation surface per sprite. Reduced-motion renders use a still surface at the same density. Original atlas images, genetics, stage progression, source art, attachments, foreground tent masks, pot rims and draw ordering are unchanged. This adds no asset downloads. Larger backing surfaces increase local canvas memory and fill work; the caps limit that increase. Actual physical phone performance has not been measured.

[Before](before.png) / [After](after.png). Captures use DPR 2, the same native line, fixed visual identity seeds, 22-inch height and nine nodes in starter and 2×2 tents. Screenshots contain existing tutorial overlays. The 4×4/5×5 cases are exercised in the growroom regression.

Passed: `npm run build:bedroom`, `npm run check`, `node --test --test-concurrency=1 tests/plant-resolution.test.cjs tests/live-plants-browser.test.cjs` with Chromium. Nine scene/zoom cases cover both grow rooms and the outdoor path; all four tent plant targets remain present, camera-to-world round trips hold, final source rectangles use the complete world canvas, still surfaces remain stable, wind animates, biology stays unchanged, and no JavaScript errors occur. The existing browser suite also checks source atlases, mutations, saved plants and startup readiness. See `verification.json` for the resolution-specific results.
