# Jacket idle/walk source review - v9

The jacket is the next outfit after the approved cardigan v11. Work is limited to this outfit.

- Eight fresh individual walking images: front/rear contact and passing phases for both legs.
- Three rejected initial frames retained unchanged; selected replacements are recorded by their generation JSON.
- Two fresh idle views drawn after the walking frames, matching their compact proportions.
- All eight selected walking frames pass the existing palette, outline, black-edge, leading-foot, connected-component and clipping checks. Corrected front/rear guides have two phases per support leg.
- New idle palette distance against original: front 1.80, rear 1.37 (limit 6).
- At 240px body height, new idle denim hip width is 66 vs walking median 69 front; 68 vs 67 rear. Shoulder width is 94.5 vs 100.5 front; 97 vs 101.5 rear. Arm swing affects total silhouette width.
- Original production idle art is unchanged. Raw generated source images are retained unchanged. Registration uses uniform scale and translation only.
- Review page images, phase selection, cycle wrap and idle toggle verified in Chrome with no script errors. Three existing pose-guide/provenance regression tests pass.

Review: `review/jacket-proportions-v9/index.html`. The comparison has old idle, revised idle, then walking phases 0-3, all at one body-height scale.

This is source-art review, not a game installation or a GitHub push. Existing side views and all other outfits remain unchanged. The all-outfit auditor reports 144 missing because this review intentionally contains only the eight jacket frames from the larger 152-frame task.
