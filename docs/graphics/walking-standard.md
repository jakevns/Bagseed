# Walking artwork standard

Jake approved the `review/custom-walk-v4` sample as the walking standard on October 16, 2026.

Every new or revised walk has eight distinct chronological drawings in each direction: first-foot contact, loading, passing, push-off, opposite-foot contact, loading, passing, push-off. Both feet must complete their stride. The second half must not duplicate the first half or turn to the opposite direction. Near/far limb identity stays consistent through crossings; arms oppose legs.

Keep the established illustrated Bagseed style, delicate linework, original character identity and proportions. Moving artwork must match standing detail. Register original high-resolution art directly to the game-density canvas with one uniform resample. Never enlarge a low-resolution game sprite as an artwork substitute, stretch individual limbs, add heavier outlines or blur the animation.

Use transparent backgrounds, full silhouettes with generous cell margins, stable anatomical anchors and a shared support-foot baseline. Preserve asymmetric clothes, props and prop-carrying hands. Heads, ponytails, hands, toes and watering-can spouts must stay within bounds in every frame.

Playback must reach all eight frames in every direction and wrap 8→1 without a hitch. Default review timing is 125 ms per pose. Check real gameplay movement clocks as well as previews; a four-frame modulus is not acceptable for an eight-frame character. Keep existing collision footprints and save identifiers.

Review front/right/back/left at native rendering resolution beside the standing figure, with pause, slow motion and individual frame controls. Landmark and hash checks support the review; they do not establish good motion by themselves.

Current rollout: the approved custom hoodie/jeans/sneakers side sample, followed by Remy, Priya and Doug in all four directions. Remaining custom wardrobe pieces and Poppy retain their existing art until explicitly updated.

The approved custom hoodie/jeans/sneakers eight-pose side cycle is now active in gameplay, creator and wardrobe mirror, at 125 ms per pose. Its complete garment set and rig are selected together. Other outfit combinations and front/back directions retain the registered four-pose cycle; the remaining wardrobe eight-pose rollout is still pending. See `review/custom-walk-v4/live-game-checks.json` for live file-game checks.
