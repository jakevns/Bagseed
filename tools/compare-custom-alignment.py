"""Compare entire sprite canvases, never crops of heads or torsos."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
from io import BytesIO
root=Path(__file__).resolve().parents[1]/'review/custom-alignment'
out=root/'comparisons';out.mkdir(exist_ok=True)
poses=[('down',-1),('down',0),('down',1),('right',3),('left',7),('up',1)]
files=[]
for before in sorted((root/'before').glob('*.png')):
    after=root/'after'/before.name
    if not after.exists():continue
    a,b=Image.open(before),Image.open(after)
    board=Image.new('RGB',(800,60+len(poses)*490),'#292330');d=ImageDraw.Draw(board)
    d.text((10,10),before.stem+' | BEFORE (left) / AFTER (right)',fill='#eee')
    d.text((10,30),'Entire 288x432 figure + 96x144 reference canvas in each cell.',fill='#eee')
    for row,(direction,frame) in enumerate(poses):
        x=(frame+1)*400;y=40+['down','right','up','left'].index(direction)*490
        for col,im in enumerate([a,b]):board.paste(im.crop((x,y,x+400,y+490)),(col*400,60+row*490))
    encoded=BytesIO();board.save(encoded,format='PNG');target=out/before.name;data=encoded.getvalue()
    if not target.exists() or target.read_bytes()!=data:target.write_bytes(data)
    files.append(before.name)
style='<style>body{background:#211d26;color:#eee;font:16px sans-serif}img{max-width:100%;height:auto}section{padding:12px}</style>'
(out/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Full-body before and after</title>'+style+'<h1>Before and after: complete figures</h1><p>Left: rejected build captured before edits. Right: current candidate. All sprites retain the full canvas.</p>'+''.join(f'<section><h2>{f}</h2><a href="{f}"><img loading="lazy" src="{f}"></a></section>'for f in files),encoding='utf-8',newline='\n')
(root/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Custom character alignment audit</title>'+style+'''<h1>Custom character alignment audit</h1>
<p>Candidate for visual review. Passing technical checks is not visual approval.</p>
<ul><li><a href="comparisons/index.html">Before / after: every outfit, complete figures</a></li>
<li><a href="wardrobe-overview/index.html">Every top: compact full-figure overview</a></li>
<li><a href="after/index.html">All 270 wardrobe sheets: 15 tops, six bodies, three presentations</a></li>
<li><a href="hair-on-body/index.html">All 61 hairstyles on hoodie, tee and suit</a></li>
<li><a href="hair-overview/index.html">Every hairstyle: compact full-figure overview</a></li>
<li><a href="measured-checks.json">7,560 measured alignment checks</a></li>
<li><a href="validation.json">Final technical validation</a></li>
<li><a href="../../docs/graphics/custom-alignment-audit.md">Scope, findings and limitations</a></li></ul>
<p>Source-art follow-ups remain open: garden apron/shirt colors, flannel plaid and pajama trim. See the scope report for frame names. Technical passes do not certify these designs.</p>
''',encoding='utf-8',newline='\n')
for old,destination in [('necks','../../custom-alignment/after/index.html'),('','../custom-alignment/hair-on-body/index.html')]:
    legacy=root.parent/'custom-hair-audit'/old/'index.html'
    legacy.write_text('<!doctype html><meta charset="utf-8"><title>Full-body review</title>'+style+f'<h1>The cropped review has been replaced</h1><p><a href="{destination}">Open the complete full-body review</a></p>',encoding='utf-8',newline='\n')
print(f'{len(files)} uncropped comparison sheets generated')
