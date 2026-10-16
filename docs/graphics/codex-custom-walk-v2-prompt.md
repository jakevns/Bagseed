# Codex prompt: custom player walk, revision 2 (full 8-frame stride, native-resolution art, correct hands and feet)

Paste everything below the line into ChatGPT Codex. It has the same `Bagseed` folder. This replaces the Phase 1 brief in `docs/graphics/codex-custom-walk-prompt.md` where they conflict.

---

Phase 1 of the custom-player walk (`review/custom-walk-v1/`, branch `codex/custom-walk-phase-1`, merged as PR #5) is **not approved**. Read this whole brief, open every image it names, and then do a revision. Do not start the full wardrobe.

## 1. What I rejected, and why

1. **It is not a full walk.** Each direction has only 4 poses, and in play it reads as an arm swing plus a kick, as if only half the stride were animated. A walk needs both legs to visibly take a step in turn, with the body rising and falling between them.
2. **The art is muddy and blurry.** Do not draw or generate anything at sprite size (32, 36, 96 or 108 px) and then upscale it. Upscaling low-resolution art is what made it smear. Every pixel you ship must be authored at the same density as the standing custom player, which renders at density 3 into a 288×432 canvas (`sprite(look,dir,frame,…,density=3)`). Downsampling only happens once, at display time, inside the existing renderer.
3. **The walking figure does not look like the standing figure.** Open `review/custom-walk-v2-brief/custom-stand-vs-walk.png`. Column 1 is the custom player standing; columns 2–5 are the Phase 1 walk frames. The walk has heavy black outlines, different hoodie folds, a different torso shape and green background showing through a seam at the waist (the hoodie hem and the jeans waistband don't meet). The walk must look like the standing character came to life: same line weight and outline color, same shading, same garment shapes and details, same face and hair. **Use the standing custom art as the style master, not `player-sheet.png`.**
4. **Hands and feet are too small** on the custom character compared with the cast. Fix this in the standing art **and** the walk (see §3).

## 2. Study the approved walkers first

Remy, Priya and Doug are the motion and personality standard. All three of their sheets are on one board for you:

- `review/custom-walk-v2-brief/approved-walk-sheets.png`: Remy, Priya and Doug, rows front / right / back / left, columns = walk frames.
- Originals: `review/characters-v2/assets/generated/remy-sheet.png`, `priya-sheet.png`, `doug-sheet.png`; extracted frames in `review/characters-v2/assets/sprites/<name>/<dir>-<0..3>.png`; prompts in `review/characters-v2/sources/generation-prompts.json`.

Important: those sheets have **4 poses per direction** (16 walk cells plus portraits per sheet). The game plays them with `frame%4` (`graphics/production/sources/renderer.js` line 569). What makes them feel good is pose quality, not frame count: every pose is a strong, clearly different key, the opposite arm swings with each leg, the shoulders and hips counter-rotate, Priya's ponytail and Doug's belly and watering can follow through, and each one walks with an attitude (Remy loose and bouncy, Priya brisk and upright, Doug heavy and rolling). Copy that personality and those poses, but give the custom player **8 poses per direction**, so the stride is smoother than theirs, not choppier.

## 3. Hands and feet: measured problem and target

I rendered all four characters through the real renderer at density 3 (`review/custom-walk-v2-brief/capture-proportions.cjs`). See `review/custom-walk-v2-brief/hands-feet-lineup.png`. The top row is front: custom standing, custom Phase 1 walk, Remy, Priya, Doug. The bottom row is the same characters in right profile.

- **Standing custom hands are visibly smaller and thinner than the cast's.** The fingers are spindly, about two-thirds of the width of Remy's or Priya's hands, and in profile the hand almost disappears into the sleeve. The cast's hands are soft, rounded, mitten-like shapes, about as wide as the forearm plus a little, and they read clearly at 32 px world width.
- **Standing custom shoes are low and flat.** The foot length is about right: shoe width is about 17% of figure height in front view (Remy 16–17%, Priya 14–15%). But the shoes are too short vertically, and in profile they look like thin slippers next to Priya's chunky sneakers or Remy's sandals. Walking feet already measure about 22–24% of figure height in profile, the same as Remy (21–22%) and Priya (21–22%).
- **Target, in both the standing and the walking art:**
  - Hands match the cast's: about 7% of figure height wide and 8% tall in the front view (around 20×24 px at density 3), rounded and chunky, with a clear outline. They stay that size in every frame.
  - Shoes are about 21–23% of figure height long in profile, and the shoe body (sole to collar) is about 8–10% of figure height, like Priya's sneakers.
  - Keep the head, hair and body heights as they are.
- Update the standing body/hand and shoe art the same way (the hands are drawn inside the top sheets `graphics/production/assets/tops-a/b/c.png`; the feet are in `shoes.png`. Find the exact source by auditing `body()` in `renderer.js`). Then the standing and walking art match each other and the cast. Re-run `capture-proportions.cjs` and report the before and after numbers.

## 4. The walk: 8 frames per direction

Use the classic contact method (Richard Williams, *The Animator's Survival Kit*): four key poses per step, two steps per cycle, which makes eight frames:

| frame | pose | what it shows |
|---|---|---|
| 0 | **contact R** | right heel touches down in front, left toes behind; legs at their widest, arms at full opposite swing (left arm forward) |
| 1 | **down R** | weight drops onto the right leg, knee bends, body at its **lowest** (≈1 world px / 3 native px lower) |
| 2 | **passing R** | left leg swings past the planted right leg, left knee lifted, arms passing the body, body back to neutral height |
| 3 | **up R** | right leg pushes off on its toes, body at its **highest** (≈1 world px up), left leg reaching forward |
| 4 | **contact L** | the mirror of frame 0 with legs and arms swapped |
| 5 | **down L** | mirror of 1 |
| 6 | **passing L** | mirror of 2 |
| 7 | **up L** | mirror of 3 |

Rules:
- **Both halves must be drawn.** Frames 4–7 are separate drawings of the other leg stepping, not frames 0–3 replayed. In front and back views the near and far legs must clearly alternate. Lay the 8 frames out in a strip and check that the right foot and the left foot each lead once.
- The **planted foot never slides**. Between contact and up it stays on the same ground pixel, and the body moves over it.
- **Arms swing opposite the legs**, with elbows softly bent and hands reaching their furthest point on the contact frames. Sleeves move with the arms.
- **Hips sway** about 1 world px toward the supporting leg in front and back views, and the **shoulders counter-rotate** against the hips.
- **Secondary motion lags one frame:** hoods and drawstrings, skirt and long hems (labcoat, garden apron), ponytails and long hair. Hair moves as a whole layer, never warped.
- **Personality:** a relaxed, friendly, slightly bouncy walk, between Remy and Priya, not a march.
- **Timing:** the player currently plays 4 frames at 8 fps (`src/game.html` line ~2914, `Math.floor(t*8)%4`). For the custom player, play 8 frames at **12 fps**, which takes about 0.67 s per full stride. Keep the reduced-motion branch working, for example by using only the contact frames 0 and 4. In `authoredWalk` and in creator and mirror previews (`Math.floor(t*6)%4` in `renderer.js` lines 614 and 626), use `frame%8` for custom looks only. Leave Remy, Priya, Doug, Poppy and the 67 cast drawings on `frame%4`.

## 5. How to author it

- Generate at **high resolution** and only ever **downsample**. If the generator returns a sheet, crop each cell and resize it **down** to the 288×432 density-3 canvas (feet at y=431, centered at x=144). Use area or Lanczos filtering, then clean the edges. Never resize up. Never use nearest-neighbor or bilinear enlargement on shipped art. Nearest-neighbor enlargement is only for the review boards.
- **Image-generation layout:** one sheet per garment, **4 rows (front, right, back, left) × 8 columns (frames 0–7 as in §4)**, transparent background, generous gutters, no text or grid. Attach these:
  1. the standing custom player for that outfit at density 3, front/right/back/left, as the **style and identity master**;
  2. a pose-guide strip of the 8 key poses, drawn as a plain mannequin in the same proportions;
  3. `approved-walk-sheets.png` for motion and personality.
  
  Tell the generator to keep the exact character, line weight, colors and proportions of attachment 1, with hands and feet at the §3 size, and to change only the pose.
- Keep the Phase 1 layered system (one shared rig, far/near arm and leg labels, key-color recoloring, similarity-only registration) but extend `rig.json` to 8 frames per direction (32 frames). Keep the rule that Python only crops, registers, masks and encodes; it never draws garments or limbs.
- **Close the waist seam:** the top's hem must overlap the bottom's waistband in every frame, with no background showing between them. Add an automated check that fails if any transparent pixel sits between the torso and the leg layers inside the body silhouette.

## 6. Scope for this revision, then stop for my approval

Revise only the Phase 1 sample set: hoodie, tee, flannel, overalls, jeans, skirt, sneakers and sandals. Also fix the standing hands and feet for the default kit. Then put this in `review/custom-walk-v2/`:

- for each of the 4 directions, an 8-frame strip of the default player, at game size and at 4× nearest-neighbor;
- animated GIFs at 12 fps, with the default player, the three Phase 1 test looks, Remy, Priya and Doug walking side by side on grass, indoor floor and night;
- a standing-vs-walking board, so I can see that they look like the same drawing;
- the before/after hand and foot measurements from `capture-proportions.cjs`;
- a README listing what was generated, what was rejected and the prompts used.

Rebuild with `npm run build:graphics` (or `node graphics/production/sources/build.cjs` for renderer-only changes), and run `npm run check` and `npm test`. Report the results honestly. Do not deploy, do not touch the approved walkers' art and do not start Phase 2 until I approve.
