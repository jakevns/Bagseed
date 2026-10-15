# Bed batch 03 — 20 approved combinations

The user approved the Platform Bed (`platform`, $110) and Fancy Canopy Bed (`fancy`, $220), each with all ten existing bedding choices, and requested pushing the completed update. This increment contains exactly 20 combinations. Batch 04 subsequently completed Rattan/Tufted, bringing the collection to 80 combinations while preserving this artwork.

`assets/platform-approval.png` and `fancy-approval.png` retain the approved concept boards. `platform.png` and `fancy.png` are original transparent production atlases derived from those boards, with ten complete drawings each. Platform has a low espresso-walnut slab base and short feet. Fancy Canopy has connected cherry-wood canopy rails, brass finials and tied-back ivory drapes, with a transparent opening above the mattress. All source PNG bytes are retained without image manipulation.

The manifest records original dimensions, SHA-256 hashes and source rectangles for all 20 combinations. The existing shared renderer is instantiated separately for this batch, with embedded atlases and no external image requests. The original width, feet anchor, interaction area, walking anchor, shadow and depth ordering remain unchanged. Registered canopy artwork fits inside the existing 84×80 logical sprite canvas without clipping its upper rails.

Room and style/shop previews use the same drawings. Save IDs, ownership, catalog names, prices, purchases, delivery and sleep behavior remain unchanged. Readiness waits for all three approved batches. Build using `npm run build:bedroom`; the full graphics builder includes this batch as well.

Run `npm run check` and `npm test`. The Batch 03 test checks all 20 drawings and previews, purchase/install, switching, save/reload, sleep controls, phone layout, complete catalog registration and transparency through the canopy opening. This batch is protected by rendered hashes captured before Batch 04 integration. Captures and a report are written to `artifacts/beds-batch-03/`.
