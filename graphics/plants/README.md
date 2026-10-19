# Reusable plant parts and phenotype identities

Status: approved component artwork is now connected to the native `PlantArt` path in `public/index.html` through `sources/live-renderer.js`. The production adapter handles live scenes, plant inspectors, Sprout photos, codex/seed-library imagery, growth, training, care, drying, mutations and saved visual recipes. The original `phenotype-library.cjs` API below remains a stricter integration-draft library for future explicit part inheritance; the live adapter consumes approved atlas manifests and persists its own `paintArt115` recipe. See [the production integration](../../review/live-plants/README.md).

## Data model

- `sources/library.json`: versioned part definitions, inherited visual-trait descriptors, assembly profiles and strain-to-profile assignments.
- `sources/phenotype-library.cjs`: validates records and creates a serializable, deterministic artwork identity from a plant and its **already expressed** genetic traits. It does not generate, cross or change simulation alleles.
- Part IDs and profile IDs include revisions. Once published, retain those records unchanged. An alternative leaf, revised asset or new assembly uses a new ID. A strain's default profile can then be advanced for future plants; existing saved identities remain pinned.
- Saved identities contain the profile, library revision, phenotype identity seed, expressed visual traits and chosen part IDs. Growth stage, water, stress, training, pruning and supports remain separate renderer inputs.
- The library can register additional inherited trait descriptors without rewriting the resolver. Feeding a new trait from real genetics still requires an explicit adapter/inheritance definition; adding a descriptor alone does not invent a biological trait or modify breeding mechanics.

## Existing game integration, when the Porchlight rig is ready

Read `PlantTraits115.for(p)` for expressed categorical traits. Existing height/branching phenotype multipliers already affect growth; do not apply them a second time to the visual height. Prefer `p.genome115.id`, then the saved phenotype ID, for stable visual variation. `Individual115.offspring` already produces distinct inherited genome IDs. Clones carry their source genome/phenotype rather than selecting a new visual identity from the new plant ID or current time.

The proposed saved field is `p.artIdentity`, with a deep-copied equivalent on clone phenotype records and photo snapshots. The helper accepts `p.artIdentity` or `p.pheno.artIdentity` and returns a detached copy. It never mutates a plant/save. The eventual spawn/load/cutting adapter will persist identities at successful lifecycle events; drawing will only read them.

An unknown strain or incompatible leaf family produces an explicit missing-profile/artwork error. Do not substitute an unrelated family silently. A real integration must retain a clearly scoped fallback during migration and report missing art before a release is published. Approved parts need asset references and normalized attachment points; the eventual build compiler must also verify actual files and image bounds.

## Adding future content

1. Register a part with a new revision ID, role, compatible inherited-trait selectors and attachment type.
2. Generate/review its art. Record the actual asset and normalized attachment point, then mark it approved. Never label a draft as renderable.
3. Add a new versioned profile or add a new strain pointing to an existing compatible profile. Keep earlier profiles and their part choices available.
4. Pass the new strain's actual expressed phenotype to `createIdentity`. Crosses can select compatible inherited organ families and palettes through the same interface.
5. Verify all natural/trained/stressed combinations in the shared Porchlight renderer; new art should not introduce its own separate wind or care system.
6. Migrate older appearances only with an explicit mapping and reviewed behavior. Catalog additions must not reroll existing plants, clones or historical photos.

## Example

```js
const api = require('./sources/phenotype-library.cjs');
const library = require('./sources/library.json');
const identity = api.createIdentity(plant, expressedTraits, library);
// Persist once at a successful lifecycle event; not during rendering.
const status = api.readiness(identity, library);
// Currently false: full care/training integration is unfinished; library entries remain drafts.
```

Validation: `node --test tests/plant-phenotype-library.test.cjs` covers read-only behavior, clone and save stability, offspring identities, library extensions, incompatible art, approval requirements and newly registered phenotype traits.

## Second strain review kit

`velvet@1` adds Velvet Underbrush using new painted organ assets and the same connected model, wind and phenotype-aware senescence renderer. The expressed `branching` trait is optional and does not change existing pinned identities. Porchlight approval remains recorded separately; Velvet samples are approved as a prototype checkpoint in `review/velvet-components/`. Neither kit replaces the native game renderer yet.

## Third strain review kit

`pixelpunch@1` adds the hybrid Pixel Punch component family, with new blue-green fans and purple flowers. Growth, wind, natural senescence, cool-night pigmentation and Sprout color appeal reuse the same shared systems. Native catalog traits and review captions are data in `pixelpunch/sources/profile.json`; the existing Porchlight/Velvet profiles remain available and pinned. Samples are approved as a prototype checkpoint under `review/pixelpunch-components/`; full painted-renderer integration remains pending.

## Fourth strain review kit

`cottoncandy@1` adds Cotton Candy CRT's hybrid organ family: lime-green healthy leaves, blush flowers, rose-pink senescence and its existing genotype's cool-night response. It uses the same connected growth, wind, climate and Sprout color systems; earlier profiles remain pinned. Review samples are approved as a prototype checkpoint in `review/cottoncandy-components/`. Painted-renderer integration remains pending.

## Fifth strain review kit

`moonberry@1` adds Moonberry's hybrid organ family: sage-blue healthy fans, pale lilac flowers, lavender senescence and its existing genotype's cool-night response. It reuses the shared growth, wind, climate and Sprout color systems, keeping earlier appearance profiles pinned. Review samples are approved in `review/moonberry-components/`; full painted-renderer integration remains pending.


## Sixth through eighth strain review batch

`halfmoon@1`, `zoomies@1` and `cruise@1` add Halfmoon CBD, Zoomies Auto and Cruise Control Auto. Halfmoon is the first narrow-leaf kit; the autos supply lime and blue-green hybrid families. All use the shared connected growth, graded branch buds, canopy cleanup, wind and finishing-color systems. Halfmoon and Zoomies retain golden senescence without a cool-night color bonus; Cruise Control's existing Blue-green genotype can express its existing blue-violet cool-night palette. Earlier parts and saved identities remain pinned. Review samples are approved under their respective `review/*-components/` folders, with a combined portrait in `review/plant-batch-03/`. Full painted-renderer integration remains pending.


## Ninth through eleventh strain review batch

`boglantern@1`, `frogprince@1` and `nightshift@1` add Bog Lantern, Frog Prince and Night Shift. Bog Lantern and Frog Prince are experimental native lines: these samples show representative narrow forest/red and broad lime/purple phenotypes, without freezing their per-save genetics. Their new parts enforce compatible leaf shape, leaf palette and flower palette; unsupported expressions require future compatible parts rather than a silent substitution. Night Shift follows its fixed broad forest/Dark purple catalog identity. All three reuse the shared connected growth, popcorn buds, canopy cleanup, wind, senescence and genotype-gated cool-night color systems. Earlier eight profiles and their saved identities remain pinned. Review samples are approved under the respective `review/*-components/` folders and `review/plant-batch-04/`. Full painted-renderer integration remains pending.


## Final named strain and additional experimental profiles

`gasstation@1` completes component-kit coverage of the original 12 named catalog strains with narrow blue-green foliage, mint-blue flower spears and ochre senescence. At the user's request, `boglantern-lavender@1` and `frogprince-red@1` add Lavender Marsh and Copper Reed phenotype families of the existing Bog Lantern and Frog Prince lines. These are extra profiles, not new native strains. `lineId` retains the actual parent line, and `registerAsDefault: false` preserves the earlier default profiles. Existing saved plant/clone identities stay pinned. The profiles enforce compatible expressed foliage and flower palettes and can be selected explicitly through the existing identity helper's `profile` option. Native automatic phenotype selection and full painted-renderer integration remain pending. All three kits are approved in their review folders and `review/plant-batch-05/`.


## Live renderer integration

`tools/compile-live-plants.cjs` verifies all twenty-seven approved atlas manifests and their runtime hashes, then embeds the shared model and production compositor in `index.html`. `BagseedPlants.ready` participates in the startup cover so original pixel plants cannot flash during atlas downloads. The live native catalog also includes the expanded seed library, random bag seed and player-generated crosses: the compositor selects leaf anatomy/foliage and flower color independently from expressed `PlantTraits115`, then pins the visual recipe. It does not require every cross to have a dedicated named profile, and never changes simulation genes.

Visual recipes (`paintArt115`, schema v1) record the component donor kits, stable phenotype seed and expressed traits. Actual plant height, node count, water, health, nutrition, stress, pruning and training remain live inputs. Recipes are stored on plant and clone phenotype records, copied into photos, and populated for older saves at post-load and save boundaries. Rendering does not alter biology. Existing mutant genes from the latest merged update remain native; the painted compositor expresses all fifteen leaf/color/structure traits, including stacked traits.

Earlier per-strain notes describe the original prototype milestone. Production integration is now active; individual sample captures remain historical approvals. Validation and actual game screenshots are in `review/live-plants/`.


## Painted mutation components

The first mutation implementation is [Freakshow](mutations/freakshow/README.md).
Its two leaf forms use dedicated painted development and mature-fan atlases,
loaded through the same startup gate as the twenty-seven strain kits. The live
renderer applies the existing phenotype palette, finishing colors, symptoms,
training and wind. Mutation kits are separate from the strain catalog; native
mutation identities and genotype/save data are preserved.

See `review/mutation-detail/freakshow-in-game/` for native gameplay captures and
verification. The user approved this gameplay implementation for production.


## Next three mutation implementations

Ducksfoot, Monophylla and Moonmarble have isolated painted juvenile, young, mature and sugar organs in two forms/pattern families each. The user approved all three native gameplay implementations for production. See `mutations/*/README.md` and `review/mutation-detail/implemented-batch-02/`. Moonmarble tissue sectors stay pale through palette/senescence changes and combine with expressed leaf-shape traits; the former synthetic wave pattern is removed. Existing mutation genes, stats, carriers and saved identity rules are unchanged.


## Snowtip, Fernfrond and Goldleaf

The user approved all three native gameplay implementations for production. Each supplies painted juvenile, young, mature and sugar organs in two forms. Snowtip greens stable node-bound organs as later nodes develop; Fernfrond uses connected painted fine fronds; Goldleaf retains green tissue within healthy golden leaf zones. Their tissue layers can combine with existing leaf shapes and Moonmarble. Native guide/card art reuses the same components. Review: `review/mutation-detail/implemented-batch-03/`.

## Ember Stem, Pink Pistil and Inkleaf

The user approved these three gameplay implementations for production. Ember has painted vascular leaves and stem material that follows the posed skeleton. Pink Pistil layers painted stigma hairs over each inherited flower kit while protecting bracts/trichomes and leaving vegetative leaves/male flowers unchanged. Inkleaf supplies shaded dark leaf organs and a reusable pigment layer. Native guide/card art reuses the same components. Review: `review/mutation-detail/implemented-batch-04/`.

## Twin Leader, Crested Cola and Triple Whorl

The user approved these three gameplay implementations for production. Twin Leader supplies a connected developing fork and two terminal tops, or four after topping. Crested Cola supplies a grooved flattened upper stem and genuinely fused, wide flowering organs. Triple Whorl supplies three independent fans and branch origins per developed node. All inherit host leaf anatomy, flower palettes, training, wind, cleanup and saved identity. `BagseedPlants.detail` reuses the live compositor at inspection resolution for structural guide icons and close-ups. Review: `review/mutation-detail/implemented-batch-05/`.

## Pocket Dwarf and Triploid

The final two native mutation families have user-approved gameplay implementations. All fifteen mutation families now have approved component artwork. Pocket Dwarf has a compact connected axis, shorter branch reach and retained mature leaf detail at its actual saved height. Triploid retains inherited anatomy; a copper/verdigris 3x identity tag appears after discovery. The live renderer no longer forces uniformly enlarged/darkened Triploid tissue. Hidden traits remain unmarked, and revealing a trait invalidates its sprite cache. The guide description follows the approved scientific references while preserving existing Bagseed reproduction and balance rules. Review: `review/mutation-detail/implemented-batch-06/`.

## Expanded catalog: OG Kush, White Widow and Northern Lights

The full running catalog has **37 named strains**, plus generated Bag Seed. The original twelve dedicated strain kits and two experimental phenotype kits did not provide individual artwork for the 25 expanded catalog strains. This approved batch adds dedicated `ogkush`, `whitewidow` and `northernlights` kits mapped to `cl_ogkush`, `cl_whitewidow` and `cl_northernlights`. Production now has **15 dedicated named strains, 17 base atlases and 17 mutation atlases**; 22 named strains still use shared donor parts pending individual artwork. The fifteen mutation types are separate from strain coverage.

Live plants receive matching new parts at create/load/save boundaries, preserving saved identity seeds, expressed traits, genomes and physical height. Incompatible traits retain their compatible donor parts. Historical photos retain pinned recipes. Native startup waits for all 34 plant atlases. Review, original PNGs, growth, senescence, care, expansion and wind: `review/strain-batch-06/`.

## Expanded catalog: Skunk #1

The approved `skunk1` kit maps to existing native `cl_skunk1`. Production now covers **16 of 37 named strains** with dedicated kits: 18 base atlases including the two extra experimental profiles, plus 17 mutation atlases. Startup gates all 35 images. Twenty-one named strains still await their individual kits. Living-save upgrades retain seeds, traits, genetics and height, while historical photos remain pinned. Approved media and source checkpoint: `review/strain-batch-07/`. Next requested review batch: Afghani, Hindu Kush and Bubba Kush.

## Expanded catalog: Afghani, Hindu Kush and Bubba Kush

Approved dedicated kits now map `afghani`, `hindukush` and `bubbakush` to native `cl_afghani`, `cl_hindukush` and `cl_bubbakush`. Released coverage is **19 of 37 named strains**, plus two extra experimental profiles: 21 base atlases and 17 mutation atlases, all 38 gated by startup. Eighteen named strains still await individual kits. Afghani/Hindu Kush retain golden finishing and no extra purple eligibility; Bubba Kush retains Dark purple finishing and its existing receptive cool-night response. Living-save upgrades preserve biology and prior unrelated/photo recipes. Review: `review/strain-batch-08/`.

## Expanded catalog: Purple Kush, Granddaddy Purple and Blueberry

Approved kits `purplekush`, `gdp` and `blueberry` map to existing native `cl_purplekush`, `cl_gdp` and `cl_blueberry`. Released dedicated coverage is **22 of 37 named strains**, with fifteen remaining. Including two extra experimental profiles, startup now gates 24 base and 17 mutation atlases (41 images). The three native finishes remain purple, deep purple and lavender, with existing genotype-gated cool-night responses. Living-save artwork upgrades preserve seeds, traits, genomes and height; unrelated recipes and historical photos stay pinned. Approved media/source checkpoint: `review/strain-batch-09/`.

## Expanded catalog: Blue Dream, Sour Diesel and Chemdawg

Approved kits `bluedream`, `sourdiesel` and `chemdawg` map to native `cl_bluedream`, `cl_sourdiesel` and `cl_chemdawg`. Released dedicated coverage is **25 of 37 named strains**, with twelve remaining. Including two extra experimental profiles, startup gates 27 base and 17 mutation atlases (44 images). Blue Dream keeps its ochre finish and existing receptive blue-violet night response; Sour Diesel/Chemdawg keep golden finishing and no extra purple eligibility. Living-save upgrades preserve seeds, expressed traits, genomes and physical height; historical photos and unrelated recipes remain pinned. Source/media checkpoint: `review/strain-batch-10/`.
