# Desk artwork checkpoint

Status: approved by the user: “Great work! Send it over :)”. Integrated into public/index.html; publication verification is recorded below after validation.

Preview: approval-board.png. Actual shop captures: store-desktop.png and store-phone.png. Validation: report.json. Regenerate with `node tools/preview-computer-desks.cjs`.

Scope: fixed bedroom computer desk, plus Side Desk Birch / Steel & Oak / Standing Desk. Existing base price $50; variant unlocks $0 / $12 / $25. Source atlas and proposal renderer under graphics/computer-desks. Computer gear, coffee, camera, chair and furniture placement metadata are preserved.

Integration: tools/build-bedroom.cjs includes the compiler in both build paths. tests/computer-desks.test.cjs exercises actual store checkout and package artwork, all three finishes and their unlock costs, flipped furniture, attached lava lamp movement, and save/reload. All 11 preexisting artwork modules, including the latest customization-9 character payload fetched from origin/main, are retained byte for byte; see integration-modules.json. The remote worker's consistent line endings and atomic build-report writes are retained.

User's requested sequence: desks first, computer equipment second, cameras third, chairs fourth. Computer tiers are Old Laptop / Used Desktop ($129) / Dual-Monitor Rig ($399). Audit keyboard, desk mat and monitor wallpaper options during the equipment batch; do not bundle new equipment art into the desk approval.

Use public/index.html for every web preview. Show actual picture previews in chat. Approval is required before pushing each new art batch.
