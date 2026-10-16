# Codex prompt: hand-authored walking for the customizable player and every outfit

Paste everything below the line into ChatGPT Codex. It has the same `Bagseed` folder.

---

I want the customizable player character in my browser game **Bagseed** to walk as beautifully as my four best characters. Customization is a core part of the game, so every outfit piece the player can wear needs real authored walk frames that match the body's motion. Nothing should look stretched, warped, sliding or rubbery. Read this whole brief before starting, inspect the files it names, and work in the approval phases at the end.

## 1. What is good today, and what is wrong

**The standard to match.** Four characters walk with fully generated frames: **Remy** (the roommate), **Priya**, **Poppy** (the child) and **Doug**. Each has a genuine four-frame walk cycle in all four directions: front, right, back and left. Their source sheets and prompts are here:

- `review/characters-v2/assets/generated/remy-sheet.png`, `priya-sheet.png`, `poppy-sheet.png`, `doug-sheet.png`
- `review/characters-v2/sources/generation-prompts.json` (the exact `master_prompt` and per-person `jobs[].prompt` that produced those sheets; reuse their wording and layout)
- `review/characters-v2/walk.gif`, `review/characters-v2/index.html` (approved motion preview)
- `review/characters-v2/README.md` (the approval record)

**The unused master.** `review/characters-v2/assets/generated/player-sheet.png` is an approved walk sheet for the default player: green hoodie, jeans and sneakers, 4 directions × 4 frames plus 3 portraits. The game does not use it. It is the ideal **pose master** for this whole project.

**What's wrong.** In `graphics/production/sources/renderer.js`, `sprite()` (around line 562) uses each canonical person's own walk frames, `person.assets[`${dir}-${frame%4}`]`, when `person.rig` is false. The custom player instead goes through `generic(L, dir, …)`. That function assembles one standing pose per direction from modular layers, and `animate(…)` then fakes walking by transforming the standing art. `body()` (around line 409) builds the torso by slicing the top sheet at fixed y lines: neck 0–41, torso 41–waist, legs at `waist`. It horizontally rescales bottoms (`lowerScale` 1.8/1.9) and shoes (by footprint) to fit. A standing drawing cannot become a walk this way. Legs never really step, sleeves can't swing and clothes warp. The approved Study 02 note already says that additional cast walking is "continuous figure motion applied to authored standing drawings", not true walk sheets.

**Goal.** Re-author the custom player's walk as real frames. Draw every top, bottom and pair of shoes as layered walk frames on one shared, locked walk skeleton, so any combination lines up frame by frame.

## 2. Inventory: confirm it yourself

Audit `src/game.html` and `graphics/production/sources/asset-manifest.json` rather than trusting this list:

- **Tops (15 asset ids):** tee, tank, hoodie, flannel, sweater, cardigan, overalls, work, crop, jacket, garden (apron), pjs, labcoat, suit, officer. The player wardrobe in `CLOTHES.shirt` lists 12; labcoat, suit and officer are used by NPC looks that go through the same modular path. Author all 15. `overalls`, `pjs` and `suit` are full-body (`fullSuit` in `body()`); `labcoat` and `garden` have long hems.
- **Bottoms (5):** jeans, joggers, cargo, shorts, skirt. `pjs` bottoms reuse jeans today; give pajamas matching pajama trousers instead.
- **Shoes (4):** sneakers, boots, sandals, rainboots. Sandals show bare skin, so feet and toes must be recolorable to all 16 skin tones.
- **Body:** builds slim, average, broad, curvy, stocky and tall-lean, applied as width factors in `portrait()`/`generic()`; presentation fem/masc/neutral; 16 skin tones.
- **Heads stay as they are.** These are bald anatomy plus 60 transparent haircuts and 8 hats, 192×320 with the neck at (96,199), registered by `graphics/production/customization-v5/register.py`. Do **not** regenerate heads or hair. Heads ride on the new body frames (see §5).
- **Overlays that must still work:** `topPat`/`botPat` patterns with `topC2`/`botC2`, the `emb` emblem, and accessories (bandana, scarf, necklace, belt, bag, headphones, earrings, glasses).
- **Not in scope:** the 67 other cast appearances, portraits, sitting, the holding-nose action sheets (`nose/…`) and the four approved walkers. Leave them untouched.

## 3. Animation references

Inspect these before drawing:

1. **In-repo, highest priority:** the five Study 02 sheets above. Note their contact → passing → contact → passing rhythm, the opposing arm and leg swing, about 1 px of body bob on passing frames, slight hair and cloth follow-through, and planted feet that never slide during contact.
2. **Reference package** (the user's `Bagseed_Codex_References_Part_XX.zip` files, extracted into a merged `Bagseed_Visual_Research/` folder; IDs are in `Reference_Sources.csv`):
   - Fields of Mistria gameplay GIFs **G03-P14, G03-P15, G03-P16, G03-P17**: small cozy-farm characters walking at real game size. Study readability at small size, step timing and how little bounce is needed.
   - **G03-P01** (Fields of Mistria Celine, animated full body): cloth and hair secondary motion.
   - Publisher captures showing a portrait next to its world sprite: **G03-S04, G04-S03, G07-S05, G15-S12, G17-S03, G26-S01, G01-S08**. These show how sprite and portrait identity should match at the scale this game uses.
   - FarmVille 2 character turnarounds **G02-PN09 to G02-PN19**: clothing folds, soft shading and outfit separation (cute, appealing proportions).
   - The pack has **no dedicated walk-cycle sheets**. The Secrets of Grindea GIFs (G17-D019/D022/D040/D049/D068) are effects and line-art studies, not walks. Part 12 of the download is truncated.
3. **Classic walk-cycle principles to apply:** four key poses per stride (contact, down, passing, up), condensed here to 4 frames (left contact, passing, right contact, passing). The body is lowest just after contact and highest at passing. Arms swing opposite to the legs, with elbows slightly bent. In front and back views the hips sway about 1 px toward the supporting leg. Long hems, hoods and skirts lag the body by one frame.

Do not copy any character, outfit or pixels from another game. Use them only for motion and quality principles.

## 4. Recommended approach: a locked walk rig with layered garments

### 4a. Lock the pose master

1. Extract the 16 walk cells from `player-sheet.png` with the same crop/registration conventions as `review/characters-v2/sources/extract-assets.py`. Normalize to the custom sprite canvas (96×144 world-density art drawn at 32 units wide, feet bottom-center; follow the existing `hires/` density convention).
2. Annotate each frame in a new `graphics/production/walk/rig.json` with keypoints in canvas pixels:
   - neck base (head attach point)
   - shoulders L/R, elbows L/R, hands L/R
   - waist center, hips L/R, knees L/R
   - ankles L/R, toe/heel contacts
   - which arm and which leg is the **near** side
   - the ground baseline

   Auto-detect where you can, then verify by rendering overlay boards. The keypoints drive layering, the head attachment, the flashlight hand (`image.bagseedHand`, used by `NightLamps1151.hand`/`carry`) and validation.
3. Generate a **neck-down "mannequin" walk sheet**: the same body, poses and proportions as the master, with recolorable skin and plain neutral fitted underlayer (no hair or head). Attach `player-sheet.png` as the exact pose reference. It becomes the skin and body base layer, and every later garment sheet is generated against it.
4. Build per-frame **part label maps** from the mannequin: farArm, torso, nearArm, farLeg, nearLeg, farFoot, nearFoot. Garment pixels inherit the label of the nearest mannequin part, with arm and leg zones taking priority over torso. This makes far arms and legs sit behind the body and near ones in front.

### 4b. Garment walk sheets (one image-generation job per item)

For each top, bottom and shoe, generate one sheet in the **same layout as the approved sheets**: 4 rows (front, right profile, back, left profile) × 4 frames (left-foot contact, passing, right-foot contact, opposite passing). Use a transparent background, no text or grid, generous gutters, and one isolated figure per cell. Attach **both** the mannequin walk sheet and `player-sheet.png`. Tell the generator the poses, limb positions, scale and feet baseline must match the attachment **exactly**, frame for frame, with only the garment changing.

Requirements for these sheets:

- **Neck-down only.** No head, no hair. The neck stump matches the mannequin.
- **Recoloring.** Paint each garment in a single mid-value **key color**, like the existing kits. `graphics/production/sources/tops-a-generation.json` uses medium blue `#5086bf` for tops, dark navy `#36405a` for bottoms, brown `#2b1d14` for shoes and tan `#cf9670` for skin. `paint()` in `renderer.js` recolors by luminance through `material()`, classifies skin with `bodySkinPixel()`, and keeps cream/white details (undershirts, coat whites, brass buttons, ink). Shade the garment only with value changes in its key hue, and keep other colors out of the garment, or recoloring will break.
- **Fixed neutral companions.** In each tops sheet, fix the bottoms (key-navy jeans) and shoes (brown sneakers) so only the top varies. In bottoms sheets, use a short fitted key-blue tee tucked in, so the waistband is visible. In shoes sheets, use rolled jeans so the full shoe and ankle are visible. Discard the companion pixels using the label maps.
- **Cute, soft, appealing finish.** It must match the approved characters exactly: organic cloth folds that move with the stride, sleeves swinging with the arms, hoods and drawstrings bouncing, skirts and long hems (labcoat, garden apron) swaying a frame late, and sandals showing toes. No 3D render, no vector-flat shapes, no stiff or robotic poses.
- **Full-body tops.** Overalls, pajamas and suit include their own legs; skip the bottoms layer for them, as `fullSuit` already does.
- Save every generated sheet untouched, with its prompt, in a `*-generation.json` beside it (follow `graphics/production/sources/*-generation.json`). Record source SHA-256 hashes in a manifest. Python must only crop, register, mask and encode; it must never draw garments.

### 4c. Registration and validation (in code)

- Register each garment frame to the master with a **similarity transform only** (translate, uniform scale, rotation of at most 2°), solved from the keypoints. **No non-uniform scaling, mesh warps or per-row stretching.** That stretching is the current problem.
- **Automatic reject list:** silhouette IoU against the mannequin below an agreed threshold (start at 0.85 for limbs); any keypoint error over 2 native px; feet off the baseline; a hand not connected to its sleeve; duplicated or missing limbs; a direction flip within a row. Regenerate rejected cells or sheets rather than patching them.
- **Left/right views:** prefer the generated left row. If it fails validation, mirror the right row but check asymmetric items (bag strap, side pony, apron ties, emblem side).

### 4d. Runtime integration

- Add a custom-player walk path in `renderer.js`. When the look is a custom/generic look and `frame` is a walk frame, compose the frame from: the far layers (farArm sleeve and hand, farLeg bottom, far shoe), then torso, nearLeg and near shoe, then nearArm. The head is placed at that frame's **neck keypoint**, which gives natural bob, and hats travel with it. Idle and standing keep using the existing standing path.
- **Long hair, braids and ponytails:** translate the whole head only, with an optional ±1 px lateral offset on the lower hair region on passing frames. Do not warp hair.
- **Body builds:** keep the current width factors for this phase, applied to the whole composed frame around its center line, and verify they don't distort the stride. If slim or broad looks wrong, propose separately generated builds as a follow-up. Don't add them silently.
- **Patterns and emblems** must stay attached to the garment. Compute pattern coordinates in garment-local space using that frame's torso keypoints, so stripes don't "swim" as the figure moves. Accessories (bag, scarf, belt, necklace, bandana) follow the torso and neck keypoints per frame.
- **Preserve:** the `drawPerson` signature, the 32×36 world footprint with feet anchored at bottom-center, collision, camera and interaction distances, depth order, `idleBlink`, breathing, sitting, the nose/smell reaction poses, `NightLamps1151` flashlight carry (update `bagseedHand` per frame from the hand keypoint, so the flashlight stays in the hand while walking), `settings.reduced`, creator and wardrobe/mirror previews (FRONT/SIDE/BACK walking toggle in `drawCreatorPreview`), and all existing option IDs and saved looks.
- **Caching and size:** composing many layers per frame must be cached the way `bodies`/`cache` already are. Pack frames into atlases and encode with `sources/encode.py` (lossless WebP, verified against PNG). Report the size increase of `public/index.html`; flag if it grows by more than about 10 MB.

## 5. Repository rules

- `src/game.html` is gameplay source; `public/index.html` is generated. Rebuild with `npm run build:graphics` after installing `graphics/production/sources/requirements.txt`. If you only change the renderer, use the documented `node graphics/production/sources/build.cjs`. The builder refuses to overwrite an output edited since the last build; respect that.
- There are **uncommitted changes** in the working tree: hair and neck fitting work (renderer, register.py, build.json, review/test files) and a garden-bed rotate/flip feature in `src/game.html` and `public/index.html`. Do not revert, reformat or discard them. Work on a new branch and keep your commits limited to this feature.
- **Windows machine:** `node` and `python` are not on PATH. Use `C:\Users\Jake Bailey\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` and `...\dependencies\python\python.exe` (Pillow 12 and NumPy 2 are installed). Tests need Playwright (`npm ci --ignore-scripts`) and a Chromium at `BAGSEED_BROWSER_PATH`.
- Do not change gameplay, balance, buildings, the menu, the bedroom art, the four approved walkers or the 67 cast drawings. Do not deploy or push unless I ask.

## 6. Work in phases and stop for my approval

**Phase 1 — rig and samples (stop and ask me afterwards).**
- Rig JSON plus keypoint overlay board for the 16 master frames.
- Mannequin walk sheet.
- Sample garments:
  - tops: hoodie, tee, flannel and overalls (full suit)
  - bottoms: jeans and skirt
  - shoes: sneakers and sandals
- Preview, rendered by the real runtime path on backgrounds from the game (grass, indoor floor and night), for the default player plus at least three varied custom looks: different skin tones, long hair and a ponytail, a hat, a broad and a slim build, and a patterned top:
  - all four directions
  - at actual gameplay size, **side by side with Remy and Priya walking**
  - nearest-neighbor enlargements
  - animated GIFs
- Put it all in `review/custom-walk-v1/` with a README of what was generated, rejected and regenerated, plus reference IDs. Then **ask me to approve**. Make revisions if I ask.

**Phase 2 — the full wardrobe (only after I approve).**
- The remaining tops, bottoms and shoes.
- Validation reports for every top × bottom × shoe × direction × frame. At minimum, an automated pass over all combinations, with visual boards for a representative grid.
- An add-only browser test (`tests/custom-walk.test.cjs`) checking:
  - every combination renders non-empty frames
  - feet stay on the baseline
  - hands are attached
  - the flashlight follows the hand while walking
  - creator and mirror previews animate
  - save/load compatibility using disposable storage, never my real save
- `npm run check` and `npm test` must pass. Report results honestly, including what still needs my phone playtest.

Automated checks don't prove the art looks good. Show me the frames.
