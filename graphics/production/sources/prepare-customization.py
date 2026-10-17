"""Retain source detail for custom portraits instead of enlarging world sprites."""
from pathlib import Path
from retained_png import save_png, save_text
import json
import hashlib
from PIL import Image

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'sources/asset-manifest.json').read_text(encoding='utf-8-sig'))
out = root / 'customization'
report = {'density': 3, 'assets': {}, 'sourceSHA256': {}}
for key, entry in manifest['assets'].items():
    if key.split('/')[0] not in ['top', 'nose', 'bottom', 'shoe']:
        continue
    source = root / manifest['sources'][entry['source']]['path']
    source_sha = hashlib.sha256(source.read_bytes()).hexdigest()
    assert source_sha == manifest['sources'][entry['source']]['sha256']
    crop = Image.open(source).convert('RGBA').crop(entry['cell']).crop(entry['subjectBounds'])
    scale = entry['scale'] * 3
    art = crop.convert('RGBa').resize((max(1, round(crop.width*scale)), max(1, round(crop.height*scale))), Image.Resampling.LANCZOS).convert('RGBA')
    canvas = Image.new('RGBA', (288, 324))
    canvas.alpha_composite(art, ((288-art.width)//2, 321-art.height))
    target = out / (key + '.png')
    target.parent.mkdir(parents=True, exist_ok=True)
    save_png(canvas,target)
    report['assets']['hires/'+key] = target.relative_to(root).as_posix()
    report['sourceSHA256'][entry['source']] = source_sha
save_text(json.dumps(report, indent=2)+'\n',out/'manifest.json')
print(f'{len(report["assets"])} portrait components registered from retained source artwork')
