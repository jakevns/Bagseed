# Codex prompt: bring the standing hands/pants-hem fix into the 8-frame walk branch

Paste everything below the line into ChatGPT Codex.

---

The standing (idle) custom player had three bugs. All of them were in `body()` in `graphics/production/sources/renderer.js`, which builds the standing figure. The walk path (`authoredWalk`) does not use `body()` and is not affected. The fix is on GitHub branch `ccr-ce6c7d40-crkcz0` (commit "Fix standing custom player hands and trouser hems"). Merge that branch into your working branch. Do not rebase it and do not discard your uncommitted 8-frame walk work. If the merge conflicts in `renderer.js`, keep both sides: my change touches only `body()`, and yours should be in `authoredWalk` and the walk timing. Then rebuild with `node graphics/production/sources/build.cjs` and run `npm run check` and `npm test`.

## What was wrong (so you don't reintroduce it)

1. **Hands vanished in profile and shrank in every view.** Below the top's hem, `body()` kept only pixels that were (a) skin-colored and (b) at x < 37 or x > 59. In left and right views the hand hangs over the hip, inside the centre strip, so it was erased. In every view, keeping only skin-colored pixels removed each hand's dark outline and shaded edge, so hands looked smaller.
   - **Fix:** seed the hand from skin pixels below the hem (any x in profile). Then keep skin and dark outline pixels (luminance < 48) within about 1.2 sprite px of a seed.
2. **The bottoms of trousers disappeared.** The bottoms layer was clipped at y=100 and everything below `shoeTop` (99, or 93 for boots and rainboots) was cleared before the shoe was drawn. The jeans, joggers and cargo hems sit at about y=100–101.5 after registration, so the hems were cut off. With boots, roughly 7 px of trouser leg vanished and a grey sock or ankle gap showed.
   - **Fix:** measure each bottom sheet's real hem from its own pixels (`bottomSource.hemY`). Clip long trousers there (clamped to 100–103), clear only below the hem, and draw the shoe *behind* the trousers (`destination-over`), clipped to start 2.5 px above the hem. Shorts and skirts keep the old behaviour, so the shoe's ankle shows.
3. **Leftover worth checking:** a thin strip of bare skin still shows between the top's hem and the waistband in front and side views on several tops (visible on the hoodie and jacket). It predates this fix. Look at it once the merge is done. Don't paper over it with a drawn band; register the top's hem to overlap the waistband.

## If you changed the standing hands or shoes for the 8-frame work

The hem and hand logic adapts to the art: the hem is measured from the bottom sheet, and hands are seeded from skin. But if you enlarged the standing shoes or moved `shoeTop`, re-check that the trouser hem still overlaps the shoe in all four directions for jeans, joggers and cargo with sneakers, boots, sandals and rainboots. Also check that profile hands are visible for every top. Render a board of each top × bottom × shoe × direction at density 3 and at game size, and show it to me.
