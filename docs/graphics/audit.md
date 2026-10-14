# Character rendering audit

This audit concerns the untouched, checksum-verified flashlight build. It is not a character art proposal or visual approval package. References are now available in the user-uploaded GitHub DOCX. The [revised five-character study](../../review/characters-v2/index.html) examines character art across seven games. Study 01 was rejected; its renderer must not be integrated. The external full-resolution image hosts remain blocked; the evidence board identifies that limitation.

Baseline SHA-256: `4889b1d5c14ee0b95085ed6ef208615e19598f2bf5a656604284f22085502164`. This is the pre-update audit. The archive remains byte-for-byte intact; the current playable build now includes the approved graphics renderer. See `graphics/production/build.json` for its checksum.

## Renderers and anchors

- `buildChar`, `charSprite`, and `drawPerson`: 24 × 36 pixels; local feet anchor (12, 36); scene coordinates and interaction targets use feet. [Source](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L1889).
- `buildPortrait` uses a separate 32 × 32 pixel drawing grid. `drawPortrait` scales it to the destination canvas; most dialogue and People cards use a 64 × 64 canvas. New haircuts currently map to classic portrait silhouettes through `HAIR115.portraitBase`, rather than using their exact world artwork. [Source](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L20400).
- Children pass `short: true` and use `Cast115.drawKid`: the first 21 sprite rows are copied at native size; the remaining 15 rows are compressed to eight. Their rendered footprint is 24 × 29 pixels with feet unchanged. [Source](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L18688).
- The world is rendered at native scene size to an offscreen canvas. `View` follows the feet, applies an integer device-pixel zoom, and disables smoothing. The declared room canvas starts at 320 × 180 but is resized at runtime; it is not a fixed 320 × 180 display.
- At the inspected 1280 × 800 desktop viewport, normal zoom was three device pixels per world pixel at DPR 1: an adult sprite occupies a 72 × 108 CSS-pixel drawing box. Phone scale depends on orientation, DPR, camera settings, and scene; approval previews must measure each actual viewport.
- Creator preview canvas: 180 × 96 pixels. Mirror preview, clothing try-on, People cards, dialogue, in-world actors, visitors, shop staff, Sprout media, and Trellis films reuse the character/portrait entry points.
- Seated drawing clips the lower legs at existing furniture anchors. Smell reactions also have a separate 24 × 36 `buildNoseSprite1151` and a hand overlay on portraits. Evening flashlight attachment computes its wrist location from `bodyDims`, `torsoProfile`, facing, walk frame, and breath. Preserve these geometry contracts or update them together with the proposed renderer.

## Saved appearance and customization

- Player appearance resides in `state.player`; `playerLook` and `creatorLook` preserve the original fields plus `LOOK_FIELDS115`, piercings, and marks. Cache keys include the expanded appearance fields.
- Runtime inventory: 60 haircuts, 40 named hair colors, 16 skin tones; 15 each of face shapes, eye styles, brows, noses, mouth styles, expressions, and facial-hair styles; ten ear styles; 15 piercing and 15 mark options; 240 authored catalog clothing designs.
- Keep all existing clothing IDs, colors, secondary colors, patterns, emblems, hats, glasses, accessories, build/presentation choices, highlights, and saved custom colors. Use copies of saves for validation. Current tests use isolated browser storage, never the live Netlify origin.

## Source collections

Counts overlap. Patient, service, and shop references often point to an existing neighbor or cast member; they must not be summed as unique people. `roster-audit.json` retains the actual authored appearance, age/role when present, story records, source collections, and customization lists.

| Collection | Count | Source |
| --- | ---: | --- |
| Central neighbors | 7 | [baseline line 5030](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L5030) |
| Roommate | 1 | [baseline line 5138](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L5138) |
| Residents / visiting family | 28 | [baseline line 18365](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L18365) |
| NPC appearance definitions | 12 | [baseline line 2259](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L2259) |
| Remy’s guest appearances | 4 | [baseline line 9053](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L9053) |
| Patient records / aliases | 9 | [baseline line 827](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L827) |
| Sprout authors | 12 | [baseline line 5144](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L5144) |
| Trellis channels / hosts | 10 | [baseline line 5175](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L5175) |
| Shop staffing definitions | 8 | [baseline line 19770](../../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html#L19770) |

## Representative sample identities

The first preview cast is the customizable player, Remy, Doug, Priya Raman, and Poppy Serrano-Patel. Their source identities and appearance fields below guide the proposed drawings. This table records the baseline, not pixel-exact reproduction by the illustrated prototype. The proposal is separate from the game and awaits visual approval.

| Character | Authored identity | Appearance to retain |
| --- | --- | --- |
| Player | Age not stated; Customizable player | skin: #cf9670, hairC: #4a2c1a, hairS: short, facial: none, topS: hoodie, shirtC: #5f9c33, pantsC: #36405a, bottomS: jeans, body: average, pres: neutral, face: soft, eyes: dot, brows: thin, glasses: none, shoesS: sneakers |
| Remy Alvarez | Age not stated; Your roommate · graphic designer | skin: #cf9670, hairC: #3e2a1e, hairS: curly, topS: tee, shirtC: #e0a33a, pantsC: #3a3a44, bottomS: shorts, body: average, pres: neutral, face: soft, eyes: round, brows: thick, glasses: square, shoesS: sandals |
| Doug Haskell | 71; Retired machinist · tomato guy | skin: #e8b48f, hairC: #e9e2d4, hairS: balding, facial: mustache, topS: overalls, shirtC: #556f8f, body: stocky, pres: masc, face: square, eyes: sleepy, brows: thick, prop: can |
| Priya Raman | 34; ER night-shift nurse | skin: #a8704c, hairC: #1d1612, hairS: ponytail, topS: hoodie, shirtC: #3f7fbf, pantsC: #2b2b33, bottomS: joggers, body: slim, pres: fem, face: soft, eyes: round, brows: arched, shoesS: sneakers |
| Poppy Serrano-Patel | 7; Kid, flower-house artist | skin: #cf9670, hairC: #1d1612, hairS: bun, topS: tee, shirtC: #f08ab8, pantsC: #f2c02a, body: slim, pres: fem, face: round, eyes: round |

Doug is a widower who keeps the Brandywine bed his late wife Ruth started. His story describes exact machine parts, imperfect household fixes, stamped tomato labels, and wanting to pass on making skills while seeking company. Preserve his established older appearance; do not reinterpret him from a generic farmer reference.

## Full authored resident/family coverage

| ID | Name | Authored age | Flags |
| --- | --- | --- |
| `mateo` | Mateo Market | adult | — |
| `elena` | Elena Market | adult | — |
| `rosa` | Rosa Market | adult | — |
| `leo` | Leo Market | child | kid |
| `mara` | Mara Rivera | adult | — |
| `eli` | Eli Rivera | adult | — |
| `nico` | Nico Rivera | 17 | teen |
| `alma` | Alma Brooks | 69 | senior |
| `owen` | Owen Brooks | 19 | — |
| `amina` | Amina Haddad | 56 | — |
| `ronan` | Ronan Watts | 55 | — |
| `leila` | Leila Haddad-Watts | 15 | teen |
| `cass` | Cass Mercer | 29 | — |
| `jun` | Jun Cho | 31 | — |
| `rosie` | Rosie Dunn | 73 | senior |
| `arthur` | Arthur Dunn | 75 | senior |
| `nadia` | Nadia Dunn | 46 | — |
| `miles` | Miles Dunn | 9 | kid |
| `hugo` | Hugo Serrano | 38 | — |
| `anika` | Anika Patel | 37 | — |
| `poppy` | Poppy Serrano-Patel | 7 | kid |
| `enzo` | Enzo Park | 27 | — |
| `sasha` | Sasha Reed | 26 | — |
| `dev` | Dev Imani | 25 | — |
| `ari` | Ari Bell | child | kid |
| `sam` | Sam Bell | child | kid |
| `talia` | Talia | young adult | — |
| `luz` | Luz | young adult | — |

Central neighbors: Doug Haskell, Priya Raman, Marcus Bell, Inés Calderón, Tobias Nguyen, Beverly Sloane, Kenji Mori.
Other base NPC appearances: doug, officer, suit, amani, grandma, pixel, moon, auto, swamp, rosalind, theo, marisol.
Guest appearances: Jules, Dev, Sasha, Ari.
Trellis channel IDs: vale, shed, patchwork, canopy, pheno, fern, tinker, netted, cure, lumen.

## Baseline validation

- Frozen dependency installation (`npm ci --ignore-scripts`) succeeded. The baseline checksum and all 77 inline script blocks passed `npm run check`.
- `npm test`: seven tests passed, zero failed/skipped. Tested desktop title/creator/new game; keyboard movement in four directions; wardrobe changes and isolated-save reload/Continue; 63 appearance records plus all 60 haircuts (1,248 sprite frames and 63 portraits); 14 day/night scene render passes; mobile portrait and landscape viewport rendering.
- Scene checks exercise the renderers with controlled test state and direct scene placement. They are not a playthrough of all travel routes or schedules. Existing-save files from the user, extended phone/device playtests, animation artwork approval, all clothing combinations, smell dialogues, seated interactions, and flashlight behavior still need targeted validation during the actual graphics pass.
- Automated tests establish rendering and state behavior, not art quality. The revised illustrated samples and source-linked evidence board are in `review/characters-v2/`; they are not integrated or approved. See that directory’s `validation.json` for preview-specific checks.

Baseline captures: [creator](baseline-creator.png), [bedroom](baseline-bedroom.png), [mobile portrait](baseline-mobile-portrait.png), [mobile landscape](baseline-mobile-landscape.png).
