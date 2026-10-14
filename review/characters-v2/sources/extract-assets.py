"""Extract illustrated sprite/portrait cells and normalize their game-space anchors.

No character drawing is synthesized here. Source artwork, generation prompts,
cell bounds, and normalization measurements are retained for review.
"""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / 'assets/master-cast.png'
IDS = ['player', 'remy', 'doug', 'priya', 'poppy']
DIRS = ['down', 'right', 'up', 'left']
HEIGHTS = {'player': 100, 'remy': 100, 'doug': 96, 'priya': 100, 'poppy': 82}


def separators(profile, count, expected=None):
    size = len(profile)
    result = [0]
    for k in range(1, count):
        center = expected[k-1] if expected else size*k/count
        radius = size*(.035 if expected else .075)
        lo = max(result[-1]+1, round(center-radius))
        hi = min(size, round(center+radius))
        sample = profile[lo:hi]
        candidates = np.flatnonzero(sample == sample.min())+lo
        result.append(int(candidates[np.argmin(abs(candidates-center))]))
    return result+[size]


def clean_alpha(image):
    data = np.array(image.convert('RGBA'))
    # Tiny alpha values contain invisible matte RGB noise in generated PNGs.
    # Remove it before calculating bounds and resample with premultiplied alpha.
    data[data[:, :, 3] <= 8] = 0
    return Image.fromarray(data)


def subject(image):
    a = np.array(image)[:, :, 3] > 40
    yy, xx = np.nonzero(a)
    if not len(xx):
        raise ValueError('An expected character cell is empty')
    box = (max(0, int(xx.min())-1), max(0, int(yy.min())-1),
           min(image.width, int(xx.max())+2), min(image.height, int(yy.max())+2))
    crop = image.crop(box)
    mask = np.array(crop)[:, :, 3] > 40
    h = crop.height
    torso = mask[round(h*.48):round(h*.72)]
    _, torso_x = np.nonzero(torso)
    anchor_x = float(np.median(torso_x)) if len(torso_x) else crop.width/2
    return crop, box, anchor_x


def resized(image, size):
    return image.convert('RGBa').resize(size, Image.Resampling.LANCZOS).convert('RGBA')


def fit_sprite(crop, anchor, scale):
    size = (max(1, round(crop.width*scale)), max(1, round(crop.height*scale)))
    art = resized(crop, size)
    out = Image.new('RGBA', (96, 108))
    x, y = round(48-anchor*scale), 107-art.height
    if x < 1 or x+art.width > 95 or y < 1:
        raise ValueError(f'Artwork exceeds canvas: {x}, {y}, {size}')
    out.alpha_composite(art, (x, y))
    return out


master = clean_alpha(Image.open(MASTER))
mask = np.array(master)[:, :, 3] > 40
master_rows = separators(mask.sum(axis=1), 5)
master_cols = separators(mask.sum(axis=0), 5, expected=[390, 600, 810, 1020])
manifest = {'version': 'study-02', 'spriteGrid': [96, 108], 'portraitGrid': [192, 192],
            'worldBox': [32, 36], 'worldFeet': [16, 36], 'nativeFeet': [48, 108],
            'masterGrid': {'rows': master_rows, 'columns': master_cols}, 'people': {}}

for row, char_id in enumerate(IDS):
    source = ROOT / 'assets/generated' / f'{char_id}-sheet.png'
    sheet = clean_alpha(Image.open(source))
    mask = np.array(sheet)[:, :, 3] > 40
    rows = separators(mask.sum(axis=1), 5)
    cols = separators(mask.sum(axis=0), 4)
    sprite_dir = ROOT / 'assets/sprites' / char_id
    portrait_dir = ROOT / 'assets/portraits'
    sprite_dir.mkdir(parents=True, exist_ok=True)
    portrait_dir.mkdir(parents=True, exist_ok=True)
    info = {'source': str(source.relative_to(ROOT)), 'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'grid': {'rows': rows, 'columns': cols}, 'walk': {}, 'idle': {}, 'portraits': {}, 'extraction': []}
    pending = []
    for direction_index, direction in enumerate(DIRS):
        info['walk'][direction] = []
        for frame in range(4):
            cell = sheet.crop((cols[frame], rows[direction_index], cols[frame+1], rows[direction_index+1]))
            crop, bounds, anchor = subject(cell)
            pending.append((direction, frame, crop, anchor, bounds))
    idle = []
    for direction_index, direction in enumerate(DIRS):
        cell = master.crop((master_cols[direction_index+1], master_rows[row], master_cols[direction_index+2], master_rows[row+1]))
        crop, bounds, anchor = subject(cell)
        idle.append((direction, 0, crop, anchor, bounds))
    # Each direction uses one scale across its frames, preserving body motion.
    # The width bound includes props and stride; no hands/cans are clipped.
    per_direction = {}
    for direction in DIRS:
        subset = [p for p in pending if p[0] == direction]
        median_height = float(np.median([p[2].height for p in subset]))
        scale = HEIGHTS[char_id]/median_height
        for _, _, crop, anchor, _ in subset:
            scale = min(scale, 45/max(1, anchor), 46/max(1, crop.width-anchor), 104/crop.height)
        for _, _, crop, anchor, _ in [p for p in idle if p[0] == direction]:
            scale = min(scale, 45/max(1, anchor), 46/max(1, crop.width-anchor), 104/crop.height)
        per_direction[direction] = scale
    for direction, frame, crop, anchor, bounds in pending:
        scale = per_direction[direction]
        asset = fit_sprite(crop, anchor, scale)
        target = sprite_dir / f'{direction}-{frame}.png'
        asset.save(target)
        info['walk'][direction].append(str(target.relative_to(ROOT)))
        info['extraction'].append({'direction': direction, 'frame': frame, 'boundsWithinCell': bounds,
                                   'torsoAnchorWithinCrop': anchor, 'scale': scale,
                                   'visibleHeightNativePixels': round(crop.height*scale)})
    for direction, _, crop, anchor, bounds in idle:
        # Master-sheet standing drawings use the same intended visible height.
        scale = min(HEIGHTS[char_id]/crop.height, 45/max(1, anchor), 46/max(1, crop.width-anchor), 104/crop.height)
        target = sprite_dir / f'{direction}-idle.png'
        fit_sprite(crop, anchor, scale).save(target)
        info['idle'][direction] = str(target.relative_to(ROOT))
    for column, expression in enumerate(['neutral', 'friendly', 'concerned']):
        cell = sheet.crop((cols[column], rows[4], cols[column+1], rows[5]))
        crop, bounds, _ = subject(cell)
        scale = min(184/crop.width, 184/crop.height)
        art = resized(crop, (round(crop.width*scale), round(crop.height*scale)))
        out = Image.new('RGBA', (192, 192))
        out.alpha_composite(art, ((192-art.width)//2, 192-art.height))
        target = portrait_dir / f'{char_id}-{expression}.png'
        out.save(target)
        info['portraits'][expression] = str(target.relative_to(ROOT))
    manifest['people'][char_id] = info
    print(char_id, '16 walk views, 4 standing views, 3 portraits',
          'visible walk heights:', sorted({r['visibleHeightNativePixels'] for r in info['extraction']}))

(ROOT/'sources/asset-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print('Asset extraction complete. The game HTML was not read or written by this script.')
