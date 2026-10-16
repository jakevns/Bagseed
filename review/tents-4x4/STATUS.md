# Approved 4×4 tent — production integration

The user approved Standard, Pro and Premium and authorized publication before starting 5×5 artwork. The production build now contains the approved 4×4, matching store/delivery/inventory art and independent equipment, four live plants and front fabric. Current character/walking updates are preserved.

approval-4x4.png shows all tiers; growroom-*.png and store-*.png come directly from public/index.html. zip-animation.gif combines nine native closing frames and reverse playback, slowed for review. Runtime timing remains 380 ms. report.json records 36 equipment/pot combinations, 36 front-player approaches, three behind-player cases, four plant targets, unchanged content/catalog/geometry and desktop/mobile store captures. publish-validation.json records actual purchases, delivery, shell fitting, collision bounds and save/reload.

Original atlas pixels are unchanged, and the lossless WebP matches every decoded RGBA channel. The startup gate waits for the fingerprinted external atlas. Production compilers validate source/asset/build integrity. Existing prices are $249 for Standard-equipped tent, $119 Pro and $219 Premium. Physical bounds and capacity are unchanged.

Publishing the release to main triggers the existing Pages workflow. A successful push and a completed live deployment are distinct states.
