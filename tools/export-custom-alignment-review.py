"""Make a compact, local review bundle suitable for sharing with a reviewer."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZIP_STORED
import json, hashlib, datetime, subprocess, html
repo=Path(__file__).resolve().parents[1]
review=repo/'review/custom-alignment'
destination=repo/'exports';destination.mkdir(exist_ok=True)
target=destination/'custom-alignment-review-v6.zip'
files={}
for p in sorted((review/'comparisons').glob('*.png')):files['images/comparisons/'+p.name]=p
for p in sorted((review/'hair-overview').glob('*.png')):files['images/hair-overview/'+p.name]=p
for p in sorted((review/'wardrobe-overview').glob('*.png')):files['images/wardrobe-overview/'+p.name]=p
for name in ['hoodie','tee','suit']:
    p=review/'after'/f'{name}-average-neutral.png';files['images/full-body/'+p.name]=p
for name in ['long-purple','curly','mohawk-purple']:
    p=review/'hair-on-body'/f'{name}.png';files['images/hair-on-body/'+p.name]=p
for name in ['graphics/production/sources/renderer.js','graphics/production/walk/sources/renderer.js','graphics/production/walk/rig.json','graphics/production/walk/stride-v4/rig.json','tools/review-custom-full-body.cjs','tools/review-custom-hair-on-body.cjs','tests/custom-alignment-audit.test.cjs','tests/garment-palette-consistency.test.cjs','tests/hair-material-anatomy.test.cjs','docs/graphics/custom-alignment-audit.md']:
    files['source/'+name]=repo/name
for name in ['graphics/production/sources/face-details.js','graphics/production/sources/hair-batch-01.js','graphics/production/sources/hair-fit-rest.js','graphics/production/walk/manifest.json','graphics/production/walk/wardrobe-v5/manifest.json','graphics/production/customization-v5/detail-landmarks.json']:
    files['source/'+name]=repo/name
for name in ['measured-checks.json','garment-color-checks.json','hair-material-checks.json','validation.json','npm-test.txt']:
    p=review/name
    if p.exists():files['checks/'+name]=p
brief='''# Custom character alignment: independent review requested

STATUS: Candidate, not visually approved. Do not infer that passing tests means the art looks correct.

OPEN SOURCE-ART FOLLOW-UPS: garden's apron/shirt colors, flannel's baked plaid and pajama trim still differ between idle and all walking phases (down/up 0–3; right/left 0–7). The scope report lists these explicitly. They are not hidden or declared fixed by the registration checks.

Open review.html after extracting this archive. Every comparison preserves the complete figure canvas, before on the left and after on the right. It includes down idle, down walk 0/1, right walk 3, left walk 7 and up walk 1 for all 15 tops. Three additional wardrobe sheets show every phase. Selected silver/purple hair-on-body sheets provide context.

Please review head/neck/collar registration, natural shoulder proportions, side-view attachment behind the ear, garment identity and color consistency, hair outline density and overlap. Identify remaining problems by outfit, direction and frame. Distinguish source-art defects from registration, masking and layer-order errors. Provide prioritized, concrete fixes and tests that would actually catch them. Check the tests critically: coordinates or hashes alone are not proof.

The approved style is Remy, Priya, Doug and Poppy: a large round head, highlighted dark eyes, soft round bodies, short limbs, warm brown outlines and restrained cel shading. Preserve the existing native illustrated resolution, eight-phase profile walks, hand/arm layering, opaque hip joins and feet anchored to the floor.

The complete local review contains 270 wardrobe sheets (15 tops × six builds × three presentations), and every hairstyle in two colors on hoodie, tee and suit. Those larger galleries remain in review/custom-alignment/ in the Bagseed workspace; this compact archive contains selected evidence rather than every PNG.

Source templates and tests are included for technical review. This is not a standalone game build. Local changes may be uncommitted and are not necessarily present in the GitHub branch. No external message has been sent.
'''
manifest={'createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'revision':json.loads((repo/'graphics/production/build.json').read_text(encoding='utf-8-sig'))['characterRevision'],'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'files':{}}
with ZipFile(target,'w') as archive:
    archive.writestr('START_HERE.md',brief,compress_type=ZIP_DEFLATED)
    gallery='<!doctype html><meta charset="utf-8"><title>Custom character review</title><style>body{background:#211d26;color:#eee;font:16px sans-serif}img{max-width:100%;height:auto}section{margin-bottom:30px}</style><h1>Candidate for independent review</h1><p>These are complete figures, not cropped heads. Read START_HERE.md for scope.</p>'
    for name,p in files.items():
        data=p.read_bytes();manifest['files'][name]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};archive.writestr(name,data,compress_type=ZIP_STORED if p.suffix=='.png' else ZIP_DEFLATED)
        if name.endswith('.png'):gallery+=f'<section><h2>{html.escape(name)}</h2><a href="{name}"><img loading="lazy" src="{name}"></a></section>'
    archive.writestr('review.html',gallery,compress_type=ZIP_DEFLATED)
    archive.writestr('manifest.json',json.dumps(manifest,indent=2),compress_type=ZIP_DEFLATED)
with ZipFile(target) as archive:assert archive.testzip() is None
assert len([f for f in files if '/comparisons/' in f])==15
print(f'{target}: {target.stat().st_size:,} bytes; archive verified')
