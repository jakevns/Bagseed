# Moonmarble painted organs

Status: **gameplay artwork approved by the user for production**.

Marbled and sectorial forms retain ordinary serrated fan-leaf anatomy with irregular cream tissue, green islands and faint veins in the pale sectors. A deterministic organ ID selects the predominant pattern family on most leaves, with occasional alternate sectors. Patterns remain fixed as an organ sways or matures. Green tissue receives the expressed palette and senescence; cream tissue retains its pale identity.

`assets/components.png` is original game artwork generated from the approved concept and supplied photographic references. Its two rows contain stable forms/pattern families; each row has juvenile, young, mature and sugar organs. The `fiveLeaf` and `sevenLeaf` engine role names are maturity slots: they share a mature organ and do not impose a leaflet count on the mutant.

The measured crops, petiole attachment points and alpha hulls are registered in `sources/manifest.json`. The compiler writes RGBA-exact lossless WebP and hashed public runtime assets without repainting or altering the source PNG. New atlases participate in startup readiness.

Native mutation IDs, simulation values, expressed genes and saved visual seeds are retained. Cuttings keep their mother's form. Shapes use Monophylla > Ducksfoot > Freakshow precedence; Moonmarble is an independent tissue pattern that can coexist with a shape mutation. The native stem/branch model supplies growth, wind, supports, SCROG, cleanup, stress and finishing colors. Male flowers, seeds, cotyledons and drying artwork retain the existing strain kit.

Reference pack: `Bagseed_Mutation_References.zip`, R26, R28, R13. Source credits and URLs are retained in `review/mutation-detail/photo-based-batch-01/review-manifest.json`. Reference photographs remain outside the repository and are not shipped as assets. Proposed pigment combinations are game art, not a new biological or inheritance claim.

Regenerate assets with `python3 tools/compile-mutation-components.py`; rebuild with `npm run build:bedroom` and validate with `npm run check`. Native captures and assertions: `node tools/preview-mutation-batch-02.cjs --animate`. Review evidence is in `review/mutation-detail/implemented-batch-02/`.
