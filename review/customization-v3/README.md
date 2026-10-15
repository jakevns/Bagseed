# Customization artwork replacement and anatomy rebuild

Superseded after the user reported remaining cropping, rear hair color, facial-hair alignment, and hat defects. The current repair and verification are documented in [customization-v4](../customization-v4/README.md). The historical functional checks below did not establish visual acceptance.

This revision supersedes the rejected `review/customization-fix/` preview. That earlier change widened some legs but retained mismatched heads, long torsos, and stretched hair. Passing its functional checks did not establish an acceptable visual result.

All 60 hairstyle options now use replacement chibi head artwork in four directions. Eight hat styles use complete isolated hat artwork instead of attempting to remove faces from old hat studies. The built-in image-generation tool produced the new source atlases using the established Bagseed cast as the style reference. Original sources are retained under `graphics/production/customization-v3/sources/`; the exact [head prompt set](../../graphics/production/customization-v3/sources/prompts.json) and [hat prompt](../../graphics/production/customization-v3/sources/hats-prompt.txt) are saved there. No CLI/API fallback was used.

The body compositor now shares a neck, waist and ankle layout across clothing. Ordinary tops end around the waist rather than continuing into the trouser layer, and independent trousers occupy the full leg region. Trouser shading uses the actual source material range, preserving the selected dark colors. The stretched hair scanlines have been removed: long hair and braids use complete drawn artwork with front/back layering around the shoulders. Head material masks include shaded skin and eye edges, so changing hair color cannot repaint those pixels as hair. Facial details and facial hair use the new face landmarks. Hat crowns and brims retain their aspect ratio, with the complete head/hat group fitted to the sprite canvas.

`before-after.png` compares the rejected preview directly with this revision's actual game rendering. `characters.png` shows four directions, moving frames at the actual world size, portraits, and a finished NPC reference. `hairstyles.png` covers all 60 hairstyles. `options.png` covers representative face shapes, facial hair, hats, glasses and accessories. Generate these from the running renderer with `node tools/review-customization.cjs`; they are not image-generation concept mockups.

Rebuild the replacement components with:

```text
python graphics/production/customization-v3/register-heads.py
python graphics/production/customization-v3/register-hats.py
python graphics/production/sources/prepare-customization.py
node graphics/production/sources/build.cjs
```

`npm run build:graphics` includes these preparation steps. The registration manifests retain source hashes, cell bounds, scaling, placement and eye landmarks. Disconnected neighboring atlas fragments are excluded. Previous source artwork and review checkpoints remain available for comparison.

Validation includes real creator controls, wardrobe changes and save/reload; all 60 hairstyle options, 16 skin tones, 40 hair colors, 240 clothing designs and existing appearance choices; 1,200 clothing/footwear combinations; waist/leg proportions; and a skin-mask check for hair-color leakage on all 60 faces. Pose comparisons retain strict checks for 71 NPC standing drawings/regular portraits and all 52 integrated smell-reaction sets. `checkpoint.json` records final results and the game checksum.

The playable local result is `public/index.html`. Existing appearance/save option IDs are unchanged. Pose progress remains 52 complete and 20 remaining. Generic movement still uses continuous figure motion rather than new drawn walk cycles. Very tall hats share the fixed sprite canvas with the head and are fitted as a group. No live user saves were touched and no push or deployment was performed.
