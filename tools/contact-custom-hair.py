"""All hairstyles as COMPLETE reference-size figures for a compact visual pass."""
from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]/'review/custom-alignment'
source=root/'hair-on-body';out=root/'hair-overview';out.mkdir(exist_ok=True)
styles=sorted(p.stem for p in source.glob('*.png') if not p.stem.endswith('-purple'))
pages=[]
for start in range(0,len(styles),8):
    batch=styles[start:start+8];board=Image.new('RGB',(930,len(batch)*180+42),'#292330');d=ImageDraw.Draw(board)
    d.text((10,8),'Complete figures at 1x reference size: silver front / side / back; purple front / side / back',fill='#eee')
    for row,style in enumerate(batch):
        top_index=(start+row)%3;pose=(start+row)%2;top=['hoodie','tee','suit'][top_index]
        d.text((10,45+row*180),f'{start+row+1}. {style}\n{top}\n'+('walk 1'if pose else'idle'),fill='#eee')
        for color_index,suffix in enumerate(['','-purple']):
            im=Image.open(source/(style+suffix+'.png')).convert('RGB')
            for direction_index in range(3):
                x=(top_index*2+pose)*400;y=direction_index*490+68
                sprite=im.crop((x,y,x+288,y+432)).resize((96,144),Image.Resampling.LANCZOS)
                board.paste(sprite,(150+(color_index*3+direction_index)*128,65+row*180))
    name=f'page-{start//8+1:02}.png';board.save(out/name);pages.append(name)
(out/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>All hair: complete figures</title><style>body{background:#211d26;color:#eee;font:16px sans-serif}img{max-width:100%}</style><h1>All hairstyles: full-figure overview</h1><p>Every cell retains the full figure. Detailed 3x sheets are in <a href="../hair-on-body/index.html">the hair gallery</a>.</p>'+''.join(f'<p><a href="{n}"><img src="{n}" loading="lazy"></a></p>'for n in pages),encoding='utf-8',newline='\n')
print(f'{len(styles)} complete-figure hairstyles on {len(pages)} overview pages')
