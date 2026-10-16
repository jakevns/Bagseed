# Bedroom chair artwork — approved

Four existing desk-chair styles: Folding Chair (included), Office Chair ($45), Gaming Chair ($120), Wooden Chair ($30), plus the preserved No Chair choice. The separate placeable Office Chair ($45) retains its Black Mesh finish and $8 Teal finish unlock. This batch contains six drawings and adds no new catalog options.

The original generated transparent atlas, checksum and crop coordinates are retained under assets and sources. The five other chairs retain that source. The gaming chair has a separate rerender with LED strips painted into its upholstery. A color mask derived from those source pixels is recolored in the same crop and transform as the chair; there are no manually traced overlay paths. Cache height is capped at 512 pixels. RGB follows rgbNow and becomes static with reduced motion.

The renderer fits all desk chairs to the same 16×30 frame, feet at y118, while preserving their aspect ratios. The placeable chair retains its 12×18 bounds, footprint, seat flag, variants and flip/rotation behavior. Store and delivery previews share the same artwork.

Approved by the user after the chairs-2 LED rerender. The shared bedroom builder embeds compile-chairs.cjs in public/index.html. Use node tools/preview-chairs.cjs to check the integrated artwork, room/store previews, LED animation and reduced motion. tests/chairs.test.cjs exercises purchases, delivery, finishes, placement, seating and save/reload.

User queue: finish and publish approved chairs first, then update the coffee cup and steam as a separate batch. Do not include coffee changes in the chair approval.
