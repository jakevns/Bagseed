# Distinct mouths and clean facial-hair edges

The user requested visibly different mouth choices, then asked for the same cropping cleanup on beards that had been done on forehead hair. V9 addresses both in the local `public/index.html`. Visual acceptance is pending.

## Mouths

The 15 existing options now have deliberately different widths, curves, lip fills, openings, teeth and tongue shapes. Three new choices are **Braces**, **Fangs** and **Cat smile**, for 18 total. Existing saved option IDs retain their meaning.

Expressions previously replaced an explicitly selected mouth, making different choices produce the same smile or frown. An explicit mouth now keeps its design while eyes and other expression details change. **Classic** continues to choose a mouth automatically for the expression. The tests compare the 17 explicit silhouettes after reduction to creator size, including profiles and happy/sad expressions.

- [Mouth menu](mouth-menu-after.png): all 18 front views; [previous menu](mouth-menu-before.png).
- [Mouth sprites](mouth-sprites-after.png): front and both profiles at preview scale.
- [Braces in the creator](creator-braces.png): the actual creator with Happy selected.

## Facial hair

The old extraction included dark ear folds, facial outlines and neck contours from the complete source head. Recoloring them silver exposed pale marks and dangling lines. Its rectangular eye clearance also cut across the cheek texture, and mouth cleanup painted skin over facial-hair strands.

The new extraction uses a soft color matte, coherent hair masses and connected strand support. Moustache pieces must connect to the upper lip, so separate cheek and ear contours are rejected. Chin-only styles have curved, feathered clearances. Narrow source rectangles no longer define the beard's chin edge. Larger-eye clearance follows a feathered curve. Face cleanup precedes the transparent beard layer, preserving the painted strands around the mouth. Light stubble and scruff use fine, deterministic hairs on the current jaw instead of recoloring the old head's shaded contours.

The anatomy and beard share the selected head-shape transform. Hair color is applied to the extracted hair material; underlying skin remains skin. The rear view stays free of facial hair. Original source artwork and authored NPC drawings remain intact.

- [Silver styles 1](beards-silver-1-after.png), [2](beards-silver-2-after.png): all 14 styles in three visible directions. The matching `*-before.png` boards expose the previous cropping and outline pickup.
- [Brown, white and violet](beard-colors-after.png): beard, short beard, goatee, chops and handlebar.
- [Head shapes 1](beard-shapes-1-after.png), [2](beard-shapes-2-after.png), [3](beard-shapes-3-after.png): all 15 head shapes with a silver full beard.
- [Beard mirror](mirror-beard.png), [chops mirror](mirror-mutton.png), [goatee mirror](mirror-goatee.png): actual wardrobe previews.

## Reproduce and verify

Run `node tools/review-mouths-beards.cjs`. It uses a disposable browser profile. The before build is retained in ignored `artifacts/custom-mouths-v9/before.html`; the mouth-only build before the beard edits is in `artifacts/custom-beards-v9/before.html`.

`tests/mouth-beard.test.cjs` checks mouth readability, expression selection, ear/neck protection and real creator/wardrobe/save/reload controls. Existing head checks cover facial-hair placement across all haircuts, protected eyes, blinks, rear views and color. `tests/face-details.test.cjs` now checks all 1,080 mouth/style/shape/direction combinations. Exact final results and the build checksum are recorded in `validation.json`.

The retained v8 face-detail work is documented in [customization v8](../customization-v8/README.md), and v7 records the hair fitting. Beds, seedling desks and gameplay remain in their separate modules. No GitHub push or deployment is performed by this local repair.

The final build passed all **44 browser tests**, with zero failures or skips. All 17 explicit mouth silhouettes remain distinct at creator size across front/profiles and neutral/happy/sad expressions (153 views). Mouth selection passed 270 expression cases and placement passed 1,080 shape/direction/style cases. Ear/neck protection passed 630 facial-hair combinations; the retained facial-hair suite passed 2,562 style/haircut/direction combinations plus 854 rear views. All 84 script blocks parse, and the original baseline checksum is intact. Preservation checks passed 1,872 cast comparisons and 260 direct smell-asset comparisons. All 83 non-character script blocks and 21 retained customization source images are unchanged. The listed review boards and actual creator/mirror captures were visually inspected.
