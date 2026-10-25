# Garden batch 07: Tomato, Bell pepper, Carrot, Beet and Radish

Status: user approved the artwork and native growth/wind previews. These five kits are integrated into production; startup awaits thirty-five garden atlases.

- [Artwork and pot preview](five-plants-in-pots.png)
- [All four growth stages](growth-stages.png)
- [Growth and wind animation](growth-and-wind.mp4)
- [Store artwork](store-artwork.png)
- [Pot tiers](pot-tiers.png)
- [Native tent example](tent-example.png)

Tomato P031 has compound serrated leaves, yellow star flowers and attached green/red fruit; Bell pepper P032 has smooth leaves, white flowers and blocky green/red peppers. Carrot P011 has finely divided foliage and a small orange crown; Beet P012 has broad red-veined leaves and a burgundy upper root shoulder; Radish P013 has rough lobed leaves and a red/cream shoulder. Root crops remain planted above the soil, with no pulled taproots.

All five fit main grow pots. Tomato and Bell pepper do not fit native companion pots, so their lower review cells show plant detail. Carrot, Beet and Radish can use both. Planting flags, heights, care, harvest and regrowth stay native.

Original source PNGs are retained unchanged. Beet's first sheet was superseded by a spacing revision to separate stage crop rectangles. Inspected opaque stem/crown attachments are saved in per-kit source files; low leaves do not become root anchors. Lossless runtime WebP decoding matches each selected PNG.

Reproduce:

```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-07 --keys=tomato,bellpepper,carrot,beet,radish --renderer=review/garden-batch-07/renderer.js
```

Verification passed for all twenty stage geometries, five fixed-root wind/reduced-motion comparisons, native main/side pot eligibility, read-only biological drawing, unchanged fallback species, save/reload and zero browser errors. The published HTML checksum is unchanged. See `verification.json`. The video is eight seconds, 96 frames at 12fps, with four selected stages shown for two seconds each; it does not represent eight seconds of simulated cultivation. Tall plant detail previews are fitted to their review cells without changing live plant heights.

Production validation passed: all nine browser tests (seven garden batches, live cannabis/genetics/mutations and mobile resolution), including native main/side pot eligibility. Build and static integrity passed; thirty-five garden atlases are startup-gated and the character payload is unchanged. See `production-verification.json`.
