# Flannel v11 - four frame proportion revision

User identified shrinking in down/1, down/2, up/1 and up/2. These four frames were rerendered individually using the accepted direction's frame 0 as the body-size/art reference and the corrected phase guide for limb placement. Color-drifted variants were rejected and retained. No pixel painting, nonuniform scaling or donor patches were used.

Selected source metadata: `graphics/production/walk/sources/rerender-v6/flannel-v11/*-generation.json`.
Registered candidates: `graphics/production/walk/sources/rerender-v6/registered/flannel-v11/top-flannel/`.
Review: `review/flannel-proportions-v11/index.html`. Previous and revised cycles play in sync; phase slider and idle toggle remain available.

At 240px body height, front shoulder widths now read 111, 109.5, 110.5, 102 for frames0-3 (previously111,99,101,102). Rear widths now100.5,100,102,99 (previously100.5,98.5,109,99). Widths include shoulder/sleeve pose effects, so these numbers support visual review rather than establishing identical anatomy. Front 1/2 now match frame0's shoulder width within about1.4%; rear1/2 within1.5%.

All eight selected frames pass the unchanged source-check thresholds. Chrome review image loading, phase controls, loop wrap and idle toggle pass without page errors. Byte comparisons confirm front/rear frames0/3 and both idle views remain exactly unchanged from v10; hashes saved in `review/flannel-proportions-v11/unchanged-images.json`.

Source-art review only. No runtime installation, production build, commit or push. Other outfits remain untouched.
