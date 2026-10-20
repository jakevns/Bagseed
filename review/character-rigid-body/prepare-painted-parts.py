"""Prepare original-pixel fragments for model completion; no synthetic caps.

This writes a NEW review pack only. It never changes the active rig or parts.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent.parent
OUT=ROOT/'graphics/character-system/sources/painted-parts-v4'
OUT.mkdir(parents=True,exist_ok=True)
docs=json.loads((HERE/'native-body-map.json').read_text())['documents']
records=[]
for anatomy in ['androgynous','female','male']:
    target=Image.new('RGBA',(1600,1200))
    protected=Image.new('RGBA',target.size)
    cells=[]
    for row,direction in enumerate(['right','left']):
        doc=next(d for d in docs if d['id']==f'body/{anatomy}/{direction}')
        x,y,w,h=doc['crop']; near='L' if direction=='left' else 'R'
        raw=HERE/'generated/raw-cuts'/doc['id'].replace('/','-')
        for column,(name,ids,lo,hi) in enumerate([
            ('hand',[f'body.hand.{near}'],400,530),
            ('torso',['body.neck','body.torso'],20,370),
            ('hips',['body.pelvis',f'body.thigh.{near}'],330,490),
            ('thigh',[f'body.thigh.{near}'],470,610)]):
            part=Image.new('RGBA',(w,h))
            for part_id in ids:
                original_cut=Image.open(raw/(part_id+'.png')).convert('RGBA')
                part.alpha_composite(original_cut)
            # Window selects ORIGINAL fragment ownership, not a finished outline.
            fragment=part.crop((0,lo-y,w,hi-y))
            ox=column*400+(400-w)//2; oy=row*600+90
            target.alpha_composite(fragment,(ox,oy))
            protected.alpha_composite(fragment,(ox,oy))
            cells.append({'direction':direction,'part':name,'cell':[column*400,row*600,400,600],
                          'fragmentOrigin':[ox,oy],'nativeCrop':[x,lo,w,hi-lo]})
    target.save(OUT/f'{anatomy}-edit-target.png')
    protected.save(OUT/f'{anatomy}-protected-pixels.png')
    # White indicates editable transparent context; black is locked painted art.
    mask=Image.fromarray(np.where(np.array(protected)[:,:,3]>0,0,255).astype('uint8'))
    mask.save(OUT/f'{anatomy}-edit-guide.png')
    records.append({'anatomy':anatomy,'size':[1600,1200],'cells':cells,
                    'source':next(d['source'] for d in docs if d['id']==f'body/{anatomy}/right')})
(OUT/'layout.json').write_text(json.dumps(records,indent=2)+'\n',newline='\n')
print('Prepared 3 original-fragment sheets; active animation and source parts unchanged.')
