# Flannel idle/walk source review - v10

Following the approved cardigan and jacket process, this pass covers only the flannel.

- Eight individually generated walking frames, front/rear contact and passing phases for each leg.
- Two idle views redrawn afterward to match the walking build. Final front idle is a color-only imagegen revision of the v9 idle; final rear is an unchanged copy of v9.
- Raw PNGs, prompts, reference hashes and null seed notes retained. Rejected candidates retained separately. No pixel painting or donor patches.
- Registered walk frames: `graphics/production/walk/sources/rerender-v6/registered/flannel-v9/top-flannel/`.
- Registered idle views: `graphics/production/walk/registered/flannel-idle-v10/`.
- Review: `review/flannel-proportions-v10/index.html`, with old/new idle, walking cycle, phase slider and idle toggle.
- Original production idles, live atlases, renderer and other outfits remain unchanged. No runtime installation or push in this step.

## Verification

All eight selected walking frames pass the existing palette (DeltaE <=6), outline, black-edge, connected-component, clipping and planted-foot checks. New idle palette distances against original are 1.21 front and 1.83 rear.

At a uniform 240px body-height review scale:

| View | New idle shoulders | Walking median | New idle denim hips | Walking median |
|---|---:|---:|---:|---:|
| Front | 101 | 101.5 | 75.5 | 80 |
| Rear | 98 | 99.75 | 76 | 76.5 |

Chrome verified all review images load, phases select and wrap, and the idle toggle works without page errors. Three existing guide/provenance tests and three new palette-clustering regression tests pass.

## Palette audit correction

The previous single farthest-point initialization sometimes allocated three of four clusters to tiny button/antialias colors, merging almost all plaid fabric into one cluster. The audit now uses deterministic k-means++ restarts and selects minimum squared error. Every sampled pixel remains included; four clusters, occupancy-weighted matching and the DeltaE limit of 6 are unchanged. Tests cover sparse outliers, deterministic results and detection of a large color shift.

A diagnostic recheck of prior approved art flagged cardigan front walk 0 (7.48), cardigan front walk 2 (9.17), and jacket front idle (6.60) under the more stable clustering. Their historical reports and user-approved images remain untouched; this pass does not claim those older measurements pass the revised audit. The flannel's eight frames and both idle views pass the revised audit.

The larger auditor still reports 144 missing because this outfit-only review contains eight of the full task's 152 walking frames.
