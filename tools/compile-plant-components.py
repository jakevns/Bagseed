"""Measure atlas metadata and encode losslessly; never repaint source pixels."""
from pathlib import Path
import hashlib, json, sys, re
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import ConvexHull

root = Path(__file__).resolve().parents[1]
strain = sys.argv[1]
assert re.fullmatch(r'[a-z0-9-]+', strain)
base = root / 'graphics/plants' / strain
spec = json.loads((base / 'sources/profile.json').read_text())
assert spec['id'] == strain
source = base / 'assets/components.png'
im = Image.open(source).convert('RGBA')
alpha = np.array(im)[:, :, 3]
labels, _ = ndimage.label(alpha > 100)
boxes = []
for region in ndimage.find_objects(labels):
    if region and (region[0].stop-region[0].start)*(region[1].stop-region[1].start)>1300:
        boxes.append(region)
assert len(boxes)==16
# Row/column identity comes from the measured organ centers, not clipped grid cells.
roles = ['seed','radicle','cotyledon','singleLeaf','threeLeaf','fiveLeaf','sevenLeaf','sugarLeaf','stem','node','femaleEarly','femaleMid','femaleLate','maleClosed','maleOpen','bamboo']
ordered=[]
for row in range(4):
    batch=sorted(boxes,key=lambda r:(r[0].start+r[0].stop)/2)[row*4:(row+1)*4]
    ordered.extend(sorted(batch,key=lambda r:(r[1].start+r[1].stop)/2))
parts={}
for role, region in zip(roles,ordered):
    y0,y1=region[0].start,region[0].stop; x0,x1=region[1].start,region[1].stop
    # Small transparent-edge allowance. Crop metadata only; atlas stays untouched.
    x0=max(0,x0-2); y0=max(0,y0-2); x1=min(im.width,x1+2); y1=min(im.height,y1+2)
    patch=alpha[y0:y1,x0:x1]; h,w=patch.shape
    top=role in ['maleClosed','maleOpen']
    edge=patch[:10] if top else patch[-10:]
    xs=np.where(edge>160)[1]
    ax=float(np.median(xs)) if len(xs) else w/2
    ay=2 if top else h-3
    if role=='seed': ax,ay=w/2,h/2
    ys,xs=np.where(patch>100)
    # Hull is sufficient for all projected canopy extrema, independent of rotation.
    pts=np.column_stack([xs,ys]); hull=pts[ConvexHull(pts).vertices]
    outline=[[round((float(x)-ax)/h,6),round((ay-float(y))/h,6)] for x,y in hull]
    parts[role]={'crop':[x0,y0,w,h],'attach':[ax,ay],'outline':outline}
for i,a in enumerate(parts.values()):
    for b in list(parts.values())[i+1:]:
        ax,ay,aw,ah=a['crop']; bx,by,bw,bh=b['crop']
        assert ax+aw<=bx or bx+bw<=ax or ay+ah<=by or by+bh<=ay, 'Atlas part bounds overlap; improve source spacing'
runtime=base/'assets/components.webp'; im.save(runtime,'WEBP',lossless=True,exact=True)
assert np.array_equal(np.array(im),np.array(Image.open(runtime).convert('RGBA')))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
dest=root/f'public/assets/plants/{strain}/components-{sha(runtime)[:12]}.webp'
dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(runtime.read_bytes())
manifest={'revision':spec['revision'],'status':'sample-awaiting-approval','name':spec['name'],'apiName':spec['apiName'],'source':'assets/components.png','sourceSHA256':sha(source),'runtime':str(dest.relative_to(root/'public')),'runtimeSHA256':sha(runtime),'size':list(im.size),'parts':parts}
if 'lineId' in spec: manifest['lineId']=spec['lineId']
(base/'sources').mkdir(parents=True,exist_ok=True)
previous_manifest=base/'sources/manifest.json'
if previous_manifest.exists():
    prior=json.loads(previous_manifest.read_text())
    assert prior['sourceSHA256']==manifest['sourceSHA256'], 'Create a new revision for changed art'
    manifest['status']=prior['status']
(base/'sources/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
catalog_path=root/'graphics/plants/sources/library.json'; catalog=json.loads(catalog_path.read_text())
new_profile = f'{strain}@1' not in catalog['profiles']
if new_profile: catalog['revision']=spec['libraryRevision']
profile={'id':f'{strain}@1','name':spec['name'],'roles':{}}
if 'lineId' in spec: profile['lineId']=spec['lineId']
for role,choices in catalog['profiles']['porchlight@1']['roles'].items():
    original=catalog['parts'][choices[0]]; pid=f'{strain}.{role}@1'; p=json.loads(json.dumps(original))
    a=parts[role]; p.update(id=pid,status='draft',asset=f'graphics/plants/{strain}/assets/components.webp',crop=a['crop'],attach=[round(a['attach'][0]/a['crop'][2],6),round(a['attach'][1]/a['crop'][3],6)])
    if 'leafShape' in p['when']: p['when']['leafShape']=spec['traits']['leafShape']
    # Experimental lines roll their expressed traits per save. Do not silently
    # assign this representative sheet to an incompatible rolled palette.
    if spec.get('experimental'):
        if role.endswith('Leaf'): p['when']['leafKey']=spec['traits']['leafKey']
        if role.startswith('female') or role=='sugarLeaf': p['when']['colorName']=spec['traits']['colorName']
    if pid in catalog['parts']:
        p['status']=catalog['parts'][pid]['status']
        assert catalog['parts'][pid]==p, 'Never rewrite a published part ID'
    catalog['parts'][pid]=p; profile['roles'][role]=[pid]
if not new_profile: assert catalog['profiles'][profile['id']]==profile
catalog['profiles'][profile['id']]=profile
if spec.get('registerAsDefault', True):
    catalog['strains'][spec.get('lineId', strain)]=profile['id']
else:
    assert spec.get('lineId') in catalog['strains'], 'Variant needs an existing native strain; never register a fake strain'
catalog['inheritedTraits']['branching']={'type':'number','source':'PlantTraits115.for'}
catalog_path.write_text(json.dumps(catalog,indent=2)+'\n')
print('Measured 16 components; RGBA-exact WebP verified; registered '+profile['id']+' without changing earlier identities.')
