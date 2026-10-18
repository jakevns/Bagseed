# Character rendering with external images

The working branch includes `dc958b1` (the `smaller-page` merge) and preserves
the local `character-alignment-audit-v6` renderer. The build still publishes
images under `public/assets/embedded/<hash>.<extension>`; it does not put the
large images back inside the published HTML or character-data script.

## Reproduced hair failure

Opening **public/index.html directly with file://** allows image decoding but
taints canvases which read those separate images. The custom hair renderer
uses `getImageData()` to recolor hair and preserve its contours. Chrome throws
`SecurityError: The canvas has been tainted by cross-origin data` at that call.

Serve the published directory with `npm run dev` for local development. For
direct-file play, use `npm run build:standalone` and open
`dist/standalone/index.html`. This is the existing standalone build path;
the large offline copy stays outside the published build.

`tools/check-hair-origin.cjs` records the direct-file failure and confirms
successful hair reads in HTTP and standalone modes in
`review/hair-external-assets/origin-check.json`.

## Verification

- Restored `tests/custom-render-clarity.test.cjs`, which the smaller-page
  change had deleted. Its outline, interior detail, palette and native-density
  assertions pass on the external-image build.
- Targeted hair clarity, hair layering and anatomy suite: **5 tests passed**.
- `tests/character-external-assets.test.cjs`: **488 identical RGBA hashes**
  across all 61 options, four directions and silver/purple colors, comparing
  the actual HTTP build to the actual direct-file standalone build.
- Regenerated 122 complete-body hair sheets and visually inspected all eight
  overview pages: `review/custom-alignment/hair-overview/index.html`.
- `node tools/check.mjs`: 127 script blocks parse; 1,841 external images
  exist and match their content hashes.

The final post-merge run passed all 225 tests, including the strict no-donor
check after the rejected local donor experiment was withdrawn. The complete
log is in `review/hair-external-assets/full-tests.txt`. This hair verification
does not approve the newly generated walk art. That work remains staged in
`graphics/production/walk/sources/rerender-v6/` until its art gates and visual
review pass.
