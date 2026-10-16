# Bedroom loading artwork

Revision: loading-bedroom-3. Status: approved by the user on 2026-10-16.

The faithful room illustration was generated from actual bedroom captures and the previous bedroom illustration. The new base removes the obsolete under-bench containers so the approved sprites can be drawn separately. Original generated edit: /workspace/generated_images/exec-c0850a79-41cc-4ef2-8dcc-de10f262cc26.png. Its unchanged copy is assets/bedroom-illustration-base.png; assets/bedroom.webp is its 1600×600 WebP encoding. Older reference/illustration PNGs document the prior concept.

assets/storage.webp is an encoded copy of graphics/under-desk-storage/assets/storage-atlas.png. The manifest records both encoded asset hashes and the approved original atlas hash. Crops and fit dimensions match the approved storage definitions. No replacement storage art was generated for this loader.

The first loading-screen preview used flat blue rectangles inside incomplete pane bounds. The user rejected the visible border and requested actual sunset/night outdoor renders plus fast-moving clouds. Revision 3 replaces that treatment with four complete outdoor paintings: daylight, sunset, blue hour, and night. The cottage, fence, shrubs, and trees persist through each state. The views crossfade at fixed coordinates through curved paths matching the curtain and glass boundaries. Separate cloud sprites move behind the scenery and change color with the lighting; their motion also loops seamlessly.

Outdoor atlas original: /workspace/generated_images/exec-72300ccb-dae2-4885-bb56-03cc93082297.png, copied unchanged to assets/outdoor-times-source.png and encoded as assets/outdoor-times.webp. Cloud original: /workspace/generated_images/exec-91c0b253-a202-440e-a51e-803db59357c4.png, copied unchanged to assets/cloud-source.png and encoded with transparency as assets/cloud.webp. Both were generated using the cropped original bedroom window as visual reference. Full originals remain in generated_images.

sources/scene.js animates light over the fixed room painting; sources/controller.js guards startup. The compiler validates artwork hashes and embeds all four compressed assets early in index.html, before game scripts. Runtime waits for image readiness, not a minimum loop duration. The only compiled game-loop change holds its first frame until all art promises settle successfully.

Rebuild: npm run build:bedroom. Verify: npm run check and node --test --test-concurrency=1 tests/loading-screen.test.cjs tests/main-menu.test.cjs tests/bedroom.test.cjs. Review previews and validation reports are in review/loading-screen.
