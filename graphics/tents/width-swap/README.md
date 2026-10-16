# Starter width revision — proposal

Requested by the user while reviewing the 2×2 designs: swap the two tent widths. The starter becomes a narrow 54×90 single-plant tent, and the 2×2 becomes 86×112. The approved starter's Budget/Standard construction details remain, with newly generated narrower artwork. assets/starter-atlas.png is preserved unchanged; crops, dimensions and checksum are in sources/manifest.json.

sources/layout-proposal.js is used only by the isolated 2×2 preview. It updates the two bounding arrays, slot/equipment anchors and representative solid/decor footprints within that browser. The starter renderer is instantiated from the current verified source using the revised art, ceiling and bounds; the production renderer files are untouched. See ../2x2/README.md for the preview command and the remaining integration work after approval.

The follow-up prototype also moves the shared bedroom watering item and its interaction/placement/access metadata to the right of the seedling desk (x300, y103). The four existing watering tiers use the same location. Soft light is drawn inside the tent before contents and front fabric; legacy fixed-width room beams are suppressed for these two proposal renderers. The narrowed starter opening is adapted to the regenerated canvas, including roof, side and floor masks. These are isolated review changes, not runtime production integration.

The user subsequently approved this revision. Production integration lives in src/game.html and the starter/2×2 renderers; this directory retains the original proposal sources. See ../2x2/README.md.
