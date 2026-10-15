# Main menu update checkpoint

The user approved the nature-and-community menu board with “Excellent!!! Approved :)”. Implementation uses the warm neighborhood garden, four adult cast members, two cannabis plants and a ginger cat. Desktop uses the illustrated cream panel beside the garden; portrait phones place a registered scene crop between the live logo and controls. Controls retain Continue, New game, Settings and Import save. Existing saves, backup notices and import validation remain authoritative.

Source art, approval board, source hashes, crop registration, responsive CSS and menu image-readiness code are retained under `graphics/main-menu/`. The shared compiler embeds the art once before the larger game-art scripts. Both build paths include it; rebuild with `npm run build:bedroom`. Web previews must always use `public/index.html`.

The focused browser check passed all six viewport sizes (1440×960, 1280×800, 390×844, 375×667, 844×390, 320×568), keyboard activation, settings, invalid import safety, valid import confirmation, new game and Continue with preserved progress. Actual captures/report are under `review/main-menu/`. A pre-existing title-screen import error was fixed by supplying the imported character's portrait to the confirmation dialog when no game is active. The gameplay/character, bedroom, desk and four bed renderer payloads are byte-for-byte unchanged.

The general graphics-loading screen is explicitly deferred until after the menu. The menu has been approved for implementation and push; check remote main before pushing and preserve any other worker's changes.

Final validation: all 23 browser tests passed with no skips. `npm run check` verified the immutable baseline checksum and parsed all 85 scripts. Repeating the build produced identical output. The final pre-commit pull reported main already up to date at `bbd94e2`.
