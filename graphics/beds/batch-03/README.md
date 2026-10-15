# Bed batch 03 — 20 approved combinations

The user approved the Platform Bed (`platform`, $110) and Fancy Canopy Bed (`fancy`, $220), each with all ten existing bedding choices, and requested pushing the completed update. This increment contains exactly 20 combinations, bringing the completed total to 60. The earlier four frames keep their shipped artwork. Rattan and Tufted remain pending separate approval.

`assets/platform-approval.png` and `fancy-approval.png` retain the approved concept boards. `platform.png` and `fancy.png` are original transparent production atlases derived from those boards, with ten complete drawings each. Platform has a low espresso-walnut slab base and short feet. Fancy Canopy has connected cherry-wood canopy rails, brass finials and tied-back ivory drapes, with a transparent opening above the mattress. All source PNG bytes are retained without image manipulation.

The manifest records original dimensions, SHA-256 hashes and source rectangles for all 20 combinations. The existing shared renderer is instantiated separately for this batch, with embedded atlases and no external image requests. The original width, feet anchor, interaction area, walking anchor, shadow and depth ordering remain unchanged. Registered canopy artwork fits inside the existing 84×80 logical sprite canvas without clipping its upper rails.

Room and style/shop previews use the same drawings. Save IDs, ownership, catalog names, prices, purchases, delivery and sleep behavior remain unchanged. Readiness waits for all three approved batches. Build using `npm run build:bedroom`; the full graphics builder includes this batch as well.

Run `npm run check` and `npm test`. The Batch 03 test checks all 20 drawings and previews, purchase/install, switching, save/reload, sleep controls, phone layout and transparency through the canopy opening. Earlier batches are protected by their recorded render hashes; the final 20 unmodified Rattan/Tufted combinations are compared with the archived game. Captures and a report are written to `artifacts/beds-batch-03/`.
