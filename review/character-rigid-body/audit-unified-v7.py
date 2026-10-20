"""Independent PNG checks for six v7 views; never converts failures to approval."""
from pathlib import Path
import json,hashlib
from native_review import *
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
BASE=ROOT/'graphics/character-system/sources/unified-body-v6';PACK=ROOT/'graphics/character-system/sources/unified-body-v7'
rig=json.loads((PACK/'rig-review.json').read_text());prepared=json.loads((PACK/'prepared.json').read_text());reports=[]
def exterior(a,color):
    mask=a[:,:,3]>128;edge=mask&~(cv2.erode(mask.astype('uint8'),np.ones((3,3),np.uint8))>0)
    light=edge&np.any(a[:,:,:3]>np.array(color)+2,axis=2)
    # Width is sampled along inward normals from the actual OUTER contour.
    pts=contour(mask);is_ink=mask&(np.max(abs(a[:,:,:3].astype(int)-np.array(color)),axis=2)<=8);widths=[]
    signed=cv2.distanceTransform(mask.astype('uint8'),cv2.DIST_L2,5)-cv2.distanceTransform((~mask).astype('uint8'),cv2.DIST_L2,5)
    gy,gx=np.gradient(cv2.GaussianBlur(signed,(0,0),2))
    for i,p in enumerate(pts):
        n=np.array([gx[p[1],p[0]],gy[p[1],p[0]]]);n/=max(np.linalg.norm(n),1e-6)
        # At a one-pixel concave raster corner the smoothed gradient can point
        # across the empty notch. Use the nearest genuinely INWARD ray, chosen
        # using alpha only, before inspecting any ink colours or thickness.
        for degrees in [0,15,-15,30,-30,45,-45,60,-60,75,-75,90,-90]:
            theta=np.radians(degrees);candidate=np.array([[np.cos(theta),-np.sin(theta)],[np.sin(theta),np.cos(theta)]])@n
            ray=np.rint(p+np.arange(1,8)[:,None]*candidate).astype(int)
            if np.all((ray[:,0]>=0)&(ray[:,0]<mask.shape[1])&(ray[:,1]>=0)&(ray[:,1]<mask.shape[0])) and np.all(mask[ray[:,1],ray[:,0]]):
                n=candidate;break
        width=0
        for depth in range(16):
            q=np.rint(p+n*depth).astype(int)
            if not(0<=q[0]<mask.shape[1] and 0<=q[1]<mask.shape[0] and is_ink[q[1],q[0]]):break
            width+=1
        widths.append(width)
    median=float(np.median(widths));bad=[w for w in widths if abs(w-median)>1]
    locations=[{'xy':p.tolist(),'thickness':w} for p,w in zip(pts,widths) if abs(w-median)>1]
    return {'exteriorPixels':int(edge.sum()),'lightPixelsOutsideInk':int(light.sum()),'medianThickness':median,'minThickness':int(min(widths)),'maxThickness':int(max(widths)),'thicknessSamples':len(widths),'outsideMedianPlusMinus1':len(bad),'problemLocations':locations,'thicknessPass':not bad}
for r in rig:
    key=r['key'];p=next(d for d in prepared if d['key']==key);body=cv2.imread(str(PACK/f'{key}-body.png'),-1);original=cv2.imread(str(BASE/f'{key}-original.png'),-1)
    mask=cv2.imread(str(BASE/f'{key}-mask.png'),0)>0
    src_skin=cv2.erode((original[:,:,3]>250).astype('uint8'),np.ones((7,7),np.uint8))>0
    g=cv2.cvtColor(original,cv2.COLOR_BGRA2GRAY);src_skin&=g>np.median(g[src_skin])*.65
    ring=(cv2.dilate(mask.astype('uint8'),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(25,25)))>0)&~mask&src_skin
    filled=mask&(cv2.erode((body[:,:,3]>250).astype('uint8'),np.ones((7,7),np.uint8))>0)
    bg=cv2.cvtColor(body,cv2.COLOR_BGRA2GRAY);filled&=bg>r['skinMedian']*.6
    mu=body[:,:,:3][filled].mean(axis=0);ref=original[:,:,:3][ring].mean(axis=0)
    color_diff=float(np.max(abs(mu-ref)/np.maximum(ref,1)))
    spread=float(np.max(abs(body[:,:,:3][filled].std(axis=0)-original[:,:,:3][ring].std(axis=0))/np.maximum(original[:,:,:3][ring].std(axis=0),1)))
    torso=cv2.imread(str(PACK/f'{key}-torso.png'),-1);rest=cv2.imread(str(BASE/f'{key}-hole.png'),0)>0
    inside=cv2.erode((body[:,:,3]>128).astype('uint8'),np.ones((2*(r['outlineWidth']+4)+1,)*2,np.uint8))>0
    internal_ink=rest&inside&(torso[:,:,3]>128)&(cv2.cvtColor(torso,cv2.COLOR_BGRA2GRAY)<r['skinMedian']*.6)
    edges={};stress={};shoulder_lines={};canvases={}
    for name in ['standing','armless','thigh-plus25','thigh-minus25','arm-plus20','arm-minus20','walk0','walk4']:
        image=cv2.imread(str(PACK/f'{key}-{name}.png'),-1);edges[name]=exterior(image,r['outlineColorBGR'])
        canvases[name]=[image.shape[1],image.shape[0]]
        if name in ['arm-plus20','arm-minus20']:
            # Detect new straight ink seams in the shoulder INTERIOR; the
            # intended curved arm exterior is excluded from this seam test.
            offset=np.array(r['testPadding']);sp=np.array(r['shoulderPivot'])+offset;yy,xx=np.indices(image.shape[:2])
            region=(xx-sp[0])**2+(yy-sp[1])**2<45**2
            arm=cv2.imread(str(PACK/f'{key}-upper-arm.png'),-1)
            arm=cv2.copyMakeBorder(arm,int(offset[1]),int(offset[1]),int(offset[0]),int(offset[0]),cv2.BORDER_CONSTANT,value=0)
            angle=20 if name=='arm-plus20' else -20
            moved=warp(arm,rigid(sp,angle),(image.shape[1],image.shape[0]))
            deep=cv2.erode((moved[:,:,3]>128).astype('uint8'),np.ones((17,17),np.uint8))>0
            ink=np.max(abs(image[:,:,:3].astype(int)-np.array(r['outlineColorBGR'])),axis=2)<8
            line_mask=(region&deep&ink).astype('uint8')*255
            lines=cv2.HoughLinesP(line_mask,1,np.pi/180,threshold=7,minLineLength=7,maxLineGap=0)
            shoulder_lines[name]=0 if lines is None else len(lines)
        if name in ['thigh-plus25','thigh-minus25','arm-plus20','arm-minus20']:
            pivot=np.array(r['hipPivot'] if name.startswith('thigh') else r['shoulderPivot'])+np.array(r['testPadding'])
            yy,xx=np.indices(image.shape[:2]);region=(xx-pivot[0])**2+(yy-pivot[1])**2<=10**2
            stress[name]={'jointTransparentPixels':int(((image[:,:,3]<250)&region).sum())}
    failures=[]
    if any(e['lightPixelsOutsideInk'] for e in edges.values()):failures.append('outer halo pixels remain')
    if any(not e['thicknessPass'] for e in edges.values()):failures.append('some outline widths exceed median +/-1px')
    if color_diff>=.03:failures.append('repaired color mean difference >=3%')
    if spread>=.03:failures.append('repaired color spread difference >=3%')
    if any(size!=r['reviewCanvas'] for size in canvases.values()):failures.append('review canvas size mismatch')
    if any(x['nearArmOrderErrors'] for x in r['nearArmDrawOrder'].values()):failures.append('near arm is not always the front contributor')
    if internal_ink.any():failures.append('internal torso arm-outline pixels remain')
    if any(shoulder_lines.values()):failures.append('new shoulder interior straight ink segment >6px detected')
    if any(x>2.00001 for x in r['hipSearchDepths']):failures.append('hip notch depth >2px')
    if any(x['jointTransparentPixels'] for x in stress.values()):failures.append('transparent pixels in stress-test joint interior')
    # User replaced original-pose edge comparison with these functional gates.
    # The old edge distance stays in this report strictly as information.
    if r['knuckleWidthDifference']>.05:failures.append('hand knuckle width differs by >5%')
    if r['handWristError']>2:failures.append('hand wrist centre differs by >2px')
    if r['wristJoinGap']:failures.append('gap in wrist join')
    if r['wristJoinMaxRowStep']>2:failures.append('wrist outline step >2px')
    if r['handForearmAngleErrorDegrees']>1:failures.append('hand rotation does not follow forearm')
    if r['handCutOff'] or not r['standingHandInFront']:failures.append('standing hand clipped or behind thigh')
    hand_file=ROOT/'graphics/character-system/sources/torso-hips-v5'/f'{key}-approved-hand.png'
    assert hashlib.sha256(hand_file.read_bytes()).hexdigest()==r['handSourceSHA256']
    assert all(x['nearArmOrderErrors']==0 for x in r['nearArmDrawOrder'].values())
    assert any(x['reversedOrderDifferentPixels']>0 for x in r['nearArmDrawOrder'].values()),'draw-order negative control ineffective'
    reports.append({'key':key,'board':r['board'],'edgeChecks':edges,'reviewCanvases':canvases,'repairColorMeanDifference':color_diff,'repairColorSpreadDifference':spread,
                    'internalTorsoArmInkPixels':int(internal_ink.sum()),'shoulderInteriorStraightSegments':shoulder_lines,'hipNotchDepths':r['hipSearchDepths'],
                    'stressJoints':stress,'nearArmOrderErrors':sum(x['nearArmOrderErrors'] for x in r['nearArmDrawOrder'].values()),
                    'handEdgeDistancesInformationalOnly':True,'handEdgeDistances':r['handEdgeDistances'],
                    'handWristError':r['handWristError'],'knuckleWidthDifference':r['knuckleWidthDifference'],
                    'wristJoinMaxRowStep':r['wristJoinMaxRowStep'],'wristJoinGap':r['wristJoinGap'],
                    'handForearmAngleErrorDegrees':r['handForearmAngleErrorDegrees'],'handCutOff':r['handCutOff'],
                    'standingHandInFront':r['standingHandInFront'],'standingOutlineDifference':r['standingOutlineDifference'],
                    'mirror':r['mirror'],'failures':failures,'automatedGatesPass':not failures,'approved':False,'walkIntegrated':False})
report={'views':6,'imageCalls':0,'results':reports,'approvedHandsUnchanged':True,'bodyApproved':False,'walkIntegrated':False}
(PACK/'audit.json').write_text(json.dumps(report,indent=2,allow_nan=False)+'\n',newline='\n')
print(json.dumps([{'key':r['key'],'color':r['repairColorMeanDifference'],'handEdge':r['handEdgeDistances']['max'],'failures':r['failures']} for r in reports],indent=2))
