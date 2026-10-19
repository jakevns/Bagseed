"""Complete source cuts with same-part texture patches, never pose geometry.

The original PNGs and raw cuts remain read-only. Every output includes a repair
mask and a solid expected-alpha mask so repairs and hole tests are inspectable.
"""
import sys, json, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / '.python-deps'))
import cv2
import numpy as np
cv2.setRNGSeed(0)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / 'graphics' / 'character-system' / 'layered-sources' / 'completed-body-parts'
OUT.mkdir(parents=True, exist_ok=True)
mapping = json.loads((HERE / 'native-body-map.json').read_text())
records = []
registrations = {}
outline_samples = {}

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

def texture_fill(rgb, known, repair, part_mask):
    """Approximate patch-nearest-neighbour quilting. Donors never leave this part."""
    seed = nearest_rgb(rgb, known)
    base = rgb.copy()
    base[repair > 0] = seed[repair > 0]
    # Transparent source RGB is black. It must never act as a shading boundary
    # for an expanded socket; extend SAME-PART skin into the solver's padding.
    base[part_mask == 0] = seed[part_mask == 0]
    donor = cv2.erode(known.astype('uint8'), np.ones((7,7),np.uint8)) > 0
    ys, xs = np.where(donor)
    if not len(xs):
        ys, xs = np.where(known)
    pick = np.linspace(0, len(xs)-1, min(3000,len(xs))).astype(int)
    ys, xs = ys[pick], xs[pick]
    offsets = [(dy,dx) for dy in (-2,0,2) for dx in (-2,0,2)]
    def features(image, yy, xx):
        return np.concatenate([image[np.clip(yy+dy,0,image.shape[0]-1),np.clip(xx+dx,0,image.shape[1]-1)].astype('float32') for dy,dx in offsets],axis=1)
    index = cv2.flann_Index(features(rgb,ys,xs),dict(algorithm=1,trees=4))
    ty,tx = np.where((repair>0) & ((np.indices(repair.shape)[0]%3)==0) & ((np.indices(repair.shape)[1]%3)==0))
    total = np.zeros_like(rgb,dtype='float32'); weight=np.zeros(repair.shape,dtype='float32')
    if len(tx):
        matches,_=index.knnSearch(features(base,ty,tx),1,params=dict(checks=48))
        for dy in range(-2,3):
            for dx in range(-2,3):
                yy,xx=ty+dy,tx+dx; sy,sx=ys[matches[:,0]]+dy,xs[matches[:,0]]+dx
                valid=(yy>=0)&(yy<rgb.shape[0])&(xx>=0)&(xx<rgb.shape[1])&(sy>=0)&(sy<rgb.shape[0])&(sx>=0)&(sx<rgb.shape[1])
                yy,xx,sy,sx=yy[valid],xx[valid],sy[valid],sx[valid]
                good=known[sy,sx]; yy,xx,sy,sx=yy[good],xx[good],sy[good],sx[good]
                np.add.at(total,(yy,xx),rgb[sy,sx]);np.add.at(weight,(yy,xx),1)
    use=(repair>0)&(weight>0)
    base[use]=np.rint(total[use]/weight[use,None]).astype('uint8')
    # Continue broad source shading through each patch with a harmonic luminance
    # field. High-frequency donor texture survives; chroma is never blurred.
    lab=cv2.cvtColor(base,cv2.COLOR_BGR2LAB)
    ys0,xs0=np.where(repair>0)
    if len(xs0):
        x0,x1=max(0,xs0.min()-10),min(rgb.shape[1],xs0.max()+11)
        y0,y1=max(0,ys0.min()-10),min(rgb.shape[0],ys0.max()+11)
        region=lab[y0:y1,x0:x1,0].astype('float32'); active=repair[y0:y1,x0:x1]>0
        detail=region-cv2.GaussianBlur(region,(0,0),2)
        field=cv2.GaussianBlur(region,(0,0),3)
        for _ in range(500):
            average=cv2.blur(field,(3,3));field[active]=average[active]
            field[~active]=region[~active]
        channel=lab[y0:y1,x0:x1,0]
        channel[active]=np.clip(np.rint(field[active]+detail[active]*.45),0,255).astype('uint8')
    filled=cv2.cvtColor(lab,cv2.COLOR_LAB2BGR)
    base[repair>0]=filled[repair>0]
    return base

def match_patch_brightness(rgb, repair, mask):
    measurements=[]
    count, labels=cv2.connectedComponents((repair>0).astype('uint8'))
    interior=cv2.erode(mask,np.ones((5,5),np.uint8))>0
    for label in range(1,count):
        area=(labels==label)&interior
        if not area.any(): continue
        ring=(cv2.dilate((labels==label).astype('uint8'),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(17,17)))>0)&interior&(repair==0)
        gray=cv2.cvtColor(rgb,cv2.COLOR_BGR2GRAY)
        if not ring.any(): raise ValueError('No same-part surrounding ring for repair')
        target=float(gray[ring].mean())
        feather=np.minimum(cv2.distanceTransform(area.astype('uint8'),cv2.DIST_L2,5)/8,1)
        for _ in range(10):
            current=float(cv2.cvtColor(rgb,cv2.COLOR_BGR2GRAY)[area].mean())
            if abs(current-target)/max(target,1)<.025:break
            # Feather the luminance correction inside the repair. Applying one
            # constant gain to the whole mask creates a visible geometric edge.
            gain=1+(target/max(current,1)-1)*feather/max(float(feather[area].mean()),.05)
            rgb[area]=np.clip(np.rint(rgb[area].astype(float)*gain[area,None]),0,255).astype('uint8')
        measured=float(cv2.cvtColor(rgb,cv2.COLOR_BGR2GRAY)[area].mean())
        error=abs(measured-target)/max(target,1)
        measurements.append({'pixels':int(area.sum()),'ringPixels':int(ring.sum()),'brightness':measured,'ringBrightness':target,'relativeDifference':error})
        if error>.06: raise ValueError(f'Patch brightness discontinuity {error}')
    return measurements

for doc in mapping['documents']:
    _, anatomy, direction = doc['id'].split('/')
    profile = direction in ('right', 'left')
    near = 'L' if direction == 'left' else 'R'
    x, y, w, h = doc['crop']
    original = cv2.imread(str(ROOT / doc['source']), cv2.IMREAD_UNCHANGED)[y:y+h, x:x+w]
    shape = (h, w)
    alpha=original[:,:,3]>128
    edge=alpha & ~(cv2.erode(alpha.astype('uint8'),np.ones((3,3),np.uint8))>0)
    samples=original[:,:,:3][edge]
    samples=samples[np.argsort(samples.mean(axis=1))[:max(1,len(samples)//3)]]
    outline_samples.setdefault(anatomy,[]).append(samples)
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
        source_gray=cv2.cvtColor(original[:,:,:3],cv2.COLOR_BGR2GRAY)
        skin_median=float(np.median(source_gray[(mask>0)&source_alpha]))
        cut_ink=(source_gray<skin_median*.65).astype('uint8')*255
        original_edge = source_alpha.astype('uint8')*255 & ~cv2.erode(source_alpha.astype('uint8')*255,np.ones((7,7),np.uint8))
        for cap_record in cap_records:
            point, radius = np.array(cap_record['center']), cap_record['radius']
            cap = disk(shape,point,radius)
            band = np.abs(np.arange(h)[:,None]-point[1]) <= 3
            repair |= band.astype('uint8')*255 & cap & interior & cut_ink
            repair |= original_edge & cap & interior
        for cut_y in ([95, 350] if name in ('neck', 'torso', 'pelvis') else []):
            band = np.abs(np.arange(h)[:, None] + y - cut_y) <= 3
            repair |= band.astype('uint8') * 255 & interior & cut_ink
        repair |= mask & (~source_alpha).astype('uint8') * 255
        if profile and side != near and side:
            # Erase the inner edge ink before darkening the far limb. Do not
            # change its alpha or conceal the new far forearm/hand.
            edge = mask & ~cv2.erode(mask, np.ones((7, 7), np.uint8))
            center = pins[('hip' if name in ('thigh','calf','foot') else 'shoulder')+side][0]
            inner = np.arange(w)[None, :] > center if direction == 'right' else np.arange(w)[None, :] < center
            repair |= edge & (inner.astype('uint8') * 255)
        # Socket caps expand the source mask AFTER the initial hidden-area mask.
        # Reapply arm ownership here: otherwise the added hip cap retains fingers.
        if profile and name in ('torso','pelvis','thigh'):
            repair |= cv2.dilate(arm_mask,np.ones((25,25),np.uint8)) & mask
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
        filled = texture_fill(rgba[:,:,:3], known, repair, mask)
        cap_texture = None
        if name == 'thigh':
            # Complete the hip cap with rotations of the OWN painted top 20%.
            # It remains behind the pelvis, which owns the buttock/socket ink.
            pivot=pins['hip'+side]; end=pins['knee'+side]
            yy=np.arange(h)[:,None]
            band=((yy>=pivot[1])&(yy<=pivot[1]+(end[1]-pivot[1])*.2)) & known
            total=np.zeros((h,w,3),np.float32); weights=np.zeros(shape,np.float32)
            for angle in range(-180,181,15):
                matrix=cv2.getRotationMatrix2D(tuple(pivot),angle,1)
                alpha=cv2.warpAffine(band.astype('float32'),matrix,(w,h),flags=cv2.INTER_LINEAR)
                paint=cv2.warpAffine(original[:,:,:3].astype('float32')*band[:,:,None],matrix,(w,h),flags=cv2.INTER_LINEAR)
                total+=paint;weights+=alpha
            cap=disk(shape,pivot,radii['hip'+side])>0
            use=cap&(repair>0)&(weights>.01)
            filled[use]=np.clip(np.rint(total[use]/weights[use,None]),0,255).astype('uint8')
            cap_texture={'sourceFraction':.2,'rotations':list(range(-180,181,15)),'paintedPixels':int(use.sum())}
        rgb = rgba[:, :, :3].copy()
        changed = (repair > 0) | (~source_alpha & (mask > 0))
        distance = cv2.distanceTransform((repair>0).astype('uint8'),cv2.DIST_L2,5)
        blend = np.minimum(distance/6,1)
        blend[(~source_alpha) | (lum<median*.72)] = 1
        mixed = np.rint(filled*blend[:,:,None]+rgb*(1-blend[:,:,None])).astype('uint8')
        rgb[changed] = mixed[changed]
        patch_measurements=match_patch_brightness(rgb,repair,mask)
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
                        'method':'same-part-patch-quilting', 'patchSize':5, 'thighCapTexture':cap_texture,
                        'patchBrightness':patch_measurements, 'sourceSHA256':doc['sourceSHA256']})

outline_colors={key:np.rint(np.median(np.concatenate(value),axis=0)).astype(int)[::-1].tolist() for key,value in outline_samples.items()}
report={'opencv':cv2.__version__, 'method':'same-part-patch-quilting', 'outlineColors':outline_colors, 'registeredPins':registrations, 'parts':records, 'newGenerationCalls':3,'acceptedGeneratedRepairs':0}
(OUT/'repairs.json').write_text(json.dumps(report, indent=2)+'\n', newline='\n')
print(f'Completed {len(records)} parts with same-part texture patches; originals unchanged.')
