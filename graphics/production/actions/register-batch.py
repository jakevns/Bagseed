"""Register whole-pose art using explicit crop bounds and existing cast scale.

Usage: python3 graphics/production/actions/register-batch.py batch-03
Retains the generated sheet untouched; performs only technical crop/registration.
"""
from pathlib import Path
import hashlib
import json
import sys
from PIL import Image, ImageOps, ImageFilter
import numpy as np

actions = Path(__file__).resolve().parent
folder = actions / sys.argv[1]
config = json.loads((folder / 'crops.json').read_text())
isolate_components = config.pop('_isolateComponents', False)
asset_ids = config.pop('_assetIds', {})
target_heights = config.pop('_targetHeights', {})
source = Image.open(folder / 'source.png').convert('RGBA')
roster = json.loads((actions.parent / 'cast/sources/cast-roster.json').read_text())['people']
samples = json.loads((actions.parents[2] / 'review/characters-v2/sources/baseline-assets.json').read_text())['people']
roster += [{**p, 'assetId': p['id'], 'kid': p['id'] == 'poppy'} for p in samples]
people = {p['id']: p for p in roster}
report = {'sourceSHA256': hashlib.sha256((folder / 'source.png').read_bytes()).hexdigest(), 'characters': {}}
def isolate_subject(crop):
    """Discard disconnected fragments from neighboring atlas cells, not anatomy."""
    mask = np.array(crop.getchannel('A')) > 80
    seen = np.zeros_like(mask)
    largest = []
    height, width = mask.shape
    for yy, xx in zip(*np.nonzero(mask)):
        if seen[yy, xx]:
            continue
        component = [(int(yy), int(xx))]
        seen[yy, xx] = True
        for y, x in component:
            for ny in range(max(0, y - 1), min(height, y + 2)):
                for nx in range(max(0, x - 1), min(width, x + 2)):
                    if mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        component.append((ny, nx))
        if len(component) > len(largest):
            largest = component
    if not largest:
        raise ValueError('No opaque subject in crop')
    keep = np.zeros_like(mask, dtype=np.uint8)
    yy, xx = zip(*largest)
    keep[yy, xx] = 255
    # Retain the source's antialiased outline around the connected figure.
    outline = np.array(Image.fromarray(keep).filter(ImageFilter.MaxFilter(7))) > 0
    pixels = np.array(crop)
    pixels[~outline, 3] = 0
    return Image.fromarray(pixels)

for name, boxes in config.items():
    person = next(p for p in roster if p['assetId'] == asset_ids[name]) if name in asset_ids else people[name]
    target_height = 82 if person.get('kid') else 93 if person['look'].get('short') else 104 if person['look'].get('body') == 'tall' else 100
    target_height = target_heights.get(name, target_height)
    target = folder / name
    target.mkdir(exist_ok=True)
    report['characters'][name] = {}
    for direction, box in zip(['down', 'right', 'up'], boxes):
        crop = source.crop(box)
        if isolate_components:
            crop = isolate_subject(crop)
        bounds = crop.getchannel('A').point(lambda v: 255 if v > 160 else 0).getbbox()
        if bounds is None:
            raise ValueError(f'Empty crop: {name} {direction}')
        crop = crop.crop(bounds)
        # Use the torso rather than the raised elbow or hair as the world anchor.
        _, xx = np.nonzero(np.array(crop)[round(crop.height * .48):round(crop.height * .72), :, 3] > 80)
        anchor = float(np.median(xx)) if len(xx) else crop.width / 2
        scale = min(target_height / crop.height, 45 / max(1, anchor), 46 / max(1, crop.width - anchor))
        art = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
        x, y = round(48 - anchor * scale), 107 - art.height
        assert x >= 1 and y >= 1 and x + art.width <= 95, f'Clipped sprite: {name} {direction}'
        out = Image.new('RGBA', (96, 108))
        out.alpha_composite(art, (x, y))
        out.save(target / (direction + '.png'))
        report['characters'][name][direction] = {'sourceBox': box, 'alphaBounds': bounds, 'scale': scale, 'targetHeight': target_height, 'placement': [x, y]}
        if direction == 'right':
            ImageOps.mirror(out).save(target / 'left.png')
        if direction == 'down':
            portrait = crop.crop((0, 0, crop.width, round(crop.height * .53)))
            portrait.thumbnail((188, 188), Image.Resampling.LANCZOS)
            p = Image.new('RGBA', (192, 192))
            p.alpha_composite(portrait, ((192 - portrait.width) // 2, 192 - portrait.height))
            p.save(target / 'portrait.png')
report['limitations'] = ['Left profile mirrors right, including hand and prop side.', 'Only matching canonical outfits use these action drawings.']
(folder / 'registration.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'{len(config)} characters registered: {folder.name}')
