"""Measure reflected right originals against left originals before using them."""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
BASE=ROOT/'graphics/character-system/sources/unified-body-v6'
OUT=ROOT/'graphics/character-system/sources/unified-body-v7';OUT.mkdir(parents=True,exist_ok=True)
items=json.loads((BASE/'inputs.json').read_text());results=[]
for a in ['female','male']:
    right=next(d for d in items if d['key']==a+'-right');left=next(d for d in items if d['key']==a+'-left')
    src=cv2.imread(str(BASE/f'{a}-right-original.png'),-1);target=cv2.imread(str(BASE/f'{a}-left-original.png'),-1)
    names=['neck','waist','shoulder','elbow','wrist','hip','knee','ankle']
    def points(item):return np.array([item['pins'][n if n in ['neck','waist'] else n+item['near']] for n in names],float)
    rp=points(right);rp[:,0]=src.shape[1]-1-rp[:,0];lp=points(left)
    rc=rp.mean(axis=0);lc=lp.mean(axis=0);s=float(((rp-rc)*(lp-lc)).sum()/((rp-rc)**2).sum());t=lc-rc*s
    matrix=np.array([[s,0,t[0]],[0,s,t[1]]]);reflected=cv2.warpAffine(cv2.flip(src,1),matrix,(target.shape[1],target.shape[0]),flags=cv2.INTER_LANCZOS4)
    ra=reflected[:,:,3]>128;ta=target[:,:,3]>128
    diff=float(np.logical_xor(ra,ta).sum()/np.logical_or(ra,ta).sum());errors=np.linalg.norm(rp*s+t-lp,axis=1)
    cv2.imwrite(str(OUT/f'{a}-mirror-original-comparison.png'),np.hstack([target,reflected]))
    results.append({'anatomy':a,'uniformScale':s,'translation':t.tolist(),'matrix':matrix.tolist(),'outlineDifference':diff,'jointRmsNativePixels':float(np.sqrt((errors**2).mean())),'jointMaxNativePixels':float(errors.max()),'jointNames':names,'jointErrors':errors.tolist(),'rotationDegrees':0,'warping':False})
(OUT/'mirror-measurements.json').write_text(json.dumps(results,indent=2)+'\n',newline='\n');print(json.dumps(results,indent=2))
