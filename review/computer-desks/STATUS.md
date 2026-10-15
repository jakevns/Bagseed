# Desk artwork checkpoint

Status: awaiting user artwork approval. Nothing from this batch has been published or appended to public/index.html.

Preview: approval-board.png. Actual shop captures: store-desktop.png and store-phone.png. Validation: report.json. Regenerate with `node tools/preview-computer-desks.cjs`.

Scope: fixed bedroom computer desk, plus Side Desk Birch / Steel & Oak / Standing Desk. Existing base price $50; variant unlocks $0 / $12 / $25. Source atlas and proposal renderer under graphics/computer-desks. Computer gear, coffee, camera, chair and furniture placement metadata are preserved.

After approval: integrate compile-computer-desks.cjs into tools/build-bedroom.cjs (shared by full graphics build), add focused integration coverage for furniture flips, variant purchase/save and attached tabletop decorations, rebuild and run checks/tests. Fetch main before publishing approved work; preserve other worker changes. Push with git push origin HEAD:main and verify remote SHA. Never force push.

User's requested sequence: desks first, computer equipment second, cameras third, chairs fourth. Computer tiers are Old Laptop / Used Desktop ($129) / Dual-Monitor Rig ($399). Audit keyboard, desk mat and monitor wallpaper options during the equipment batch; do not bundle new equipment art into the desk approval.

Use public/index.html for every web preview. Show actual picture previews in chat. Approval is required before pushing each new art batch.
