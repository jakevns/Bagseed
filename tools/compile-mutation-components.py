"""Register painted mutation organs without changing source pixels or strain IDs."""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import ConvexHull

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'graphics/plants/mutations/freakshow'
sha = lambda data: hashlib.sha256(data).hexdigest()


def measure(name, expected, columns):
    source = BASE / f'assets/{name}.png'
    image = Image.open(source).convert('RGBA')
    rgba = np.array(image)
    labels, count = ndimage.label(rgba[:, :, 3] > 100)
    masses = np.bincount(labels.ravel())
    regions = [r for i, r in enumerate(ndimage.find_objects(labels), 1)
               if r is not None and masses[i] > 1500]
    assert len(regions) == expected, (name, len(regions))
    regions.sort(key=lambda r: (r[0].start + r[0].stop) / 2)
    ordered = []
    for start in range(0, expected, columns):
        ordered += sorted(regions[start:start + columns], key=lambda r: r[1].start)
    parts = []
    for r in ordered:
        x0, x1 = max(0, r[1].start - 2), min(image.width, r[1].stop + 2)
        y0, y1 = max(0, r[0].start - 2), min(image.height, r[0].stop + 2)
        alpha = rgba[y0:y1, x0:x1, 3]
        h, w = alpha.shape
        # A downward leaflet can reach the petiole's level. Select the strongest
        # bottom cluster, rather than averaging the two disconnected endpoints.
        bottom = alpha[max(0, h - 16):] > 160
        clusters, n = ndimage.label(bottom.any(axis=0))
        cluster = max(range(1, n + 1), key=lambda k: int(bottom[:, clusters == k].sum()))
        ys, xs = np.where((alpha > 160) & (clusters == cluster)[None, :])
        ax, ay = float(np.median(xs[ys >= h - 16])), float(ys.max())
        ys, xs = np.where(alpha > 100)
        points = np.column_stack([xs, ys])
        hull = points[ConvexHull(points).vertices]
        parts.append({'atlas': name, 'crop': [x0, y0, w, h], 'attach': [ax, ay],
                      'outline': [[round((float(x) - ax) / h, 6), round((ay - float(y)) / h, 6)]
                                  for x, y in hull]})
    encoded = BASE / f'assets/{name}.webp'
    image.save(encoded, 'WEBP', lossless=True, exact=True)
    assert np.array_equal(rgba, np.array(Image.open(encoded).convert('RGBA')))
    data = encoded.read_bytes()
    public = ROOT / f'public/assets/plants/mutations/freakshow/{name}-{sha(data)[:12]}.webp'
    public.parent.mkdir(parents=True, exist_ok=True)
    public.write_bytes(data)
    return parts, {'source': f'assets/{name}.png', 'sourceSHA256': sha(source.read_bytes()),
                   'runtime': str(public.relative_to(ROOT / 'public')), 'runtimeSHA256': sha(data),
                   'size': list(image.size)}


development, young_asset = measure('development', 6, 3)
mature, fan_asset = measure('mature-fans', 2, 2)
variants = {}
for i, name in enumerate(['slender', 'fuller']):
    # Engine role names are maturity slots. A dissected mature fan does not
    # acquire a fixed leaflet count merely because the slot is called fiveLeaf.
    variants[name] = {'parts': {'singleLeaf': development[i * 3],
                                'threeLeaf': development[i * 3 + 1],
                                'fiveLeaf': mature[i], 'sevenLeaf': mature[i],
                                'sugarLeaf': development[i * 3 + 2]}}
manifest = {'revision': 'freakshow-parts-1', 'status': 'approved-live-components',
            'mutationKey': 'freakshow', 'art': 'freak', 'leafKey': 'forest',
            'atlases': {'development': young_asset, 'mature-fans': fan_asset},
            'variants': variants,
            'references': ['Bagseed_Mutation_References/R17', 'Bagseed_Mutation_References/R02',
                           'review/mutation-detail/photo-based-batch-01/leaf-studies-01.png']}
(BASE / 'sources/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('Registered two Freakshow organ sets; two RGBA-exact atlases; strain catalog unchanged.')
