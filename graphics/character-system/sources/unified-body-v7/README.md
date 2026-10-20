# Unified body v7 — isolated, unapproved source review

This keeps the v6 repaired-image pipeline. No image-service calls were made for
v7. The game, clothing, production contract and active walk renderer are unchanged.
The independent audit records failures; a generated board is not approval.

## Reproduce from the repository root

Use Python with Pillow, NumPy and OpenCV. The scripts also look for the existing
review-local OpenCV environment in `review/character-rigid-body/.python-deps`.

```text
python review/character-rigid-body/measure-mirrored-body.py
python review/character-rigid-body/prepare-unified-v7.py
python review/character-rigid-body/build-unified-v7.py
python review/character-rigid-body/audit-unified-v7.py
node review/character-rigid-body/unified-v7-server.cjs
node review/character-rigid-body/verify-unified-v7.cjs
```

The server binds to `http://127.0.0.1:5193/`. Browser verification uses installed
Chrome through Playwright and checks that all six served boards and the audit
match their saved files byte for byte.

## Sources and registration

Native source crops, repair masks and four returned repairs come from v6. Male-
left and female-left reflect the right-side repaired body, then apply one scalar
scale and translation. Before use, the mirrored ORIGINAL paintings were compared
against the left originals: female 14.894% alpha XOR/union difference, male 5.379%.
See `mirror-measurements.json` for per-joint errors and exact transforms. There
is no geometric warping to hide those source asymmetries.

The repair colour is matched to the original 12px skin ring, including channel
spread, with a 6px interior feather. Only repair-mask pixels receive that colour
correction. The latest requested outer-edge cleanup is an explicit exception to
v6 outside-mask pixel equality: it trims painted fringes and normalizes the
outer ink. It does not rewrite the v6 inputs.

Torso, hips, thigh and calf/foot are curved overlapping cuts from one cleaned
body image. Near-arm paint comes from the matching untouched original. Its
inherited generic cut polygon is a search prior; forearm boundaries follow the
painting's dark lines. Wrist positions are measured at the narrow painted
forearm section, replacing the inherited generic wrist coordinates in this
review's `contract.json` only. `rig-review.json` records both positions.

The upper arm retains the round painted shoulder. The hip pivot is searched
inside the hips part for minimal fold notching under the two stress rotations.
The body's only pose transforms are translation and rotation. Approved hand
registration additionally uses its permitted uniform scale.

## Approved hands and revised acceptance rules

The six approved v4 hand SOURCE files in `torso-hips-v5` are unchanged and their
SHA-256 hashes are checked. Registration uses the existing painted wrist stub,
matches knuckle width, and aligns the hand axis to the source forearm. A source
wrist-cut ink remnant is removed at the overlap; the approved hand's shape is
retained. Forearm and hand colour are matched for the join.

Per the user's revised tests, original-pose hand edge distance is informational
only. Gates are knuckle width within 5%, wrist centre within 2px, no gap or step
at the join, forearm-aligned rotation, and the full Standing hand in front of the
thigh. The audit measures adjacent outline jumps across the wrist overlap and
flags jumps greater than 2px for inspection.

## Review and checks

Each anatomy/side has a five-panel board: armless body; Standing beside untouched
original; thigh +25/-25; near arm +20/-20; isolated Walk 0/4. Every image uses the
same display scale and the same 860 × 1010 padded review canvas. The separate
`standing-native.png` files preserve native crop dimensions for source comparison.

`audit.json` checks PNGs independently of rendering: halo pixels, normal-sampled
outer ink thickness, repair colour, internal torso arm ink, shoulder straight
seams, hip notch depth, transparent joint interiors, hand registration and source
hashes. Near-arm order is checked against the last opaque pixel contributor and
an intentionally reversed-order negative control. The checks do not replace
visual approval, nor prove an integrated eight-frame gait.

Thickness normals come from a smoothed signed-distance gradient. At acute
raster notches the nearest valid inward ray is selected using alpha alone,
before measuring ink. This avoids sampling empty space across the notch; the
median ±1px gate remains strict. Narrow ink-filled extremities may use a half-
pixel thinner band within that tolerance, retaining their painted skin and alpha.
Colour mean and spread are fitted again after edge cleanup using skin-only
samples; both final differences are reported and gated at 3%.

`contract.json` and all builders are review artifacts. No walk integration,
clothing refit, migration, deployment or push is authorized by these results.
