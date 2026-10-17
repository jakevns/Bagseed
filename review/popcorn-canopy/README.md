# Popcorn buds and canopy cleanup — approved 2026-10-17

The shared illustrated attachment model now places four stable flower sites along each primary branch, in addition to its terminal flower and the main apex. Flowers increase in size along the branch; the apex remains the largest. All five component kits use the same model: Porchlight, Velvet Underbrush, Pixel Punch, Cotton Candy CRT, and Moonberry. Existing approved organ atlases and inherited part identities are unchanged. These screenshots supersede the earlier tip-only flowering studies for this proposed revision.

`all-five-strains.png` shows unshaped mature plants. `canopy-before-and-after.png` shows the same 50-inch Porchlight with and without early cleanup. These are actual shared-rig renders, not separately painted mockups. The illustrated rig remains a component prototype; this change does not enable an incomplete native replacement.

The native game's existing renderer and care actions also use the shared canopy policy. Prune lower growth and Shape canopy clear lower growth and proximal popcorn sites. Cleanup is persisted independently of genetics. Early cleanup earns full redistribution credit; mid-flower cleanup earns 55%, and later cleanup is unavailable. Repeating either action never stacks credit. Existing stress, energy costs, stage limits and the three-day shaping cooldown remain. Native cache keys and Sprout snapshots include canopy state; photos copy it independently.

Game balance: unmanaged top-flower scale .88, early-cleaned 1.18; harvest factor .90 versus 1.08, before existing health/training/drying factors and whole-jar rounding. These are explicit game balance values, not physical yield predictions. The factor is applied once in the jar calculation. Cleanup is frozen at harvest. Existing dried/finished harvests without a canopy record retain their old quantities. Legacy pruned plants receive bounded partial credit because their care date is unknown.

Reproduce samples: `node tools/preview-popcorn-canopy.cjs`.

Validation: 34 pure/unit tests, native browser care → render/cache → cooldown → repeated action → independent snapshot → save/reload → frozen harvest → actual jar-count comparison, plus `npm run check`. Shared wind posing keeps flowers attached to their branch curve and roots fixed; no new random phenotype rolls or inherited care state.

User approved the five-strain artwork and canopy cleanup samples on 2026-10-17.
