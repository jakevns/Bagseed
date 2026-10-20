# Integrated v7 painted body

The game uses the approved unified v7 painting for all three base anatomies in
left/right Standing and Walk 0–7. Front/back retain their existing artwork and
renderer. NPC authored sprites are unchanged.

`build.py` works on copies of the approved source. It removes short isolated ink
fragments and the shoulder's closed attachment line. It measures the registered
v4 hand against the forearm at the wrist and applies uniform enlargement only
when the knuckles are narrower than that wrist. The original approved hand files
remain unchanged. `manifest.json` records each measurement and cleanup count.

Body parts use translation, rotation and one uniform character scale (0.9 of
the standard figure scale, to match the retained front/back world height). Each
anatomy keeps its measured bone lengths and joint positions. Clothes, head and
hair do not change those coordinates. The body retains the painting's luminance
when tinted through explicit skin masks. Cropped atlas packing avoids decoding
large empty sheets.

The tee, hoodie, jeans, shorts, sneakers and boots use the existing independent
prepared garment SVG layers. Garment parts follow the new pose anchors; trouser
concealed areas use pixels sampled from the same garment. The near hand draws
after the sleeve, and the near arm draws in front of the torso. Other catalog
items use their existing painted panels fitted over compatible core linings.
Footwear attaches to the painted sole instead of the empty sheet boundary;
adapted trouser panels stop at the ankle so their baked shoes are excluded.
Suit material values are normalized per painted panel and lab coats keep their
fixed white material. The v7 compositing passes use software canvases so cache
warm-up and save/reload do not change raster output.

## Rebuild and verify

1. `node graphics/production/unified-v7/export-core.cjs` (only when prepared SVGs change).
2. `python graphics/production/unified-v7/build.py`
3. `node graphics/production/sources/build.cjs`
4. `node tools/check.mjs`
5. `node review/character-rigid-body/verify-shipping.cjs`
6. `npm test -- --test-concurrency=2`

Set `BAGSEED_BROWSER_PATH` to an installed Chrome/Chromium executable for browser
tests. The Python build uses the same OpenCV/native-pixel helper as the approved
v7 source preparation. Source hashes are checked during the production build.

## Known follow-up work

- Front/back have not received the v7 source parts.
- Drawn slim, broad, curvy, stocky and tall variants are absent. Side views use
  the approved base anatomy instead of stretching its pixels.
- Non-core coats, skirts, overalls and full suits retain adapted legacy panels;
  some hems, waist overlaps and sleeve shapes need dedicated source fitting.
  Their Standing clothes use contact-frame panels fitted to the neutral rig.
- Core clothing is fitted to the approved body rather than newly painted for
  every anatomy. Collar/shoulder coverage and boot/cuff transitions can still be
  refined. This release does not claim a completed art migration of the catalog.
- Sandals/rain boots retain adapted legacy art with translucent edges.
- The sole/cuff pixel comparison in `tests/graphics.test.cjs` remains failing:
  some visible sole colors vary between long trousers and shorts/skirts. Foot
  anchors, body geometry, ground contact and all 300 walk combinations pass.
  This is shipped as a declared closest-fit limitation, per the user's direction.

## Release validation

The full 241-test suite completed (237 passed initially). Palette, deterministic
save/reload and a climate-test asset request interrupted by the rebuild were
rechecked successfully. The remaining sole/cuff comparison is recorded above:
240 of the 241 checks pass after focused retesting. The suite is not all green.
Additional source-layer checks passed for 3,120 hand combinations and 1,800 waist
joins. See `review/unified-v7-shipping/validation.json` for the recorded scope.

No new image-generation calls were used for this integration.
