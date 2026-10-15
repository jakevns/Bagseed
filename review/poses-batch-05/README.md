# Pose batch 05

User-approved batch: Cass Mercer, Jun Cho, Rosie Dunn, Arthur Dunn and Nadia Dunn. Complete nose-covering drawings and whole-drawing portrait crops apply only to matching canonical looks. Standing art, custom outfits and the earlier 17 approved pose sets are preserved.

`pose-candidates.png` retains the approved review; `registered.png` shows four world views, portrait crops and the 32×36 game scale. `candidate.html` is a separate updated standalone game. The untouched original illustrated HTML and earlier candidates remain under batches 01–04; checkpoint.json records their relationship and the new checksum.

Technical registration: `python3 graphics/production/actions/register-batch.py batch-05`. Explicit overlapping crop bounds preserve complete feet and hair; connected-component isolation discards disconnected neighboring atlas fragments. Whole source artwork remains in `graphics/production/actions/batch-05/source.png`. Height and feet anchors match the existing cast conventions, including short Rosie and tall Arthur. Left views mirror right views, including the raised-hand side.

Verify with `npm run check`, `node tools/verify-action-batch.cjs`, and `npm test`. The comparison script checks all 67 cast appearances and direct sprite/portrait routing for all 22 approved appearances.

GitHub Pages deployment is configured in .github/workflows/pages.yml. It publishes only public/ after a merge to main and records the commit in version.json. The owner confirmed Pages Source is GitHub Actions. The live address is expected to be https://jakevns.github.io/Bagseed/ once the first deployment succeeds; local validation does not establish live deployment. Local staging was functionally checked at the /Bagseed/ subpath with tools/verify-pages.cjs.
