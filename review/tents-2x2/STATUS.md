# 2×2 designs and width swap — awaiting revised sample approval

The user approved the three 2×2 designs, then asked to swap the starter and 2×2 widths because the two-plant tent should be wider. The current preview has a 54-wide starter and an 86-wide 2×2. Original heights remain, and the 2×2 shifts left into the space freed by the starter so its right edge remains clear of the desk. The two existing starter shells also have narrower artwork.

width-comparison.png shows both tents at the same game scale with one and two live plants and the player in front. approval-2x2.png shows Standard, Pro and Premium open/closed artwork, room placement and matching store art. Existing prices are $89 for the Standard-equipped tent, $49 for the Pro shell and $95 for the Premium shell.

The isolated browser preview uses public/index.html. The helper verifies live grow contents, aligned visual targets and retained walk destinations, 36 equipment/pot/shell layering combinations, 36 player approach cases across open/closed and day/night, nine zip frames per shell, all three store cards and a mobile card. Detailed results: report.json.

No production files are changed or pushed. The proposal sources, original images, crops and preview helper are saved locally for review and later integration. Comprehensive production collision/placement/save integration will follow approval of these revised proportions.

## Follow-up corrections

The narrowed starter now uses its own opening proportions (.15–.85 of the width, ceiling at .27 of the height), so plant contents stay behind the front fabric. Both tents use soft reflected illumination within their local opening instead of the old room beam with fixed bounds. This keeps the wider 2×2 free of a clipped purple wedge; the local glow respects light power, flicker and the foreground/zip layers.

The bedroom watering can and its purchased drip-reservoir replacement move from x62 to x300 at the same floor depth, to the right of the seedling desk. Their shared click target, placement footprint and access reservation move with them. All four watering tiers are checked. watering-placement.png shows the ordinary can and upgraded tank separately; width-comparison.png shows the corrected tent contents and lighting.

The preview checks now also cover both starter shells open/closed with marker content hidden by the roof, sides and bottom fabric. No production files changed; these revisions are saved locally pending sample approval.

### Starter depth correction after further review

The previous aperture correction still left the starter pot at the opening's front lip. The follow-up seats its soil anchor at y74 rather than y82 and renders the plant/pot group at .86 scale, leaving roughly seven logical pixels of liner in front of the pot base. Visual hit rectangles use the same transform while the walk destination remains outside the tent. Both starter shells and all three pot tiers now have a specific floor-depth check, in addition to fabric occlusion checks. The updated width-comparison.png shows the actual room render with this placement.
