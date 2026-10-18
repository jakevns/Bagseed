# Custom head, neck and wardrobe alignment — candidate review

This replaces the cropped neck audit. This is a candidate for the user's visual review; test success is not visual approval.

Open [the review index](../../review/custom-alignment/index.html), which links to the complete wardrobe matrix, hair on complete bodies, and before/after comparisons. Each review cell contains the entire 288×432 native figure canvas and a 96×144 reference-size version. Nothing is hidden by cropping the head or torso. Click images for their native resolution.

## Renderer changes

- Idle and walking use the same face-fitted jaw placement function. The jaw join is five reference pixels above each garment's measured collar root. Neck skin fills the garment's tapered opening; the garment's fabric mask preserves its collar.
- Walking no longer forces front/rear roots to `top+5`. It measures the actual collar and the alpha contour of the cut neck cap. Warm-colored pixels alone were insufficient: black/cream caps could leave only a few skin pixels on one side and falsely move the head there.
- A complete walking figure is registered by a feet-anchored uniform least-squares fit to its measured shoulders and collar. Fitting only a shoulder row allowed the back hoodie's collar to drop, which the unchanged roster height limit caught. A separate width fit matches the assembled upper body's shoulder span to idle, with the same build/presentation multipliers. Shoulder measurement includes arms, not just a torso slice. Measuring the tank's narrow torso slice produced a severe left/4 stretch; the walking regression caught that error during this work.
- Profile head position follows the painted neck centre and the rig's neck offset. The supplied profile rigs themselves have x=48 in every frame. The attachment is behind the ear hinge and translates the whole head/hair together.
- Suit jackets consistently use the selected bottoms, in idle and walking. Overalls and pajamas consistently use their own lower garment. Unmapped cream pixels on separate trousers now receive the trouser material; lab coats keep white material.
- Overalls `up/1` contains an incorrect bib in its original source painting. A local donor-torso experiment was rejected and removed before publication, restoring both the committed atlas and its matching manifest. A genuinely redrawn frame remains pending. The strict no-donor regression passes on the published manifests; that does not certify the original painting's design.
- Hair retains warm silhouette ink, lighter interior strand shading, and a small cel palette. White hair has lighter shadow masses. Mohawk shaved sides are clipped to the bald scalp. The shaved rear of a high-top fade is evaluated as translucent stubble, rather than requiring long strand strokes there.

## Evidence and checks

- `after/`: 270 sheets = 15 tops × six builds × three presentations. All four views include idle and every walk frame. Presentation variants also show three skin tones and three head shapes. The front/rear walk retains four frames; profiles retain the approved eight frames.
- `hair-on-body/`: all 61 choices, including bald, on hoodie, tee and suit. Four directions, idle and walk 1, complete figures; silver and purple material variants.
- `hair-overview/`: eight full-figure contact sheets covering every hairstyle, reviewed visually in silver and purple in front, side and rear views. Detailed left views and other poses remain in the full hair gallery.
- `before/`: the rejected build captured before this repair, average/neutral for all 15 tops.
- `comparisons/`: complete before/after cells for down idle, down walk 0/1, right walk 3, left walk 7 and up walk 1. These are the named problem phases, not selected flattering crops.
- `measured-checks.json`: 7,560 cases across top/build/presentation/direction/phase, checking jaw-to-collar distance, head scale, measured shoulder fit, garment identity, exposed neck pixels, profile attachment/motion, canvas clipping and foot grounding. Three skin tones/head shapes are included.
- `hair-material-checks.json`: all 60 non-bald styles in four views and two colors, with alpha stability, palette, outline and interior-contrast checks. Hashes are recorded as evidence, not treated as proof that the art is correct.
- `garment-color-checks.json`: actual suit cloth values and white/ivory lab-coat material in all 24 walking phases, compared with idle. Cream placeholders in trouser panels receive a modest fabric highlight rather than bleaching dark pants.

Existing regressions still check source neck removal, collar ownership, all 300 walking outfit combinations, hands/flashlight attachment, connected figures, hair-over-clothes ordering and customization. Projection tests were updated to use the actual body width and registered head origin; the former hard-coded x/neck anchor was itself the rendering bug.

The test launcher retains the complete roster gate and test inventory, defaults to one worker, and supports `npm test -- --test-concurrency=4`. It passes runner options before file paths so Node actually honors them. The plant browser test now respects the configured browser path on Windows; no plant behavior was changed.

## Reproduction

```text
npm run build:graphics
node tools/review-custom-neck.cjs
node tools/review-custom-hair.cjs
python tools/compare-custom-alignment.py
npm test
```

Use `node tools/review-custom-full-body.cjs --before` only before changing the renderer; it preserves the rejected build for comparison. Do not overwrite that evidence after fixing a defect.

The rejected donor repair is not part of the published source or build. Fresh walk candidates are staged separately and are not runtime assets. The required mannequin guides repeat a same-side leading foot in three of four frames in both front and rear cycles; correcting that guide sequence remains unresolved. See `review/custom-walk-rerender-v6/original-guides-and-cardigan.png` for the original guides beside the individual cardigan candidates. Existing review sheets captured before the donor experiment was withdrawn are historical evidence; regenerate the overalls sheets for the current build.

## Source-art follow-ups still open

The full-figure visual pass found these design differences beyond the alignment repair. They are **not corrected or approved**, and the technical alignment tests do not certify their designs. They need a source-art/material-role pass so standing and moving use the same garment design, rather than registration offsets that disguise a different painting.

| Top | Affected walking frames | Remaining difference |
|---|---|---|
| `garden` | `down/0–3`, `up/0–3`, `right/0–7`, `left/0–7` | Standing has a tan apron over a dark shirt; moving sources use a blue apron/bib over a cream shirt. Separate apron/shirt material roles and source design need reconciling. |
| `flannel` | `down/0–3`, `up/0–3`, `right/0–7`, `left/0–7` | Standing has baked plaid; the moving source paintings read as a much plainer button shirt. Its authored plaid needs matching, independent of optional user patterns. |
| `pjs` | `down/0–3`, `up/0–3`, `right/0–7`, `left/0–7` | Walking sources add contrasting piping/collar trim that the standing design does not share. |

See [the two outfit overview pages](../../review/custom-alignment/wardrobe-overview/index.html). These differences are retained in the exported evidence so an independent reviewer can assess them.
