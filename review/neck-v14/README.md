# Custom-character neck attachment

Revision `customization-14`; the user accepted this checkpoint for now and requested publishing it on October 15, 2026.

The initial v14 reaction result was rejected: the head floated above the torso and the fingers touched the throat. Passing neck-ownership tests did not establish anatomical alignment. [Rejected render](rejected-reaction.png) records that failure.

The current renderer removes the neck painted on the head before composing facial details and hair. The jaw attaches to the garment's existing neck. An anatomical underlay fills the join behind the torso. Portraits use the same jaw attachment.

Reaction bodies require separate registration: their fingers were painted near the old neck stump. The current head lowers and turns toward the hand, with the nose registered to the source fingers. Side reaction bodies therefore use a front-facing head; ordinary standing and walking retain profile heads. Only the raised forearm is redrawn in front of the face. The old full-torso redraw exposed the neck stump over the jaw.

## Current rendered evidence

- [Four-direction tank-top reaction detail](reaction-detail.png), reproducing the garment in the rejected example.
- [All 15 reaction garments](reaction-garments.png).
- [All 15 head shapes with varied hair, skin and body shapes](reaction-shapes.png).
- [Child, adult and short body types](reaction-sizes.png).
- [Standing before/after](before-after.png).
- [Idle, walking, reaction and portraits with varied hair](hair-and-animation-after.png).
- [Creator](creator.png) and wardrobe mirrors: [short](mirror-short.png), [long](mirror-long.png), [bald](mirror-bald.png), [afro](mirror-afro.png).

These are actual renders from the rebuilt public/index.html, using isolated browser storage. Reproduce with `node tools/review-neck.cjs` and `node tools/review-neck-poses.cjs`. The v13 before-build is retained locally in ignored artifacts/neck-v14/before.html.

## Verification and limits

Eight targeted neck and hair-layer tests passed. These cover 5,400 standing attachments, 1,350 independently measured finger-to-nose contacts, 40 short/child movement and reaction cases, 75 neck portraits, and existing hair/ear layering cases. Rendered visual review remains necessary; these checks do not establish that every customization combination is artistically perfect.

The NPC comparison passed 1,872 comparisons and 260 pose-asset checks. All 71 NPC drawings/portraits and 52 authored reaction sets are preserved. Original image payloads and 85 other script blocks remain unchanged. The two garden scripts changed concurrently and match the current gameplay source; they were preserved in the build. Publication details are recorded in the merge checkpoint.
