# Porchlight flowering reference

Status: flowering references and phenotype-aware late-flower senescence approved by the user. Published as a prototype checkpoint; not installed in the production renderer.

Reproduce with `node tools/preview-porchlight-flower.cjs`. This opens the current `index.html` in a disposable browser and injects the existing component prototype. Early, mid and late female flowering inputs use stages 7, 8 and 10, the same phenotype seed, 50-inch height, 11 nodes, healthy conditions and natural training. Heights are controlled study inputs rather than a growth timeline. The full renderer has not yet completed training/care integration.

The comparison uses the approved leaf kit and its early/mid/late flower components, with 19 attached flower sites per plant. The detail sheet enlarges those same flower components. Browser capture verified no page errors. No production assets or game/save code were modified.

## Late-flower senescence study

`porchlight-late-flower-senescence.png` shows the same 50-inch Porchlight phenotype at late flower (stage 9), with an explicit finish-color study input of `visualState.senescence: 1`. This is not a literal change to the game's days per stage. Porchlight's existing Forest green phenotype maps to gold; other expressed color names select ochre, lavender, purple, deep purple, rose or red, while the existing ink mutation selects near-black purple. No new inheritance is rolled.

Finishing color changes the painted fan-leaf RGB while preserving source alpha, veins and shading. Buds and stems retain their original art. Variation by canopy height leaves upper fans somewhat greener than lower fans. It is independent of health, nutrition, water and stress, which retain separate rendering effects. Veg/early/midflower are gated out. The prototype supports continuous finish progress but still needs a native simulation adapter before production use.
