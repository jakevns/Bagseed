"""Register a repaint and enforce exact original pixels outside native mask.

No anatomical shape is synthesized. Any registration, color adjustment and
failed image is reported. A unified source must be visually accepted before use.
"""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
PACK=ROOT/'graphics/character-system/sources/unified-body-v6'
records=[]
for item in json.loads((PACK/'inputs.json').read_text()):
    key=item['key'];file=PACK/f'{key}-candidate.png'
    if not file.exists():continue
    original=cv2.imread(str(PACK/f'{key}-original.png'),-1)
    target=cv2.imread(str(PACK/f'{key}-edit-input.png'),-1)
    mask=cv2.imread(str(PACK/f'{key}-mask.png'),0)>0
    generated=cv2.imread(str(file),-1)
    if generated is None or generated.shape[2]!=4:raise ValueError('Missing generated alpha')
    # Register with unchanged source features outside the paint mask. Uniform
    # similarity transform only; no anisotropic fitting or anatomy mesh.
    input_mask=cv2.imread(str(PACK/f'{key}-edit-mask.png'),0)
    valid=((target[:,:,3]>240)&(input_mask==0)).astype('uint8')*255
    orb=cv2.ORB_create(nfeatures=7000,edgeThreshold=10,fastThreshold=8)
    k1,d1=orb.detectAndCompute(cv2.cvtColor(generated,cv2.COLOR_BGRA2GRAY),None)
    k2,d2=orb.detectAndCompute(cv2.cvtColor(target,cv2.COLOR_BGRA2GRAY),valid)
    good=[]
    if d1 is not None and d2 is not None:
        matches=cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(d1,d2,k=2)
        candidates=[pair[0] for pair in matches if len(pair)==2 and pair[0].distance<.72*pair[1].distance]
        # Repeated ink corners must not all vote for one target keypoint: that
        # can produce a zero-scale RANSAC transform with many false inliers.
        unique={}
        for match in sorted(candidates,key=lambda m:m.distance):unique.setdefault(match.trainIdx,match)
        good=list(unique.values())
    matrix=None;inliers=0
    if len(good)>=6:
        src=np.float32([k1[m.queryIdx].pt for m in good]);dst=np.float32([k2[m.trainIdx].pt for m in good])
        matrix,keep=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=3,maxIters=5000)
        inliers=int(keep.sum()) if keep is not None else 0
        framing=min(768/generated.shape[1],1024/generated.shape[0])
        scale=float(np.hypot(matrix[0,0],matrix[1,0])) if matrix is not None else 0
        angle=abs(float(np.degrees(np.arctan2(matrix[1,0],matrix[0,0])))) if matrix is not None else 180
        if inliers<6 or not framing*.75<scale<framing*1.25 or angle>5:matrix=None
    method='ORB similarity outside mask'
    if matrix is None:
        # Explicit fallback aligns framing using one uniform scale. A failed
        # source registration stays a failure, not an excuse to distort paint.
        scale=min(768/generated.shape[1],1024/generated.shape[0])
        matrix=np.float64([[scale,0,(768-generated.shape[1]*scale)/2],[0,scale,(1024-generated.shape[0]*scale)/2]])
        method='uniform canvas framing fallback; source registration UNVERIFIED'
    full=cv2.warpAffine(generated,matrix,(768,1024),flags=cv2.INTER_LANCZOS4)
    cx,cy=item['padding'];x,y,w,h=item['crop'];candidate=full[cy:cy+h,cx:cx+w].copy()
    restored=original.copy();restored[mask]=candidate[mask]
    # Same-part ring excludes transparent exterior and dark painted ink. Chroma
    # gain operates only on new pixels; it preserves texture and source pixels.
    outer=cv2.dilate(mask.astype('uint8'),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(21,21)))>0
    skin=cv2.erode((original[:,:,3]>250).astype('uint8'),np.ones((5,5),np.uint8))>0
    gray=cv2.cvtColor(original,cv2.COLOR_BGRA2GRAY)
    ring=outer&~mask&skin&(gray>np.median(gray[skin])*.65)
    filled=mask&(restored[:,:,3]>250)
    gains=np.ones(3)
    if ring.any() and filled.any():
        target_mean=original[:,:,:3][ring].mean(axis=0);before=restored[:,:,:3][filled].mean(axis=0)
        gains=target_mean/np.maximum(before,1)
        restored[:,:,:3][filled]=np.clip(np.rint(restored[:,:,:3][filled]*gains),0,255).astype('uint8')
        after=restored[:,:,:3][filled].mean(axis=0)
        color_difference=float(np.max(np.abs(after-target_mean)/np.maximum(target_mean,1)))
    else:color_difference=1
    assert np.array_equal(restored[~mask],original[~mask]),'Outside-mask pixels changed'
    cv2.imwrite(str(PACK/f'{key}-armless.png'),restored)
    correction=np.zeros_like(target);correction[cy:cy+h,cx:cx+w]=restored
    cv2.imwrite(str(PACK/f'{key}-correction-input.png'),correction)
    # Dark thin structures inside repair skin are an arm-outline warning. The
    # automatic count is diagnostic; only inspection can identify a deltoid.
    alpha=restored[:,:,3]>128
    inside=cv2.erode(alpha.astype('uint8'),np.ones((11,11),np.uint8))>0
    restored_gray=cv2.cvtColor(restored,cv2.COLOR_BGRA2GRAY)
    median=float(np.median(restored_gray[inside])) if inside.any() else 0
    dark=(restored_gray<median*.58)&mask&inside
    count,labels,stats,_=cv2.connectedComponentsWithStats(dark.astype('uint8'))
    strokes=[{'pixels':int(s[4]),'width':int(s[2]),'height':int(s[3])} for s in stats[1:] if s[4]>=10 and s[3]>=15]
    records.append({'key':key,'candidate':file.name,'registrationMethod':method,'registrationMatrix':matrix.tolist(),'featureMatches':len(good),'featureInliers':inliers,
                    'outsideMaskChangedPixels':0,'colorMatchGainsBGR':gains.tolist(),'holeRingMaxChannelDifference':color_difference,'colorGatePass':color_difference<.04,
                    'internalDarkStrokeWarnings':strokes,'shoulderMuscleVisualCheck':'pending','accepted':False})
(PACK/'restoration.json').write_text(json.dumps(records,indent=2)+'\n',newline='\n')
print(json.dumps(records))
