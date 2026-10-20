"""Code-only body cleanup. V6/native paintings and approved hands stay intact."""
from pathlib import Path
import json
from native_review import *
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
BASE=ROOT/'graphics/character-system/sources/unified-body-v6';OUT=ROOT/'graphics/character-system/sources/unified-body-v7'
items=json.loads((BASE/'inputs.json').read_text());mirrors=json.loads((OUT/'mirror-measurements.json').read_text());reports=[]
for item in items:
    key=item['key'];original=cv2.imread(str(BASE/f'{key}-original.png'),-1)
    if not (BASE/f'{key}-armless.png').exists():continue
    raw=cv2.imread(str(BASE/f'{key}-armless.png'),-1);mask=cv2.imread(str(BASE/f'{key}-mask.png'),0)>0
    ink=ink_metrics(original)
    matched,color_report=match_repair(raw,original,mask)
    # Remove internal arm-outline remnants ONLY from the former resting arm
    # region. Outer silhouette ink is excluded and restored separately below.
    resting=cv2.imread(str(BASE/f'{key}-hole.png'),0)>0
    inside=cv2.erode((matched[:,:,3]>128).astype('uint8'),np.ones((17,17),np.uint8))>0
    gray=cv2.cvtColor(matched,cv2.COLOR_BGRA2GRAY)
    remove=resting&inside&(gray<ink['graySkinMedian']*.6)
    donor=inside&~resting&(gray>ink['graySkinMedian']*.65)
    if remove.any() and donor.any():matched[:,:,:3][remove]=nearest_paint(matched,donor)[remove]
    cleaned=clean_edge(matched,ink)
    # A short all-ink neck spur in the original crop has no skin interior.
    # Remove only narrow neck-edge remnants, leaving limbs/toes untouched.
    neck_limit=int((item['pins']['neck'][1]+item['pins']['shoulder'+item['near']][1])/2)
    alpha=(cleaned[:,:,3]>128).astype('uint8')
    opened=cv2.morphologyEx(alpha,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*ink['width']+1,)*2))
    neck_rows=np.indices(alpha.shape)[0]<neck_limit
    cleaned[neck_rows&(opened==0)]=0
    cleaned=clean_edge(cleaned,ink,follow_dark=False)
    cleaned,final_color_report=match_repair(cleaned,original,mask,skin_only=True)
    # Edge cleanup is the user's explicit exception to v6 outside-mask equality.
    changed=np.any(cleaned!=raw,axis=2)&~mask
    cv2.imwrite(str(OUT/f'{key}-body.png'),cleaned)
    report={**item,'source':'native v6 repair','initialColorMatch':color_report,'colorMatch':final_color_report,
            'outlineColorBGR':ink['color'].tolist(),'outlineWidth':ink['width'],'skinMedian':ink['graySkinMedian'],
            'internalArmInkRemoved':int(remove.sum()),'outsideRepairMaskEdgeCleanupPixels':int(changed.sum())}
    reports.append(report)
for a in ['female','male']:
    target=next(d for d in items if d['key']==a+'-left');right=next(d for d in reports if d['key']==a+'-right')
    measurement=next(m for m in mirrors if m['anatomy']==a)
    source=cv2.imread(str(OUT/f'{a}-right-body.png'),-1);original=cv2.imread(str(BASE/f'{a}-left-original.png'),-1)
    m=np.array(measurement['matrix']);flipped=warp(cv2.flip(source,1),m,(original.shape[1],original.shape[0]))
    ink=ink_metrics(original)
    left_mask=cv2.imread(str(BASE/f'{a}-left-mask.png'),0)>0
    flipped,left_color=match_repair(flipped,original,left_mask)
    flipped=clean_edge(flipped,ink,follow_dark=False)
    flipped,left_color=match_repair(flipped,original,left_mask,skin_only=True)
    cv2.imwrite(str(OUT/f'{a}-left-body.png'),flipped)
    reports.append({**target,'source':'horizontal reflection of right repair; one uniform scale and translation',
                    'mirror':measurement,'colorMatch':left_color,'outlineColorBGR':ink['color'].tolist(),
                    'outlineWidth':ink['width'],'skinMedian':ink['graySkinMedian'],'internalArmInkRemoved':0,
                    'outsideRepairMaskEdgeCleanupPixels':None})
(OUT/'prepared.json').write_text(json.dumps(reports,indent=2)+'\n',newline='\n')
print(json.dumps([{'key':r['key'],'outlineWidth':r['outlineWidth'],'color':r['colorMatch'],'mirrorDifference':r.get('mirror',{}).get('outlineDifference')} for r in reports],indent=2))
