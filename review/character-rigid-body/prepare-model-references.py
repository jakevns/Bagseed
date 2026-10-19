"""Prepare bounded edit targets for concealed profile skin only."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent.parent
OUT=ROOT/'graphics/character-system/sources/concealed-skin-v3'
OUT.mkdir(parents=True,exist_ok=True)
docs=json.loads((HERE/'native-body-map.json').read_text())['documents']
parts=json.loads((ROOT/'graphics/character-system/layered-sources/completed-body-parts/repairs.json').read_text())['parts']
records=[]
for anatomy in ['androgynous','female','male']:
    target=Image.new('RGBA',(840,560)); mask_sheet=Image.new('L',(840,560))
    cells=[]
    for column,direction in enumerate(['right','left']):
        doc=next(d for d in docs if d['id']==f'body/{anatomy}/{direction}')
        x,y,w,h=doc['crop']; ox=column*420+(420-w)//2
        original=Image.open(ROOT/doc['source']).convert('RGBA').crop((x,y,x+w,y+560))
        wanted=np.zeros((560,w),np.uint8); repair=np.zeros_like(wanted)
        for p in parts:
            if p['view']==doc['id'] and p['id'] in ['body.neck','body.torso','body.pelvis']:
                wanted=np.maximum(wanted,np.array(Image.open(ROOT/p['expected']))[:560])
                if p['id']!='body.neck':repair=np.maximum(repair,np.array(Image.open(ROOT/p['repair']))[:560])
        rgba=np.array(original);rgba[:,:,3]=wanted
        rgba[repair>0,:3]=[255,0,255]
        target.alpha_composite(Image.fromarray(rgba),(ox,0));mask_sheet.paste(Image.fromarray(repair),(ox,0))
        cells.append({'direction':direction,'sheetRect':[ox,0,w,560],'nativeCrop':[x,y,w,560]})
    target.save(OUT/f'{anatomy}-edit-target.png');mask_sheet.save(OUT/f'{anatomy}-edit-mask.png')
    records.append({'anatomy':anatomy,'cells':cells,'target':f'{anatomy}-edit-target.png','mask':f'{anatomy}-edit-mask.png','output':f'{anatomy}-concealed.png'})
(OUT/'layout.json').write_text(json.dumps(records,indent=2)+'\n',newline='\n')
print('Prepared three 840x560 edit targets and masks; generation limit 3, no retries.')
