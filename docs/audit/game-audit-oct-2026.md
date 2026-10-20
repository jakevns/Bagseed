# Bagseed game audit and graphics priority list (October 19, 2026)

This audit uses the current `main` build. Every location was rendered in a real browser at 1 PM: [contact sheet](locations-oct-2026.jpg). Green means the new illustrated style. Orange means the original code-drawn pixel art.

## Short version

- **Done:** almost everything inside the bedroom, all grow gear, plants, the menu and loading screen, and the people. That covers the part of the game you play most.
- **Not started:** every other place in the game. That is 13 of 14 locations, including the rest of your own house.
- **Where the effort went:** about 46 of the 126 review folders are for the player character (hair, neck, faces, outfits, walk cycles). Most of that work is fine detail on one character.
- **Biggest visual problem:** the gap between the painted art and the old pixel art. Your house is the first place you walk into from the bedroom, so you see the difference every day. The top-down layout is the game's standard view (house, every building interior, backyard, community garden). The bedroom and grow room, with their tall front walls, are the exceptions.
- **Recommendation:** freeze the player character once the walk is done. Shelve Westbrook Way and the Threads clothing shop. Spend the art budget on the home loop first (house, grow room, backyard, Willow Lane), then town.

## 1. What's updated (new illustrated style)

| Area | Status |
| --- | --- |
| Main menu, loading screen | Done |
| Bedroom room, window, curtains, all 80 bed combos, desks, chairs, computer, coffee, under-desk storage | Done |
| Grow gear: starter / 2x2 / 4x4 / 5x5 tents, lights, fans, exhaust, humidifiers, dehumidifiers, heaters, AC, HVAC, sensors, cameras, water and pots | Done |
| Plants: ~40 strains, 15 mutations, garden plants, companion pots, growth and wind | Done |
| NPC people: 69 appearances with idle, reactions and portraits | Done (static / 4-pose walk) |
| NPC 8-pose walk (new standard) | Only Remy, Priya, Doug |
| Player: 60 hairstyles, faces, hoodie / flannel / cardigan / jacket idle and walk | Mostly done, still being polished |

## 2. What still uses old art

| Location | How often you see it | Notes |
| --- | --- | --- |
| **House** (kitchen, bath, living room, laundry, entry, Remy's room) | Every day | Old pixel art next to the painted bedroom. The most visible style gap. Its top-down layout matches the other interiors and should stay. |
| **Grow room** (den) | Every day once unlocked | Plain brick wall and concrete. The new tents get placed into an unfinished room. |
| **Backyard** | Every day in season | Flat grass. The garden beds and greenhouse are blocky. |
| **Willow Lane** (your street) | Every trip out | Clean pixel art. It works, but the new people look pasted on. |
| **Main Street** (town) | Most days | 11 storefronts |
| **Shop interiors** (café, Fern & Forge, hardware, market, community center, clinic, lab, Threads) | When shopping | 8 rooms, all built from the same simple block set |
| **Willow Park, Community Garden** | Occasionally | Large scenes |
| **Neighbor home interiors** | Rarely (friendship gated) | 9 houses, with upstairs floors |
| **Westbrook Way** | Rarely | 8 households, 24 residents |
| **Library** | Rarely | |

## 3. Player clothing math (why Threads is too much)

The creator offers 12 tops, 5 bottoms, 4 shoes, 6 hats, 4 glasses and 5 accessories on 6 body builds. Each piece needs idle and 8-pose walking art in 4 directions, and it has to fit every build.

So far, 4 tops (hoodie, flannel, cardigan, jacket) have approved hand-made art. The other 8 tops (tee, tank, sweater, overalls, work shirt, crop top, garden apron, pajamas) still need it. Threads sells cardigan, overalls, jacket, garden apron, rain boots, sun hat, bucket hat, shades, bandana and scarf. All of these raise the art bill for small gameplay value.

## 4. What to put away for now

**Done (October 19).** The flags are in `SHELVED` at the end of `src/game.html`. Each one can be switched back independently:
- `threads`: the Threads door shows a "closed for a refit" message, its sign reads CLOSED, LeafCart has no Threads tab and the online catalog is closed. Mara's volunteer task moved to the community center.
- `westbrook`: a road-work barrier closes the west edge of Willow Park. Saves inside Westbrook Way or its homes now load in the park. Residents still pass through the park, the community garden and Main Street. The park and the community garden stay open.
- `wardrobe`: the creator and mirror offer only hoodie, flannel, cardigan and jacket (cardigan and jacket are now owned from the start). Hats, glasses and accessories are hidden. Older saves keep whatever they already wear, and that piece stays selectable so it can be changed.


Hide these from the player rather than deleting them. The code and saves stay intact, and each can come back as an update.

1. **Willow Threads (clothing shop).** Close it with a "Coming soon" sign. Nothing in the grow loop depends on it.
2. **Trim the creator wardrobe to approved pieces only.** Keep hoodie, flannel, cardigan and jacket, plus the bottoms and shoes that already look right. Hide hats, glasses and accessories until the base outfits are final. Players then never see an unfinished garment.
3. **Westbrook Way.** Close the west park path ("road work", or a fence with a sign). That removes 8 houses, 24 residents and 9 interiors from the to-do list. It is a good "Update 2: New Neighbors" later.
4. **Optional:** gate Willow Park, the Community Garden and the Library behind "coming soon" too. Then the playable map is **home, Willow Lane and Main Street**. The park is the route to Westbrook, so close at least its west exit.
5. **Keep** the clinic, lab and other shop *functions*: patients, testing, buying gear and seeds. Their interiors can wait. They work fine as menus.

## 5. Priority list

The order follows what the player sees most and what breaks immersion most. Each item is one focused job with a clear "done".

### Tier 1: finish what's in flight, then stop

1. **Finish the player walk** (current Codex job), then declare the player character frozen. No more face, neck or hair passes unless something is visibly broken at normal game zoom. Note any small issues on a list for later.
2. **Face detail: do one pass at gameplay zoom only.** In-game the whole player is about 33 world units tall, so the face is only a small part of the screen. Polish beyond what shows there is spent usage that nobody sees.

### Tier 2: the home loop (where players spend most of their time)

3. **House: repaint it in the new style, keeping its top-down layout.** Floors, walls and doors first, then the kitchen and living room. These are the same pieces every other interior uses, so painting them once also covers the shops and neighbor homes later. The bedroom's tall-wall view is the one exception in the game. Whether it should eventually match the top-down rooms is your call, but it works as it is and doesn't need usage now.
4. **Grow room shell.** One painted room background (walls, floor, door, shelf). The tents are already done, so this is cheap and gives a big payoff.
5. **Backyard.** Painted ground, house wall and fence, plus the garden beds and greenhouse tiers.
6. **Kitchen and living room furniture.** Fridge, stove, table, couch and TV: the pieces players actually click.

### Tier 3: leaving the house

7. **Willow Lane.** Repaint the 7 house facades, the sidewalk and the bus stop. All are reusable pieces.
8. **NPC walk for the 8 Willow Lane neighbors.** Remy, Priya and Doug are done, so 5 remain: Marcus, Inés, Tobias, Bev and Kenji. These are the people you see walking every day.
9. **Main Street storefronts.** One facade per shop. Do the shops you actually use first: Fern & Forge, café, hardware, market.

### Tier 4: interiors and story

10. **Shop interiors:** Fern & Forge first (the seed shop), then café and market. One shared "shop shell" with different props keeps the cost down.
11. **Storyline pass.** The writing for the 8 neighbors and Remy already exists (`STORY115`). Focus the story on those characters while Westbrook is shelved, which keeps it small enough to finish.
12. **Other NPC walks:** shop staff, then patients.

### Later (an update after the core is polished)

- Westbrook Way, its households and their interiors
- Neighbor home interiors (friendship-gated, so few players reach them early)
- Willow Park, Community Garden, Library
- Threads, plus the extra tops, hats, glasses and accessories
- Extra body builds for each garment, if 6 builds turns out to be too many

## 6. How to save usage

- **Give each Codex task a "done" line.** For example: "Done when it looks right at 1x in-game zoom on phone and desktop." Without one, agents keep polishing.
- **Batch with shared parts.** Design one set of walls, floors, doors and windows, then reuse it in the house, shops and homes, instead of painting each room from scratch.
- **Don't open new categories while one is in flight.** Finish the walk, then the house, then the yard.
- **Repo size.** `review/` is 1.7 GB and `graphics/` is 859 MB. This slows every fresh clone, and so every cloud session. Moving old, already-approved review folders out of the repo (or into a release archive) would help. This is a separate cleanup job, not urgent.
