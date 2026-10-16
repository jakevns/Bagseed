# Bedroom coffee mug and steam — awaiting approval

One illustrated ivory stoneware mug with sage glaze and a small sprout, replacing the existing built-in bedroom coffee cup. The source PNG is retained unchanged, with checksum and technical crop in sources/manifest.json. The cup remains seven world pixels wide with its base at y74, using the original coffee interaction at [206,64,10,11]. There is no existing purchasable coffee-mug style or store card to replace; this batch adds no catalog item.

Steam uses three translucent curved wisps rising from the visible coffee surface. Each drifts, rises and fades over a seamless four-second period. The animation uses the game's existing time argument, with no timers or additional animation loops. Reduced motion hides the steam. Drinking hides both mug and steam, and the existing next-day reset restores them. Energy, time, daily state and saved games keep their current behavior.

The computer-desk source extracts the old coffee block into RoomArt.drawCoffee as a separate fallback, then calls it from the same place. The new module wraps only that function. This preserves the approved desk, computer and camera drawing order and the camera wrapper's phone/placed-decor overlap behavior.

Preview: node tools/preview-coffee.cjs. It opens public/index.html and injects the extracted desk hook, existing camera wrapper and coffee proposal only into a disposable browser. The shipped HTML and shared build configuration remain unchanged until approval. Frames are saved under ignored artifacts/coffee-preview/frames; encode with ffmpeg at 10 fps, matching 0.1-second simulation steps. See review/coffee/STATUS.md for approval and integration notes.
