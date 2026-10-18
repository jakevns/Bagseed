# Custom hair and neck audit — 2026-10-17

**Superseded:** the user rejected this cropped review and its conclusions. See [the uncropped alignment audit](custom-alignment-audit.md) and [full-body comparisons](../../review/custom-alignment/index.html). This older report is retained as history, not approval evidence.

Revision: `character-hair-neck-audit-v5`.

The previous pass restored interior hair ink but only showed six examples. This review inspects all 60 hairstyles plus Bald individually: front, right, back and left; white and purple hair; native head detail and a game-size figure. Every style has a card in the [hair gallery](../../review/custom-hair-audit/index.html). This is a visual review of the soft head; the regression tests separately exercise the other head/ear shapes, builds, colors, hats and layering. No original hairstyle is replaced with a generic new cut.

The approved Curly treatment remains the reference. Connected part, lock, curl and braid strokes use warm brown ink. Loose long styles have softer shadows; dense curls get a larger minimum connected stroke; buzz cuts use clean translucent scalp coverage rather than accidental long ink fragments. Fades now taper at the rear as well as the temples. Their visible scalp is intentional, unlike a missing rear cap on a full hairstyle. Balding and cornrows retain their intentional exposed scalp.

## Neck findings and correction

The old jaw was attached near an inferred rig neck point inside the garment. The detached head also carried an outlined neck stump. Simply adding neck pixels left a skin patch on the chest, and raising only the head made walking taller. Registration now reads the original garment's physical cut neck and collar, fits each walking body from the feet to the standing collar span, and attaches the head's neck root there. Head neck material continues without its old bottom rim; the original garment fabric and collar ink occlude it. Only connected neck material is retained, preventing detached skin flecks. The player sniff reaction reuses the same fitted idle body instead of its older authored head/neck.

The [garment gallery](../../review/custom-hair-audit/necks/index.html) contains all 15 tops, idle and every walking frame, in all four directions (420 composites). Hair is removed for these close-ups so it cannot hide seams. The 1.8x bedroom/grow-room scene scale remains in use, and figures are composed at native 288-pixel width. See the [curly hair idle/walking example](../../review/custom-render-clarity/idle-walk-neck.png) for the complete assembled character.

## Individual hairstyle review

| Style | Review | Result |
|---|---|---|
| [Bald](../../review/custom-hair-audit/bald.png) | Reviewed | Intentional bare scalp; no artificial hair ink. |
| [Short](../../review/custom-hair-audit/short.png) | Reviewed | Retain swept locks, clean forehead opening and foreground ears. |
| [Buzzed](../../review/custom-hair-audit/buzz.png) | Cleaned | Remove stray long marks and broad shade bands; use translucent close-shaven coverage. |
| [Medium](../../review/custom-hair-audit/medium.png) | Reviewed | Layered lock lines continue through both profiles and the nape. |
| [Long](../../review/custom-hair-audit/long.png) | Cleaned | Retain full lengths and part lines; soften the dark lower shading block. |
| [Bob](../../review/custom-hair-audit/bob.png) | Reviewed | Keep the curved hem, internal strands and covered ear roots. |
| [Curly](../../review/custom-hair-audit/curly.png) | Reviewed | Approved reference: retain the current curl and part line treatment. |
| [Wavy](../../review/custom-hair-audit/wavy.png) | Cleaned | Retain wave boundaries; soften the lower shadow mass. |
| [Bun](../../review/custom-hair-audit/bun.png) | Reviewed | Keep gathered crown lines, bun contour and visible ears. |
| [Ponytail](../../review/custom-hair-audit/ponytail.png) | Reviewed | Keep swept crown, hair tie and complete tail. |
| [Braids](../../review/custom-hair-audit/braids.png) | Reviewed | Retain braid crossings and complete ends; ears stay in front. |
| [Locs](../../review/custom-hair-audit/locs.png) | Cleaned | Retain solid lock boundaries; soften the darker lower lengths. |
| [Afro](../../review/custom-hair-audit/afro.png) | Cleaned | Filter short disconnected texture fragments while retaining connected curl outlines. |
| [Mohawk](../../review/custom-hair-audit/mohawk.png) | Reviewed | Keep deliberate bare sides, central ridge and rear strip. |
| [Shaved Side](../../review/custom-hair-audit/sidecut.png) | Reviewed | Keep the intentionally shaved side and the swept opposite side. |
| [Thinning Top](../../review/custom-hair-audit/balding.png) | Reviewed | Keep the thin side/rear ring; do not fill the intentionally bare crown. |
| [Pixie](../../review/custom-hair-audit/pixie.png) | Reviewed | Short layered lines remain fitted around the ears and nape. |
| [Side-swept pixie](../../review/custom-hair-audit/sidepixie.png) | Reviewed | Keep the asymmetric swept fringe and short rear cap. |
| [Textured crop](../../review/custom-hair-audit/crop.png) | Reviewed | Retain short textured lock groups without adding speckle. |
| [Caesar](../../review/custom-hair-audit/caesar.png) | Reviewed | Keep straight fringe, curved crown lines and clean nape. |
| [Low fade](../../review/custom-hair-audit/fade.png) | Cleaned | Apply the scalp fade to the rear as well as the temples; remove the opaque nape band. |
| [High-top fade](../../review/custom-hair-audit/hightop.png) | Cleaned | Retain the raised curl top; taper side/rear coverage into the selected skin. |
| [Flat-top](../../review/custom-hair-audit/flattop.png) | Cleaned | Keep the intentional level top and top-edge strokes; fade the rear cap. |
| [Quiff](../../review/custom-hair-audit/quiff.png) | Cleaned | Keep swept crown strokes; fade the rear rather than leaving a solid lower band. |
| [Pompadour](../../review/custom-hair-audit/pomp.png) | Cleaned | Preserve the rolled top; taper the sides and nape. |
| [Slicked back](../../review/custom-hair-audit/slick.png) | Reviewed | Keep coherent swept-back strokes and full rear cap. |
| [Spiky](../../review/custom-hair-audit/spikes.png) | Reviewed | Keep separate spike contours and their root lines. |
| [Faux-hawk](../../review/custom-hair-audit/fauxhawk.png) | Cleaned | Preserve the central ridge and soften side/rear fade coverage. |
| [Curly top fade](../../review/custom-hair-audit/curlytop.png) | Cleaned | Retain curl outlines while tapering the temples and nape. |
| [Short twists](../../review/custom-hair-audit/twistsS.png) | Reviewed | Keep connected twist boundaries in all four views. |
| [Bowl cut](../../review/custom-hair-audit/bowl.png) | Reviewed | Retain the rounded fringe, ear openings and complete rear cap. |
| [Curtain bangs](../../review/custom-hair-audit/curtains.png) | Reviewed | Keep the centre part and curved loose ends. |
| [Angled bob](../../review/custom-hair-audit/angledbob.png) | Reviewed | Keep the angled profile hem and clean strand lines. |
| [Asymmetric bob](../../review/custom-hair-audit/asymbob.png) | Reviewed | Keep the intended unequal sides; do not force the long fringe away from the eye. |
| [Braided bob](../../review/custom-hair-audit/braidbob.png) | Reviewed | Keep the crown braid, gathered rear section and loose lower locks. |
| [Lob](../../review/custom-hair-audit/lob.png) | Cleaned | Preserve shoulder-length ends and soften lower shading. |
| [Shag](../../review/custom-hair-audit/shag.png) | Reviewed | Keep separate shag layers and a closed rear scalp. |
| [Wolf cut](../../review/custom-hair-audit/wolf.png) | Reviewed | Keep short crown layers and longer nape strands. |
| [Mullet](../../review/custom-hair-audit/mullet.png) | Reviewed | Keep short sides and complete long nape. |
| [Curly bob](../../review/custom-hair-audit/curlybob.png) | Reviewed | Retain curved locks and the curly lower hem. |
| [Twist-out](../../review/custom-hair-audit/twistout.png) | Cleaned | Filter small texture fragments without losing the twist structure. |
| [Afro puff](../../review/custom-hair-audit/puff.png) | Cleaned | Clean puff texture fragments; keep the smooth gathered scalp and tendrils. |
| [Twin puffs](../../review/custom-hair-audit/puffs.png) | Cleaned | Clean disconnected puff texture while retaining both puff silhouettes. |
| [Top knot](../../review/custom-hair-audit/topknot.png) | Reviewed | Keep the tied knot, swept high hairline and rear cap; exposed forehead is intentional. |
| [Half-up bun](../../review/custom-hair-audit/halfup.png) | Reviewed | Keep the top bun and complete loose lengths above clothing. |
| [High ponytail](../../review/custom-hair-audit/ponyhi.png) | Reviewed | Keep the high tie and complete long tail; preserve the swept fringe. |
| [Side ponytail](../../review/custom-hair-audit/sidepony.png) | Reviewed | Keep the side tie and the asymmetric tail across all views. |
| [Space buns](../../review/custom-hair-audit/spacebuns.png) | Reviewed | Keep both tied buns and the fitted rear scalp. |
| [Bantu knots](../../review/custom-hair-audit/bantu.png) | Cleaned | Prune tiny fragments while keeping coherent knot spirals. |
| [Crown braid](../../review/custom-hair-audit/crownbraid.png) | Reviewed | Retain crown crossings and the gathered rear section. |
| [Low bun](../../review/custom-hair-audit/lowbun.png) | Reviewed | Keep the lower knot and swept crown strands. |
| [Layered long](../../review/custom-hair-audit/layered.png) | Cleaned | Retain complete layers and soften the darker lower lengths. |
| [Blunt long with bangs](../../review/custom-hair-audit/bluntlong.png) | Cleaned | Keep blunt fringe/end lines and reduce the harsh lower shadow block. |
| [Beach waves](../../review/custom-hair-audit/beachwaves.png) | Cleaned | Retain broad wave lines with lighter lower shading. |
| [Long curls](../../review/custom-hair-audit/longcurls.png) | Cleaned | Preserve complete curl lines and soften their lower shadow mass. |
| [Twin braids](../../review/custom-hair-audit/twinbraids.png) | Reviewed | Keep both braid crossings, roots and ends. |
| [Box braids](../../review/custom-hair-audit/boxbraids.png) | Cleaned | Keep narrow braid lines, filter tiny fragments and soften lower shading. |
| [Long twists](../../review/custom-hair-audit/longtwists.png) | Cleaned | Keep connected twist shapes and soften the lower shadow mass. |
| [Cornrows](../../review/custom-hair-audit/cornrows.png) | Cleaned | Keep narrow continuous rows and intentional scalp channels; reject tiny disconnected ink fragments. |
| [Loose side braid](../../review/custom-hair-audit/loosebraid.png) | Reviewed | Keep the side braid, tied end and swept crown. |
| [Big afro](../../review/custom-hair-audit/bigafro.png) | Cleaned | Keep the large round curl silhouette while filtering small disconnected texture marks. |

## Validation

37 focused regression checks passed across the hair and neck suites, including the affected checks rerun after reference updates:

- All 60 hairstyle layers in four directions and two colors (480 reviewed appearance hashes); identical alpha and ink placement across recolors. Interior strokes are checked well inside opaque hair on 57 styles (456 views). Buzz, the thinning ring and narrow cornrows have separate appropriate coverage expectations.
- Every head shape, selected ears and jewelry, complete rear caps, deliberate fades, transparent canvas margins, forehead strands, hats and blink placement.
- 12,960 covered-ear/jewelry comparisons, plus 6,480 loose-hair figure/walk/reaction comparisons and 30 portrait comparisons.
- Pixel-identical idle breathing in 120 looks, visible upper-neck material in 1,620 walking cases, and body/collar ownership across 5,400 garment/head/build/direction combinations.
- All 300 walking outfits (7,200 frames), 1,040 side-arm composites, and 1,800 waist-to-pelvis joins. Hand/flashlight and shoulder/arm checks project the authored references through the registered body transform.
- Short/child joins, reaction proportions and portraits, creator/mirror controls and disposable save/reload.
- Strict audit: 69 appearances, 276 direction comparisons, zero flagged rows. Rebuilt source/payload checks pass all 127 script blocks.

The concurrent saved-head-shape changes in `src/game.html` were preserved when rebuilding; their matching edits to the generated game were verified before replacement. The renderer changes are included in the publication; unapproved walk redraws remain separate from runtime art.

Reproduce the review with `node tools/review-custom-hair.cjs` and `node tools/review-custom-neck.cjs`. Appearance fixture updates are deliberate: the hair review tool only writes `hair-collection-v5.json` with `--write-fixture`. The standard `npm test` command includes the new regression tests and the strict character audit.
