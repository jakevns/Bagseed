# Mobile loading zoom fix — approved for publication

User report: the room window appears hugely zoomed in when the page first opens, before the normal loading menu appears.

Reproduced on the published a2b147c build using mobile Chromium (Pixel 7 emulation) and a staged HTML download. Once the unstyled home-menu image arrived, the page layout viewport grew from 412×839 to 974×1984 CSS pixels while the physical visual viewport remained 412×839. The loading canvas then grew from about 1489×559 to 4543×1704, moving its title and loading controls out of view. Existing tests stopped the download before this image arrived or used desktop browser contexts.

Fix: while startup is loading, exclude the unfinished game/home-menu body elements from layout with display:none. Keep the loading menu visible. After all artwork, document images, and fonts are ready, restore the underlying layout under the existing cover and inert/input guards, hydrate and paint the first full frame, then reveal it. The approved fixed camera, day/night artwork, game window, gardening update, and saves are unchanged.

Validation:
- loading-first-paint.test.cjs fails against the published version and passes with the fix. It streams through the early shell, unstyled menu markup, native game/menu styles, and final release assets in actual mobile browser contexts (Pixel 7, iPhone 13 viewport emulation, and a narrow 320×568 phone). It verifies unchanged viewport/canvas bounds, visible loading controls, and successful handoff to the home menu.
- loading-mobile-layout.test.cjs and main-menu.test.cjs passed, including slow-download Reload layouts and existing menu actions.
- npm run check passed: 98 script blocks, baseline and character payload verified.
- The full loading-screen readiness/error/reload/save test passed for the final checkpoint. See loading-regression.json.

Preview: mobile-corrected.png. Detailed staged-download measurements: report.json. Published-version reproduction: before-layout.json. Artwork/module preservation: integration-modules.json.

The user approved publishing this fix on 2026-10-16. The current repository was checked before publication.

Publication integration: merged with origin/main at 71e4e05, preserving its bedroom wall-placement correction. Rebuilt the generated game from the merged sources. The source game and all 19 other embedded artwork/runtime modules match that published base; only the loading controller and its early visibility styles change.

Merged-build validation passed: npm run check and all four targeted browser tests (bedroom wall placement, mobile first paint, slow-download mobile layout, and main-menu actions). The full loading recovery/save test above was run on the approved feature checkpoint before this unrelated wall-placement integration.
