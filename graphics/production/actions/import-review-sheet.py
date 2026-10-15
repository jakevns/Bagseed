"""Extract supplied, opaque pose-review cells without redrawing their artwork.

Usage: python import-review-sheet.py batch-06
The untouched review sheet and explicit cells are retained for reproduction.
"""
from collections import deque
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent
folder = root / sys.argv[1]
config = json.loads((folder / 'sheet.json').read_text())
sheet = Image.open(folder / 'review-sheet.png').convert('RGBA')
atlas = Image.new('RGBA', sheet.size)
crops = {}
for name, boxes in config['cells'].items():
    crops[name] = boxes
    for box in boxes:
        cell = np.array(sheet.crop(box))
        rgb = cell[:, :, :3].astype(int)
        # Only flood cream paper/shadow colors reachable from the cell edges.
        # Enclosed pale clothing, hair, skin and highlights remain intact.
        background = np.median(np.concatenate((rgb[:, :4], rgb[:, -4:]), axis=1), axis=1)
        paper = np.max(np.abs(rgb - background[:, None, :]), axis=2) <= 12
        h, w = paper.shape
        outside = np.zeros((h, w), dtype=bool)
        queue = deque()
        def add(y, x):
            if paper[y, x] and not outside[y, x]:
                outside[y, x] = True
                queue.append((y, x))
        for x in range(w):
            add(0, x)
            add(h-1, x)
        for y in range(h):
            add(y, 0)
            add(y, w-1)
        while queue:
            y, x = queue.popleft()
            for yy, xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0 <= yy < h and 0 <= xx < w:
                    add(yy, xx)
        cell[outside, 3] = 0
        atlas.alpha_composite(Image.fromarray(cell), (box[0], box[1]))
atlas.save(folder / 'source.png')
(folder / 'crops.json').write_text(json.dumps({'_isolateComponents': True, '_assetIds': config['assetIds'], '_targetHeights': config.get('targetHeights', {}), **crops}, indent=2)+'\n')
print(f'Extracted {len(crops)*3} action cells from {folder.name}')
