"""Native arm-hole inputs and six-pixel masks; active art remains untouched."""
import sys,json,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
OUT=ROOT/'graphics/character-system/sources/unified-body-v6';OUT.mkdir(parents=True,exist_ok=True)
mapping=json.loads((HERE/'native-body-map.json').read_text())
repairs=json.loads((ROOT/'graphics/character-system/layered-sources/completed-body-parts/repairs.json').read_text())
records=[]
for d in mapping['documents']:
    a,direction=d['id'].split('/')[1:]
    if direction not in ['right','left']:continue
    x,y,w,h=d['crop'];key=f'{a}-{direction}';near='L' if direction=='left' else 'R'
    original=cv2.imread(str(ROOT/d['source']),-1)[y:y+h,x:x+w].copy()
    raw=HERE/'generated/raw-cuts'/d['id'].replace('/','-')
    hole=np.zeros((h,w),np.uint8)
    for name in ['upperArm','forearm','hand']:
        arm=cv2.imread(str(raw/f'body.{name}.{near}.png'),-1)
        hole[arm[:,:,3]>0]=255
    base_mask=cv2.dilate(hole,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13)))
    # User explicitly approved including leftover arm ink outside the original
    # 6px mask. Restrict detection to nearby INTERIOR ink, not the body outline.
    pins=repairs['registeredPins'][d['id']]
    gray=cv2.cvtColor(original,cv2.COLOR_BGRA2GRAY)
    skin=(original[:,:,3]>240)
    inside=cv2.erode(skin.astype('uint8'),np.ones((7,7),np.uint8))>0
    median=float(np.median(gray[inside]))
    distance=cv2.distanceTransform((hole==0).astype('uint8'),cv2.DIST_L2,5)
    yy=np.indices((h,w))[0]
    palm_y=pins['palm'+near][1]-y
    ink=(gray<median*.62)&inside&(distance<=35)&(yy>=95-y)&(yy<=palm_y+65)
    added_ink=cv2.dilate(ink.astype('uint8'),np.ones((7,7),np.uint8))>0
    mask=base_mask.copy();mask[added_ink]=255
    armless=original.copy();armless[(hole>0)|added_ink]=0
    # Original native resolution retained inside padded edit canvas. No scaling.
    cx,cy=(768-w)//2,80
    target=np.zeros((1024,768,4),np.uint8);target[cy:cy+h,cx:cx+w]=armless
    guide=np.zeros((1024,768),np.uint8);guide[cy:cy+h,cx:cx+w]=mask
    for suffix,image in [('original',original),('arm-removed',armless),('hole',hole),('base-mask',base_mask),('leftover-ink-extension',((mask>0)&(base_mask==0)).astype('uint8')*255),('mask',mask),('edit-input',target),('edit-mask',guide)]:cv2.imwrite(str(OUT/f'{key}-{suffix}.png'),image)
    records.append({'key':key,'anatomy':a,'direction':direction,'near':near,'source':d['source'],'sourceSHA256':d['sourceSHA256'],'crop':d['crop'],'canvas':[768,1024],'padding':[cx,cy],
                    'pins':{k:[v[0]-x,v[1]-y] for k,v in pins.items()},'maskGrowthNativePixels':6,'holePixels':int((hole>0).sum()),'maskPixels':int((mask>0).sum()),'userApprovedLeftoverInkExtensionPixels':int(((mask>0)&(base_mask==0)).sum())})
(OUT/'inputs.json').write_text(json.dumps(records,indent=2)+'\n',newline='\n')
print('Prepared six native arm-removed views, exact hole masks grown 6px; padded without resampling.')
