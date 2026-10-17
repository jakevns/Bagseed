# Reusable plant parts and phenotype identities

Status: tested foundation, not connected to the live game. Porchlight is the first planned organ kit. Its component artwork and 50/90-inch growth prototype are approved. The 15 registered part roles remain integration drafts while training and care states are unfinished; the component sheet supplies asset paths and attachment coordinates; `readiness()` explicitly reports them as pending. Whole-plant concept sheets are not treated as usable organ art. The first attached growth prototype and the 50/90-inch samples are documented in `porchlight/README.md`.

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
