# Character audit repair

Branch: `ccr-12191481-bpni4g`. Original findings: [character-audit.md](character-audit.md).

The twelve explicitly named Tier C appearances were redrawn, Marcus first, with front/profile/back sprites, three portraits, and matching nose poses. The audit heading says fifteen, but its table names twelve; the additional pose-only cases were handled with the missing-reaction work. After retiring Theo's duplicate patient appearance, eleven of those Tier C identities remain active. All six Tier B appearances were softened. Generated source sheets, exact prompts, source checksums and crop/registration reports are retained under `graphics/production/style-audit-v1/`.

The approved references remain Remy, Priya, Doug and Poppy: rounded large heads, highlighted dark eyes, short rounded limbs, warm outlines, broad cel-shaded shapes, and a soft belly for heavy builds. The regenerated [style board](character-audit/style-tiers.png) compares the active redraws directly with those references at native sprite size.

## Rendering and identity

- Canonical identity ignores props. Omitted tiny-person props preserve the look; explicit null still works. All 183 definition/prop combinations resolve to authored art.
- An authored NPC cannot fall through to the procedural renderer when a reaction is missing. Its idle art plus a small sniff emote is the guard path.
- All twenty formerly missing reactions have authored source art in batches 12–15. Batch 16 replaces Mara, Eli and Nico; batch 17 corrects the short hairstyles for Kai, the night desk and Eli. Full redraw sheets own the final reactions for the redrawn characters.
- Nose registration uses the same height rules as cast extraction: child 82, short 93, tall 104, otherwise 100 pixels in a 108-pixel canvas. Old per-character height overrides no longer apply. Doug's idle and eight-frame walks also use the adult target.
- Marisol, Theo and Rosalind share their NPC look objects with their patient records. Their three unused registered appearances were removed; extraction cannot restore them. Original mixed source atlases and Git history retain provenance.
- Unknown NPC IDs warn once per ID and use a neutral generic look.
- Customized player reactions use the fitted idle figure plus a small sniff emote. The old modular hand-at-collar pose shortened the figure; it is no longer used. Canonical authored reaction sheets remain in use. The [player reaction comparison](character-audit/player-reactions.png) shows idle and sniff views at the same scale.
- The default adult player measures 33.3 world units in front view. The complete idle/walking figure and its feature/hand anchors scale together. Custom hair uses three broad cel colors plus warm outline ink, preserving the existing silhouette and ear fitting. Portraits use illustrated bust framing with a head target of about 60% of the frame.

## Verification

`node tools/audit-characters.cjs` regenerates the size table, full-roster board and style board. It now measures every direction and every available walking frame, checks authored ownership/reaction coverage, and fails on any nose/idle height difference over one world unit or an idle/walk range over two units. `npm test` runs the same audit in read-only `--check` mode before the browser regression suite.

The final active roster contains 69 appearances, including the original player sample: 276 directional comparisons. The audit reports zero flagged rows. Focused checks also cover shared patient identities, prop stripping, player height, bounded hair palettes, hair/ear fitting, neck ownership, unchanged custom reaction proportions and all 300 wardrobe walking combinations with flashlight attachment.

`npm run build:graphics` re-extracts retained source art, reapplies the style redraws, registers all reaction batches, and verifies lossless decoded RGBA equality during encoding. JSON reads and writes explicitly use UTF-8 so accented names survive Windows builds. Generated asset paths use forward slashes so registrations built on Windows remain usable on other platforms. Whole-figure registration is uniform; no independent face or limb warping is used for these redraws. Left profiles mirror right profiles, including asymmetric props and the raised hand.

Final validation: `npm run build:graphics`, `node tools/check.mjs` and `npm test` passed. The full suite passed all 99 tests with zero failures; the included character audit passed all 276 directional comparisons for 69 appearances.

## Integration with current main

Merged main through `00b2548` after the initial character release. This retains the phone decorating tools and cozy score, equipment/climate changes, Water & Pots and garden layering, plant phenotype/growth work, and the complete eight-pose wardrobe with rear-arm and opaque waist fixes. Source conflicts were combined; the game HTML, character payload and build report were regenerated together. Patient identity, prop-independent authored lookup, fitted player scale and cel hair remain in place. The incoming arm/waist checks project their references to the fitted player scale; the bedroom check uses the approved Water & Pots can hitbox.

Merge validation: graphics build and source/payload checks passed (122 script blocks); the character audit passed 69 appearances and 276 directional comparisons with zero flagged rows. The full `npm test` run executed 151 tests: 149 passed, with an outdated one-pixel climate-station can hitbox assertion and a Water & Pots page-load timeout. The assertion was corrected to the approved artwork geometry; both tests then passed together on targeted rerun. All 151 checks have passing coverage. The focused wardrobe checks also passed 300 outfits, 1,040 arm composites and 1,800 opaque waist joins.

A final fetch found subsequent main updates through `9e8f1e8` (additional plant kits, persistent canopy cleanup and night-temperature color expression). These were also merged and the combined graphics package rebuilt. All 71 affected/new checks passed on the final build, including the new component/phenotype tests, night-cooling and canopy browser/save tests, character smoke/ownership, arm/waist checks, climate access and Water & Pots. The final source check parsed 124 script blocks and the character audit again reported 276 comparisons with no flags. One incoming canopy browser test now honors the existing Windows browser-path environment setting.
