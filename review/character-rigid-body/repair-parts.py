"""Complete source cuts with TELEA, never a pose-dependent outline or mesh.

The original PNGs and raw cuts remain read-only. Every output includes a repair
mask and a solid expected-alpha mask so repairs and hole tests are inspectable.
"""
import sys, json, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / '.python-deps'))
import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / 'graphics' / 'character-system' / 'layered-sources' / 'completed-body-parts'
OUT.mkdir(parents=True, exist_ok=True)
mapping = json.loads((HERE / 'native-body-map.json').read_text())
records = []
registrations = {}

def span(mask, row, guess):
    xs = np.flatnonzero(mask[int(round(row))] > 200)
    if xs.size == 0:
        raise ValueError('No painted cross-section at joint')
    chunks = np.split(xs, np.flatnonzero(np.diff(xs) > 1)+1)
    c = min(chunks, key=lambda c: max(float(c[0])-guess, guess-float(c[-1]), 0))
    return (float(c[0])+float(c[-1]))/2, (float(c[-1])-float(c[0])+1)/2

def nearest_rgb(rgb, valid):
    if not valid.any():
        raise ValueError('Part has no original skin samples')
    _, labels = cv2.distanceTransformWithLabels((~valid).astype('uint8'), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    palette = np.zeros((int(labels.max()) + 1, 3), np.uint8)
    palette[labels[valid]] = rgb[valid]
    return palette[labels]

def disk(shape, point, r):
    a = np.zeros(shape, np.uint8)
    cv2.circle(a, tuple(np.rint(point).astype(int)), int(r), 255, -1, cv2.LINE_8)
    return a

def filled_holes(mask):
    padded = cv2.copyMakeBorder(mask, 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0)
    flooded = padded.copy()
    cv2.floodFill(flooded, None, (0, 0), 255)
    return mask | cv2.bitwise_not(flooded[1:-1, 1:-1])

for doc in mapping['documents']:
    _, anatomy, direction = doc['id'].split('/')
    profile = direction in ('right', 'left')
    near = 'L' if direction == 'left' else 'R'
    x, y, w, h = doc['crop']
    original = cv2.imread(str(ROOT / doc['source']), cv2.IMREAD_UNCHANGED)[y:y+h, x:x+w]
    shape = (h, w)
    pins = {k: np.array(v, float) - [x, y] for k, v in doc['pins'].items()}
    rawdir = HERE / 'generated' / 'raw-cuts' / doc['id'].replace('/', '-')
    raw = {l['id']: cv2.imread(str(rawdir / (l['id'] + '.png')), cv2.IMREAD_UNCHANGED) for l in doc['layers']}
    radii = {}
    for s in ('L','R'):
        for joint, part in [('shoulder','upperArm'),('elbow','forearm'),('wrist','hand'),('palm','hand')]:
            center, radius = span(raw[f'body.{part}.{s}'][:,:,3], pins[joint+s][1], pins[joint+s][0])
            pins[joint+s][0] = center
            radii[joint+s] = max(15, radius)
        for joint, sample_offset in [('hip',80),('knee',0),('ankle',-20)]:
            center, radius = span(original[:,:,3], pins[joint+s][1]+sample_offset, pins[joint+s][0])
            if joint in ('knee','ankle'):
                pins[joint+s][0] = center
            radii[joint+s] = max(16, radius)
    registrations[doc['id']] = {k:(v+[x,y]).tolist() for k,v in pins.items()}
    arm_mask = np.zeros(shape, np.uint8)
    for name in ('upperArm', 'forearm', 'hand'):
        arm_mask |= (raw[f'body.{name}.{near}'][:, :, 3] > 30).astype('uint8') * 255
    dest = OUT / f'{anatomy}-{direction}'
    dest.mkdir(exist_ok=True)
    for layer in doc['layers']:
        bits = layer['id'].split('.')
        name, side = bits[1], bits[2] if len(bits) == 3 else None
        rgba = raw[layer['id']].copy()
        mask = (rgba[:, :, 3] > 30).astype('uint8') * 255
        # Adjacent pixels already painted in the original are valid overlap
        # material. Preserve their shading; inpaint only genuinely hidden skin,
        # crossing cut ink, and extensions beyond the original silhouette.
        source_alpha = original[:, :, 3] > 30
        rgba[:, :, :3] = original[:, :, :3]
        repair = np.zeros(shape, np.uint8)
        cap_records = []
        # Hidden profile torso/hip is a SOURCE silhouette taken from the painting,
        # not from a pose skeleton. Inpaint the arm ownership region within it.
        if profile and name in ('torso', 'pelvis'):
            yy = np.arange(h)[:, None] + y
            lo, hi = (85, 370) if name == 'torso' else (330, 467)
            mask = ((original[:, :, 3] > 30) & (yy >= lo) & (yy <= hi)).astype('uint8') * 255
            rgba[:, :, :3] = original[:, :, :3]
            repair = cv2.dilate(arm_mask, np.ones((25, 25), np.uint8)) & mask
        elif name in ('torso', 'pelvis'):
            # Ownership cuts through contiguous shoulder/chest skin need a
            # real source overlap, not two antialiased edges meeting exactly.
            mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11))) & ((original[:,:,3]>30).astype('uint8')*255)
        # Complete each joint from the original part's adjacent skin. Cap radii
        # are source-pixel measurements of half-width, not runtime bone tubes.
        if side and name not in ('hand', 'foot'):
            specs = {
                'upperArm': ('shoulder', 'elbow', 36, 29),
                'forearm': ('elbow', 'wrist', 29, 19),
                'thigh': ('hip', 'knee', 49, 34),
                'calf': ('knee', 'ankle', 34, 20)
            }
            a, b, ra, rb = specs[name]
            ra, rb = radii[a+side], radii[b+side]
            pa, pb = pins[a+side], pins[b+side]
            yy = np.arange(h)[:, None]
            if profile and name == 'thigh':
                # The original hand also hides the upper thigh. Recover its
                # source silhouette before removing the hand's ink/shading.
                mask = (original[:, :, 3] > 30).astype('uint8') * 255
                rgba[:, :, :3] = original[:, :, :3]
                repair |= cv2.dilate(arm_mask, np.ones((25,25), np.uint8)) & mask
            mask &= ((yy >= pa[1]) & (yy <= pb[1])).astype('uint8') * 255
            for point, radius, joint in [(pa, ra, a), (pb, rb, b)]:
                cap = disk(shape, point, radius)
                mask |= cap
                cap_records.append({'joint': joint+side, 'center': point.tolist(), 'radius': radius})
        elif side:
            joint, r = ('wrist', radii['wrist'+side]) if name == 'hand' else ('ankle', radii['ankle'+side])
            cap = disk(shape, pins[joint+side], r)
            mask |= cap
            cap_records.append({'joint': joint+side, 'center': pins[joint+side].tolist(), 'radius': r})
        # Socket overlaps on the parent body cover the moving part's attachment.
        if name in ('torso', 'pelvis'):
            joint = 'shoulder' if name == 'torso' else 'hip'
            for s in ('L', 'R'):
                r = radii[joint+s]
                cap = disk(shape, pins[joint+s], r)
                mask |= cap
                cap_records.append({'joint': joint+s, 'center': pins[joint+s].tolist(), 'radius': r})
        mask = filled_holes(mask)
        # Remove the 3px crossing strokes at fixed source cut lines, preserving
        # the outer silhouette along the middle of each retained painted limb.
        interior = cv2.erode(mask, np.ones((5, 5), np.uint8))
        original_edge = source_alpha.astype('uint8')*255 & ~cv2.erode(source_alpha.astype('uint8')*255,np.ones((7,7),np.uint8))
        for cap_record in cap_records:
            point, radius = np.array(cap_record['center']), cap_record['radius']
            cap = disk(shape,point,radius)
            band = np.abs(np.arange(h)[:,None]-point[1]) <= 3
            repair |= band.astype('uint8')*255 & cap & interior
            repair |= original_edge & cap & interior
        for cut_y in ([95, 350] if name in ('neck', 'torso', 'pelvis') else []):
            band = np.abs(np.arange(h)[:, None] + y - cut_y) <= 3
            repair |= band.astype('uint8') * 255 & interior
        repair |= mask & (~source_alpha).astype('uint8') * 255
        if profile and side != near and side:
            # Erase the inner edge ink before darkening the far limb. Do not
            # change its alpha or conceal the new far forearm/hand.
            edge = mask & ~cv2.erode(mask, np.ones((7, 7), np.uint8))
            center = pins[('hip' if name in ('thigh','calf','foot') else 'shoulder')+side][0]
            inner = np.arange(w)[None, :] > center if direction == 'right' else np.arange(w)[None, :] < center
            repair |= edge & (inner.astype('uint8') * 255)
        repair &= mask
        lum = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_BGR2GRAY)
        original_interior = cv2.erode(source_alpha.astype('uint8'), np.ones((7,7),np.uint8)) > 0
        sampled = lum[original_interior & (mask > 0)]
        median = float(np.median(sampled)) if sampled.size else 145
        # Outline ink is not a skin sample for a hidden cap. Sampling only
        # eroded interior skin prevents TELEA from spreading that ink into it.
        known = original_interior & (repair == 0) & (mask > 0) & (lum > median*.72) & (lum < median*1.28)
        # If a source hand is mostly its wrist cap, retain palm samples.
        if known.sum() < 20:
            known = original_interior & (mask > 0) & (lum > median*.72) & (lum < median*1.28)
        extended = nearest_rgb(rgba[:, :, :3], known)
        rgb = rgba[:, :, :3].copy()
        rgb[~known] = extended[~known]
        filled = cv2.inpaint(rgb, repair, 5, cv2.INPAINT_TELEA)
        rgb = rgba[:, :, :3].copy()
        changed = (repair > 0) | (~source_alpha & (mask > 0))
        distance = cv2.distanceTransform((repair>0).astype('uint8'),cv2.DIST_L2,5)
        blend = np.minimum(distance/6,1)
        blend[(~source_alpha) | (lum<median*.72)] = 1
        mixed = np.rint(filled*blend[:,:,None]+rgb*(1-blend[:,:,None])).astype('uint8')
        rgb[changed] = mixed[changed]
        preserved = source_alpha & (mask > 0) & (~changed)
        if not np.array_equal(rgb[preserved],original[:,:,:3][preserved]):
            raise ValueError('Original shading changed outside the repair mask')
        rgb[mask == 0] = 0  # Do not duplicate a hidden whole painting in each PNG.
        completed = np.dstack((rgb, mask))
        stem = layer['id']
        for suffix, array in [('', completed), ('.repair', repair), ('.expected', mask)]:
            cv2.imwrite(str(dest / (stem + suffix + '.png')), array)
        contour = max(cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0], key=cv2.contourArea)
        contour = cv2.approxPolyDP(contour, .6, True).reshape(-1, 2) + [x, y]
        records.append({'view':doc['id'], 'id':stem, 'path':str((dest/(stem+'.png')).relative_to(ROOT)).replace('\\','/'),
                        'expected':str((dest/(stem+'.expected.png')).relative_to(ROOT)).replace('\\','/'),
                        'repair':str((dest/(stem+'.repair.png')).relative_to(ROOT)).replace('\\','/'),
                        'caps':cap_records, 'contour':contour.tolist() if name == 'foot' else None, 'repairedPixels':int((repair>0).sum()),
                        'preservedOriginalPixels':int(preserved.sum()), 'cutInkBand':3,
                        'method':'cv2.INPAINT_TELEA', 'radius':5, 'sourceSHA256':doc['sourceSHA256']})

report={'opencv':cv2.__version__, 'method':'TELEA', 'radius':5, 'registeredPins':registrations, 'parts':records, 'newGenerationCalls':0}
(OUT/'repairs.json').write_text(json.dumps(report, indent=2)+'\n', newline='\n')
print(f'Completed {len(records)} parts with TELEA radius 5; originals unchanged.')
