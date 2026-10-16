"""Pack the generated fitted underlayer, retaining its original painted pixels."""
from register_samples import *
m=json.loads((W/'manifest.json').read_text());item={'kind':'skin','style':'locked-underlayer','fullSuit':False,'frames':{},'source':'generated mannequin v3 with rear v4 corrections'};parts=[]
for key,frame in rig['frames'].items():
 di,f=key.split('/');a=np.array(Image.open(W/f'registered/mannequin/{di}-{f}.png').convert('RGBA'));lab,_,_=labels(frame);item['frames'][key]={'parts':{}}
 for label,name in [(4,'farLeg'),(5,'nearLeg')]:
  mask=(a[:,:,3]>8)&(lab==label);ys,xs=np.nonzero(mask)
  if not len(xs):continue
  box=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)];out=np.zeros_like(a);out[mask]=a[mask];im=Image.fromarray(out).crop(box);parts.append((key,name,box,im))
atlas=Image.new('RGBA',(1024,1024));x=y=h=0
for key,name,box,im in sorted(parts,key=lambda p:-p[3].height):
 if x+im.width+2>1024:x=0;y+=h+2;h=0
 assert y+im.height<1024
 atlas.alpha_composite(im,(x,y));item['frames'][key]['parts'][name]={'rect':[x,y,im.width,im.height],'destination':box[:2]};x+=im.width+2;h=max(h,im.height)
atlas=atlas.crop((0,0,1024,y+h+2));atlas.save(W/'atlases/skin-base.png');item['atlas']='atlases/skin-base.png';m['items']['skin-base']=item
for file in ['assets/mannequin-v3.png','assets/mannequin-rear-01-v4.png']:m['sources'][file]=hashlib.sha256((W/file).read_bytes()).hexdigest()
(W/'manifest.json').write_text(json.dumps(m,indent=2)+'\n');print('Packed sixteen generated underlayer poses; no anatomical or garment pixels drawn.')
