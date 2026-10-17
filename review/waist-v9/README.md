# Continuous waist and pelvis

The side-walk packing cut assigned painted waistband rows to the torso, then discarded them from bottom garments. Shirt hems ended above that cut, exposing a horizontal transparent strip. Five bottoms now retain their original waistband, belt and seam pixels. No garment art is redrawn or moved.

The older front/back path also lacked a continuous base at this join. A cropped section of the existing grayscale mannequin now sits beneath the pelvis and takes the current pants color (or the matching full-suit color). It is confined inside the hips so it cannot protrude at the waist. Existing leg, shirt, arm and shoe parts keep their artwork.

The regression check samples 583,200 waist/pelvis pixels in 1,800 rendered composites: 15 tops, five bottoms, eight frames per side and four frames front/back. It requires opaque coverage instead of accepting a transparent cut as a normal seam. Arm visibility and live creator/mirror checks also run. See `coverage.json` and `preserved-art.json`.

Reproduce with `python graphics/production/walk/wardrobe-v5/sources/repack_lower.py`, `python graphics/production/sources/encode.py --walk-only`, then `node graphics/production/sources/build.cjs` and `node tools/check.mjs`. Encoding checks exact decoded RGBA equality. Full wardrobe registration reapplies the lower-body repair at its end. The builder skips rewriting identical generated files.
