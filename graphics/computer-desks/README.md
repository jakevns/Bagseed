# Computer desks — approved

Four desk frames: the fixed bedroom computer desk and the existing Side Desk's Birch, Steel & Oak, and Standing Desk variants. The $50 base item and $12/$25 finish unlocks remain unchanged. No new furniture choices are added.

The original generated transparent atlas is retained in `assets/desks-atlas.png`; its checksum and crop bounds are recorded in `sources/manifest.json`. The renderer uses the same Side Desk drawing function in the room and store. It preserves existing dimensions, collision shapes, tabletop support, flip/rotation, variant selection and saved records. Computer equipment, cameras, chairs and coffee retain their current art and behavior.

Run `node tools/preview-computer-desks.cjs` for a picture board and browser validation against **public/index.html**. The approved renderer is included in both production build paths through `tools/build-bedroom.cjs`. Browser integration coverage is in `tests/computer-desks.test.cjs`.
