# Hair above clothing and concealed ears — v13

The previous figure renderer painted long hair behind the torso, then redrew only the part above the neck. This produced a straight shirt edge across loose hair. It also painted every selected ear above every wig, including afros and long rear caps.

The complete head now renders over the clothing in figures and portraits. Loose ends retain their transparent strand edges. Nose-covering sprites keep the raised hand in front of the face and hair below the neck above the sleeve. The 24 loose/dense styles conceal ears and their jewelry in all four directions. Short cuts and tied/up styles retain foreground ears. Ear choices remain saved and reappear when a suitable hairstyle is selected. Hats and headphones retain their intentional position above hair.

The v12 crown fits, all original PNGs, embedded art data, mouths, facial hair, head transforms, clothing geometry, NPC artwork and gameplay are preserved. The accepted five cuts retain their v11 head fingerprints. Figure antialiasing now uses one head pass rather than two.

## Review

- [Before and after](before-after.png): long, bob, bun, half-up, afro, large afro, box braids and long curls, front/side/back.
- [All 61 choices](all-styles-1-after.png): eight numbered `all-styles-*-after.png` sheets, four directions, large ears and hoops selected.
- Head shapes: [long](shapes-long-after.png), [half-up](shapes-halfup-after.png), [afro](shapes-afro-after.png); all 15 shapes, four directions, elf ears and moon earrings selected.
- [Walking, idle and nose-covering figures](animation-after.png), plus [portraits](portraits-after.png).
- Actual [creator](creator-long.png) and wardrobe mirrors: [long](mirror-long.png), [bob](mirror-bob.png), [bun](mirror-bun.png), [half-up](mirror-halfup.png), [afro](mirror-afro.png), [large afro](mirror-bigafro.png).

Generated with `node tools/review-hair-layers.cjs`, using isolated browser storage. Browser errors: none. The saved v12 comparison build is in ignored `artifacts/hair-layer-v13/before.html`.

## Verification

`tests/hair-layers.test.cjs` checks 12,960 covered-ear variants across all 15 head shapes and nine ear choices, 6,480 figure/pose cases across six body types and four directions, and 30 portrait cases. Opaque hair below the collar is compared with the independently projected head; walking checks change the underlying shirt color to detect garment bleed-through. Partially transparent strand edges are excluded from opaque-pixel comparisons.

The prior ear checks now require full ear surfaces only on exposed-ear cuts: 16,740 remaining-cut cases, plus the accepted five-cut checks. Existing head fit, crown/length, skull coverage, mouth/beard, footwear, creator/save and gameplay checks remain. See `validation.json` and `test-results.txt` for the final run.

The art payload and 87 non-character scripts match v12 exactly. Cast verification preserves all 71 NPC drawings/portraits and all 52 complete smell-pose sets. This is a local build; visual acceptance by the user is pending.
