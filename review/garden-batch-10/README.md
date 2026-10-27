# Garden batch 10
Status: approved and integrated into production (50 garden identities).

Previous approved batch published to GitHub main as 61b3075219bb28a3ad9c2b0cca53e55523f13851 (45 garden identities integrated).

Lemongrass (P068), Tulip (P083), Daffodil (P084), Crocus (P085) and Hyacinth (P086). Each has four isolated painted growth stages. Lemongrass retains its nursery starter pot; the four flowers use illustrated bulb bags matching their native purchase form. All five are eligible for main and companion pots.

Original generated PNGs are preserved unchanged in originals/, with source filenames in generation-sources.json and SHA256 hashes in kit manifests. Lossless runtime WebPs decode identically. The renderer keeps the central basal attachment fixed at the soil while foliage moves in the wind, and honors reduced motion.

Verified all 20 stage geometries, five fixed-root wind and still comparisons, native pot eligibility, read-only biological drawing, save/reload, unchanged published HTML and zero browser errors. See verification.json. The eight-second clip shows four selected stages at two seconds each, rather than eight seconds of simulated cultivation.

- [Plants in pots](five-plants-in-pots.png)
- [Growth stages](growth-stages.png)
- [Growth and wind animation](growth-and-wind.mp4)
- [Store artwork](store-artwork.png)
- [Pot tiers](pot-tiers.png)
- [Tent](tent-example.png)

Reproduce:

```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-10 --keys=lemongrass,tulip,daffodil,crocus,hyacinth --renderer=review/garden-batch-10/renderer.js
```
