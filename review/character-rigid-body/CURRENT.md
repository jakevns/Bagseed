# Painted joints — body approval pending

Clothing, builds, migration and mesh skinning remain deferred. All three
anatomies and four directions use 15 painted parts, Standing and Walk 0–7.

```powershell
node review/character-rigid-body/build.cjs
node review/character-rigid-body/server.cjs
```

Review: <http://127.0.0.1:5189/?body-review=painted-joints>. Old query links also
resolve to current files. Source comparison, magenta, anchors and onion skin
remain available. The production game and old body-shape generator are untouched.

To reproduce source repairs and checks (Python, OpenCV and local Chrome):

```powershell
python -m pip install --target review/character-rigid-body/.python-deps -r review/character-rigid-body/requirements-repair.txt
node review/character-rigid-body/prepare.cjs --python python
node review/character-rigid-body/verify.cjs --browser
python review/character-rigid-body/audit-pixels.py
node review/character-rigid-body/capture.cjs
```

Completed PNGs, repair masks, expected alpha and repair metadata are versioned
under `graphics/character-system/layered-sources/completed-body-parts/`. Runtime
JSON, dependencies and captures are ignored; selected evidence is committed.
Original paintings and SVG cuts remain unchanged. Normal builds need no Python.

## What changed

TELEA is replaced by same-part patch-nearest-neighbour quilting: deterministic
FLANN search over retained skin, 5px patches, harmonic brightness continuation
and retained fine painted texture. Brightness corrections feather inward instead
of creating a hard repair boundary. Only explicit repair-mask pixels change.
Every source interior is opaque; the generator asserts original retained pixels
are unchanged. The arm-removal mask now includes newly added socket caps, fixing
finger pixels previously left inside the hip.

Thigh caps use rotations of the thigh's own painted top 20%, sampled every 15
degrees. Both thighs now draw under the pelvis, which owns buttock shading and
the hip socket. Calf draws over thigh, forearm over upper arm, hand over forearm.
Near arms draw over torso. Far limbs retain detail through RGB multiply .8.

An opt-in body finish finds the combined alpha's background-connected outer
boundary and restores measured source ink 2 output pixels inward at density 3.
Enclosed joint boundaries receive no extra line. Visible far-limb ink has 60%
strength. Fully surrounded assembly pixels become opaque; exterior AA remains.
The production registry does not enable this finish.

Profile thighs are capped at 22 degrees from vertical, including their native
painted angle. Near thigh offsets are [20,15,0,-15,-20,-15,0,15]; knees are
[3,15,38,20,5,35,5,10]. Far legs are offset four frames. Arms swing up to 18
degrees with a 7-degree forward elbow bend. Feet follow the shin, and real foot
contours set ground contact. Torso counter-rotation reaches 2 degrees. The body
bounces 2 logical pixels down at contacts and 2 up at passing; source socket
overlap accommodates this movement over grounded leg roots.

Front/back legs do not rotate sideways. Peak calf projection is .85, with a 2px
proximal lift, giving 5–7px passing-foot lift. Planted feet stay on the baseline.
Hips tilt up to 2 degrees and sway 1px. Forward arms rise up to 2.5px and forearms
project to .9; backward arms drop 1px. The compositor allows projection only on
front/back calves and forearms. All other parts retain their source proportions
with one whole-character scale of .13. Builds are excluded.

## Checks and limits

`verify.cjs --browser` checks 108 poses and 1,620 transforms: source hashes, all
parts, angle bounds, ownership/order, far shading, projection, passing-foot lift,
foot/shin alignment and ankle x drift <=2px. Expected alpha and independent joint
disks detect magenta leaks. An injected interior hole must fail and expose pink.

`audit-pixels.py` independently checks source opacity and filled-region mean
brightness against each part's surrounding 8-native-pixel ring (<=6%). All 108
frames reference these audited parts. Rigid motion preserves brightness; far
RGB multiply preserves the ratio apart from rounding. This is a source-space
measurement, not a visual judgment of patches after occlusion or resampling.

Every rendered exterior contour must have >=95% dark ink coverage. The RGB
ceiling derives from 60% source ink over the brightest possible source pixel,
allowing the requested softer far outline. White replacement ink must fail.
Numerical passes do not establish artistic approval, especially at repaired hips.

Three model calls were authorized and exhausted. The service blocked female and
androgynous outputs; the male output was rejected for unwanted forms and changed
registration. No model repair was imported, and no retries remain authorized.
Prompts, references, masks, outcomes and the rejected candidate are preserved in
`graphics/character-system/sources/concealed-skin-v3/`.

The body remains unapproved. Clothing and publication wait for the user's review.
