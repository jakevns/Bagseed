# Cool nights and phenotype color expression

Status: local feature and artwork samples awaiting user approval. Velvet organ kit approval remains separate. Do not advance to another strain until this checkpoint is reviewed.

## Player behavior

The Canopy Brain controller gains **Cool nights · autumn colors**. The option defaults off for existing/new saves and offers 8°F, 10°F or 12°F drops (10°F selected initially). A setting is shared by indoor room, visible through that room's controllers. Enabled digital ACs and mini-splits cool the same room and all its tents; this does not create an independent AC inside each tent. Enabling the setting powers installed digital cooling devices in the room. Manual climate devices keep their existing behavior.

Night targets apply only with a powered smart controller, powered compatible cooler, active growing plants, a recent measured daytime reference and every growing tent in that room dark. Mixed light schedules wait until all are dark. A dark room without a controller or working cooling unit gains no artificial temperature reduction. Power outages/circuit trips suppress cooling normally, and physical unit capacity, power consumption, humidity effects and native plant comfort/stress rules continue to apply. Drying-only rooms retain their existing controller mode. If drying and growing plants share a room, the room climate remains shared.

Each tent plant records its own running lights-on mean, reset on the next light cycle. The controller uses the warmest recent plant reference in the room for its target. The night target is that reference minus the chosen drop, limited to a 55°F cooling floor with a 3°F thermostat deadband. Actual tent conditions—not the requested target—determine color eligibility.

## Fictional game rule and genetics

The user requested an inclusive **10°F actual lights-on/lights-off difference**. Receptive mid/late/ready flowering phenotypes gain one exposure hour per qualifying dark hourly update; 9.9°F does not qualify. A 24-hour accumulated exposure reaches full expression, scaled by flowering maturity, without an instant texture swap. Exposure is persistent, capped at 72 hours, deduplicated by game timestamp and retained on the same plant. A changed location must learn its own new daytime reference. References expire after 24 hours of darkness. Drawing and UI refreshes never advance exposure.

Eligibility and hue come from existing expressed genetic `colorName`, including inherited individual alleles/crosses: Lavender → lavender, Purple → purple, Dark purple → near-black purple, Pink accents → rose, Red accents → wine red, Blue-green → blue violet. The existing ink mutation also permits near-black purple. Forest/Lime green do not acquire this trait just because they are chilled. No new genetic rolls, cold bonuses to yield, new strains or universal purple switch are introduced.

Natural late-flower senescence stays separate from cool-night pigment expression. Native leaf and bud palettes deepen while source leaf shapes, trichomes and pistils remain legible. The connected organ prototype uses the same shared rule; colored flowers protect pale frost and orange pistils from the tint. Its source atlas is unchanged. Existing drying and finished plant sprites retain already-developed pigment without accumulating more exposure. Temporary exposure does not become an inherited library part selector.

## Persistence and integration

- Pure shared logic: `graphics/plants/sources/night-color.cjs`.
- Controller/hourly/snapshot/cache adapter: `graphics/plants/sources/night-cooling.js`.
- Effective climate targets are read inside the existing room and greenhouse climate solvers, avoiding changes to saved normal daytime setpoints during draws.
- Room options persist in `state.nightCooling[room]`; plant exposure in `plant.nightColor`. Old saves safely default to off/no exposure. Photos copy the exposure state so later temperatures do not recolor historical photos. Clones keep inherited genetics but do not copy a mother's environmental exposure through this feature.
- Native art cache includes pigment palette/strength; the native pixel renderer can display the feature immediately after an approved release. The new painted Porchlight/Velvet rigs remain review prototypes pending full care/training integration.
- Build: `tools/compile-night-colors.cjs`, appended by `tools/build-bedroom.cjs`. Existing illustrated character payload is retained and verified.

## Review and validation

`tests/night-color.test.cjs` covers the 9.9/10/10.1°F boundary, absolute-temperature independence, light/stage/genetics gates, average/reference reset, stale/moved references, repeat-update protection, gradual persistent expression and prototype pigment handling.

`tests/night-cooling-browser.test.cjs` uses the real `index.html`: controller interaction, actual shared room cooling, 24 qualifying hours across two nights, green-only control, native rendered-pixel/cache changes, photograph state, mixed schedules, power/controller/cooler/drying gates, access guards and save/reload. It saves a controller screenshot and measured report under `review/night-colors/`.

`node tools/preview-night-colors.cjs` captures a controlled Velvet comparison: identical phenotype/health/maturity, 78°F lights-on reference, 68.1°F versus 68°F lights-off, after two nights. This boundary study uses explicit inputs, not a weather forecast or elapsed growth timeline. No additional plant kit is commissioned.

A climate regression check initially failed on a stale watering-can hitbox expectation (289 versus the current illustrated sprite margin at 290). The identical failure was reproduced against the unchanged HEAD build; the assertion now checks the documented one-pixel margin relative to the actual watering position. No watering placement or access code changed.
