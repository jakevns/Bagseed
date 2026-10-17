"""Measure atlas metadata and encode losslessly; never repaint source pixels."""
from pathlib import Path
import hashlib, json
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import ConvexHull

root = Path(__file__).resolve().parents[1]
base = root / 'graphics/plants/velvet'
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
runtime=base/'assets/components.webp'; im.save(runtime,'WEBP',lossless=True,exact=True)
assert np.array_equal(np.array(im),np.array(Image.open(runtime).convert('RGBA')))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
dest=root/f'public/assets/plants/velvet/components-{sha(runtime)[:12]}.webp'
dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(runtime.read_bytes())
manifest={'revision':'velvet-components-1','status':'sample-awaiting-approval','name':'Velvet Underbrush','apiName':'BagseedVelvetGrowth','source':'assets/components.png','sourceSHA256':sha(source),'runtime':str(dest.relative_to(root/'public')),'runtimeSHA256':sha(runtime),'size':list(im.size),'parts':parts}
(base/'sources').mkdir(parents=True,exist_ok=True)
(base/'sources/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
catalog_path=root/'graphics/plants/sources/library.json'; catalog=json.loads(catalog_path.read_text())
catalog['revision']='plant-parts-library-2'
profile={'id':'velvet@1','name':'Velvet Underbrush','roles':{}}
for role,choices in catalog['profiles']['porchlight@1']['roles'].items():
    original=catalog['parts'][choices[0]]; pid=f'velvet.{role}@1'; p=json.loads(json.dumps(original))
    a=parts[role]; p.update(id=pid,status='draft',asset='graphics/plants/velvet/assets/components.webp',crop=a['crop'],attach=[round(a['attach'][0]/a['crop'][2],6),round(a['attach'][1]/a['crop'][3],6)])
    catalog['parts'][pid]=p; profile['roles'][role]=[pid]
catalog['profiles']['velvet@1']=profile; catalog['strains']['velvet']='velvet@1'
catalog['inheritedTraits']['branching']={'type':'number','source':'PlantTraits115.for'}
catalog_path.write_text(json.dumps(catalog,indent=2)+'\n')
print('Measured 16 components; RGBA-exact WebP verified; registered velvet@1 without modifying Porchlight identities.')
