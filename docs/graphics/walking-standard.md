# Walking artwork standard

Jake approved the `review/custom-walk-v4` sample as the walking standard on October 16, 2026.

Every new or revised walk has eight distinct chronological drawings in each direction: first-foot contact, loading, passing, push-off, opposite-foot contact, loading, passing, push-off. Both feet must complete their stride. The second half must not duplicate the first half or turn to the opposite direction. Near/far limb identity stays consistent through crossings; arms oppose legs.

Keep the established illustrated Bagseed style, delicate linework, original character identity and proportions. Moving artwork must match standing detail. Register original high-resolution art directly to the game-density canvas with one uniform resample. Never enlarge a low-resolution game sprite as an artwork substitute, stretch individual limbs, add heavier outlines or blur the animation.

Use transparent backgrounds, full silhouettes with generous cell margins, stable anatomical anchors and a shared support-foot baseline. Preserve asymmetric clothes, props and prop-carrying hands. Heads, ponytails, hands, toes and watering-can spouts must stay within bounds in every frame.

Playback must reach all eight frames in every direction and wrap 8→1 without a hitch. Default review timing is 125 ms per pose. Check real gameplay movement clocks as well as previews; a four-frame modulus is not acceptable for an eight-frame character. Keep existing collision footprints and save identifiers.

Review front/right/back/left at native rendering resolution beside the standing figure, with pause, slow motion and individual frame controls. Landmark and hash checks support the review; they do not establish good motion by themselves.

Current rollout: all 24 custom wardrobe garments share the approved eight-pose side cycle, across all 300 outfit combinations. Remy, Priya and Doug have eight poses in all four directions. Custom front/back walking and Poppy retain their existing four-pose art.

The complete custom wardrobe side cycle is active in gameplay, creator and wardrobe mirror, at 125 ms per pose. Every selected garment uses the same eight-pose rig. See `review/custom-walk-v5/README.md` for the live validation and native-resolution garment review.
