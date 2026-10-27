# Garden groups 11–12: ten-plant review
Status: approved and integrated into production (60 garden identities).

Previous approved group published to GitHub main as f05e14b2e37686e80e587181547df436cf8690d4. Fifty of 163 garden identities are now integrated; 113 remain. Per user request, reviews now combine ten plants, preserving the saved priority order.

Grape hyacinth P087, Snowdrop P088, Primrose P090, Pansy P091, Viola P092, Ranunculus P093, Anemone P094, Petunia P099, Impatiens P100 and Begonia P101. All ten retain native main/side-pot eligibility, heights, care, flowering, harvest and regrowth behavior. Grape hyacinth, Snowdrop, Ranunculus and Anemone retain bulb purchase packages; the other six retain nursery starter pots.

Four connected painted stages per species. Distinct features include blue urn-shaped grape hyacinth florets, green-marked snowdrop bells, textured primrose rosettes, large blotched pansy faces, finer lilac violas, concentric pink ranunculus petals, scarlet dark-centered anemones, magenta petunia trumpets, flat coral impatiens and waxy asymmetric bronze begonia leaves.

Original generated PNGs remain unchanged; generation-sources.json records their original file paths. Kit manifests include source/runtime hashes and lossless WebP conversion. Primrose, Pansy, Viola, Anemone, Petunia and Begonia use inspected central basal attachment points to exclude low leaves. Fixed-root wind and reduced-motion stills use the shared renderer.

All 40 stage geometries, ten fixed-root wind/still comparisons, native pot eligibility, read-only biological drawing, save/reload and unchanged published HTML passed. No browser errors. The eight-second animation has 96 frames at 12fps and shows four selected stages at two seconds each, rather than eight seconds of simulated cultivation. The tent scene is a six-slot example; the other sheets and animation include all ten plants.

- [Ten plants in pots](five-plants-in-pots.png)
- [Forty growth stages](growth-stages.png)
- [Growth and wind animation](growth-and-wind.mp4)
- [Matching store artwork](store-artwork.png)
- [Pot tiers](pot-tiers.png)
- [Tent example](tent-example.png)

The pot-preview filename retains the existing helper convention; it contains all ten plants.

Reproduce:
```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-11-12 --keys=grapehyacinth,snowdrop,primrose,pansy,viola,ranunculus,anemone,petunia,impatiens,begonia --renderer=review/garden-batch-11-12/renderer.js
```
