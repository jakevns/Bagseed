"""Losslessly encode registered PNGs for the standalone HTML payload.

Verify decoded RGBA equality for every encoded asset; retain all original PNGs.
"""
from pathlib import Path
from PIL import Image,features
import json,hashlib,sys
import numpy as np

ROOT=Path(__file__).resolve().parents[1];REPO=ROOT.parents[1]
assert features.check('webp'),'Pillow needs WebP support'
paths=[]
folders=[ROOT/'walk/atlases'] if '--walk-only' in sys.argv else [ROOT/'registered',ROOT/'cast/registered',REPO/'review/characters-v2/assets/sprites',REPO/'review/characters-v2/assets/portraits',ROOT/'walk/atlases']
for folder in folders:
    paths.extend(sorted(folder.rglob('*.png')))
out=ROOT/'encoded';out.mkdir(exist_ok=True)
manifest=json.loads((out/'manifest.json').read_text()) if '--walk-only' in sys.argv else {'format':'lossless WebP','decodedRGBAEqual':True,'files':{}}
before=after=0
for path in paths:
    source_sha=hashlib.sha256(path.read_bytes()).hexdigest();target=out/(source_sha+'.webp')
    image=Image.open(path).convert('RGBA')
    if not target.exists():image.save(target,'WEBP',lossless=True,exact=True,method=6)
    decoded=Image.open(target).convert('RGBA')
    assert np.array_equal(np.array(image),np.array(decoded)),f'RGBA changed during encoding: {path}'
    before+=path.stat().st_size;after+=target.stat().st_size
    manifest['files'][str(path.relative_to(REPO))]={'sourceSHA256':source_sha,'encoded':str(target.relative_to(REPO)),'encodedSHA256':hashlib.sha256(target.read_bytes()).hexdigest()}
if '--walk-only' in sys.argv:manifest.update(walkPngBytes=before,walkWebpBytes=after)
else:manifest.update(pngBytes=before,webpBytes=after)
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'{len(paths)} images encoded with identical decoded RGBA: {before:,} PNG bytes -> {after:,} WebP bytes')
