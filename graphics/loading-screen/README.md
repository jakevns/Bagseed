# Bedroom loading artwork

Revision: loading-bedroom-2. Status: awaiting user approval.

The faithful room illustration was generated from actual bedroom captures and the previous bedroom illustration. The new base removes the obsolete under-bench containers so the approved sprites can be drawn separately. Original generated edit: /workspace/generated_images/exec-c0850a79-41cc-4ef2-8dcc-de10f262cc26.png. Its unchanged copy is assets/bedroom-illustration-base.png; assets/bedroom.webp is its 1600×600 WebP encoding. Older reference/illustration PNGs document the prior concept.

assets/storage.webp is an encoded copy of graphics/under-desk-storage/assets/storage-atlas.png. The manifest records both encoded asset hashes and the approved original atlas hash. Crops and fit dimensions match the approved storage definitions. No replacement storage art was generated for this loader.

sources/scene.js animates light over the fixed room painting; sources/controller.js guards startup. The compiler validates artwork hashes and embeds both compressed assets early in index.html, before game scripts. Runtime waits for image readiness, not a minimum loop duration. The only compiled game-loop change holds its first frame until all art promises settle successfully.

Rebuild: npm run build:bedroom. Verify: npm run check and node --test --test-concurrency=1 tests/loading-screen.test.cjs tests/main-menu.test.cjs tests/bedroom.test.cjs. Review previews and validation reports are in review/loading-screen.
