# Remy, Priya and Doug: high-resolution eight-frame walking

Jake approved the custom `review/custom-walk-v4` stride and requested this as the future walking standard on October 16, 2026. This explicitly expands the earlier scope to these three approved walkers.

Each character has eight different authored drawings in front, right, back and left views, registered directly from high-resolution source artwork to 288 × 324 canvases. Matching high-resolution standing drawings use the same illustrated detail and identity references, instead of enlarging the old pixelated extracts. Portraits, reactions, world footprints and save identities remain on their established paths.

The built-in image generation tool created the additional poses, using original identity sheets and the approved eight-pose custom-character motion as references. Prompts and original PNGs are retained under `graphics/production/cast-walk-v1/sources/` and `assets/`. Corrections address weak arm swing, watering-can continuity and footwear consistency. Transparent alpha is preserved with premultiplied-alpha registration; source RGB under completely transparent pixels is not visible artwork.

Registration uses uniform scaling and translation, with one source-to-native resampling and a small specified weight bob. It corrects accidental differences in drawing scale between sheet rows. It does not draw clothing, stretch limbs, warp meshes or enlarge low-resolution intermediates. Remy and Priya's symmetric left views mirror their right drawings. Doug's left view is independently authored to retain the carrying hand.

The canonical sprite selector uses the character's frame count. NPC/visitor/roommate playback reaches all eight frames; movement-driven clocks remain tied to displacement where available. The preview uses 125 ms per frame, with pause, slow motion and individual frame controls. Runtime checks render all 96 poses through the actual game compositor and verify the eight-frame keys, canvas size, nonempty figures and floor baseline. Visual review remains essential for judging gait and likeness.

Local changes only; this work has not been committed, pushed or deployed.
