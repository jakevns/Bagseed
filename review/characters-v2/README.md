# Character study 02 — approved sample archive

The user approved this revised study (“You nailed it”). Production integration and final evidence are in `../../public/index.html` and `../final/index.html`. The remaining notes describe the original five-character sample checkpoint.

The user rejected study 01 as stiff, square, robotic, generic, unattractive, and insufficiently informed by the supplied collection. That renderer is not reused here.

This study uses original illustrated portrait and sprite assets informed by character art from Fields of Mistria, Eastward, Sea of Stars, Legend of Mana, CrossCode, Roots of Pacha, and Owlboy. The selected reference IDs and source links are in `sources/reference-selection.json`. Embedded previews were inspected at their available native resolution; the full-resolution external image hosts remain blocked.

Open `index.html` in a browser. It is self-contained and needs no server or external image requests. It uses the actual proposed PNG sprite and portrait assets, compared with the supplied game on its own backgrounds. No more reference uploads are needed for this review.

## Review

- `character-samples.png`: original and proposed sprites and portraits, four views, three expressions.
- `walk.gif` and `idle.gif`: front-view motion comparisons. Choose Walking in the interactive preview to see all four directions.
- `comparison-indoor.png` and `comparison-night.png`: the same assets on game backgrounds. Night colors use the original game's sampled lighting operation.
- `enlarged-inspection.png`: enlarged inspection, beyond normal game zoom.
- `phone-portrait.png` and `phone-landscape.png`: browser viewport emulation, not physical-device playtesting.
- `validation.json`: asset bounds, browser errors, mobile overflow and baseline integrity checks.

The proposed native sprites are 96 × 108, drawn into a 32 × 36 world-space canvas with feet at its bottom center. This is a wider transparent drawing surface than the original 24 × 36 canvas; world feet and collision coordinates would stay fixed. Preserving the added detail requires a threefold render density and matching world-camera source-rectangle changes. Portraits are 192 × 192, compared at the original 64 CSS-pixel display size. These renderer changes are now integrated in the production build; the archived study remains the original sample.

These are five sample identities, 80 walk frames, 20 standing views and 15 portraits. The generated walk sheets still require animation review. Idle breathing transforms the upper body while keeping feet fixed; blink, sitting, smell reactions, flashlight attachment, full cast and all customization combinations remain production work after approval. Illustrated shading interprets the baseline palette; this is not a completed appearance-compatibility implementation.

## Reproduce

The original generated sheets and prompts are retained in `assets/generated/`, `assets/master-cast.png`, `sources/generation-prompts.json` and `sources/generated-assets.json`. Crops, source hashes, scales and anchors are in `sources/asset-manifest.json`. Extraction resamples and aligns existing artwork; it does not draw characters. `sources/baseline-assets.json` contains only comparison fixtures from the original supplied game, with its checksum and provenance, not rejected proposal art.

From the repository root, with the locked Node dependencies installed and Python packages in `sources/requirements-art.txt` available:

```sh
python3 review/characters-v2/sources/extract-assets.py
node review/characters-v2/sources/build.cjs
python3 review/characters-v2/sources/export-animations.py
```

These commands were run successfully with Python 3.12, Pillow 12.3, NumPy 2.3.5, Node 24 and system Chromium. The browser build requires the repository's baseline, static-server helper and Playwright dependency. The exported standalone HTML does not.

The approved game HTML has not been edited, and this study is not yet approved or integrated. The old procedural study must not be treated as approved or carried into the game.
