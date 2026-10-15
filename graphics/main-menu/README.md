# Approved community-garden main menu

The user approved the artwork with “Excellent!!! Approved :)”. The title screen now features a sunny neighborhood garden, the familiar adult cast direction, two potted cannabis plants and a ginger cat. Continue, New game, Settings and Import save remain real accessible controls. Desktop places the controls over the cream panel beside the garden; portrait phones use a separate registered scene crop between the brand and controls. Short screens and landscape phones retain usable controls. Continue stays disabled without a save, and New game becomes the primary action in that case.

`assets/approval-concept.png` retains the approved desktop/phone board. `assets/community-garden.png` is the original generated production background without baked-in text or buttons. The manifest records the original source hash and phone crop; source PNGs are unchanged. The logo and all labels/buttons are live HTML/SVG. Scoped CSS leaves gameplay and other menus intact. The original animated title canvas is hidden and its draw loop exits early.

`tools/compile-main-menu.cjs` embeds the image once in the HTML and installs the title styles and image-readiness hook before the larger gameplay graphics scripts. Both the bedroom and full graphics builds use it. Rebuild with `npm run build:bedroom`, then validate with `npm run check` and `npm test`. `public/index.html` is the complete playable game and the required entry point for every web preview; `src/game.html` is the source template.

The menu test covers six viewport sizes, visible full-size controls, keyboard activation, settings, invalid imports without changing state, importing a valid save from the title screen, new-game creation and Continue preserving progress. Import confirmation now obtains a portrait from the imported character when there is no active game, preventing a null-player error. Reviewed captures/report are under `review/main-menu/`; reproduce with `node --test tests/main-menu.test.cjs`.

The separate graphics-loading screen remains a future task, as requested. This increment changes the title screen and the related import-confirmation portrait only.

Validation: all 23 browser tests passed with no skips; the baseline checksum and 85 scripts passed `npm run check`. Repeating the build produced identical output.

## Mobile foliage revision — awaiting approval

The user requested more plants around the mobile menu to match the approved phone reference. `assets/mobile-foliage.png` is an original transparent painted border generated using `assets/approval-concept.png` as the visual reference; its checksum is recorded in the manifest. Mobile-only CSS frames the logo, garden, controls and lower corners with flowering vines and a second fine border. Soft masks keep the title/footer clear. The active primary button has small leaf ornaments. The decorative layer ignores pointer events and is hidden on desktop and landscape layouts.

The image-readiness hook awaits both menu assets. Both build paths read the menu revision from the manifest. The focused menu test additionally checks that decoration cannot intercept taps at the center or edges of enabled buttons across all six layouts. Revised actual-game captures and validation are retained under `review/main-menu-mobile/`. This revision is pending visual approval and has not been pushed.
