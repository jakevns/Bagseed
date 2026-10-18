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


def measure(name, expected, columns, grid=False):
    source = BASE / f'assets/{name}.png'
    image = Image.open(source).convert('RGBA')
    rgba = np.array(image)
    labels, count = ndimage.label(rgba[:, :, 3] > 100)
    masses = np.bincount(labels.ravel())
    regions = [r for i, r in enumerate(ndimage.find_objects(labels), 1)
               if r is not None and masses[i] > 1500]
    if grid:
        # A stigma cluster intentionally contains many disconnected hairs. Its
        # explicit atlas cell, rather than one connected component, owns them.
        regions = []
        rows = expected // columns
        for row in range(rows):
            for col in range(columns):
                x, y = col * image.width // columns, row * image.height // rows
                cell = rgba[y:(row + 1) * image.height // rows,
                            x:(col + 1) * image.width // columns, 3]
                yy, xx = np.where(cell > 100)
                assert len(xx) > 100, (name, row, col)
                regions.append((slice(int(y + yy.min()), int(y + yy.max() + 1)),
                                slice(int(x + xx.min()), int(x + xx.max() + 1))))
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
        region_labels = labels[y0:y1, x0:x1]
        label_sizes = np.bincount(region_labels.ravel())
        own_label = int(np.argmax(label_sizes[1:]) + 1)
        foreign = (region_labels > 0) & (region_labels != own_label)
        isolated = not grid and BASE.name != 'freakshow' and bool(foreign.any())
        # A downward leaflet can reach the petiole's level. Select the strongest
        # bottom cluster, rather than averaging the two disconnected endpoints.
        bottom = alpha[max(0, h - 16):] > 160
        clusters, n = ndimage.label(bottom.any(axis=0))
        cluster = max(range(1, n + 1), key=lambda k: int(bottom[:, clusters == k].sum()))
        ys, xs = np.where((alpha > 160) & (clusters == cluster)[None, :])
        ax, ay = float(np.median(xs[ys >= h - 16])), float(ys.max())
        ys, xs = np.where(region_labels == own_label if isolated else alpha > 100)
        points = np.column_stack([xs, ys])
        hull = points[ConvexHull(points).vertices]
        parts.append({'atlas': name, 'crop': [x0, y0, w, h], 'attach': [ax, ay],
                      'outline': [[round((float(x) - ax) / h, 6), round((ay - float(y)) / h, 6)]
                                  for x, y in hull]})
        # Closely spaced source organs can have overlapping rectangular crops.
        # Register a geometry clip for stray neighbor pixels; keep the source and
        # exact runtime atlas unchanged, including all original owned tissue.
        if isolated:
            parts[-1]['clipHull'] = True
    encoded = BASE / f'assets/{name}.webp'
    image.save(encoded, 'WEBP', lossless=True, exact=True)
    assert np.array_equal(rgba, np.array(Image.open(encoded).convert('RGBA')))
    data = encoded.read_bytes()
    public = ROOT / f'public/assets/plants/mutations/{BASE.name}/{name}-{sha(data)[:12]}.webp'
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

# Additional original atlases use two rows (stable forms/pattern families) and
# four columns (juvenile, young, mature and sugar). Historical role names are
# growth slots, not a leaflet count: Monophylla remains single-bladed as an adult.
families = {
    'ducksfoot': ('duck', ['broad-webbed', 'spear-webbed'], ['R05', 'R13']),
    'monophylla': ('mono', ['lanceolate', 'quilted-broad'], ['R14', 'R15']),
    'moonmarble': ('variegated', ['marbled', 'sectorial'], ['R26', 'R28', 'R13']),
    'snowtip': ('albino', ['ivory-crown', 'green-edged'], ['R25', 'R26']),
    'fernfrond': ('fern', ['fine-open', 'paired-fronds'], ['R02', 'R17', 'R03']),
    'goldleaf': ('gold', ['green-veined', 'golden-olive'], ['R18']),
    'ember': ('ember', ['copper-crimson', 'wine-burgundy'], ['R11']),
    'inkleaf': ('ink', ['plum-green', 'blue-black'], ['R11']),
}
for key, (art, names, references) in families.items():
    BASE = ROOT / f'graphics/plants/mutations/{key}'
    organs, asset = measure('components', 8, 4)
    variants = {}
    for i, name in enumerate(names):
        single, young, adult, sugar = organs[i * 4:i * 4 + 4]
        variants[name] = {'parts': dict(singleLeaf=single, threeLeaf=young,
                                       fiveLeaf=adult, sevenLeaf=adult, sugarLeaf=sugar)}
    atlases = {'components': asset}
    if key == 'ember':
        bark, bark_asset = measure('bark', 4, 2)
        atlases['bark'] = bark_asset
        for i, name in enumerate(names):
            variants[name]['parts'].update(internode=bark[i * 2], nodeCollar=bark[i * 2 + 1])
    manifest = {'revision': key + '-parts-1', 'status': 'approved-live-components',
                'mutationKey': key, 'art': art, 'leafKey': 'forest',
                'atlases': atlases, 'variants': variants,
                'references': ['Bagseed_Mutation_References/' + r for r in references] +
                              [('review/mutation-detail/photo-based-batch-02/detail-and-color-studies-02.png'
                                if key in ['fernfrond', 'goldleaf', 'ember', 'inkleaf'] else
                                'review/mutation-detail/photo-based-batch-01/leaf-studies-01.png')]}
    (BASE / 'sources/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Registered', key, ': eight painted organs; RGBA-exact atlas; catalog unchanged.')

BASE = ROOT / 'graphics/plants/mutations/pinkpistil'
stigmas, asset = measure('stigmas', 6, 3, grid=True)
variants = {}
for i, name in enumerate(['blush-rose', 'magenta-coral']):
    parts = dict(zip(['femaleEarly', 'femaleMid', 'femaleLate'], stigmas[i * 3:i * 3 + 3]))
    for part in parts.values():
        image = np.array(Image.open(BASE / 'assets/stigmas.png').convert('RGBA'))
        x, y, w, h = part['crop']; pixels = image[y:y+h, x:x+w].astype(float)
        select = ((pixels[:, :, 3] > 180) & (pixels[:, :, 0] > pixels[:, :, 1] * 1.2)
                  & (pixels[:, :, 2] > pixels[:, :, 1] * .9))
        assert select.sum() > 30
        part['pigment'] = np.median(pixels[select, :3], axis=0).round().astype(int).tolist()
    variants[name] = {'parts': parts}
manifest = {'revision': 'pinkpistil-parts-1', 'status': 'approved-live-components',
            'mutationKey': 'pinkpistil', 'art': 'pink', 'material': 'stigmas',
            'partRoles': ['femaleEarly', 'femaleMid', 'femaleLate'],
            'atlases': {'stigmas': asset}, 'variants': variants,
            'references': ['Bagseed_Mutation_References/R19', 'Bagseed_Mutation_References/R20',
                           'review/mutation-detail/photo-based-batch-02/detail-and-color-studies-02.png']}
(BASE / 'sources/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('Registered Pink Pistil: six stigma overlays; native flower bodies and male flowers retained.')
