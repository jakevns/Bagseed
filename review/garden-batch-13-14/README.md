# Garden groups 13–14: ten-plant review
Status: approved and integrated into production (70 garden identities).

Previous approved group published to GitHub main as 31869ce96fea7301d9da3ab757d52c3418e3547c. Sixty of 163 garden identities are integrated; 103 remain. The saved priority order continues in ten-plant reviews.

Geranium P102, Portulaca P109, Dianthus P114, Chrysanthemum P116, Sedum stonecrop P123, Hosta P135, Heuchera P136, Coleus P137, Ornamental kale P138 and Dusty miller P139. All ten retain native main/side-pot eligibility, heights, care, harvest and regrowth. Coleus has a matching cutting purchase icon using its young painted stage; the other nine retain nursery starter pots. The approved renderer, including the cutting icon branch, is copied into production.

Four connected painted stages per species. Distinct traits include Geranium's zonal leaves and red umbels, Portulaca's succulent needles and orange-pink cups, fringed pink Dianthus, yellow Chrysanthemum pompoms, Sedum's fleshy leaves and starflower clusters, ivory-edged ribbed Hosta leaves and lavender bells, burgundy Heuchera and airy coral bells, magenta/lime Coleus leaves, pink-centered ruffled kale and felted silver Dusty miller foliage.

Original generated PNGs are preserved unchanged. Dianthus and Ornamental kale additionally retain spacing-corrected generated sheets for separated crops and complete outer leaves; generation-sources.json records both. Lossless runtime WebPs decode identically to the selected sheets. Explicit central basal anchors for Portulaca, Chrysanthemum, Heuchera, Coleus, Ornamental kale and Dusty miller keep low leaves from becoming false soil attachment points.

Verification passed all 40 stage geometries, ten fixed-root wind/still comparisons, native pot eligibility, read-only biological drawing, save/reload, unchanged published HTML and zero browser errors. The eight-second video has 96 frames at 12fps, showing four selected stages for two seconds each, rather than eight seconds of simulated cultivation. The tent is a six-slot example; other sheets and animation include all ten plants.

- [Ten plants in pots](five-plants-in-pots.png)
- [All forty growth stages](growth-stages.png)
- [Growth and wind animation](growth-and-wind.mp4)
- [Store artwork](store-artwork.png)
- [Pot tiers](pot-tiers.png)
- [Tent example](tent-example.png)

The pot-preview filename retains the existing helper convention but contains ten plants.

Reproduce:
```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-13-14 --keys=geranium,portulaca,dianthus,chrysanthemum,sedumstonecrop,hosta,heuchera,coleus,ornamentalkale,dustymiller --renderer=review/garden-batch-13-14/renderer.js
```
