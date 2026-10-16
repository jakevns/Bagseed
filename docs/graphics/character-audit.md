# Character audit: broken, off-style and mis-sized characters

Audit date: 2026-10-16. Build audited: `public/index.html` on branch `ccr-12191481-bpni4g` (package 1.1.5-2).

## How this was measured

- Started a new game in headless Chromium. Hooked `drawPerson` and visited every scene, every `H5` home (both floors) and every `SHOP5` shop at 7, 10, 13, 16, 19 and 22h.
- For each character draw, recorded whether it resolved to authored art (`canonical` map in `graphics/production/sources/renderer.js`) or fell through to the procedural `generic()` renderer. Also recorded the effective world scale.
- Rendered all 73 authored appearances in four poses: idle, walk, "holding nose" (smell reaction, front) and "holding nose" (side). Measured the visible height in world units (1 unit = 1 world pixel; adult target ≈ 33.3, tall ≈ 34.7, short ≈ 31, kid ≈ 27.3).
- Re-run with `node tools/audit-characters.cjs`. It writes `docs/graphics/character-audit/measurements.json` and `all-characters-idle-walk-nose.png`, and flags regressions with `<<<`.

Evidence images are in `docs/graphics/character-audit/`:

| File | Shows |
|---|---|
| `worst-offenders-zoom.png` | Marcus, Mateo, Nico, Jun, Hugo, Theo and Marisol. Columns: idle front, walk side, nose front, nose side. |
| `all-characters-idle-walk-nose.png` | Every character in the same four columns. Red line = adult head height. |
| `prop-stripped-fallbacks.png` | Each character, plus (right) how it renders after its `prop` is removed. Only Doug, Inés, Bev, Owen, Officer and Rosalind (knit) change. |
| `portraits.png` | All dialogue portraits. |
| `measurements.json` | Raw heights per character, direction and pose. |

## Summary

Idle and walking art for all NPCs is consistent: same style, same anchor and correct heights. All in-world draws use scale 1. The problems come from three places:

1. **Missing or bad "holding nose" pose art (biggest problem).** 20 characters never got an authored smell-reaction pose. 2 more got bad ones. When the smell mechanic triggers, these characters switch to the procedural `generic()` renderer, which draws a chibi big-head, small-body figure in another style, often with a different hairstyle or outfit. Several authored poses are also scaled wrong. **This is the "Marcus is big" problem:** his nose pose is drawn noticeably bulkier and wider than his idle sprite (see the zoom image).
2. **Prop-stripping breaks the authored-art lookup.** The renderer matches characters by exact look, *including `prop`*. Any game code that sets `prop: null` or `undefined` makes the lookup miss, and the NPC is drawn by the procedural renderer instead. **Owen Brooks is broken all the time in the world because of this.**
3. **Duplicate or conflicting identities and small size offsets.** Rosalind, Theo and Marisol each have two different looks. The player is drawn about 6% shorter than adult NPCs.

---

## P0: Broken in normal play

### 1. Owen Brooks always renders in the wrong (procedural) style
- Seen 88 times in the sweep: `westway`, `town`, `home115:west_brooks`. All 88 used the fallback renderer.
- Cause: `src/game.html:22108-22110`, the `Cast115.drawNPC` wrapper. When Owen is not photographing, it strips `prop:'camera'` (`look:{...a.look,prop:null}`). When he is photographing, line 22110 strips it again before drawing the body. Neither stripped look matches `cast-14-owen`'s key, so `sprite()` falls to `generic()`.
- **Fix:** see the root-cause fix in section 3. As a local fix, stop stripping the prop: pass `a` through unchanged, and draw the camera overlay on top of the authored sprite.

### 2. Characters with props lose their art when the prop is stripped
These six looks carry a `prop`: Doug (`can`), Inés (`book`), Bev (`phone`), Owen (`camera`), Officer (`clipboard`), Rosalind NPC (`knit`). Each one flips to the procedural style in these paths:

| Code path | Location | Effect |
|---|---|---|
| Bedroom window walkers | `renderer.js` `drawTinyPerson=(c,x,y,look,frame=0,prop)=>drawPerson(c,x,y,{...look,prop},…)` with call sites at `src/game.html:6503` (and `22868` / `2776`) | `prop` becomes `undefined` when the caller doesn't pass one. Doug, Bev and Inés walking past the window are drawn procedurally. Confirmed in sweep: unmatched Doug at scale 0.42 in `bedroom`. |
| Smell reaction | `src/game.html:26185` and `26232` (`look:{...a.look,prop:null}`) | The nose pose for these six can't find its `actions` sheet, so it renders procedurally. |
| Trellis video clip | `src/game.html:22319` | Clip host is drawn procedurally if it has a prop. |
| Event panel (3 guests at scale 1.55) | `src/game.html:25701` | The same applies to any guest with a prop. |

### 3. Root-cause fix (recommended, fixes 1 and 2 together)
In `graphics/production/sources/renderer.js`:
- Exclude `prop` from the key used by `canonical` (`approvalKey`). Props are already drawn as a separate overlay (`props(g,L,dir)`), so they are not part of the identity.
- Alternatively, add an `identityKey`-based lookup (the map already exists as `identities`) as a second chance before calling `generic()`.
- In `drawTinyPerson`, only override `prop` when one is passed: `prop===undefined?look:{...look,prop}`.
- Add a test that asserts every `NPC_LOOK`, `NB_DEF[*].look`, `CAST_DEF[*].look` and `PATIENTS[*].look` resolves to authored art with `prop` set to `null`, `undefined` and its original value. Also assert the same with `short:true` added for kids (`Cast115.drawKid`).

---

## P0: "Holding nose" pose art is off-style or the wrong size

The smell mechanic triggers this pose in normal play, so these show up whenever the grow smells.

### A. No authored pose. Falls back to the procedural chibi style (20 characters)
`graphics/production/actions/progress.json` reports `completedCount: 52, remainingCount: 20`. These are the 20:

| Character | asset id | What the fallback looks like |
|---|---|---|
| Miles Dunn (kid) | cast-23-miles | Shrinks from 27.3 to 22 units, tiny |
| Hugo Serrano | cast-24-hugo | Different outfit (tan apron), different face, smaller |
| Anika Patel | cast-25-anika | Looks like a different person: long straight black hair, black dress |
| Enzo Park | cast-26-enzo | Chibi in a suit, 33.3 → 29.5 |
| Sasha Reed | cast-27-sasha | Different hair (afro) and outfit |
| Theo Park (patient look) | cast-38-theo | Chibi bowl cut, 33.3 → 27.7 |
| Marisol Vega (patient look) | cast-39-marisol | Long straight hair, chibi, 33.3 → 28.3 |
| Dr. Juniper Vale | cast-40-vale | Chibi, 33.3 → 29.7 |
| The Soil Shed | cast-41-shed | Different beanie/face |
| Patchwork Grow Diaries | cast-42-patchwork | Chibi, 33.3 → 30 |
| Canopy Conversations | cast-43-canopy | Chibi, different hair |
| Pheno Hunters HQ | cast-44-pheno | Chibi, spiky green "hat" hair |
| Ask Auntie Fern | cast-45-fern | Chibi, different hair |
| Tinkerbench | cast-46-tinker | Chibi, 33.3 → 28.7 |
| Netted & Neat | cast-47-netted | Chibi, tall 34.7 → 29.7 |
| June (threads part-timer) | cast-53-threadsPT | Different hair colour and outfit |
| Kai (market part-timer) | cast-54-marketPT | Chibi with an afro, 33.3 → 28 |
| Volunteer desk | cast-55-communityPT | Chibi, 33.3 → 29 |
| Night desk | cast-56-labPT | Chibi, 33.3 → 30 |
| Officer | cast-57-officer | Smaller, different cap and body |

**Fix:** author `actions/batch-12…batch-15` for these 20 (five per batch, same as batches 01–11) in the approved illustrated style. Register them at the same heights as the idle art. Until that art exists, don't fall back to `generic()` for NPCs with authored idle art. Instead, show the authored idle sprite with a small "nose-hold" overlay or a sniff emote bubble. That keeps the style consistent.

### B. Authored pose exists but is wrong

| Character | Batch | Problem |
|---|---|---|
| **Marcus Bell** | batch-01 | Pose is much bulkier: wider shoulders, larger torso and head. Height 34 vs idle 33.3. This is the "Marcus looks big" case. Re-register it to idle width and height. |
| **Mateo Market** | batch-02 | Same problem: noticeably bigger torso and head than idle. |
| **Nico Rivera** | batch-03 | Broken: different hairstyle (huge afro with shaved side vs short curls), crouched pose, looks like another person. Redraw. |
| **Inés Calderón** | batch-01 | Registered at full adult height: 34 vs her `short` idle at 31. She grows about 10% when reacting. Register at 93/108 like her idle. |
| Mara Rivera, Eli Rivera, Jun Cho | batch-03 / batch-05 | Head and hair noticeably larger than idle. Reduce to idle head scale. |
| Tobias, Bev, Kenji, Elena | batch-02 | +0.7 units (34 vs 33.3). Minor. Re-register to the idle height when re-exporting. |

**Fix:** extend `actions/register-batch.py` to register each pose using the same `height` rule as `cast/sources/extract.py` (kid 82, short 93, tall 104, else 100 px of 108). Also clamp the torso width to the idle sprite's width ±10%. Add the size check from `tools/audit-characters.cjs` to `npm test`: nose-pose height must be within ±1 unit of idle height for every direction.

---

## P1: Identity and consistency problems

### 4. Same person, two different looks
| Name | Look A (`collections.patients`) | Look B (`NPC_LOOK`, used in world and dialogue) |
|---|---|---|
| Marisol Vega | cast-39: curly hair, yellow tee, no hat | cast-67: green bucket hat, glasses, overalls (matches the screenshot) |
| Theo Park | cast-38: buzz cut, black tee | cast-66: stocky, garden top, joggers |
| Rosalind Ortega | cast-37: average build, purple top | cast-65: short, curvy, bun, skirt, knitting |

`PATIENTS[id].look` (`src/game.html:852+`, using legacy `hair`/`style`/`shirt` fields) and `NPC_LOOK[id]` (`src/game.html:2294-2296`) describe different people. Both were authored as separate cast entries, so whichever object a UI reads decides which person appears. The visit sprite and dialogue portrait in the screenshot use look B. Any UI that draws `PATIENTS[id].look` shows look A, a different person with the same name. Look A's smell pose also falls back to the procedural style (see P0-A).
**Fix:** pick one look per person, make `PATIENTS[id].look` reference `NPC_LOOK[id]`, and delete the unused cast entry and art.

### 5. Unknown NPC ids silently draw as Doug
`src/game.html:2304` and `6431`: `return NPC_LOOK[who] || NPC_LOOK.doug;`. Any typo or missing id renders Doug Haskell. **Fix:** log a warning and use a neutral generic look, or make it an error in tests.

### 6. Player is shorter than everyone else
The custom player (procedural/modular renderer, 96×144 canvas) measures **31.3 units idle and 30.7 walking**. Adult NPCs are **33.3**. With default settings, the player is about 6% shorter than an average adult NPC, close to the "short" NPC height (31). That makes NPCs like Kenji and Arthur (tall, 34.7) look noticeably larger next to the player, as in the park screenshot.
**Fix:** in `renderer.js` `generic()`, scale the body and head so the default `average` adult reaches 100/108 px, the same as NPCs. Keep the slim, broad, tall and short multipliers relative to that.

### 7. The player's portrait is a different style
In `portraits.png`, every NPC portrait is an illustrated bust. The player's portrait (procedural `portrait()` path) is smaller in frame, flatter and simpler. **Fix:** fit the procedural portrait to the same head size and framing as the authored portraits (head about 60% of frame height), or generate player portraits from the same layered head art at a larger scale.

### 8. Side and profile views of broad characters look thin
Marcus is `broad`, 51 px wide from the front but 33 px from the side. Ronan, Hugo, Cure Corner and Mateo are similar. Front to side, these characters look like they change body type. This is low priority. If the art is redone, give broad and stocky profiles a deeper chest and belly instead of a straight-line torso.

---

## Characters with no problems found
Idle and walk art for all 73 appearances is consistent in style and height. These characters also have correct, on-style smell poses: Remy, Doug, Priya, Poppy, Rosa, Leo, Alma, Owen (art only; see P0-1), Amina, Ronan, Leila, Cass, Rosie, Arthur, Nadia, Dev Imani, Ari Bell, Sam Bell, Talia, Luz, Jules, Dev, Sasha, Ari, Rosalind (both), Theo (cast-66), Marisol (cast-67), Cure Corner, Lumen & Loam, Ana, Wes, Dez, Business rep, Dr. Amani, Grandma Green, Pixel Seeds, Moon Medicine, AutoPilot, Swamp Wizard.

## Suggested order for Codex
1. Exclude `prop` from the canonical key and fix `drawTinyPerson` (fixes Owen and all prop owners, small change).
2. Add the no-fallback guard: never use `generic()` for an NPC with authored idle art. Use the idle sprite plus an overlay instead. This removes every chibi pose immediately.
3. Re-register the Marcus, Mateo, Inés, Mara, Eli and Jun poses to idle size, and redraw Nico's pose.
4. Author nose poses for the 20 missing characters.
5. Unify the Marisol, Theo and Rosalind looks and fix the `NPC_LOOK.doug` fallback.
6. Raise the player's height to 33.3 and restyle the player portrait.
7. Add `tools/audit-characters.cjs` checks to `npm test`.
