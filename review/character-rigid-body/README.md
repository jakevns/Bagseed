# Original-pixel body review (approval pending)

This replaces the rejected `body-shape-review` preview. It is isolated from the
published game. No clothes are loaded, fitted, regenerated or migrated here.
No image-generation calls were made. Builds are excluded rather than stretching
the three base paintings.

## Reproduce

From the repository root with Node 22+:

```powershell
node review/character-rigid-body/build.cjs
node review/character-rigid-body/verify.cjs
node review/character-rigid-body/server.cjs
```

Open <http://127.0.0.1:5189/?body-review=original-pixels>. The old review server
entry point also delegates to this server, including old query-string links.
The retired `build-body-review.cjs` fails explicitly without writing anything.

For browser verification, install the repository's Playwright dependency and
provide Chrome (default Windows installation, or `CHROME_PATH`):

```powershell
node review/character-rigid-body/verify.cjs --browser
```

Build outputs go only to `review/character-rigid-body/generated/`, which is
ignored. Screenshots and the measured comparison report are reproducible outputs.

## Art and attachments

`native-body-map.json` records original PNG coordinates, view crops, manually
registered joint centers and the existing layer ownership cuts from the approved
`layered-sources/body-{anatomy}-{direction}.svg` documents. The builder verifies
that those SVGs embed the exact fingerprinted approved PNG bytes. The source
paintings, input SVGs, cut metadata, rig, builder, shared compositor and review
are included in this commit; no private generator is required.

Each view retains 15 named parts: neck, torso, pelvis, and left/right upper arm,
forearm, hand, thigh, calf and foot. The builder strips all synthetic underpaint,
gradients and synthetic concealed limbs. Expanded source cut bands overlap at
the shoulder, elbow, wrist, waist, hip, knee and ankle. They reveal only existing
PNG pixels; mask geometry is static in source coordinates and never follows a
skeleton silhouette.

The shared compositor's `rigid` attachment has one source pivot, target joint,
rotation and common scale (0.13). It rejects body width/height fitting and
destination silhouette clips. Each anatomy/view uses its own measured source
vectors. The walk solves joints from those fixed lengths. There are no per-part
scales, stretched endpoints or frame-dependent source masks. Standing sets all
rotations to zero and reconstructs the source through the same 15-part route.

The default comparison preserves original colors. Optional tint multiplies the
original luminance by the chosen material color through the explicit skin alpha;
it preserves source shading and alpha rather than drawing a gradient.

## Verification and its limits

The structural check covers all 108 poses (3 anatomies × 4 directions × 9 frames),
1,620 rigid matrices, 15 parts per pose, fixed measured bone lengths, source PNG
identity, no synthetic fills/clips, and forward airborne foot travel. Browser
checks compare each of the 12 Standing views to the corresponding PNG, with
zero lost opaque pixels, silhouette overlap above 98%, and mean opaque channel
error below 1% of 255. Small edge differences come from SVG decoding, overlapping
alpha edges and PNG resampling. Served file hashes are checked against disk.
These are technical checks, not visual approval of the walk.

The broader existing character regression selection also passed: 47 tests across
18 files, with no failures or skips. The exact file list is recorded in
`evidence/existing-character-regressions.json`. Published game input hashes are
recorded separately in `evidence/published-inputs.json` and remain unchanged.

**The walk is not approval-ready.** In profile, the original arm conceals torso
skin, and the near leg conceals far limb surfaces. An exact cut cannot recover
pixels that were never painted. The far profile limbs currently reuse the
matching visible limb pixels, explicitly recorded in the manifest and UI.
Moving the arm exposes missing torso skin and source boundary strokes. The
missing-surface list below must be resolved with deliberately authored approved
source artwork; adding skeleton outlines, gradient patches or stretching would
violate this review's rules. No such replacements have been added. Clothing
refitting and broader migration remain blocked on body approval.
