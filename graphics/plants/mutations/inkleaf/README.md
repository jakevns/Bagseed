# Inkleaf components

Status: **user-approved gameplay implementation for production**.

Plum-green and blue-black forms progress from greener juvenile blades through transitional young fans to dark mature and sugar leaves. Painted veins, folds, green margins and tissue highlights remain readable. The former flat dark tint is replaced with painted organs; combined leaf shapes receive a pigment treatment from the same atlas. Existing near-black finishing/cool-night behavior remains in use, with restrained finishing over the dark source so surface detail survives.

All source PNGs are original generated game artwork. RGBA-exact lossless WebP and content-hashed public assets are registered in `sources/manifest.json`; source pixels are not repainted by the compiler. Ember and Inkleaf use two rows of juvenile, young, mature and sugar organs. Historical `fiveLeaf`/`sevenLeaf` slots share a mature organ. Ember's second atlas supplies internodes and collars. Pink Pistil's atlas supplies only female stigma overlays, registered by explicit cells because paired hairs need not form one connected component. New atlases participate in startup readiness.

Native mutation names, genes, inheritance probabilities, simulation tradeoffs, catalog records and pinned visual recipes are retained. Forms derive from the existing saved visual seed and phenotype; cuttings keep their mother's form. Leaf shapes retain Monophylla > Ducksfoot > Freakshow > Fernfrond precedence, with independent vascular, pigment, chlorophyll and female-stigma layers. Sugar leaves attach to their flower-bearing branches, including after canopy cleanup. Seeds, cotyledons and male flower parts remain native.

Reference pack: `Bagseed_Mutation_References.zip`, R11 and approved Inkleaf pigment studies. Approved concepts and supplied credits/URLs: `review/mutation-detail/photo-based-batch-02/`. Red vascular color alone does not diagnose a mutation or health condition. The extreme Inkleaf color families and pigment combinations are approved game-art interpretations, not proof of a separate documented natural genotype. Photographs remain outside the repository and are not shipped as sprites.

Rebuild registration with `python3 tools/compile-mutation-components.py`, rebuild the game with `npm run build:bedroom`, and validate with `npm run check`. Native captures and assertions: `node tools/preview-mutation-batch-04.cjs --animate`. Review evidence: `review/mutation-detail/implemented-batch-04/`.
