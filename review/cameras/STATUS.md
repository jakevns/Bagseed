# Camera artwork checkpoint

Status: approved by the user: “Send it!!”. Integrated into public/index.html through the shared bedroom builder for publication.

Scope: Cracked Phone (included), Snapwell Compact ($89), Lumen DSLR ($349), plus the separate Vintage Camera Display decoration ($20). The original generated transparent atlas is retained at graphics/cameras/assets/cameras-atlas.png. Its checksum and seven technical crops are in sources/manifest.json. Phone has portrait/store and flat/desk views; DSLR body and tripod crops preserve the existing native world placement. Compact stays on the desktop; DSLR stays in front of the desk. A flat starter phone is shown in the compact camera's desk corner only when no player-placed tabletop item overlaps it. No new collisions or placement restrictions are added.

Shared entry points: Gear.camera, drawGearIcon, DECOR.camdisplay.d, drawDecorIcon and Asset115.decor. The final Asset115.decor hydration pass used to shrink small décor to at most 4× native size; the override is scoped to camdisplay so it preserves the full-size approved store image. Other décor forwards unchanged.

Reproduce: node tools/preview-cameras.cjs. It opens public/index.html and requires the approved module to be integrated. report.json records three distinct gear previews, unchanged computer art, five byte-identical photo outputs across the preview injection (all resolutions plus vintage/low-angle and dreamy/macro), unchanged camera catalog and tripod collisions, phone/decor overlap handling, actual desktop/phone store captures, and zero page errors. The original preview-only checkpoint is retained in commit 4b7b44a.

Integration: compile-cameras.cjs is included in tools/build-bedroom.cjs (shared by both build paths); camera metadata is saved in the build report. All 13 preexisting embedded artwork modules are byte-identical; see integration-modules.json. tests/cameras.test.cjs covers buying/installing both camera upgrades ($438 total), Vintage Camera Display purchase ($20), identical store/package art, actual photo-mode angle/filter unlocks for every tier, rendered photo previews, decorative camera placement/flip and save/reload. Validation evidence is recorded in validation.json. Fetch main before pushing approved work with git push origin HEAD:main; never force push. Verify the remote SHA.

Prior published release is fe75fc6 (computer equipment). User requested sequence: desks, computer equipment, cameras, then chairs. Chairs are next after this camera batch is approved and published. Keep all new art previews as actual pictures; any web preview must use public/index.html, never src/game.html.

Environment note: Chromium blocks file:// navigation with ERR_BLOCKED_BY_ADMINISTRATOR. Hosted-game checks work. Do not bypass that policy or disable the standalone test; run appropriate hosted checks and report their scope accurately.
