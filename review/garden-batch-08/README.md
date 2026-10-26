# Garden batch 08: Broccoli, Cauliflower, Cabbage, Kohlrabi and Celery

Status: user approved the artwork and native growth/wind previews. The five approved kits are integrated into production; startup now awaits forty garden atlases.

- [Artwork and pot preview](five-plants-in-pots.png)
- [All four growth stages](growth-stages.png)
- [Growth and wind animation](growth-and-wind.mp4)
- [Store artwork](store-artwork.png)
- [Pot tiers](pot-tiers.png)
- [Native tent scene](tent-example.png)

Native IDs: Broccoli P021, Cauliflower P022, Cabbage P023, Kohlrabi P025 and Celery P027. All five fit main grow pots; none fits companion side pots. Lower review cells therefore show plant detail without side pots. Native planting flags, heights, timing, care and harvest mechanics remain unchanged. Kohlrabi retains its seed-packet purchase form, while the other four retain starter pots.

Botanical identities: Broccoli has a dark green unopened bud crown on a branching stalk; Cauliflower has a bumpy cream curd within waxy cupped wrapper leaves; Cabbage has a dense overlapping leaf head; Kohlrabi has an above-ground swollen stem with separate petiole attachments; Celery has long ribbed pale green petioles and compound toothed leaves. Four distinct stages run from sprouting through harvest-ready.

Original source PNGs are retained unchanged, and lossless runtime WebPs decode identically. Cauliflower's sprout/young stages and mature Cabbage use explicitly inspected opaque central stem attachment points so lower outer leaves cannot become soil anchors. The other attachments pass the shared compiler's opaque basal-pixel validation.

Reproduce:

```sh
node tools/preview-garden-batch-01.cjs --offline --review-root=review/garden-batch-08 --keys=broccoli,cauliflower,cabbage,kohlrabi,celery --renderer=review/garden-batch-08/renderer.js
```

Verification passed for all twenty stage geometries, five fixed-root wind and reduced-motion comparisons, native main/side pot eligibility, read-only biological drawing, unchanged fallback species, save/reload and zero browser errors. Published HTML remained unchanged. See `verification.json`. The clip contains 96 frames at 12fps (eight seconds), showing four selected stages for two seconds each; it does not represent eight seconds of simulated cultivation.

Production validation passed: all eleven browser tests (eight garden batches, live cannabis/genetics/mutations, mobile resolution and the newer Sprout/Trellis comment-performance regression). The incoming fix from cb256c1 is preserved. Build and static integrity passed; forty garden atlases are startup-gated, and the character payload is unchanged. See `production-verification.json`.
