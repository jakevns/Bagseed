"""Independent PNG audit: source opacity/patch brightness and rendered outlines.

Brightness is measured in native source pixels against an 8px same-part ring.
All frames reuse these sources; rigid transforms and uniform far-limb multiply
preserve the ratio. This numerical check does not replace visual patch review.
"""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent.parent
repairs=json.loads((ROOT/'graphics/character-system/layered-sources/completed-body-parts/repairs.json').read_text())
sources=[]; failures=[]
for part in repairs['parts']:
    png=cv2.imread(str(ROOT/part['path']),cv2.IMREAD_UNCHANGED)
    repair=cv2.imread(str(ROOT/part['repair']),cv2.IMREAD_GRAYSCALE)>0
    alpha=png[:,:,3];mask=alpha>0
    assert np.all((alpha==0)|(alpha==255)),part['path']+' interior partial alpha'
    interior=cv2.erode(mask.astype('uint8'),np.ones((5,5),np.uint8))>0
    gray=cv2.cvtColor(png[:,:,:3],cv2.COLOR_BGR2GRAY)
    count,labels=cv2.connectedComponents(repair.astype('uint8'))
    patches=[]
    for label in range(1,count):
        area=(labels==label)&interior
        if not area.any():continue
        ring=(cv2.dilate((labels==label).astype('uint8'),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(17,17)))>0)&interior&~repair
        if not ring.any():raise ValueError('Repair has no measurable surrounding ring')
        a,b=float(gray[area].mean()),float(gray[ring].mean());delta=abs(a-b)/max(b,1)
        patches.append({'pixels':int(area.sum()),'ringPixels':int(ring.sum()),'brightness':a,'ringBrightness':b,'relativeDifference':delta})
        if delta>.06:failures.append({'part':part['path'],'brightnessDifference':delta})
    sources.append({'view':part['view'],'part':part['id'],'opaqueInterior':True,'patches':patches})
frames=[]
for file in sorted((HERE/'generated/frame-renders').glob('*.png')):
    png=cv2.imread(str(file),cv2.IMREAD_UNCHANGED);alpha=png[:,:,3]
    # The body is finished at alpha >=128. RETR_EXTERNAL excludes joint seams.
    contours,_=cv2.findContours((alpha>=128).astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    anatomy=file.name.split('-')[1]; color=np.array(repairs['outlineColors'][anatomy][::-1])
    total=matched=0
    for contour in contours:
        for x,y in contour[:,0]:
            total+=1
            # Near edges use measured source ink exactly; far edges retain 40%
            # of their painted texture, so compare distance to the source ink.
            rgb=png[y,x,:3].astype(float)
            # A 60%-strength far outline over any original pixel must be below
            # this per-channel ceiling. Near outlines match the source ink.
            if np.all(rgb<=color*.6+255*.4+1) and alpha[y,x]>=250:matched+=1
    coverage=matched/max(total,1)
    frames.append({'render':file.name,'edgePixels':total,'outlinedPixels':matched,'outlineContinuity':coverage})
    if coverage<.95:failures.append({'render':file.name,'outlineContinuity':coverage})
assert len(frames)==108,'Run verify.cjs --browser to render all frames first'
# Negative control: a bright outline must fail the dark-ink predicate.
assert not np.all(np.array([255,255,255])<=color*.6+255*.4+1)
report={'sourceParts':len(sources),'frames':len(frames),'patchRingNativePixels':8,'patchThreshold':.06,'outlineThreshold':.95,'outlineMaximumRGB':'0.6 * measured source ink + 0.4 * 255 + 1 rounding tolerance','sources':sources,'renders':frames,'failures':failures}
(HERE/'generated/pixel-audit.json').write_text(json.dumps(report,indent=2)+'\n',newline='\n')
print(json.dumps({'sourceParts':len(sources),'frames':len(frames),'maxPatchDifference':max(p['relativeDifference'] for s in sources for p in s['patches']),'minOutlineContinuity':min(f['outlineContinuity'] for f in frames),'failures':len(failures)}))
if failures:sys.exit(1)
