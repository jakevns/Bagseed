"""Independent persisted-image gates; failures stay explicit."""
import sys,json,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
PACK=ROOT/'graphics/character-system/sources/unified-body-v6'
checks=json.loads((PACK/'checks.json').read_text());restore=json.loads((PACK/'restoration.json').read_text())
results=[]
for item in json.loads((PACK/'inputs.json').read_text()):
    key=item['key'];file=PACK/f'{key}-armless.png'
    if not file.exists():
        results.append({'key':key,'status':'BLOCKED: image service rejected output; no replacement was fabricated','accepted':False});continue
    body=cv2.imread(str(file),-1);original=cv2.imread(str(PACK/f'{key}-original.png'),-1);mask=cv2.imread(str(PACK/f'{key}-mask.png'),0)>0
    assert np.array_equal(body[~mask],original[~mask]),key+' outside mask changed'
    # Negative control proves an outside-mask modification is observable.
    bad=body.copy();point=tuple(np.argwhere(~mask)[0]);bad[point][0]^=1
    assert not np.array_equal(bad[~mask],original[~mask])
    alpha=body[:,:,3]>128;contours,_=cv2.findContours(alpha.astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    contour=max(contours,key=cv2.contourArea).reshape(-1,2);gray=cv2.cvtColor(body,cv2.COLOR_BGRA2GRAY)
    interior=cv2.erode(alpha.astype('uint8'),np.ones((5,5),np.uint8))>0
    dark_limit=float(np.median(gray[interior]))*.7
    # Search 2px inward for AA exterior ink; no contour is painted by this test.
    dark=(gray<dark_limit)&alpha
    near_dark=cv2.dilate(dark.astype('uint8'),np.ones((5,5),np.uint8))>0
    coverage=float(near_dark[contour[:,1],contour[:,0]].mean())
    c=next(r for r in checks if r['key']==key);r=next(r for r in restore if r['key']==key)
    steps={}
    for joint,center in c['cutJoints'].items():
        edges=[]
        for y in range(max(0,int(center)-15),min(len(alpha),int(center)+16)):
            xs=np.flatnonzero(alpha[y]);edges.append((y,int(xs[0]),int(xs[-1])) if len(xs) else (y,None,None))
        deltas=[max(abs(a[1]-b[1]),abs(a[2]-b[2])) for a,b in zip(edges,edges[1:]) if a[1] is not None and b[1] is not None]
        steps[joint]=max(deltas,default=0)
    tests_pass=all(t['jointInteriorTransparentPixels']==0 for t in c['tests'].values())
    failures=[]
    if not c['standingOutlinePass']:failures.append('Standing silhouette difference >=2%')
    if not c['regionColorPass']:failures.append('Standing region mean color difference >=3%')
    if not r['colorGatePass']:failures.append('Hole/ring color difference >=4%')
    if coverage<.95:failures.append('Exterior dark outline continuity <95%')
    if any(v>2 for v in steps.values()):failures.append('Armless boundary jump >2px near cut join')
    if not tests_pass:failures.append('Rotation attachment has transparent pixels')
    # Shoulder shape and patch appearance are visual gates. Do not infer their
    # success from whole-region averages or a zero joint-leak count.
    failures.append('Visual rejection: residual shoulder shading / repair-boundary transitions and arm-contour artifacts')
    results.append({'key':key,'outsideMaskIdentical':True,'standingOutlineDifference':c['standingOutlineDifference'],'regionColorDifferences':c['regionMaxChannelDifferences'],
                    'holeRingColorDifference':r['holeRingMaxChannelDifference'],'darkOutlineContinuity':coverage,'maxBoundaryJumpNearJoin':steps,
                    'armlessCutReassemblyDifference':c['armlessCutReassemblyDifference'],'rotationJointGatesPass':tests_pass,
                    'fourPanel':c['fourPanel'],'failures':failures,'accepted':False})
approved=json.loads((ROOT/'graphics/character-system/sources/torso-hips-v5/approved-parts.json').read_text())
for item in approved:
    for part in item['approvedParts']:
        if part['part']!='hand':continue
        file=ROOT/'graphics/character-system/sources/torso-hips-v5'/part['file']
        assert hashlib.sha256(file.read_bytes()).hexdigest()==part['sha256'],'Approved hand changed'
report={'results':results,'viewsRequested':6,'renderedViews':len(checks),'acceptedViews':0,'approvedHandSourcesUnchanged':True,'noWalkIntegration':True,
        'scope':'Native PNG comparisons and static stress tests. Natural background between limbs is not a joint hole. Visual checks still fail.'}
(PACK/'audit.json').write_text(json.dumps(report,indent=2)+'\n',newline='\n')
print(json.dumps(report,indent=2))
