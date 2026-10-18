# Goldleaf painted organs

Status: **gameplay artwork approved by the user for production**.

Green-veined and golden-olive forms follow the yellow-green analogue in R18 and the approved Goldleaf concepts. Original leaf tissue retains green inner areas and veins within golden outer zones; this replaces the uniform tint. The healthy golden coloration is independent of hunger/burn. Existing stress and finishing effects still apply.

`assets/components.png` is original generated game artwork, with two rows of stable forms and four columns: juvenile true leaf, young fan, mature fan and sugar leaf. Historical `fiveLeaf`/`sevenLeaf` role names are maturity slots; both use an appropriate mature organ. Crops, petiole anchors and alpha hulls are measured in `sources/manifest.json`. Source pixels remain unchanged; runtime WebP is lossless and RGBA-exact. All new atlases participate in startup readiness.

Native mutation genes, tradeoffs, strain catalog, save IDs and pinned visual recipes are unchanged. Forms use the existing saved visual seed and leaf phenotype; cuttings retain their mother's form. Leaf-shape precedence is Monophylla > Ducksfoot > Freakshow > Fernfrond. Moonmarble sectors, Snowtip pale growth and Goldleaf golden tissue can coexist with shape mutations. Sugar leaves have real flower attachments; the native model supplies growth, wind, supports, SCROG, pruning, canopy cleanup, stress and finishing colors.

Snowtip maturity is derived from the organ's node and later node development in the ephemeral render model. No persistent maturity counter or reroll is introduced. This follows the game's established partial-pale/greening convention; the source photographs alone do not prove an independent albinism gene or guarantee biological recovery. Goldleaf and Snowtip color pairings are game-art proposals, not new inheritance claims.

Source pack: `Bagseed_Mutation_References.zip`, R18; approved concepts and source credits under `review/mutation-detail/photo-based-batch-02/`. Photographs remain outside the repository and are not shipped as sprites.

Regenerate registration/WebP with `python3 tools/compile-mutation-components.py`, rebuild with `npm run build:bedroom`, validate with `npm run check`. Native samples and assertions: `node tools/preview-mutation-batch-03.cjs --animate`. Evidence: `review/mutation-detail/implemented-batch-03/`.
