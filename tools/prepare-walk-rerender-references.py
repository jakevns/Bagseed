"""Reference-only contact boards. Source mannequin and idle PNGs stay untouched."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
root=Path(__file__).resolve().parents[1]/'graphics/production/walk'
out=root/'sources/rerender-v6/reference-guides';out.mkdir(exist_ok=True)
records=[]
notes=['viewer-RIGHT shoe lowest / contact','viewer-RIGHT support / passing',
       'viewer-LEFT shoe lowest / contact','viewer-LEFT support / passing']
for di,first in [('down',0),('up',0),('right',0),('right',4),('left',0),('left',4)]:
    board=Image.new('RGBA',(1152,432),'#ede8de');draw=ImageDraw.Draw(board)
    for slot in range(4):
        frame=first+slot
        source=root/('registered/mannequin' if di in ['up','down'] else 'stride-v4')/f'{di}-{frame}.png'
        board.alpha_composite(Image.open(source).convert('RGBA'),(slot*288,0))
        note=notes[slot] if di in ['up','down'] else 'copy this exact stride phase'
        draw.text((slot*288+8,20),f'{frame}: {note}',fill='#333333')
        records.append({'source':str(source.relative_to(root)),
                        'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
    board.save(out/f'{di}-{first}-{first+3}.png')
(out/'provenance.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
