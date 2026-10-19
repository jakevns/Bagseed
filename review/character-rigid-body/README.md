# Completed-source body review (approval pending)

This isolates body repair from the published game. Clothing, builds, catalog
migration and mesh skinning remain deferred. No image-generation calls were used.
The rejected `body-shape-review` generator remains disabled.

## Run the review

With Node 22+ and the repository dependencies installed:

```powershell
node review/character-rigid-body/build.cjs
node review/character-rigid-body/verify.cjs
node review/character-rigid-body/server.cjs
```

Open <http://127.0.0.1:5189/?body-review=completed-parts>. Old query-string review
links resolve to the same current page. The magenta toggle and joint dots are
available on the page; Standing and all eight walking frames use the same parts.

## Reproduce the source preparation

The original PNGs and twelve input SVGs are read-only. Source output lives in
`graphics/character-system/layered-sources/completed-body-parts/`: 180 completed
PNGs, 180 repair masks, 180 expected-alpha masks and `repairs.json`. These are
versioned source assets, not 5,184 per-frame replacement outlines. A normal build
requires no Python or private files; it reads these completed parts.

To reproduce the art repairs with Python and Chrome:

```powershell
python -m pip install --target review/character-rigid-body/.python-deps -r review/character-rigid-body/requirements-repair.txt
node review/character-rigid-body/prepare.cjs --python python
node review/character-rigid-body/verify.cjs --browser
node review/character-rigid-body/capture.cjs
```

Set `CHROME_PATH` if Chrome is outside its default Windows installation. The
preparation runner executes `build.cjs --raw`, `export-cuts.cjs`,
`repair-parts.py`, and the final build in order. Raw extraction does not replace
the active review. Runtime JSON and raw extraction files stay in ignored
`generated/`; dependency packages and logs are also ignored.

## Completed parts and joint ownership

Each anatomy and view has neck, torso, pelvis, and left/right upper arm, forearm,
hand, thigh, calf and foot. Native pixel cuts retain approved skin and shading.
Pixels already painted in the original supply overlap; TELEA (`cv2.INPAINT_TELEA`,
radius 5) supplies hidden torso/pelvis/thigh skin and removes crossing cut ink.
Only explicit repair-mask regions change color. The repair script asserts that
painted pixels outside these masks remain unchanged.

Caps are rounded source masks centered on measured joints, with radii measured
from painted cross-sections. They extend beyond each pivot by the measured
half-width. A 3px band removes cut-crossing ink while exterior contour ink is
retained. Missing skin is repaired in source space, not with runtime gradient
patches or pose-generated destination outlines. The repair report records the
registered source joints, cap measurements and original painting hashes.

Forearm draws over upper arm; hand over forearm; calf over thigh; foot over calf.
Far limbs draw behind the body; near upper arm draws in front. Far profile limbs
use independently repaired source files seeded from the visible limb painting,
with inner edge ink reduced. After skin tinting, RGB multipliers .75/.77/.80 make
these limbs 20-25% darker and slightly cooler. Their source origin is explicit;
they are not claimed to be newly painted independent views.

## Pose contract

The source scale is .13 for the entire character. Side views use translations
and rotations with measured bone vectors. The foot follows the shin angle. The
actual repaired foot contour sets the ground contact by a single root translation.
Standing has zero rotation. The near side uses this table; the far side is four
frames offset:

| Frame | Pose | Thigh forward | Knee bend | Opposite arm |
| --- | --- | ---: | ---: | ---: |
| 0 | Contact | 25 | 3 | 20 |
| 1 | Down | 15 | 15 | 10 |
| 2 | Passing | 0 | 38 | 0 |
| 3 | Up | -15 | 20 | -10 |
| 4 | Push-off | -25 | 5 | -20 |
| 5 | Recovery | -15 | 35 | -10 |
| 6 | Return | 0 | 5 | 0 |
| 7 | Reach | 15 | 10 | 10 |

Front/back legs and arms never rotate in the image plane. The swing calf's only
scale exception is vertical projection .875; the planted leg stays full length.
The swing foot rises 3-6 logical pixels. The pelvis/torso move down 1.5px at
contact and up 1px at passing, with 1px sway toward the planted leg. Socket overlap
accommodates this small body movement while planted feet stay grounded. Arms
shift vertically. Ankle x positions remain within 1px of Standing (limit: 2px).
The compositor rejects this projection on any part other than a front/back calf.

## Verification and evidence

`verify.cjs --browser` covers all 108 poses and 1,620 part transforms. It checks
source fingerprints, all fifteen parts, exact side angles and four-frame offset,
foot/shin rotation, child-over-parent ordering, far shading, front/back zero
rotation, calf projection, foot lift and ankle drift.

The browser renders all poses on magenta. Independent completed-part masks define
the expected silhouette; a full 5x5 erosion excludes only the antialiased exterior.
The source and reference masks use the same canvas sampling path. Any interior
alpha below 250 fails. Independent disks also check the interiors of all twelve
limb joints. A deliberately erased interior pixel must expose magenta and fail
the same opacity predicate. Neither expected masks nor joint disks clip or paint
the character. They are diagnostic references only.

Current reports and twelve magenta strips are in `evidence/`. The old
`standing-original-comparisons.png` is the 1841f67 baseline, before source repair;
it is not evidence of the current completed-source pass. Visual body approval
still belongs to the user. Passing technical checks does not authorize clothing
refitting, mesh work, integration or publication.