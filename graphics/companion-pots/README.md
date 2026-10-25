# Painted companion pots

Approved shared terracotta pot for the eight native companion slots across starter, 2×2, 4×4 and 5×5 tents. The original pot positions, six-unit height, nine-unit maximum width, plant soil anchors, 0.8 plant scale and care targets are retained. Main grow pots, nursery starter pots, shop inventory, prices and companion bonuses are unchanged.

The original 1254×1254 source PNG and exact lossless WebP are retained. The 862×677 painted pot crop is sampled directly into the high-resolution indoor world canvas. The near-rim surface is cached at the full 862×677 source resolution; neither layer passes through a small icon or a low-resolution world-unit-sized sprite. Both layers use high-quality image sampling. The existing zoom-aware indoor canvas and smooth camera pass preserve detail at mobile and desktop zoom levels. The soil/back, native plant and near rim/body are painted in that order; plants retain their growth stages and root-fixed wind.

`tools/compile-companion-pots.cjs` validates approved status, source/runtime/public hashes and crop/soil/footprint metadata. `tools/build-bedroom.cjs` includes the renderer, and the startup gate waits for its image before revealing the game. `tools/check.mjs` checks the published renderer against its approved sources.

Artwork approval checkpoint: `review/companion-pots/`. Production integration and mobile/desktop zoom checks: `tests/companion-pots-browser.test.cjs` and `review/companion-pots/production/`. The browser check covers delayed image loading, all three zoom levels in both rooms on both devices, full-size back/front layer inputs, original care geometry, all 76 eligible crops at four stages, root/rim occlusion, read-only drawing and saved-plant reload.
