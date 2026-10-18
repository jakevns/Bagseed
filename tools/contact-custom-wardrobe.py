"""Complete figures for a visual pass over every top; never crop body parts."""
from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]/'review/custom-alignment'
out=root/'wardrobe-overview';out.mkdir(exist_ok=True)
files=sorted((root/'after').glob('*-average-neutral.png'))
poses=[(0,0),(0,2),(1,4),(3,8),(2,0),(2,2)]
pages=[]
for start in range(0,len(files),8):
    batch=files[start:start+8];board=Image.new('RGB',(930,len(batch)*180+42),'#292330');d=ImageDraw.Draw(board)
    d.text((10,8),'Complete figures: front idle / walk 1 / right walk 3 / left walk 7 / back idle / back walk 1',fill='#eee')
    for row,p in enumerate(batch):
        im=Image.open(p).convert('RGB');d.text((10,45+row*180),p.stem.replace('-average-neutral',''),fill='#eee')
        for col,(direction,frame_col) in enumerate(poses):
            x=frame_col*400;y=direction*490+68
            sprite=im.crop((x,y,x+288,y+432)).resize((96,144),Image.Resampling.LANCZOS)
            board.paste(sprite,(150+col*128,65+row*180))
    name=f'page-{start//8+1:02}.png';board.save(out/name);pages.append(name)
(out/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Every top: complete figures</title><style>body{background:#211d26;color:#eee;font:16px sans-serif}img{max-width:100%}</style><h1>Every top: full-figure overview</h1><p>Detailed 3x sheets and all builds/presentations are in <a href="../after/index.html">the full wardrobe gallery</a>.</p>'+''.join(f'<p><a href="{n}"><img loading="lazy" src="{n}"></a></p>'for n in pages),encoding='utf-8',newline='\n')
print(f'{len(files)} tops reviewed as complete figures on {len(pages)} overview pages')
