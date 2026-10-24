# Garden batch 04: Spinach, Swiss chard, Arugula, Rosemary and Lemon balm

Status: user approved the source artwork, growth and wind previews and requested GitHub publication. The five approved kits are integrated in production; startup now awaits twenty garden atlases.

- [Growth and wind video](growth-and-wind.mp4): eight seconds, 96 frames at 12 fps, two seconds at each of the four native stages.
- [Animated preview](growth-and-wind.gif)
- [Four-stage growth sheet](growth-stages.png)
- [Main and companion pots](five-plants-in-pots.png)
- [Store imagery](store-artwork.png)
- [Three pot tiers](pot-tiers.png)
- [Tent scene](tent-example.png)

These previews use the approved original PNGs through the game's shared garden renderer, with original growth, height and care mechanics. The clip advances selected stages for demonstration; it is not eight seconds of simulated growth. Wind uses the existing fixed-root displacement and reduced-motion stills. Spinach's final attachment explicitly targets its central basal crown, above the low outer leaf tips. Lemon balm's two lower crops meet at a transparent gap without clipping opaque tissue. Source pixels are preserved and lossless WebP decoding matches them exactly.

Browser verification passed for all twenty stage geometries, five wind/still comparisons, fixed roots, untouched-species fallback, biological read-only drawing and save/reload. No browser errors occurred. The published HTML checksum is unchanged. See `verification.json` for the captured results.

Reproduce:

```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-04 --keys=spinach,swisschard,arugula,rosemary,lemonbalm --renderer=review/garden-batch-04/renderer.js
```

`kits/*/sources/manifest.json` retains the preview compiler's `sample-awaiting-approval` lifecycle marker; the user’s approval is recorded here. The matching production manifests under `graphics/garden-plants/` use `approved-growth-artwork` and hashed asset paths.

Production validation: build and static integrity passed; all seven browser tests passed, covering four garden batches, live cannabis/genetics/mutations, mobile plant resolution and the merged pollen inventory update. Startup awaits twenty garden atlases. The character payload is preserved. See `production-verification.json`.
