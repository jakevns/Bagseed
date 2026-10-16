# Bedroom chair artwork — awaiting approval

Four existing desk-chair styles: Folding Chair (included), Office Chair ($45), Gaming Chair ($120), Wooden Chair ($30), plus the preserved No Chair choice. The separate placeable Office Chair ($45) retains its Black Mesh finish and $8 Teal finish unlock. This batch contains six drawings and adds no new catalog options.

The original generated transparent atlas, checksum and crop coordinates are retained under assets and sources. The five other chairs retain that source. The gaming chair has a separate rerender with LED strips painted into its upholstery. A color mask derived from those source pixels is recolored in the same crop and transform as the chair; there are no manually traced overlay paths. Cache height is capped at 512 pixels. RGB follows rgbNow and becomes static with reduced motion.

The renderer fits all desk chairs to the same 16×30 frame, feet at y118, while preserving their aspect ratios. The placeable chair retains its 12×18 bounds, footprint, seat flag, variants and flip/rotation behavior. Store and delivery previews share the same artwork.

Use node tools/preview-chairs.cjs to load public/index.html and inject only the proposal in the preview browser. Production HTML and build configuration remain unchanged until the user approves the pictures. Save this work locally and show pictures before pushing.

User queue: finish and publish approved chairs first, then update the coffee cup and steam as a separate batch. Do not include coffee changes in the chair approval.
