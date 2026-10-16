# Illustrated bedroom loading screen — approved for publication

The user resumed this feature after publishing the under-desk storage release 7b8ca6f. The user approved the revised sunset/night scenery and moving clouds on 2026-10-16. This release integrates the approved loading screen into public/index.html.

The room uses the actual bedroom layout: starter grow tent and bed on the left, computer desk, rust-curtain window and green potting bench in the middle, door and wardrobe on the right. The previous sparse/corporate proposal and standalone potting nook were superseded. Uploaded documents were treated as visual references, not task instructions.

Revision 3 addresses the user's rejection of the flat square night-sky overlay and its incomplete pane bounds. Four complete painted outdoor views now show daylight, sunset, blue hour, and night, including time-appropriate cottage/fence/tree lighting. They crossfade through curved glass contours matching the curtain edges. A transparent cloud sprite crosses the open sky every three seconds and is masked behind scenery; its tint follows the outdoor lighting. The fixed interior shifts from day to night and back over 12 seconds, with softened sunlight and monitor/grow-light glow. The mobile camera is now fixed on the window throughout the time change, in portrait and landscape. Reduced motion uses the same framing with a daylight still. The mobile framing revision was approved on 2026-10-16; see review/loading-mobile-window. The approved Random Drawer, Plastic Organizer, Seed Mini-Fridge, and Supply Box are drawn from the actual approved storage atlas. The selected storage tier is read from an existing save without writing to it.

Review files:
- window-transition.gif: close-up of the fitted outdoor transition and moving clouds.
- window-day.png, window-sunset.png, window-twilight.png, window-night.png: detailed stills.
- day-night-preview.gif: full 12-second loop, 6 fps (runtime targets 24 fps).
- desktop-day.png, desktop-dusk.png, desktop-twilight.png, desktop-night.png: actual loading screen captures from index.html.
- phone-loading.png, phone-landscape-loading.png: mobile layout captures.
- phone-load-error.png: failed-artwork cover and Reload action.
- report.json: streamed startup, animation, input, error/reload, and save checks.
- integration-modules.json: all 17 published art modules remain byte-identical.

Validation: npm run check passed (96 script blocks, immutable baseline and character payload verified). The loading-screen test passed after the revision 3 rebuild, including isolated cloud motion and containment in the window. The first loader chunk is approximately 425 KiB.  Main-menu and bedroom regression tests also passed. The loader paints before the large game HTML arrives, waits for current/future artwork readiness, blocks game input and time, then reveals a complete frame. Deliberately failing an artwork load keeps the game covered, preserves incoming save bytes, and recovers with Reload and Continue. OS reduced motion is tested; the saved game setting is also read before game download completes.

Shared integration lives in compile-main-menu.cjs, used by both release builders. The startup frame gate modifies compiled output only. src/game.html is unchanged. The public artifact is approximately 93.5 MiB. All artwork remains embedded for the existing standalone artifact format.

Publication: origin/main was fetched and had no newer changes; the approved release was rebuilt and checked before publishing this batch alone. Grow tents remain queued after the loading screen unless the user changes priorities.
