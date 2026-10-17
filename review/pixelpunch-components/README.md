# Pixel Punch artwork review

Status: approved for publication as a prototype checkpoint; full painted-renderer integration remains pending.

- `pixelpunch-growth-and-flower.png`: seed through harvest-ready, including natural purple senescence. Stage panels are independently magnified.
- `pixelpunch-late-flower-senescence.png`: full-size mature portrait.
- `pixelpunch-50-and-90-inches.png`: potted and outdoor forms at the same physical scale.
- `pixelpunch-cool-night-colors.png`: the same purple genotype with an 8°F versus 10°F dark-period drop after two study nights.
- `pixelpunch-growth-and-wind.mp4` / `.gif`: connected growth and late-flower wind animation.
- `verification.json`: pinned phenotype, measured painted heights, attached organ counts, senescence, cool-night exposure, captured-color bonus and browser errors.

Reproduce with `node tools/preview-plant-components.cjs pixelpunch`. See `graphics/plants/pixelpunch/README.md` for the integration boundary and checks. No native game mechanics, climate behavior or Sprout scoring changes are required for this kit; it uses those existing shared systems.
