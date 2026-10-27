# Garden batch 09: Tarragon, Marjoram, Summer savory, Chervil and Lemon verbena

Status: user approved the complete artwork and native growth/wind previews. The five approved kits are integrated into production; startup awaits forty-five garden atlases.

- [Artwork and pot preview](five-plants-in-pots.png)
- [All four growth stages](growth-stages.png)
- [Growth and wind animation](growth-and-wind.mp4)
- [Store artwork](store-artwork.png)
- [Pot tiers](pot-tiers.png)
- [Native tent scene](tent-example.png)

Native IDs: Tarragon P063, Marjoram P064, Summer savory P065, Chervil P066 and Lemon verbena P067. All five fit both main and companion pots. Tarragon and Lemon verbena retain starter purchase forms; the other three retain seed packets. Native heights, timing, care, harvesting, regrowth and planting flags remain unchanged.

Distinctive painted identities: soft narrow Tarragon foliage with small yellow-green flower heads; rounded gray-green Marjoram leaves and compact pale flower clusters; narrow Summer savory leaves, reddish stems and small pink-lilac axillary flowers; light-green dissected Chervil foliage and white umbels; lanceolate Lemon verbena leaves and fine white flower sprays. Each supplies four connected growth stages.

Original PNGs are retained unchanged, with generation filenames and hashes in `generation-sources.json`. Runtime WebPs decode identically. Marjoram's growing/mature crowns and Chervil's young/growing/mature stems use explicitly inspected opaque attachment points so lower leaves do not become false soil anchors. The shared renderer supplies fixed-root wind, reduced-motion stills, native soil positioning and foreground rims.

Verification passed all twenty stage geometries, five fixed-root wind/still comparisons, native main/side pot eligibility, read-only biological drawing, unchanged fallback species, save/reload and zero browser errors. Published HTML remained unchanged. See `verification.json`. The video has 96 frames at 12fps (eight seconds), showing four selected stages for two seconds each; it does not represent eight seconds of simulated cultivation.

Reproduce:

```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-09 --keys=tarragon,marjoram,summersavory,chervil,lemonverbena --renderer=review/garden-batch-09/renderer.js
```
