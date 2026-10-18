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

`gasstation@1` completes component-kit coverage of all 12 named native catalog strains with narrow blue-green foliage, mint-blue flower spears and ochre senescence. At the user's request, `boglantern-lavender@1` and `frogprince-red@1` add Lavender Marsh and Copper Reed phenotype families of the existing Bog Lantern and Frog Prince lines. These are extra profiles, not new native strains. `lineId` retains the actual parent line, and `registerAsDefault: false` preserves the earlier default profiles. Existing saved plant/clone identities stay pinned. The profiles enforce compatible expressed foliage and flower palettes and can be selected explicitly through the existing identity helper's `profile` option. Native automatic phenotype selection and full painted-renderer integration remain pending. All three kits are approved in their review folders and `review/plant-batch-05/`.


## Live renderer integration

`tools/compile-live-plants.cjs` verifies all fourteen approved atlas manifests and their runtime hashes, then embeds the shared model and production compositor in `index.html`. `BagseedPlants.ready` participates in the startup cover so original pixel plants cannot flash during atlas downloads. The live native catalog also includes the expanded seed library, random bag seed and player-generated crosses: the compositor selects leaf anatomy/foliage and flower color independently from expressed `PlantTraits115`, then pins the visual recipe. It does not require every cross to have a dedicated named profile, and never changes simulation genes.

Visual recipes (`paintArt115`, schema v1) record the component donor kits, stable phenotype seed and expressed traits. Actual plant height, node count, water, health, nutrition, stress, pruning and training remain live inputs. Recipes are stored on plant and clone phenotype records, copied into photos, and populated for older saves at post-load and save boundaries. Rendering does not alter biology. Existing mutant genes from the latest merged update remain native; the painted compositor expresses all fifteen leaf/color/structure traits, including stacked traits.

Earlier per-strain notes describe the original prototype milestone. Production integration is now active; individual sample captures remain historical approvals. Validation and actual game screenshots are in `review/live-plants/`.


## Painted mutation components

The first mutation implementation is [Freakshow](mutations/freakshow/README.md).
Its two leaf forms use dedicated painted development and mature-fan atlases,
loaded through the same startup gate as the fourteen strain kits. The live
renderer applies the existing phenotype palette, finishing colors, symptoms,
training and wind. Mutation kits are separate from the strain catalog; native
mutation identities and genotype/save data are preserved.

See `review/mutation-detail/freakshow-in-game/` for native gameplay captures and
verification. The user approved this gameplay implementation for production.


## Next three mutation implementations

Ducksfoot, Monophylla and Moonmarble have isolated painted juvenile, young, mature and sugar organs in two forms/pattern families each. The user approved all three native gameplay implementations for production. See `mutations/*/README.md` and `review/mutation-detail/implemented-batch-02/`. Moonmarble tissue sectors stay pale through palette/senescence changes and combine with expressed leaf-shape traits; the former synthetic wave pattern is removed. Existing mutation genes, stats, carriers and saved identity rules are unchanged.
