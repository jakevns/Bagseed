# Velvet Underbrush artwork review

Status: artwork approved for publication as a prototype checkpoint. Full painted-renderer integration remains pending.

- `velvet-growth-and-flower.png`: seed, germination, seedling, early/mature vegetation, early/mid/late flower and harvest-ready. Panels are independently magnified.
- `velvet-50-and-90-inches.png`: the same phenotype at a shared physical scale.
- `velvet-late-flower-senescence.png`: larger mature-flower portrait with the Red accents phenotype's autumn fade.
- `velvet-growth-and-wind.mp4` / `.gif`: continuous growth and late-flower wind study, 120 frames at 12 fps. Sample heights do not represent elapsed game days.
- `verification.json`: pinned identity, measured heights, attached organ counts, finish palette and browser errors.

Reproduce with `node tools/preview-plant-components.cjs velvet`. All samples use the actual component atlas and shared model/renderer, not separate full-plant concept paintings. Full training/care/drying integration remains pending as documented in `graphics/plants/velvet/README.md`.
