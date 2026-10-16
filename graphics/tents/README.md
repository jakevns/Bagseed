# Tent rendering rules

Tent contents and front fabric are local layers, not a final screen overlay. Draw the lining, live plants/equipment, and foreground fabric together at the tent's normal position in the scene. Preserve existing actor/furniture depth sorting. Never repaint a full tent frame after RoomArt.draw or after the player/NPC pass; that hides the player's torso at the tent entrance.

For late lighting, register `RoomArt.growEffectMasks[loc] = (context, doorProgress) => { ... }`. Intersect the canvas clip with the illustrated opening and any still-open part of the moving door. The caller saves/restores the context. The shared bedroom and grow-room light passes call this hook; unregistered locations keep their current lighting. Apply ambient color with the normal room pass rather than applying it again to a late fabric overlay.

Before publishing future tent artwork, run `node --test --test-concurrency=1 tests/tent-player-depth.test.cjs tests/starter-tent.test.cjs`. The first test checks left/center/right approaches across the starter, 2x2, 4x4 and 5x5 shell tiers, open/closed doors and day/night, plus the opposite depth relationship behind the two grow-room tents. Add new tent locations and tiers to this coverage when they enter the catalog. The second test protects the approved plant/light/pot layering, zipper motion, store artwork and saved content.
