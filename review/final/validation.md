# Final validation

This is the integrated release of the user-approved illustrated Study 02. The immutable supplied flashlight HTML and the user's reference DOCX remain retained. The editable gameplay source is identical to the supplied build; only a final graphics script and embedded lossless artwork are added to the generated HTML.

## Automated browser checks

The release browser suite contains 12 checks: original-build save loading; all 60 hairstyles, 16 skin palettes, 40 hair colors and 240 clothing designs; appearance options and unchanged state; seating and standing; shop interactions and scene transitions; Next Track state; 14 flashlight carriers across four directions and three frames with obstacle checks; live smell encounter and Escape dismissal; new game and creation; four-direction movement; wardrobe/save/reload; cast/day/night rendering; portrait and landscape phone viewport emulation. See the retained test source and test-summary.txt for exact outcomes.

The final capture runner also opens an actual Trellis video and checks play, replay, loop toggle and differing animation frames. Its capture-report.json records the result, browser errors, full source appearance coverage and mobile overflow checks. It exports the full roster on three game backgrounds, all 60 hairstyles, 16 representative player combinations, and before/after scenes using the original and updated builds.

The source roster contains appearance variants and aliases; counts do not imply 72 different people. The new cast have four authored standing views and three expression portraits. Their walks use a limb rig. The five originally approved characters retain illustrated walk sheets. The complete view/portrait boards allow inspection of individual identities. Technical crop errors found during review were corrected by using per-column separators and isolating the subject.

The lossless encoder verifies decoded RGBA equality for all 1,128 embedded images. npm run check protects the original baseline checksum and compiles all 78 built script blocks. Tests and captures use local HTTP servers and disposable browser storage, with no access to the user's real save.

## Limits and playtest

Validation uses desktop Chromium, with emulated phone viewport sizes; no physical Android or iPhone was available. It does not prove device performance, every possible combination, or a full long-duration playthrough. Audio track state was checked; speaker output was not assessed by listening. The pending outdoor plant-yield update remains pending user playtest and has not been rebalanced or approved.

Only the selected embedded DOCX reference previews were inspected; external full-resolution image hosts were inaccessible. The approved reference evidence names its exact sources and IDs. No additional reference uploads are needed for this release.

No manual Netlify deployment was performed. The authorized GitHub push can trigger a deployment if the user's Netlify project is connected to the repository; that remote site's deployment and live save compatibility are not established by these local checks.
