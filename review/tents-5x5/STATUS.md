# Approved 5×5 tent — production integration

The user approved Standard, Pro and Premium and authorized publishing. The production build contains all three 5×5 shells with six independent live plants, twin lights, matching store/delivery/inventory icons and native zip steps. Existing prices are $489 for the base tent, $189 Pro and $339 Premium. Bounds, unlocks, catalog names and capacity are unchanged. The 4×4 and current character/walking update are preserved.

approval-5x5.png and growroom-*.png are rendered directly from public/index.html, alongside the published 4×4. store-*.png includes the base and both upgrades with a phone capture. zip-animation.gif combines native captures, slowed for review; runtime keeps 380 ms timing.

report.json records 36 shell/light/pot combinations, 36 front-player approaches, three behind-player cases, six accessible plant targets, nine zip steps per tier, three store cards, a phone card and preserved content/geometry/catalog. publish-validation.json records actual $489/$189/$339 purchases, delivery artwork, shell fitting, saved progress, collision/approach bounds and loading cover behavior when the external atlas is deliberately blocked.

The original PNG is unchanged. The lossless WebP matches every decoded RGBA channel, has a fingerprinted URL, and is required by the startup gate. Build/source checks validate the embedded renderer and published image. A successful push to main triggers the Pages workflow; it is distinct from verification of a completed live deployment.
