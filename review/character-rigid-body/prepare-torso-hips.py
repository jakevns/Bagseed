"""Freeze approved v4 hand/thigh pixels and prepare v5 source references."""
from pathlib import Path
import json,hashlib
from PIL import Image
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent.parent
OLD=ROOT/'graphics/character-system/sources/painted-parts-v4'
OUT=ROOT/'graphics/character-system/sources/torso-hips-v5'
OUT.mkdir(parents=True,exist_ok=True)
docs=json.loads((HERE/'native-body-map.json').read_text())['documents']
records=[]
for a in ['androgynous','female','male']:
    sheet=Image.open(OLD/(a+'-candidate.png')).convert('RGBA')
    w,h=sheet.size;cw,ch=w//4,h//2
    refs=Image.new('RGBA',(cw*2,ch*2)); sources=Image.new('RGBA',(800,850))
    parts=[]
    for row,d in enumerate(['right','left']):
        doc=next(v for v in docs if v['id']==f'body/{a}/{d}')
        x,y,nw,nh=doc['crop']
        source=Image.open(ROOT/doc['source']).convert('RGBA').crop((x,y,x+nw,y+nh))
        source.save(OUT/f'{a}-{d}-original.png')
        sources.alpha_composite(source,(row*400+(400-nw)//2,0))
        for col,(part,old_col) in enumerate([('hand',0),('thigh',3)]):
            box=(old_col*cw,row*ch,(old_col+1)*cw,(row+1)*ch)
            cut=sheet.crop(box);name=f'{a}-{d}-approved-{part}.png';cut.save(OUT/name)
            refs.alpha_composite(cut,(col*cw,row*ch))
            parts.append({'direction':d,'part':part,'file':name,'sourceSheet':str((OLD/(a+'-candidate.png')).relative_to(ROOT)).replace('\\','/'),'sourceBox':box,'sha256':hashlib.sha256((OUT/name).read_bytes()).hexdigest()})
    sources.save(OUT/f'{a}-side-originals.png');refs.save(OUT/f'{a}-approved-references.png')
    records.append({'anatomy':a,'approvedParts':parts,'sourceScale':1,'approvedSourceSheetSize':[w,h]})
(OUT/'approved-parts.json').write_text(json.dumps(records,indent=2)+'\n',newline='\n')
print('Frozen approved v4 hands/thighs by exact crop; no repaint or resampling.')
