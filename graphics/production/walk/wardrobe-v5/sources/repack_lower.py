"""Restore original waistband pixels; do not redraw or reposition any art."""
from pathlib import Path
import sys,json,hashlib
ROOT=Path(__file__).resolve().parents[5]
sys.path.insert(0,str(ROOT/'graphics/production/walk/sources'))
import profile_v3 as packing
from PIL import Image
import numpy as np
W=ROOT/'graphics/production/walk';V=W/'wardrobe-v5'
manifest=json.loads((V/'manifest.json').read_text());packing.P3=V;packing.newrig=manifest['rig']
for style in ['jeans','cargo','joggers','shorts','skirt']:
 item='bottom-'+style;old=manifest['items'][item];frames={}
 for f in range(8):
  source=W/f'stride-v4/right-{f}.png'if style=='jeans'else V/f'registered/{item}/right-{f}.png'
  im=Image.open(source).convert('RGBA')
  for direction in ['right','left']:
   key=f'{direction}/{f}';frames[key]=(im if direction=='right'else im.transpose(Image.Transpose.FLIP_LEFT_RIGHT),old['frames'][key]['registration'])
 entry=packing.pack(item,old,frames,'bottom',style)
 entry['atlas']=entry['atlas'].replace('profile-v3/','wardrobe-v5/');entry['profileRevision']='waistband-coverage-v9'
 for field in ['profileBases','profileToneAudit']:
  if field in old:entry[field]=old[field]
 entry['atlasSHA256']=hashlib.sha256((W/entry['atlas']).read_bytes()).hexdigest();manifest['items'][item]=entry
 print(item,'restored original waistband material',flush=True)
target=V/'manifest.json';staging=target.with_suffix('.json.tmp');staging.write_text(json.dumps(manifest,indent=2)+'\n',newline='\n');staging.replace(target)

def extend_base(data,rig,folder):
 entry=data['items']['skin-base'];source=Image.open(W/entry['atlas']).convert('RGBA')
 for frame in entry['frames'].values():frame['parts'].pop('pelvis',None)
 height=max(p['rect'][1]+p['rect'][3]for frame in entry['frames'].values()for p in frame['parts'].values())+2
 pieces=[]
 for key,frame in entry['frames'].items():
  direction,f=key.split('/');slot=int(f)%4
  original=json.loads((W/'rig.json').read_text())['frames'][f'{direction}/{slot}']['keypoints']['waist']
  waist=rig['frames'][key]['keypoints']['waist']
  im=Image.open(W/f'registered/mannequin/{direction}-{slot}.png').convert('RGBA');a=np.array(im)
  yy,xx=np.indices(a.shape[:2]);gray=(np.max(a[:,:,:3],axis=2).astype(int)-np.min(a[:,:,:3],axis=2).astype(int))<24
  halfwidth=8 if direction in ['right','left']else 10
  mask=gray&(yy>=(original[1]-3)*3)&(yy<(original[1]+5)*3)&(abs(xx-original[0]*3)<halfwidth*3)&(a[:,:,3]>0)
  a[~mask]=0;ys,xs=np.nonzero(mask);box=(int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))
  crop=Image.fromarray(a).crop(box);dest=[round(box[0]+(waist[0]-original[0])*3),round(box[1]+(waist[1]-original[1])*3)]
  pieces.append((key,crop,dest))
 atlas=Image.new('RGBA',(source.width,height+sum(im.height+2 for _,im,_ in pieces)));atlas.alpha_composite(source.crop((0,0,source.width,height)))
 y=height
 for key,im,dest in pieces:
  atlas.alpha_composite(im,(0,y));entry['frames'][key]['parts']['pelvis']={'rect':[0,y,im.width,im.height],'destination':dest};y+=im.height+2
 file=folder/'atlases/skin-base-waist-v9.png';tmp=file.with_suffix('.png.tmp');atlas.save(tmp,format='PNG');tmp.replace(file)
 entry['atlas']=str(file.relative_to(W)).replace('\\','/');entry['atlasSHA256']=hashlib.sha256(file.read_bytes()).hexdigest();entry['pelvisRevision']='continuous-original-mannequin-v9'

extend_base(manifest,manifest['rig'],V)
staging.write_text(json.dumps(manifest,indent=2)+'\n',newline='\n');staging.replace(target)
legacy_path=W/'manifest.json';legacy=json.loads(legacy_path.read_text());extend_base(legacy,json.loads((W/'rig.json').read_text()),W)
tmp=legacy_path.with_suffix('.json.tmp');tmp.write_text(json.dumps(legacy,indent=2)+'\n',newline='\n');tmp.replace(legacy_path)
