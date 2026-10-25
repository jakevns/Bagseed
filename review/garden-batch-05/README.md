# Garden batch 05: Parsley, Sage, Oregano, Strawberry and Jalapeno

Status: user accepted the source artwork and growth/wind previews. All five approved kits are now integrated into production; startup awaits twenty-five garden atlases.

Native IDs: Parsley P054, Sage P059, Oregano P060, Strawberry P071, Jalapeno P033. Four complete connected stages per species. Parsley follows the catalog's curly-leaf form; Sage has velvety gray-green leaves and violet two-lipped flowers; Oregano has small opposite leaves and terminal flower clusters; Strawberry has trifoliate leaves, white flowers and attached berries; Jalapeno has smooth leaves and attached blunt green/red peppers. Native heights, purchase forms, care, harvest and regrowth are retained.

- [Main and companion pot preview](five-plants-in-pots.png)
- [Four growth stages](growth-stages.png)
- [Growth and wind animation](growth-and-wind.mp4)
- [Store artwork](store-artwork.png)
- [Pot tiers](pot-tiers.png)
- [Tent scene](tent-example.png)

The eight-second clip contains 96 frames at 12fps and selects four stages for two seconds each, rather than simulating cultivation in eight seconds. The existing garden renderer supplies attached wind, fixed roots, reduced-motion stills and native pot rims. Source PNGs are retained unchanged and runtime WebPs decode identically. Sage's initial layout was superseded by the spaced revision to separate bounding rectangles; its basal stem attachments are explicitly measured. `generation-sources.json` identifies both Sage sources and the selected revision.

Browser review passed all twenty stage geometries, five wind/still comparisons, fixed roots, unchanged fallback species, biological read-only drawing, save/reload and zero browser errors. Production HTML was unchanged by the review. See `verification.json`.

Reproduce:

```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-05 --keys=parsley,sage,oregano,strawberry,jalapeno --renderer=review/garden-batch-05/renderer.js
```

Review manifests retain the sample lifecycle marker; matching approved production manifests are registered under `graphics/garden-plants/`.

Production validation: all seven browser tests passed (five garden batches, live cannabis/genetics/mutations and mobile resolution). Build and static integrity checks passed; startup awaits 25 garden atlases, and the character payload is unchanged. See `production-verification.json`.
