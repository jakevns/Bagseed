# Dehumidifier artwork samples

Awaiting user approval; do not publish these samples before approval. The two existing tiers and their prices, installation, per-tent humidity effects and controls are unchanged. Both have matching Leaf Mart, inventory and delivery artwork, on/off indicators and a live target display on the smart tier.

The unchanged original generated PNG is retained in assets. The runtime WebP preserves its exact decoded RGBA pixels and is served at a fingerprinted URL. The compiler verifies both source and runtime hashes. Artwork readiness participates in the startup gate.

Interior dehumidifiers render before plants and foreground fabric, within the opening clip. Starter placement is opposite the humidifier; 2×2 is back right; 4×4 is between plants 3–4; 5×5 is between plants 5–6. Exterior sensors render after the tent foreground, before actors, with their own targets when zipped closed. Logical plant anchors and equipment slots are unchanged. Dual fans render one head per side at the same middle height, with separate click areas. The middle is measured within the visible opening and keeps clearance beneath the exhaust. Side-mounted fans render after the canopy but before front fabric and actors so leaves cannot conceal the grilles. Reduced motion and on/off/speed settings still apply.

Rebuild with `npm run build:bedroom`, verify with `npm run check`, capture the actual `public/index.html` with `node tools/preview-dehumidifiers.cjs`, then package its motion captures with `python3 tools/animate-dehumidifiers.py`. Browser checks use the supported local HTTP server. The builder retains the current character renderer and `public/character-data.js` companion.

Integration coverage: `node --test --test-concurrency=1 tests/dehumidifiers.test.cjs tests/starter-tent.test.cjs tests/tent-player-depth.test.cjs tests/fans.test.cjs tests/humidifiers.test.cjs`. The preview helper additionally checks all four placements, separate fan click areas, visible/clickable closed-door sensors across all three purchased tiers, live displays, pot overlap, motion settings, model preservation, store cards and phone layout.
