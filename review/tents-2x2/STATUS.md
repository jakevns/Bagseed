# Approved tent update — production integration

The user approved these corrected samples and authorized publishing. The production build contains all three 2×2 shells, the narrower starter shells, recessed starter plant/pot, soft tent illumination and watering gear moved to the seedling desk’s right side. width-comparison.png and watering-placement.png are generated from public/index.html. approval-2x2.png shows all three shells and matching store images.

The starter is 54×90; the 2×2 is 86×112. Heights and capacities remain unchanged. The starter pot’s soil anchor is y74 at .86 scale, leaving visible liner in front of its base. Plant click rectangles follow that transform, while walk destinations stay outside. Front fabric covers the roof/sides/floor edges. The 2×2 has two independent live plants at recessed anchors. No final fabric pass paints over players.

report.json records production visual, target and layering checks: 36 2×2 equipment/pot cases, 36 player approach cases, four starter fabric cases, six starter floor-depth/pot cases, four watering tiers, nine zip frames per shell, three store cards and a phone card. publish-validation.json records real $89/$49/$95 purchases, delivery art, shell fitting, preserved plant identities/equipment, collision/placement and save/reload.

Source modules, original image checksums, lossless runtime assets and the rebuilt game are included in this release. The current character release from origin/main is preserved. Publishing this commit to main triggers the existing GitHub Pages workflow; deployment completion must be distinguished from a successful Git push.
