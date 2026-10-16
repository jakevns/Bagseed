# Camera artwork checkpoint

Status: awaiting user approval. Nothing from this batch is published or included in public/index.html. Save and show the actual approval-board.png picture before integrating.

Scope: Cracked Phone (included), Snapwell Compact ($89), Lumen DSLR ($349), plus the separate Vintage Camera Display decoration ($20). The original generated transparent atlas is retained at graphics/cameras/assets/cameras-atlas.png. Its checksum and seven technical crops are in sources/manifest.json. Phone has portrait/store and flat/desk views; DSLR body and tripod crops preserve the existing native world placement. Compact stays on the desktop; DSLR stays in front of the desk. A flat starter phone is shown in the compact camera's desk corner only when no player-placed tabletop item overlaps it. No new collisions or placement restrictions are added.

Shared entry points: Gear.camera, drawGearIcon, DECOR.camdisplay.d, drawDecorIcon and Asset115.decor. The final Asset115.decor hydration pass used to shrink small décor to at most 4× native size; the override is scoped to camdisplay so it preserves the full-size approved store image. Other décor forwards unchanged.

Reproduce: node tools/preview-cameras.cjs. It opens public/index.html and injects the proposed module only in a disposable browser. report.json records three distinct gear previews, unchanged computer art, five byte-identical photo outputs (all resolutions plus vintage/low-angle and dreamy/macro), unchanged camera catalog and tripod collisions, phone/decor overlap handling, actual desktop/phone store captures, and zero page errors. Source game, production build settings and public HTML are unchanged.

After explicit approval: append compile-cameras.cjs in tools/build-bedroom.cjs (shared by both build paths), add camera metadata to its build report, mark the manifest approved, rebuild and preserve all preexisting embedded art modules. Add focused coverage for buying/installing both camera upgrades ($438 total), Vintage Camera Display purchase ($20), identical store/package art, actual photo-mode unlocks, decorative camera placement/flip and save/reload. Fetch main to preserve other workers' changes before pushing approved work with git push origin HEAD:main; never force push. Verify the remote SHA.

Prior published release is fe75fc6 (computer equipment). User requested sequence: desks, computer equipment, cameras, then chairs. Chairs are next after this camera batch is approved and published. Keep all new art previews as actual pictures; any web preview must use public/index.html, never src/game.html.

Environment note: Chromium blocks file:// navigation with ERR_BLOCKED_BY_ADMINISTRATOR. Hosted-game checks work. Do not bypass that policy or disable the standalone test; run appropriate hosted checks and report their scope accurately.
