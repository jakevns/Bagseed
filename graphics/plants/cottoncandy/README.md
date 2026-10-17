# Cotton Candy CRT connected component prototype

**Production update:** this approved kit is now connected to the live game through `BagseedPlants` / native `PlantArt`. See `review/live-plants/README.md`. The notes below preserve the original component-review milestone.

Status: component artwork, growth, flowering, pink senescence, cool-night colors and wind animation approved by the user. This is the fourth kit, after Porchlight, Velvet Underbrush and Pixel Punch. The painted rigs remain review prototypes pending full care/training and native renderer integration.

## Identity and artwork

The existing native catalog defines `cottoncandy` (Pixel Punch × Pink Static): photoperiod Type I, hybrid leaves, lime foliage, Pink accents, branching 1.0, height factor 1.05, Floral aroma. `sources/profile.json` records the expressed visual traits and captions. The already simulated physical height is used directly; the native height factor is not applied twice.

The new transparent hand-painted organ sheet uses fresh lime-green fans, blush/rose calyx clusters, pale frost and peach/copper pistils. Pixel Punch's approved component layout/style was the source reference, while the green/pink phenotype and new flowers were explicitly regenerated for Cotton Candy CRT. Healthy fan source pixels stay green; senescence and cold expression are supplied by the shared renderer. No full-plant silhouette is stretched to simulate growth.

Sixteen isolated components cover seed, radicle, paired cotyledons, single/three/five/seven-leaflet fans, sugar leaf, stem, branch junction, three female flower maturities, closed/open male flowers, and bamboo/tie. Source PNG pixels remain unchanged. The WebP conversion is verified for identical RGBA pixels; crops, attachment points, alpha hulls and hashes are metadata in `sources/manifest.json`. Neighboring rectangular crop bounds cannot overlap.

## Shared growth and color

`cottoncandy@1` registers 15 organ roles as integration drafts. All earlier part/profile records and saved identities remain intact. Hybrid compatibility is explicit; unrelated broad-leaf substitution is rejected. Native expressed traits are pinned once, while water, health, stress, training and night exposure stay separate temporary inputs.

The same connected model/renderer used by earlier kits handles stable parent/child IDs, continuous shoot growth, the native 11-node limit, physical canopy bounds, rooted wind and reduced motion. The review includes seed through harvest-ready, same-scale 50/90-inch growth, a late-flower portrait and a 10-second growth/wind clip. Male and support components are available and tested; complete training, care-event persistence, diagnostic states and drying/harvest organ adapters still require the shared integration milestone.

Natural late-flower senescence is rose-pink. The existing Pink accents genotype is receptive to the shared cool-night rule, deepening toward rose after qualifying exposure. The same 8°F versus 10°F study holds phenotype, geometry, health, stage and nutrition constant. Only the 10°F example receives 24 exposure hours after two study nights, with a captured-color Sprout bonus of up to 8 percentage points before the existing cap. This does not change eligibility for earlier green-only plants or introduce another climate/scoring rule.

## Reproduce and verify

- `python3 tools/compile-plant-components.py cottoncandy`: measure metadata, encode losslessly and register the new versioned profile (Pillow, NumPy, SciPy). Repeated runs preserve approved status and refuse to overwrite an existing part ID with different data.
- `node tools/preview-plant-components.cjs cottoncandy`: capture images, 120 wind/growth frames, MP4 and GIF. `--stills` skips animation; `--output=/tmp/...` allows regression capture without touching earlier approved media.
- `node --test tests/cottoncandy-components.test.cjs tests/pixelpunch-components.test.cjs tests/velvet-components.test.cjs tests/porchlight-growth-model.test.cjs tests/plant-phenotype-library.test.cjs tests/night-color.test.cjs`
- `npm run check`

The preview opens the real `index.html`, waits for startup and injects the kit only into the disposable browser page. Native game source/output and existing character payload remain unchanged. Stage-board panels independently magnify small plants; only the 50/90-inch board shares a physical scale. Animation heights are controlled study inputs, not elapsed game days. Samples are in `review/cottoncandy-components/`; intermediate frame PNGs are ignored and encoded review media are retained. Nothing is pushed before approval.

The generalized preview's Pixel Punch output was captured into a temporary directory after adding pink-specific labels. All four approved Pixel Punch stills match byte-for-byte; hashes are recorded in `review/cottoncandy-components/previous-kit-regression.json`.
