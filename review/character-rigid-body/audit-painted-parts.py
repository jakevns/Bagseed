"""Audit unapproved model sheets without editing or promoting them to the rig."""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent.parent
PACK=ROOT/'graphics/character-system/sources/painted-parts-v4'
layout=json.loads((PACK/'layout.json').read_text())
records=[]
for doc in layout:
    a=doc['anatomy'];file=PACK/(a+'-candidate.png')
    if not file.exists():
        records.append({'anatomy':a,'status':'no output','approved':False});continue
    generated=cv2.imread(str(file),cv2.IMREAD_UNCHANGED)
    original=cv2.imread(str(PACK/(a+'-protected-pixels.png')),cv2.IMREAD_UNCHANGED)
    record={'anatomy':a,'size':[generated.shape[1],generated.shape[0]],'requiredSize':doc['size'],'approved':False,'integrated':False}
    if generated.shape!=original.shape:
        record['status']='FAIL: output dimensions/alpha do not match; do not rescale original paint'
    else:
        locked=original[:,:,3]==255
        error=np.max(np.abs(generated.astype('int16')-original.astype('int16')),axis=2)
        changed=locked&(error>0)
        record.update({'status':'FAIL: protected pixels changed' if changed.any() else 'protected pixel equality passes; visual review still required',
                       'protectedPixels':int(locked.sum()),'changedProtectedPixels':int(changed.sum()),
                       'changedProtectedFraction':float(changed.sum()/max(locked.sum(),1)),
                       'partialInteriorAlpha':int(((generated[:,:,3]>0)&(generated[:,:,3]<255)&(cv2.erode((generated[:,:,3]>0).astype('uint8'),np.ones((3,3),np.uint8))>0)).sum())})
        cells=[]
        for c in doc['cells']:
            x,y,w,h=c['cell'];part=generated[y:y+h,x:x+w]
            name=f"{a}-{c['direction']}-{c['part']}-draft.png"
            cv2.imwrite(str(PACK/name),part)
            cells.append({'direction':c['direction'],'part':c['part'],'draft':name,'alphaPixels':int((part[:,:,3]>128).sum()),'sourceFragmentPixels':int((original[y:y+h,x:x+w,3]>128).sum())})
        record['cells']=cells
    records.append(record)
report={'summary':'Unapproved model drafts. Source-pixel preservation is mandatory; failures are not repaired by resizing, warping or code-drawn caps. Walk checks are deferred until part approval.','results':records,'integrated':False,'walkChecksRun':False,'bodyApproved':False}
(PACK/'validation.json').write_text(json.dumps(report,indent=2)+'\n',newline='\n')
print(json.dumps(records,indent=2))
