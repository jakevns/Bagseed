# Computer equipment checkpoint

Status: awaiting user artwork approval. Production HTML and build configuration are unchanged; this batch is preview-only and must not be pushed until approved.

Pictures: approval-computers.png (all three computer tiers, store/package thumbnails and four keyboard options), approval-options.png (three mats and all five monitor wallpapers), rgb-screen-animation.gif. Actual desktop/phone shop captures and browser validation are saved alongside them. Reproduce with node tools/preview-computer-equipment.cjs. The entry point is public/index.html, with the proposal injected only into the disposable browser.

Scope: Old Laptop included, Used Desktop $129, Dual-Monitor Rig $399. Keyboards: Beige Clacker included, Black Low-Profile $25, White Compact $25, RGB Mechanical $55. Mats: None included, Moss $12, Grape $12, Map $16. Wallpapers: Terminal Green / Plain Blue included, Pixel Sunset / Leaf Macro / Starfield $4 each. All original IDs, prices, purchase effects, furniture geometry and computer interaction bounds are preserved. Cameras and chairs are unchanged and are the next two batches in that order.

The 16 retained painted sprite components compose 15 existing visual choices. Four original transparent PNG atlases and their SHA-256 checksums, technical crop bounds and screen coordinates are stored in graphics/computer-equipment. Display content, climate history bars, power LEDs and RGB effects are rendered separately from hardware. Reduced-motion effects are static. Store, package, style and room previews share the same asset data and drawing functions.

Approval next steps: include compile-computer-equipment.cjs at the end of tools/build-bedroom.cjs (shared by both build paths). Preserve all existing embedded artwork modules. Add focused integration coverage for computer purchase/install/pay effects, all style purchases, package previews and save/reload. Rebuild, check, run relevant regression checks, fetch main to preserve other worker changes, push approved work with git push origin HEAD:main, then verify the remote SHA. Never force push.

Prior release: 8b1f576 published the approved desk frames and merged the latest customization-9 character work. Its full regression run had 50 passes and one environment-blocked local-file test (Chromium net::ERR_BLOCKED_BY_ADMINISTRATOR for file:// URLs). Hosted-game checks passed. Do not bypass that environment policy or disable the test.
