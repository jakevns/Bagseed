# Bald anatomy and transparent hair

The custom character now uses one genuinely bald anatomy layer in four directions. Each of the 60 hairstyles is separate grayscale RGBA artwork, tinted as one hair material at runtime. Bald is an additional selectable option. Hair never contains a face, and there is no brown hairstyle hidden underneath it.

Generated source PNGs are in `sources/`; all were made using the built-in `image_gen` tool with true transparency. The complete prompt set and revision prompts are retained in `sources/prompts.json`. The bald head is the anatomical reference for the generated hair. New hat artwork shows the outside of each hat as worn, with no hollow underside painted below the brim.

`register.py` performs technical source isolation, grayscale normalization and registration, using Pillow and NumPy. It isolates whole connected silhouettes before cropping and rejects opaque source edges. It retains transparency, fits the full hair to stable anatomy, and writes `registered/` plus `manifest.json`. Long ends can extend below the neck. Sparse temple hair is registered to temple/nape locations rather than scored for full scalp coverage. Generated source images are retained without destructive editing.

The build embeds `base/`, `wig/` and `headwear/` from this manifest. The original baked head/hat sheets are excluded. The v6 renderer composes the bald head, facial details, complete transparent hair and fitted hat. It never paints a broad face or forehead plate over the strands. The registration score fits the source face opening to eye landmarks and keeps crowns consistent while turning. Back hair can cover the neck naturally. Hair color changes never alter hair alpha, and the rear anatomy does not depend on hair color.

Head layers are 192×320, with the neck at (96,199). Custom world sprites are 96×144, with added transparent room above the original body. Drawing uses a fixed width and feet anchor rather than shrinking complete silhouettes. Creator and wardrobe previews are 540×336 with matching CSS proportions. Face and body scale remain stable when changing hairstyles or hats.

Rebuild from the repository root with `npm run build:graphics`, or after changing only this pipeline run Python on `register.py` and then `node graphics/production/sources/build.cjs`. Current browser evidence is generated with `node tools/review-layered-characters.cjs review/customization-v6` and `node tools/review-character-fit.cjs`. See `review/customization-v6/README.md` for the review and validation record.
