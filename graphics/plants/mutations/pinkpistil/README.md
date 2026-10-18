# Pink Pistil components

Status: **user-approved gameplay implementation for production**.

Blush-rose and magenta-coral forms each provide early/mid/late stigma overlays. Native strain bracts, bud silhouettes, trichomes and flower-kit selection remain in use. The shader recolors native warm stigma tissue, then restricts painted hairs to stigma zones or open spaces within the inherited flower silhouette. Existing bract and trichome pixels are protected. Vegetative leaves and male flowers stay unchanged; coral aging and drying reuse the existing stage rules. The compact native guide icon displays a female flower for this trait.

All source PNGs are original generated game artwork. RGBA-exact lossless WebP and content-hashed public assets are registered in `sources/manifest.json`; source pixels are not repainted by the compiler. Ember and Inkleaf use two rows of juvenile, young, mature and sugar organs. Historical `fiveLeaf`/`sevenLeaf` slots share a mature organ. Ember's second atlas supplies internodes and collars. Pink Pistil's atlas supplies only female stigma overlays, registered by explicit cells because paired hairs need not form one connected component. New atlases participate in startup readiness.

Native mutation names, genes, inheritance probabilities, simulation tradeoffs, catalog records and pinned visual recipes are retained. Forms derive from the existing saved visual seed and phenotype; cuttings keep their mother's form. Leaf shapes retain Monophylla > Ducksfoot > Freakshow > Fernfrond precedence, with independent vascular, pigment, chlorophyll and female-stigma layers. Sugar leaves attach to their flower-bearing branches, including after canopy cleanup. Seeds, cotyledons and male flower parts remain native.

Reference pack: `Bagseed_Mutation_References.zip`, R19/R20. Approved concepts and supplied credits/URLs: `review/mutation-detail/photo-based-batch-02/`. Red vascular color alone does not diagnose a mutation or health condition. The extreme Inkleaf color families and pigment combinations are approved game-art interpretations, not proof of a separate documented natural genotype. Photographs remain outside the repository and are not shipped as sprites.

Rebuild registration with `python3 tools/compile-mutation-components.py`, rebuild the game with `npm run build:bedroom`, and validate with `npm run check`. Native captures and assertions: `node tools/preview-mutation-batch-04.cjs --animate`. Review evidence: `review/mutation-detail/implemented-batch-04/`.
