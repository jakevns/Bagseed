# Failed painted-part drafts — do not integrate

The new budget was six built-in imagegen edit calls, two per anatomy. All six
were used. Five sheets were produced; the female correction was blocked by the
service. No output satisfies the user's visible-pixel preservation requirement.

The model returned 1448x1086 sheets from 1600x1200 targets, repositioned/repainted
visible fragments, and retained unwanted forms or hard edges. The male drafts
also changed the original anatomy. Candidate filenames are DISPLAY REFERENCES
ONLY, not accepted source assets. The female candidate is its first draft.

`layout.json` records the original native-pixel mapping. `*-protected-pixels.png`
contains original fragment pixels; edit-guide PNGs visualize editable context.
The built-in tool accepts references, not an enforced mask parameter. No claim
of a genuinely mask-enforced edit is made. No rescaling, warping, circles,
rotated-copy caps, texture fill or silhouettes were added to these outputs.

`prompts.json` saves the first-pass prompts; correction prompts are separate text
files. `attempts.json` records every result. `validation.json` records the failed
registration gate. Hand-area, waist, contour and walk checks are NOT passed or
claimed: native registration must be correct before those checks are meaningful.

The user requested source approval BEFORE integration. Accordingly no active
source parts, rig, hip pivots, renderer, animation, clothing or production files
were changed. The proposed hips pivot and +/-4 degree motion are deferred until
usable source parts are approved. No further model calls are authorized.

Run the independent comparison page with:

```powershell
node review/character-rigid-body/parts-review-server.cjs
```

Open <http://127.0.0.1:5190/>. It shows each anatomy's latest draft beside the
untouched original. This page displays failures, not a request to approve them.
