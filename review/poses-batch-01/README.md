# Pose review batch 01

The original illustrated release is preserved byte-for-byte in original-illustrated.html; checkpoint.json records its checksum and release commit. The older pre-graphics HTML remains in baselines/.

Review only Marcus Bell and Inés Calderón first. Replace collaged arms with coherent whole-pose drawings. Preserve identities and standing art. Candidate illustrations are not integrated game sprites, and must be reviewed before atlas extraction or renderer changes. Do not push until user approves. Once approved, create a separate candidate HTML without overwriting the preserved original, and compare native-size sprites before expanding the batch.

Approved by the user in chat. The integrated batch uses complete action drawings for Marcus and Inés in all four views and whole-drawing crops for their reaction portraits. Standing art and custom outfits stay on their existing paths. Left profile mirrors the right profile, including the active hand/book side. `candidate.html` is the updated standalone game; `original-illustrated.html` is the untouched release. Run `node tools/verify-action-batch.cjs` to compare both HTML versions across standing, action, and customized appearances.
