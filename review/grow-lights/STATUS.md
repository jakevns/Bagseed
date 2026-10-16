# Grow lights — samples awaiting approval

The user requested illustrated lights, nicer falloff and subtle floating dust. This local batch covers all four existing grow-light tiers, with on/off fixture artwork, tier-specific soft fields, deterministic drifting particles and matching store cards. Original prices, growth/power/heat effects and fitting restrictions are preserved.

approval-lights.png shows on/off fixtures, day/night tent placement and matching store art. context-*.png covers the starter, 2×2, 4×4 and 5×5. dust-animation.gif combines the actual night render frames at the sampled timing. store-tier-*.png includes real store cards and a phone capture.

report.json records catalog/content/logical-geometry preservation, 16 location/tier effect checks (on/off, motion, flicker and reduced motion), 32 front-player depth cases, 16 light interaction targets and store/phone art checks. Grow-room samples use native vegetative schedules so lights remain on in the evening. Emission and particles are composited after the room ambient tint so powered LEDs remain visible at night. Only the illustrated opening and current zipper opening receive light; actual foreground character alpha is removed from the effect surface. The pass contains no tent fabric. Opaque character-pixel and roof/side/tray checks supplement the approach probes.

Production HTML, source modules, build report and the remote repository remain unchanged. The proposal and generated reference artwork are saved locally until approval.
