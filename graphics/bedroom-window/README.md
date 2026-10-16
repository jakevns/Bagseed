# Live bedroom window — awaiting artwork approval

Reuses the four approved outdoor paintings and transparent cloud sprite from the loading-screen release 0cbf21e. No new image files or duplicated embedded outdoor assets are needed. The original images and their hashes remain under graphics/loading-screen. The reusable painter is now sources/scenery.js; both startup and gameplay use the same decoded atlas/cloud pair through BagseedWindowScenery.

The game uses state.minute for daylight, sunset, blue hour, and night. Dawn reverses those lighting states smoothly. The loading screen retains its 12-second loop. Clouds move more slowly during gameplay, accelerate in windy/stormy weather, and stop with reduced motion.

Drawing order:
1. Painted outdoor scenery, with moving clouds masked behind the cottage and tree.
2. Doug when his existing yard schedule is active, plus eligible native street walkers.
3. Near fence pickets, rails, shrubs, and garden, using traced masks over the same painting. The upper fence gaps stay transparent to people; the near garden hides their feet.
4. Weather cover/haze and the original rain, snow/frost, heat, fog, and wind effects.
5. Original mullions, sill, all seven curtain choices, tomato gift, and sill cat.

Integration overrides HouseWing115c.yard only. The previously installed HouseWing wrapper repainted the entire window over the original walker layer. This renderer calls the captured native Hood.drawWindowWalkers function before painting the foreground, avoiding that override's recursion. Neighbor schedules, actions, hit geometry, cat behavior, curtain artwork/motion, AC/decor placement, saves, and scene layout remain native. The shutdown cutscene keeps its original drawing path.

The shared readiness promise participates in startup gating, and a late BagseedBedroomWindow promise is also discovered by the loader. Both build paths use tools/build-bedroom.cjs. tools/check.mjs verifies the live renderer and the shared loading payload against their sources, along with the immutable baseline and character payload.

Review previews: review/bedroom-window. Tests: bedroom-window.test.cjs, bedroom.test.cjs, loading-screen.test.cjs, and curtains-batch-03.test.cjs. No publishing until this batch is approved.
