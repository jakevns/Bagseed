# Garden batch 06: Kale, Mustard greens, Mizuna, Tatsoi and Collard greens

Status: user approved the complete artwork, growth and wind previews. The five kits are integrated into production; startup awaits thirty garden atlases.

- [Plant and pot previews](five-plants-in-pots.png)
- [All four growth stages](growth-stages.png)
- [Growth and wind animation](growth-and-wind.mp4)
- [Matching store imagery](store-artwork.png)
- [Main pot tiers](pot-tiers.png)
- [Native tent scene](tent-example.png)

Botanical identities: Kale P005 has blue-green curly leaves; Mustard greens P007 has bright lime broad frilled leaves; Mizuna P008 has slender deeply divided pointed blades and fine pale petioles; Tatsoi P009 has a low radial rosette of dark fleshy spoon-shaped leaves; Collard greens P006 has broad smooth waxy leaves with pale midribs. All four growth stages are above-ground connected silhouettes, with original source PNGs retained and lossless WebP equality verified. Generation provenance is in `generation-sources.json`.

All five are eligible for native main grow pots. Kale and Collard greens do not fit native companion side pots: their lower preview cells show plant detail instead. Mustard greens, Mizuna and Tatsoi use both pot types. The tent preview only places eligible species in side pots. Planting flags, heights, care, biology, harvest and regrowth stay native.

Kale and growing Mustard use inspected central basal attachments rather than low outer leaves. Tatsoi uses its actual central crown, including at young and growing stages, so spreading outer spoon leaves do not become a false root position. Original pixels are unchanged.

The shared garden renderer supplies fixed-root wind, reduced-motion stills, native soil attachment and foreground pot rims. Browser verification passed for all twenty stage geometries, five wind/still comparisons, native main/side pot eligibility, unchanged fallback species, biological read-only drawing, save/reload and zero browser errors. Published HTML remained unchanged. See `verification.json`.

The video contains 96 frames at 12fps, eight seconds total; each of the four selected stages is shown for two seconds. It demonstrates stage progression rather than eight seconds of cultivation.

Reproduce:

```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-06 --keys=kale,mustardgreens,mizuna,tatsoi,collardgreens --renderer=review/garden-batch-06/renderer.js
```

Preview manifests retain their historical sample status; matching approved production manifests are registered under `graphics/garden-plants/`.

Production validation passed: all eight browser tests (six garden batches, live cannabis/genetics/mutations and mobile resolution), including native main/side pot eligibility for this batch. Build and static integrity checks passed; thirty garden atlases are startup-gated and the character payload is unchanged. See `production-verification.json`.
