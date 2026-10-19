# Approved hoodie: walking and matched idle

The user approved this exact v15 review on 2026-10-18 and requested implementation and a GitHub push. Its ten paintings are registered in the approved outfit pack for front/rear idle and walking with jeans and sneakers. Other bottom/shoe combinations retain their complete established renderer; side views keep their existing eight-frame art.

`review/hoodie-proportions-v15/index.html` compares the original idle, newly painted slimmer idle and four fresh walking phases in each front/rear direction. Every figure uses a uniform 240-pixel neck-to-shoe review height, with no independent width stretch. Existing eight-frame side views are unchanged.

The built-in image generator produced each pose individually using the approved hoodie idle and corrected `pose-guides-v6` diagrams. Fresh same-cycle artwork provided proportion continuity, never donor pixels. Prompts, reference hashes, selected raw paths and unavailable-seed records are collected in `generation-prompts.json`. Rejected attempts remain separate; selected frame metadata identifies the actual source.

Raw generations: `graphics/production/walk/sources/rerender-v6/hoodie-v14/` with selected retries in `hoodie-v14-retry1`, `hoodie-v14-retry2`, `hoodie-v14-retry3`. Raw idle: `graphics/production/walk/sources/hoodie-idle-v14/`. Registered geometry: `registered/hoodie-v14/top-hoodie/` beneath the rerender root and `graphics/production/walk/registered/hoodie-idle-v14/`.

Final color-only derivatives use `hoodie-v15` and `hoodie-idle-v15`. The shared-palette process used for the approved flannel maps hoodie, jeans, skin, leather, cream soles and drawstrings to common material ramps. It changes only solid material RGB; alpha, protected ink, outside-mask pixels, source hashes and geometry are asserted unchanged. Raw PNGs are never overwritten. A mask diagnostic is provided for inspection.

All ten final candidates pass the original color, contour-weight, near-black-edge, rear-neck, clipping and applicable support-leg checks. Hoodie, jeans, skin and leather median RGB are identical across candidates; cream and drawstring spreads are at most half a channel level. Garment palette comparison to original idle is between ΔE 0.57 and 3.44 (limit 6). The front idle shoulder width is 94 pixels at review scale versus a walk median of 93.75; rear idle is 93 versus 94.5. Jeans hip widths are 66 versus 65 front, and 64 versus 62.25 rear.

The approved source review remains available beside the live renderer captures in `review/approved-outfits-live/hoodie.png`. Source hashes identify the exact approved PNGs; packing never repaints them. Publication validation is recorded after rebuilding and running the full suite.

Reproduce the source review using the checked-in workflow tools after preserving the raw candidates:

```text
python tools/audit-walk-rerender-v6.py --attempt hoodie-v14 --guides pose-guides-v6
python tools/review-cardigan-proportions-v9.py --garment hoodie --version 14 --attempt hoodie-v14
python tools/prepare-hoodie-review-v15.py
python tools/write-outfit-source-review.py --garment hoodie --version 15 --attempt hoodie-v15
```

The v14 audit intentionally reports its uncorrected down/0 palette discrepancy. Final derivative checks are in the v15 `shared-palette.json`; the source geometry is unchanged by that correction.

The player-scale check now compares each direction with Remy, Priya and Doug's measured authored alpha bounds (33.11 world units), retaining its one-unit rest/reaction tolerance and 1.5-unit stride-bob tolerance. Their own bounds must remain within 0.25 of nominal 33.3. The approved hoodie front idle and all four walk frames measure 32.22, within 0.89 of those adults; the source artwork and runtime scale were not changed to fit the old nominal-height assumption. Legacy modular leg/sole checks use the unchanged tee as their reference rather than the newly replaced hoodie.

Final release validation: the full graphics build passed; all **240 npm tests passed** with zero failures or skips; the strict character audit flagged zero rows; all **1,849 published image hashes** passed verification; and all ten source/derivative geometry, alpha and protected-ink checks passed. See `review/approved-outfits-live/hoodie-publication-validation.json` and `hoodie-full-tests.txt`. Main commit `34c3a14` was incorporated before publishing.
