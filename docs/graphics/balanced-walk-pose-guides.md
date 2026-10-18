# Balanced front and rear reference cycles

The user authorized correcting the pose guides on 2026-10-18, after the original
front and rear sequences were found to repeat one image-side supporting foot
in three of four frames. Individual outfit-frame generation is also authorized.

The corrected guides are technical diagrams, not game artwork. They are newly
constructed from explicit joint coordinates; no old garment pixels are repaired,
mirrored, pasted or repainted. The approved idle remains the style, proportion,
palette and garment-detail reference. Approved eight-frame side walks are intact.

Files: `graphics/production/walk/pose-guides-v6/{down,up}-0..3.png`, 288 × 432
pixels (density 3). `manifest.json` records the coordinates, view, anatomical
supporting leg, image-side support, phase and PNG hash. No runtime rig, manifest
or atlas is replaced by this guide pack.

| Frame | Phase | Front support side | Back support side |
|---|---|---|---|
| 0 | Right-leg contact | Image left | Image right |
| 1 | Right support, left passing | Image left | Image right |
| 2 | Left-leg contact | Image right | Image left |
| 3 | Left support, right passing | Image right | Image left |

Opposite-side phases have mirrored joint coordinates. Passing raises the free
foot and knee distinctly and reduces the arm swing. The neck, shoulders and
ground baseline remain stable. This prevents a partial cycle from being accepted
merely because its garment colors pass.

Open [the animated guide preview](../../review/custom-walk-rerender-v6/corrected-guides/index.html)
to play, pause, step or select a phase. The angular neutral diagram shapes are
pose instructions only; generated garment art must retain the approved idle's
soft painted style.

```text
node tools/build-walk-pose-guides.cjs
node --test tests/walk-pose-guides.test.cjs
python tools/audit-walk-rerender-v6.py --attempt individual-v8 --guides pose-guides-v6
```

Generation metadata can name `poseReference` explicitly. Registration records
its SHA256 and retains the raw source PNG hash; only uniform scale and
translation are used. A balanced guide sequence and numeric passes still do not
approve generated artwork or authorize its installation without visual review.
