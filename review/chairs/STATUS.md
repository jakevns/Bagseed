# Bedroom chair artwork checkpoint

Status: awaiting user approval. This batch is saved locally and is not integrated into public/index.html or published. Show actual picture previews before publishing.

Scope: all four existing desk-chair styles (Folding included, Office $45, Gaming $120, Wooden $30), plus both finishes for the separate placeable Office Chair ($45 Black Mesh; $8 Teal finish unlock). No Chair remains available. Other seating, house fixtures and dining chairs are outside this workstation batch.

Source atlas: graphics/chairs/assets/chairs-atlas.png. Six retained painted sprites, source dimensions/checksum, technical crops and normalized gaming RGB piping paths are in sources/manifest.json. Rendering preserves aspect ratios in a fixed desk-chair frame (x182/y88, 16×30, feet at y118) and the existing 12×18 placeable-chair bounds. All prices, finish ownership, collision footprints and seat flags are unchanged.

Pictures: approval-desk-chairs.png, approval-office-finishes.png and gaming-rgb-animation.gif. Store captures are included for desktop/phone. Reproduce with node tools/preview-chairs.cjs; it opens public/index.html and injects only the proposal into the disposable browser. Raw animation frames are ignored under artifacts/chair-preview/frames; GIF uses 4fps with matching 0.25-second simulation steps.

report.json records six distinct drawings, preserved No Chair/catalog/footprints/seat flag, byte-identical camera images, byte-identical desk/coffee/steam at two animation times, native-resolution RGB changes, still reduced motion, actual store captures and zero page errors. Its liveMotion section samples actual RoomArt.drawChair calls from the game loop at native resolution. Store and package art share drawing functions; Asset115.decor is overridden only for officechair to prevent the late legacy hydration pass from shrinking the image. Other items forward unchanged.

After user approval: append compile-chairs.cjs in tools/build-bedroom.cjs (shared by both build paths); mark manifest approved; add chair metadata to the bedroom build report and rebuild. Retain all prior embedded art modules. Add focused integration coverage for three paid chair styles ($195), placeable office chair ($45), Teal finish ($8), correct store/package art, style switching including None, placement/flip, seat behavior and save/reload. Fetch main before pushing to preserve other workers' changes; publish approved work using git push origin HEAD:main, never force push, and verify the remote SHA.

User's next requested batch is the coffee cup and steam, AFTER chairs. Do not include coffee changes in this approval. The active mug/steam drawing is currently in graphics/computer-desks/sources/renderer.js, inside RoomArt.drawDesk; respect coffeeDay/day state, coffee interaction bounds, consumption behavior and reduced motion. Cameras wrap drawDesk to add the flat starter phone, so preserve that wrapper and equipment when updating coffee later.

Last published release: 376c476 (camera tiers and Vintage Camera Display). Any web preview must use public/index.html, never src/game.html. Chromium blocks file:// navigation with ERR_BLOCKED_BY_ADMINISTRATOR in this environment; hosted-game checks work. Do not bypass that policy or disable the standalone test.
