"""Static Standing review only. Never edits active source layers or animation.

Each new raster gets a recorded uniform source-registration scale + translation.
No stretching, cap drawing, texture filling, contour repaint or geometry mask.
Approved v4 source files are hash-checked; only review canvases are resampled.
"""
from pathlib import Path
import sys,json,hashlib
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
OUT=ROOT/'graphics/character-system/sources/torso-hips-v5'
docs=json.loads((HERE/'native-body-map.json').read_text())['documents']
approved=json.loads((OUT/'approved-parts.json').read_text())
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
report=[]
def bbox(image):
    alpha=np.array(image)[:,:,3]
    # Ignore detached colored specks for registration, but leave all pixels in
    # the displayed draft so the review cannot hide a failed cleanup.
    n,labels,stats,_=cv2.connectedComponentsWithStats((alpha>128).astype('uint8'))
    if n<2:raise ValueError('Empty generated part')
    i=1+np.argmax(stats[1:,cv2.CC_STAT_AREA]);x,y,w,h=stats[i,:4]
    return (int(x),int(y),int(x+w),int(y+h))
def place(cv,part,target_top,target_height,target_center):
    box=bbox(part);x0,y0,x1,y1=box;scale=target_height/(y1-y0)
    # Scale on the display canvas only, with the exact source PNG retained.
    pw,ph=part.size;size=(max(1,round(pw*scale)),max(1,round(ph*scale)))
    p=part.resize(size,Image.Resampling.LANCZOS)
    tx=round(target_center-(x0+x1)/2*scale);ty=round(target_top-y0*scale)
    cv.alpha_composite(p,(tx,ty))
    return {'sourceBox':box,'uniformScale':scale,'translation':[tx,ty]}
for item in approved:
    a=item['anatomy'];candidate=OUT/f'{a}-candidate.png'
    for p in item['approvedParts']:
        assert hashlib.sha256((OUT/p['file']).read_bytes()).hexdigest()==p['sha256'],'Approved asset changed'
    if not candidate.exists():continue
    sheet=Image.open(candidate).convert('RGBA');sw,sh=sheet.size
    for col,direction in enumerate(['right','left']):
        doc=next(d for d in docs if d['id']==f'body/{a}/{direction}')
        x,y,w,h=doc['crop'];offset=(400-w)//2
        original=Image.open(OUT/f'{a}-{direction}-original.png').convert('RGBA')
        raw=HERE/'generated/raw-cuts'/doc['id'].replace('/','-');near='L' if direction=='left' else 'R'
        arm=Image.new('RGBA',(w,h))
        for name in ['upperArm','forearm','hand']:
            arm.alpha_composite(Image.open(raw/f'body.{name}.{near}.png').convert('RGBA'))
        visible=np.array(original).copy();visible[np.array(arm)[:,:,3]>0]=0
        original_removed=Image.fromarray(visible)
        torso=sheet.crop((col*sw//2,0,(col+1)*sw//2,sh//2))
        hips=sheet.crop((col*sw//2,sh//2,(col+1)*sw//2,sh))
        torso.save(OUT/f'{a}-{direction}-torso-draft.png');hips.save(OUT/f'{a}-{direction}-hips-draft.png')
        thigh=Image.open(OUT/f'{a}-{direction}-approved-thigh.png').convert('RGBA')
        assembly=Image.new('RGBA',(400,850));transforms={}
        # Retained original lower legs/feet provide an honest full-height context.
        lower=original.crop((0,600-y,w,h));assembly.alpha_composite(lower,(offset,600-y))
        thigh_center=offset+doc['pins']['knee'+near][0]-x
        transforms['approvedThigh']=place(assembly,thigh,470-y,140,thigh_center)
        waist=offset+doc['pins']['waist'][0]-x
        transforms['hips']=place(assembly,hips,325-y,175,waist)
        transforms['torso']=place(assembly,torso,30-y,320,waist)
        no_arm=assembly.copy();assembly.alpha_composite(arm,(offset,0))
        labels=['Original: arm pixels removed\nHidden surface is transparent','New torso + hips +\napproved thigh; no arm','Same assembly + original arm','Untouched original Standing']
        board=Image.new('RGB',(1600,910),'#d6d9dc');draw=ImageDraw.Draw(board)
        for i,label in enumerate(labels):draw.multiline_text((i*400+12,8),label,font=font,fill='#17212b',spacing=4)
        for i,image in enumerate([original_removed,no_arm,assembly,original]):
            px=i*400+(offset if i in [0,3] else 0);board.paste(image,(px,60),image)
        file=f'{a}-{direction}-standing-comparison.png';board.save(OUT/file)
        # Compare reference and new external alpha honestly; no silhouette clipping.
        reference=Image.new('RGBA',(400,850));reference.alpha_composite(original,(offset,0))
        ra=np.array(reference)[:,:,3]>128;aa=np.array(assembly)[:,:,3]>128
        mismatch=float(np.logical_xor(ra,aa).sum()/max(np.logical_or(ra,aa).sum(),1))
        report.append({'anatomy':a,'direction':direction,'comparison':file,'transforms':transforms,'standingSilhouetteDifference':mismatch,'approvedHandsThighsHashesMatch':True,'bodyApproved':False,'integrated':False})
(OUT/'standing-review.json').write_text(json.dumps({'results':report,'alignment':'Explicit uniform display scales + translations, no stretch or destination silhouette. Native model PNGs retained.','originalArmRemoved':'Only visible source pixels retained; missing original skin remains transparent.','approved':False},indent=2)+'\n',newline='\n')
print(json.dumps([{'anatomy':r['anatomy'],'direction':r['direction'],'standingSilhouetteDifference':r['standingSilhouetteDifference']} for r in report]))
