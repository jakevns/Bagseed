"""Technical crops of approved whole-pose art; retain untouched source and HTML."""
from pathlib import Path
from PIL import Image, ImageOps
import json, hashlib
root=Path(__file__).parent
im=Image.open(root/'source.png').convert('RGBA')
boxes={'marcus':[(240,5,540,518),(680,5,900,518),(1015,5,1340,518)],'ines':[(250,520,510,1000),(670,520,905,1000),(1055,520,1350,1000)]}
report={'sourceSHA256':hashlib.sha256((root/'source.png').read_bytes()).hexdigest(),'characters':{}}
for who,views in boxes.items():
 folder=root/who;folder.mkdir(exist_ok=True)
 report['characters'][who]={}
 for direction,box in zip(['down','right','up'],views):
  crop=im.crop(box); bounds=crop.getchannel('A').point(lambda v:255 if v>160 else 0).getbbox(); crop=crop.crop(bounds)
  # Keep feet at y=108 and enough padding for raised elbows. Uniform per-view scale.
  scale=min(102/crop.height,88/crop.width); sprite=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
  out=Image.new('RGBA',(96,108));out.alpha_composite(sprite,((96-sprite.width)//2,108-sprite.height));out.save(folder/(direction+'.png'))
  report['characters'][who][direction]={'sourceBox':box,'alphaBounds':bounds}
  if direction=='right':ImageOps.mirror(out).save(folder/'left.png')
  if direction=='down':
   portrait=crop.crop((0,0,crop.width,round(crop.height*.53)))
   portrait.thumbnail((188,188),Image.Resampling.LANCZOS)
   p=Image.new('RGBA',(192,192));p.alpha_composite(portrait,((192-portrait.width)//2,192-portrait.height));p.save(folder/'portrait.png')
report['limitations']=['Left profile mirrors the right profile; raised-hand and carried-book sides mirror with it.','Only matching canonical outfits receive these poses; custom appearances retain existing renderer.']
(root/'registration.json').write_text(json.dumps(report,indent=2)+'\n')
