# Bedroom update checkpoint

The user approved the sage/cream/oak bedroom Concept 01 and requested its baseline integration before redrawing furniture. The room-shell implementation and its original artwork are in `graphics/bedroom/`; the generated standalone game is `public/index.html`. The immutable uploaded game remains under `baselines/`.

Completed scope: baseline sage wall and wood floor, paneled trim, trim around the existing window and door, and separate weather/time/curtain-aware floor light. Existing furniture renderers, variations, save identifiers, interaction geometry and gameplay rules are preserved. Other wall and floor finishes retain their previous artwork.

Validation: source-integrity check passed; the existing 14 browser tests passed; the new bedroom test passed, comparing save choices and interaction geometry with the archived game and testing finishes, blackout/rain/night light and phone viewport rendering. Repeating the bedroom build preserved its output. Screenshots can be reproduced by `node --test tests/bedroom.test.cjs` under `artifacts/bedroom/`.

The user requested that future work be completed and pushed in small approved increments to preserve progress between conversations. For each bedroom furniture item, inspect all existing variations, show artwork for explicit approval, then implement and test the approved change and push that completed increment before proceeding to the next item. No furniture redesign has yet been approved; the next item has not been selected. Do not interpret approval of the room shell as approval of furniture artwork.

Rebuild only the bedroom using `npm run build:bedroom`; this retains the existing verified character payload. Run `npm run check` and `npm test`. The full graphics builder includes the bedroom compiler too. Read `graphics/bedroom/README.md` for registration and asset provenance.
