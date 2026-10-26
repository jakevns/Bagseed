# Garden and companion plant visual-update plan

Status: batches 1–8 are accepted and integrated (40 species). Batch 9 is in progress; later batches retain their original artwork. The ranked order below is the saved production plan.

Order is **highest to lowest visual-update priority**, based on current pot visibility, the reported lettuce/pot issues, companion interactions and reusable botanical components. This is an art-production ranking, not a claim about botanical or economic importance. No usage analytics were available.

## Catalog audit

- 151 standard species: the 150 entries in GP_DATA.plants plus separately registered Calendula (P151).
- 12 separately named rare varieties, inheriting their parent species' planting flags.
- **163 garden plant identities total; 132 fit main grow pots.**
- **76 also fit side pots.** Side-pot eligibility and companion-effect eligibility are different; not every side-pot plant grants a companion bonus.
- 31 identities have the game's companion-effect flag, including outdoor-only flowers.
- Main grow pots reject large and trellis-requiring plants. Side pots require indoor-friendly and non-large flags. Garden-only species are retained in the final batches for later outdoor work.
- A separate 20-entry tree catalog is listed below, outside this pot-plant pass. These trees are distinct entries even where names overlap fruit plants.

Source: src/game.html, GP_DATA, GP.build, GP.canPlant and GrowPotGarden. Store eligibility labels alone are not used as the main-pot rule.

## Five at a time

Every approved plant needs its actual four game stages (sprouting, young, growing, ready/in bloom), anatomically distinct leaves/stems/flowers/produce, attached wind animation with fixed roots, reduced-motion stillness, correct soil/rim placement in both eligible pot types, and matching store, inventory and plant-menu imagery. Preserve existing regrowth/perennial behavior; visually reset after harvest where the simulation already does. Add rare color/fruit patterns when that named variety reaches its batch. Do not change planting rules or gameplay.

Use high-resolution painted rendering consistent with the approved plants. Review each batch with stage sheets, in-pot samples, detail images and a wind clip before publishing. Check center stems, flower heads, root positions and canopy bounds in every stage; test both reduced motion and normal wind, and preserve foreground pot rims and tent/player occlusion. A leaf or petal extending below a stem must never become its attachment anchor.

## Ranked batches

Batches 1–26 contain five main-pot plants each. Batch 27 starts with the final two main-pot plants, then three garden-only plants. The remaining batches are garden-only. The last batch has three entries because the catalog is not a multiple of five.

| Batch | Plants, in priority order |
| --- | --- |
| 1 | Lettuce; Bok choy; Basil; Mint; Marigold |
| 2 | Chamomile; Lavender; Calendula; Sweet alyssum; Nasturtium |
| 3 | Thyme; Chives; Dill; Cilantro; Thai basil |
| 4 | Spinach; Swiss chard; Arugula; Rosemary; Lemon balm |
| 5 | Parsley; Sage; Oregano; Strawberry; Jalapeno |
| 6 | Kale; Mustard greens; Mizuna; Tatsoi; Collard greens |
| 7 | Tomato; Bell pepper; Carrot; Beet; Radish |
| 8 | Broccoli; Cauliflower; Cabbage; Kohlrabi; Celery |
| 9 | Tarragon; Marjoram; Summer savory; Chervil; Lemon verbena |
| 10 | Lemongrass; Tulip; Daffodil; Crocus; Hyacinth |
| 11 | Grape hyacinth; Snowdrop; Primrose; Pansy; Viola |
| 12 | Ranunculus; Anemone; Petunia; Impatiens; Begonia |
| 13 | Geranium; Portulaca; Dianthus; Chrysanthemum; Sedum stonecrop |
| 14 | Hosta; Heuchera; Coleus; Ornamental kale; Dusty miller |
| 15 | Fern; Succulent rosette; Dwarf heather; Poinsettia; Amaryllis |
| 16 | Christmas cactus; Paperwhite narcissus; Cyclamen; Hellebore; Anise hyssop |
| 17 | Zinnia; Cosmos; Bachelor button; Goldenrod; Rudbeckia |
| 18 | Echinacea; Salvia; Coreopsis; Yarrow; Turnip |
| 19 | Parsnip; Rutabaga; Daikon; Onion; Garlic |
| 20 | Shallot; Leek; Fava bean; Celeriac; Eggplant |
| 21 | Okra; Tomatillo; Green bean; Soybean; Iris |
| 22 | Snapdragon; California poppy; Celosia; Gomphrena; Larkspur |
| 23 | Scabiosa; Aster; Japanese anemone; Helenium; Rose |
| 24 | Delphinium; Lupine; Hollyhock; Columbine; Ornamental grass |
| 25 | Dwarf boxwood; Violet Kitchen; Sunset Button; Festival Climber; Snowlace |
| 26 | Grandad's Ruby; Copper Ribbon; Peach Lantern; Willow Blue; Willow Street Stripe |
| 27 | Lantern Gold; Midnight Ruffle; Brussels sprouts [garden-only]; Garden peas [garden-only]; Sweet corn [garden-only] |
| 28 | Sweet potato [garden-only]; Cucumber [garden-only]; Zucchini [garden-only]; Pattypan squash [garden-only]; Butternut squash [garden-only] |
| 29 | Acorn squash [garden-only]; Spaghetti squash [garden-only]; Pumpkin [garden-only]; Watermelon [garden-only]; Cantaloupe [garden-only] |
| 30 | Honeydew [garden-only]; Blueberry [garden-only]; Raspberry [garden-only]; Blackberry [garden-only]; Gooseberry [garden-only] |
| 31 | Redcurrant [garden-only]; Blackcurrant [garden-only]; Grape [garden-only]; Apple [garden-only]; Pear [garden-only] |
| 32 | Peach [garden-only]; Fig [garden-only]; Sunflower [garden-only]; Sweet pea [garden-only]; Dahlia [garden-only] |
| 33 | Tithonia [garden-only]; Peony [garden-only]; Moonbeam Mini [garden-only] |

## Exact identities and planting eligibility

| Rank | ID | Plant | Main pot | Side pot | Companion flag | Rare parent |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | P001 | Lettuce | Yes | Yes | No |  |
| 2 | P010 | Bok choy | Yes | Yes | No |  |
| 3 | P051 | Basil | Yes | Yes | Yes |  |
| 4 | P061 | Mint | Yes | Yes | Yes |  |
| 5 | P098 | Marigold | Yes | Yes | Yes |  |
| 6 | P070 | Chamomile | Yes | Yes | Yes |  |
| 7 | P126 | Lavender | Yes | Yes | Yes |  |
| 8 | P151 | Calendula | Yes | Yes | Yes |  |
| 9 | P108 | Sweet alyssum | Yes | Yes | Yes |  |
| 10 | P105 | Nasturtium | Yes | Yes | Yes |  |
| 11 | P058 | Thyme | Yes | Yes | Yes |  |
| 12 | P056 | Chives | Yes | Yes | Yes |  |
| 13 | P055 | Dill | Yes | Yes | Yes |  |
| 14 | P053 | Cilantro | Yes | Yes | Yes |  |
| 15 | P052 | Thai basil | Yes | Yes | Yes |  |
| 16 | P002 | Spinach | Yes | Yes | No |  |
| 17 | P004 | Swiss chard | Yes | Yes | No |  |
| 18 | P003 | Arugula | Yes | Yes | No |  |
| 19 | P057 | Rosemary | Yes | Yes | No |  |
| 20 | P062 | Lemon balm | Yes | Yes | No |  |
| 21 | P054 | Parsley | Yes | Yes | No |  |
| 22 | P059 | Sage | Yes | Yes | No |  |
| 23 | P060 | Oregano | Yes | Yes | No |  |
| 24 | P071 | Strawberry | Yes | Yes | No |  |
| 25 | P033 | Jalapeno | Yes | Yes | No |  |
| 26 | P005 | Kale | Yes | No | No |  |
| 27 | P007 | Mustard greens | Yes | Yes | No |  |
| 28 | P008 | Mizuna | Yes | Yes | No |  |
| 29 | P009 | Tatsoi | Yes | Yes | No |  |
| 30 | P006 | Collard greens | Yes | No | No |  |
| 31 | P031 | Tomato | Yes | No | No |  |
| 32 | P032 | Bell pepper | Yes | No | No |  |
| 33 | P011 | Carrot | Yes | Yes | No |  |
| 34 | P012 | Beet | Yes | Yes | No |  |
| 35 | P013 | Radish | Yes | Yes | No |  |
| 36 | P021 | Broccoli | Yes | No | No |  |
| 37 | P022 | Cauliflower | Yes | No | No |  |
| 38 | P023 | Cabbage | Yes | No | No |  |
| 39 | P025 | Kohlrabi | Yes | No | No |  |
| 40 | P027 | Celery | Yes | No | No |  |
| 41 | P063 | Tarragon | Yes | Yes | No |  |
| 42 | P064 | Marjoram | Yes | Yes | No |  |
| 43 | P065 | Summer savory | Yes | Yes | No |  |
| 44 | P066 | Chervil | Yes | Yes | No |  |
| 45 | P067 | Lemon verbena | Yes | Yes | No |  |
| 46 | P068 | Lemongrass | Yes | Yes | No |  |
| 47 | P083 | Tulip | Yes | Yes | No |  |
| 48 | P084 | Daffodil | Yes | Yes | No |  |
| 49 | P085 | Crocus | Yes | Yes | No |  |
| 50 | P086 | Hyacinth | Yes | Yes | No |  |
| 51 | P087 | Grape hyacinth | Yes | Yes | No |  |
| 52 | P088 | Snowdrop | Yes | Yes | No |  |
| 53 | P090 | Primrose | Yes | Yes | No |  |
| 54 | P091 | Pansy | Yes | Yes | No |  |
| 55 | P092 | Viola | Yes | Yes | No |  |
| 56 | P093 | Ranunculus | Yes | Yes | No |  |
| 57 | P094 | Anemone | Yes | Yes | No |  |
| 58 | P099 | Petunia | Yes | Yes | No |  |
| 59 | P100 | Impatiens | Yes | Yes | No |  |
| 60 | P101 | Begonia | Yes | Yes | No |  |
| 61 | P102 | Geranium | Yes | Yes | No |  |
| 62 | P109 | Portulaca | Yes | Yes | No |  |
| 63 | P114 | Dianthus | Yes | Yes | No |  |
| 64 | P116 | Chrysanthemum | Yes | Yes | No |  |
| 65 | P123 | Sedum stonecrop | Yes | Yes | No |  |
| 66 | P135 | Hosta | Yes | Yes | No |  |
| 67 | P136 | Heuchera | Yes | Yes | No |  |
| 68 | P137 | Coleus | Yes | Yes | No |  |
| 69 | P138 | Ornamental kale | Yes | Yes | No |  |
| 70 | P139 | Dusty miller | Yes | Yes | No |  |
| 71 | P140 | Fern | Yes | Yes | No |  |
| 72 | P142 | Succulent rosette | Yes | Yes | No |  |
| 73 | P144 | Dwarf heather | Yes | Yes | No |  |
| 74 | P145 | Poinsettia | Yes | Yes | No |  |
| 75 | P146 | Amaryllis | Yes | Yes | No |  |
| 76 | P147 | Christmas cactus | Yes | Yes | No |  |
| 77 | P148 | Paperwhite narcissus | Yes | Yes | No |  |
| 78 | P149 | Cyclamen | Yes | Yes | No |  |
| 79 | P150 | Hellebore | Yes | Yes | No |  |
| 80 | P069 | Anise hyssop | Yes | No | Yes |  |
| 81 | P096 | Zinnia | Yes | No | Yes |  |
| 82 | P097 | Cosmos | Yes | No | Yes |  |
| 83 | P107 | Bachelor button | Yes | No | Yes |  |
| 84 | P118 | Goldenrod | Yes | No | Yes |  |
| 85 | P121 | Rudbeckia | Yes | No | Yes |  |
| 86 | P122 | Echinacea | Yes | No | Yes |  |
| 87 | P128 | Salvia | Yes | No | Yes |  |
| 88 | P129 | Coreopsis | Yes | No | Yes |  |
| 89 | P130 | Yarrow | Yes | No | Yes |  |
| 90 | P014 | Turnip | Yes | No | No |  |
| 91 | P015 | Parsnip | Yes | No | No |  |
| 92 | P016 | Rutabaga | Yes | No | No |  |
| 93 | P017 | Daikon | Yes | No | No |  |
| 94 | P018 | Onion | Yes | No | No |  |
| 95 | P019 | Garlic | Yes | No | No |  |
| 96 | P020 | Shallot | Yes | No | No |  |
| 97 | P026 | Leek | Yes | No | No |  |
| 98 | P029 | Fava bean | Yes | No | No |  |
| 99 | P030 | Celeriac | Yes | No | No |  |
| 100 | P034 | Eggplant | Yes | No | No |  |
| 101 | P035 | Okra | Yes | No | No |  |
| 102 | P037 | Tomatillo | Yes | No | No |  |
| 103 | P038 | Green bean | Yes | No | No |  |
| 104 | P039 | Soybean | Yes | No | No |  |
| 105 | P089 | Iris | Yes | No | No |  |
| 106 | P103 | Snapdragon | Yes | No | No |  |
| 107 | P106 | California poppy | Yes | No | No |  |
| 108 | P110 | Celosia | Yes | No | No |  |
| 109 | P111 | Gomphrena | Yes | No | No |  |
| 110 | P112 | Larkspur | Yes | No | No |  |
| 111 | P113 | Scabiosa | Yes | No | No |  |
| 112 | P117 | Aster | Yes | No | No |  |
| 113 | P119 | Japanese anemone | Yes | No | No |  |
| 114 | P120 | Helenium | Yes | No | No |  |
| 115 | P125 | Rose | Yes | No | No |  |
| 116 | P131 | Delphinium | Yes | No | No |  |
| 117 | P132 | Lupine | Yes | No | No |  |
| 118 | P133 | Hollyhock | Yes | No | No |  |
| 119 | P134 | Columbine | Yes | No | No |  |
| 120 | P141 | Ornamental grass | Yes | No | No |  |
| 121 | P143 | Dwarf boxwood | Yes | No | No |  |
| 122 | RARE007 | Violet Kitchen | Yes | Yes | Yes | P051 |
| 123 | RARE009 | Sunset Button | Yes | Yes | Yes | P098 |
| 124 | RARE011 | Festival Climber | Yes | Yes | Yes | P105 |
| 125 | RARE012 | Snowlace | Yes | Yes | Yes | P108 |
| 126 | RARE004 | Grandad's Ruby | Yes | Yes | No | P012 |
| 127 | RARE005 | Copper Ribbon | Yes | Yes | No | P004 |
| 128 | RARE008 | Peach Lantern | Yes | No | Yes | P096 |
| 129 | RARE010 | Willow Blue | Yes | No | Yes | P107 |
| 130 | RARE001 | Willow Street Stripe | Yes | No | No | P031 |
| 131 | RARE002 | Lantern Gold | Yes | No | No | P032 |
| 132 | RARE006 | Midnight Ruffle | Yes | No | No | P005 |
| 133 | P024 | Brussels sprouts | No | No | No |  |
| 134 | P028 | Garden peas | No | No | No |  |
| 135 | P036 | Sweet corn | No | No | No |  |
| 136 | P040 | Sweet potato | No | No | No |  |
| 137 | P041 | Cucumber | No | No | No |  |
| 138 | P042 | Zucchini | No | No | No |  |
| 139 | P043 | Pattypan squash | No | No | No |  |
| 140 | P044 | Butternut squash | No | No | No |  |
| 141 | P045 | Acorn squash | No | No | No |  |
| 142 | P046 | Spaghetti squash | No | No | No |  |
| 143 | P047 | Pumpkin | No | No | No |  |
| 144 | P048 | Watermelon | No | No | No |  |
| 145 | P049 | Cantaloupe | No | No | No |  |
| 146 | P050 | Honeydew | No | No | No |  |
| 147 | P072 | Blueberry | No | No | No |  |
| 148 | P073 | Raspberry | No | No | No |  |
| 149 | P074 | Blackberry | No | No | No |  |
| 150 | P075 | Gooseberry | No | No | No |  |
| 151 | P076 | Redcurrant | No | No | No |  |
| 152 | P077 | Blackcurrant | No | No | No |  |
| 153 | P078 | Grape | No | No | No |  |
| 154 | P079 | Apple | No | No | No |  |
| 155 | P080 | Pear | No | No | No |  |
| 156 | P081 | Peach | No | No | No |  |
| 157 | P082 | Fig | No | No | No |  |
| 158 | P095 | Sunflower | No | No | Yes |  |
| 159 | P104 | Sweet pea | No | No | No |  |
| 160 | P115 | Dahlia | No | No | No |  |
| 161 | P124 | Tithonia | No | No | Yes |  |
| 162 | P127 | Peony | No | No | No |  |
| 163 | RARE003 | Moonbeam Mini | No | No | No | P047 |

## Separate tree catalog, future pass

Dwarf apple (TREE001), Dwarf pear (TREE002), Dwarf fig (TREE003), Dwarf peach (TREE004), Dwarf plum (TREE005), Dwarf lemon (TREE006), Dwarf lime (TREE007), Dwarf orange (TREE008), Dwarf cherry (TREE009), Pomegranate (TREE010), Compact avocado (TREE011), Crape myrtle (TREE012), Eastern redbud (TREE013), Japanese maple (TREE014), Magnolia (TREE015), Birch (TREE016), Compact pine (TREE017), Jacaranda (TREE018), Backyard willow (TREE019), Oak (TREE020).
