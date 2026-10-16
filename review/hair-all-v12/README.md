# All remaining hairstyles: scalp fit and foreground ears

Local renderer **customization-12** extends the approved five-cut method to the other **55 hairstyles**. All 60 cuts now draw the selected ears and ear jewelry above the hair, with glasses arms retained. Bald and the accepted Short, Buzzed, Textured crop, Caesar and Low fade retain their v11 pixels. Visual acceptance of the remaining styles is pending.

`graphics/production/sources/hair-fit-rest.js` records a separate front/profile/rear crown fit for every remaining cut. Long hair, bobs, buns, braids and ponytails have narrower crowns; high profile views are lowered toward the scalp. Length below the ear root is retained, including wispy and tapered ends. Buns, puffs and deliberately large afros keep their characteristic silhouette. Shaved sides, thinning crowns and cornrow gaps stay intentional.

The rear cap retains enough width to span the actual bald skull. A smooth row field carries the correction into loose lengths. Several tied styles also carry their own painted cap texture down behind the tied sections to cover gaps above the nape. Existing strand detail and narrow upper partings remain. No broad forehead/face plate is painted over the fringe. All parts share the selected head-shape transform.

No source images or registered PNGs were regenerated in this pass. All fitting and ear composition use the existing transparent paintings. Hats, mouths, beards, body proportions, clothes and footwear keep their earlier implementation.

- [Before and after: long styles](long-before-after.png).
- All 55 cuts, front/right/back/left, with complete ends: `heads-01-after.png` through `heads-11-after.png`. Matching `*-before.png` sheets retain the v11 baseline.
- Complete characters: `figures-01-after.png` through `figures-11-after.png`.
- All 15 head shapes for 11 representative long/tied cuts: `shapes-<cut>-after.png` for Long, Bob, Wavy, Bun, Braids, Lob, Half-up, Layered, Blunt long, Long curls and Box braids.
- [Ear shapes, glasses and hoops](ears-and-glasses-after.png); [hats](hats-after.png).
- Actual [creator](creator-long.png) and wardrobe previews: [Long](mirror-long.png), [Bob](mirror-bob.png), [Wavy](mirror-wavy.png), [Bun](mirror-bun.png), [Braids](mirror-braids.png), [Half-up](mirror-halfup.png), [Blunt long](mirror-bluntlong.png), [Box braids](mirror-boxbraids.png).

The new tests check 29,700 remaining-style ear cases, 120 crown-size/length cases, 56 complete rear caps, and all 55 choices through creator and wardrobe controls plus save/reload. The earlier five-cut tests retain another 2,700 ear cases and 1,500 jewelry cases. Compact v11 fingerprints guard the accepted five cuts plus Bald over 360 shape/direction combinations. Existing tests also check all 3,660 hairstyle/head-shape/direction combinations, original forehead strands, neutral/recolorable material, hats, blinks, neck/waist/foot joins and footwear.

Build with `node graphics/production/sources/build.cjs`. The builder validates that all 55 remaining cuts have explicit fits and includes the fitting source in release checksums. Recreate current images with `node tools/review-all-hair.cjs --after`. Before/after comparisons additionally require ignored `artifacts/hair-all-v12/before.html`. Tests use `tests/fixtures/hair-all-v11.json`, so they do not depend on that large local backup. Browser tests use disposable storage. Final results are in `validation.json`.

Validation: **61 tests passed, 0 failed, 0 skipped**, run as two disjoint groups (20 character tests and 41 remaining game tests). All 88 embedded scripts parse and match the source/build checksums. The accepted five cuts plus Bald match their saved v11 fingerprints. All embedded artwork/data and 87 non-character script blocks match v11 exactly. Full-cast verification passed 1,872 comparisons and 260 registered-pose checks. No browser errors were reported. This local build has not been committed or pushed.
