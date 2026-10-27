# Garden groups 15–16: ten-plant review
Status: approved and integrated into production (80 garden identities).

Previous approved group published to GitHub main as 2ee12fb918c2fc167220f5c1f6079e0a2e2b871d. Seventy of 163 garden identities are integrated; 93 remain. Reviews continue in the saved priority order.

Fern P140, Succulent rosette P142, Dwarf heather P144, Poinsettia P145, Amaryllis P146, Christmas cactus P147, Paperwhite narcissus P148, Cyclamen P149, Hellebore P150 and Anise hyssop P069. All ten retain native main-pot eligibility, heights, care, seasonal behavior, harvest and regrowth. Anise hyssop remains main-pot-only; the other nine also fit native side pots. Succulent rosette and Christmas cactus retain cutting purchases; Amaryllis and Paperwhite narcissus retain bulbs; the other six use starter pots.

Four connected painted stages per species. Distinct traits include unfurling fern fiddleheads and fine fronds, powdery blue-green succulent spirals, fine heather bells, red poinsettia bracts and central cyathia, large red amaryllis trumpets, pendant segmented Christmas cactus stems and tiered pink flowers, small white narcissus cups, silver-marbled cyclamen leaves and reflexed pink flowers, palmate hellebore foliage and ivory-green cups, and opposite serrated anise hyssop leaves with purple tubular flower spikes.

Original generated PNGs remain unchanged, with original file paths in generation-sources.json and hashes in kit manifests. Runtime WebPs decode identically. Fern, Poinsettia, Christmas cactus, Cyclamen, Hellebore and Anise hyssop use inspected central basal attachment points so drooping leaves and flowers cannot become false soil anchors.

Verification passed all 40 stage geometries, ten fixed-root wind/still comparisons, native pot eligibility, read-only biological drawing, save/reload, unchanged published HTML and zero browser errors. The eight-second clip has 96 frames at 12fps, showing four selected stages for two seconds each, rather than eight seconds of simulated cultivation. The tent is a six-slot example; other sheets and animation include all ten plants. Anise hyssop's second pot-preview cell is labeled plant detail and has no side pot.

- [Ten plants in pots](five-plants-in-pots.png)
- [Forty growth stages](growth-stages.png)
- [Growth and wind animation](growth-and-wind.mp4)
- [Store artwork](store-artwork.png)
- [Pot tiers](pot-tiers.png)
- [Tent example](tent-example.png)

The pot-preview filename retains the existing helper convention but contains ten plants.

Reproduce:
```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-15-16 --keys=fern,succulentrosette,dwarfheather,poinsettia,amaryllis,christmascactus,paperwhitenarcissus,cyclamen,hellebore,anisehyssop --renderer=review/garden-batch-15-16/renderer.js
```
