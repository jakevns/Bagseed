# Torso/hips v5 — layered Standing checks failed

All six authorized calls were used, two per anatomy. Only torso and hips were
requested. Original side paintings and exact crops of the APPROVED v4 hands and
thighs were included as references. Those approved assets were not regenerated,
retouched or overwritten; their file hashes are saved and checked.

The Standing boards show four columns: original visible pixels with the original
arm removed (hidden skin is transparent), new torso/hips plus approved thigh,
the same assembly with the original painted arm restored, and the untouched
original. Original lower-leg/foot pixels provide full Standing context. Only
uniform scale and translation are used to register draft parts on these review
canvases; exact transforms are in standing-review.json. Native model sheets are
retained unchanged as attempt files. Review registrations are provisional and
are not an animation contract or a claim of an exact source-pixel match.

These boards FAILED visual review: the torso still suggests an attached shoulder
muscle, waist attachments make a visible ledge, and hips/thigh silhouettes do
not line up with the original. Adding the original arm does not restore the
original Standing silhouette. They are failed comparisons, not approved assets.
The silhouette-difference number also includes approved-thigh registration and
retained lower-leg joins; it is not solely a score of the new torso/hips art.

Edge cleanup only removes detached background fragments and bright red/yellow
specks in NEW output. It adds no skin or contour strokes and changes none of the
approved hand/thigh sources. The native model attempts remain available.

No active source parts, hips pivots, compositor, animation or clothing changed.
Walk-frame gates are deferred until usable torso/hips parts pass Standing review.
No approval or passing waist/patch/outline gates are claimed.

Reproduce:

```powershell
python review/character-rigid-body/prepare-torso-hips.py
python review/character-rigid-body/clean-torso-hips-edges.py
python review/character-rigid-body/assemble-torso-hips.py
node review/character-rigid-body/torso-hips-server.cjs
node review/character-rigid-body/verify-torso-hips-page.cjs
```

Page: <http://127.0.0.1:5191/>. Exact first/correction prompts and attempt outcomes
are saved alongside the boards. Further image calls need a new user budget.
