# Character publication status

This page records the earlier hair publication. The subsequent approved cardigan, jacket and flannel integration, corrected pose guides and final flannel palette are described in [Approved custom outfits in the game](approved-outfits-publication.md). Its validation supersedes the older counts and cardigan-candidate status below.

This update preserves the external-image layout and merges plant-art commit
`bd35adb` from `main` before publishing the character renderer changes.

Final merged verification: `npm run build:graphics` completed, all **225 tests
passed** with zero failures, the strict character audit flagged zero rows, and
`node tools/check.mjs` verified all 1,841 external image hashes. See
`review/hair-external-assets/verification.json` and `full-tests.txt`.

## Included

- Native-resolution custom rendering, shared idle/walk head attachment, garment
  collar measurements and skin/material corrections.
- Hair outline and interior-line recovery, pale-hair shading, scalp coverage,
  ear/jewelry occlusion and hair-over-clothing ordering.
- Saved head-shape protection when the player changes movement direction.
- Browser regression coverage, external-image/standalone hair parity, and strict
  donor-part rejection for both wardrobe manifests.
- Compact hairstyle/outfit comparisons and the individual cardigan generation
  experiment, with raw images, prompts, unavailable-seed records and registration
  metadata. These candidates are review material and are not runtime assets.

## Still open

The fresh wardrobe redraw is incomplete. Original mannequin front and back
cycles each put the lowest foot on the same image side in three of four frames.
Eight individual cardigan candidates pass palette/outline checks, but the guide
sequence must be resolved before those checks can establish a balanced cycle.
See [original guides beside the candidates](../../review/custom-walk-rerender-v6/original-guides-and-cardigan.png).

The rejected local overalls donor-torso experiment was backed up locally and
withdrawn, restoring both the committed atlas and its matching manifest. It is
not published. The original overalls painting still needs a genuine redraw;
passing the donor check does not approve its design.

## Reproduction and large local evidence

Use `npm run dev` to play the small external-image build. Direct `file://` access
to `public/index.html` taints pixel-reading canvases. For direct-file play, run
`npm run build:standalone` and open `dist/standalone/index.html`.

The 270 wardrobe matrices, 122 detailed hair sheets, rejected bulk generation
attempts and the export archive remain local. Their compact comparisons and
reproduction tools are versioned to avoid publishing hundreds of megabytes of
duplicated diagnostic images. Regenerate the large matrices with:

```text
node tools/review-custom-full-body.cjs --all
node tools/review-custom-hair-on-body.cjs
python tools/contact-custom-hair.py
python tools/contact-custom-wardrobe.py
python tools/compare-custom-alignment.py
```

Run `npm run build:graphics`, `npm test -- --test-concurrency=4` and
`node tools/check.mjs` before publishing. Technical tests do not replace visual
approval of the unfinished source artwork.
