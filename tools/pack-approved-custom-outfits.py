"""Pack approved whole paintings and semantic masks without repainting pixels."""
from pathlib import Path
from collections import deque
import importlib.util,json,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];W=ROOT/'graphics/production/walk'
s=importlib.util.spec_from_file_location('colors',ROOT/'tools/apply-flannel-shared-palette.py')
c=importlib.util.module_from_spec(s);s.loader.exec_module(c)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
guides=json.loads((W/'pose-guides-v6/manifest.json').read_text())['frames']
def labels(im,hem=None,footY=125,idle=False):
 a=np.array(im);ms,_=c.masks(im,hem);part=np.zeros(a.shape[:2],dtype=np.uint8);mat=part.copy()
 for name,p,m in [('flannel',1,2),('jeans',2,3),('skin',1,1),('leather',3,4),('cream',3,0)]:part[ms[name]]=p;mat[ms[name]]=m
 r,g,b=a[:,:,:3].transpose(2,0,1);cream=(r>175)&(g>160)&(b>125)&(abs(r.astype(float)-g)<45)&(a[:,:,3]>200)
 yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];creamtop=cream&(yy<350);part[creamtop]=1;mat[creamtop]=0
 # A raised shoe can be above the global lower-quarter cutoff used by the
 # color review. Use this pose's hand/foot separation for physical layers.
 foot=(yy>footY*3)&(a[:,:,3]>200)&((cream)|((r>125)&(r>g*1.12)&(g>b*1.12)))
 part[foot]=3;mat[foot]=np.where(cream[foot],0,4)
 if idle:
  sole=(yy>=393)&(a[:,:,3]>0)&~((b>r*1.10)&(b>g*1.03))
  part[sole]=3
  mat[sole]=np.where(cream[sole],0,4)
 queue=deque(map(tuple,np.argwhere(part>0)));h,w=part.shape
 while queue:
  y,x=queue.popleft()
  for Y,X in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
   if 0<=Y<h and 0<=X<w and not part[Y,X] and a[Y,X,3]>0:
    part[Y,X]=part[y,x];mat[Y,X]=mat[y,x];queue.append((Y,X))
 # Very faint detached antialias pixels retain their RGB and nearest region.
 unknown=(a[:,:,3]>0)&(part==0);part[unknown]=np.where(yy[unknown]<335,1,np.where(yy[unknown]<405,2,3))
 ink=((r>g)&(g>b)&(r<125))|(a[:,:,:3].max(2)<40)|cream
 mat[ink]=0
 out=np.zeros_like(a);out[:,:,0]=part;out[:,:,1]=mat;out[:,:,3]=np.where(a[:,:,3]>0,255,0)
 return Image.fromarray(out),part,mat
items={};sources={}
def shoe_boxes(part,alpha):
 mask=(part==3)&(alpha>80);seen=np.zeros(mask.shape,bool);components=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  q=deque([(int(y),int(x))]);seen[y,x]=True;points=[]
  while q:
   Y,X=q.popleft();points.append((Y,X))
   for dy in [-1,0,1]:
    for dx in [-1,0,1]:
     a,b=Y+dy,X+dx
     if 0<=a<432 and 0<=b<288 and mask[a,b] and not seen[a,b]:seen[a,b]=True;q.append((a,b))
  components.append(np.array(points))
 feet=sorted(sorted(components,key=len,reverse=True)[:2],key=lambda p:float(np.median(p[:,1])))
 if len(feet)!=2:raise ValueError('Two separate painted shoes are required')
 def bounds(points):
  y,x=points.T;return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
 return {'all':bounds(np.concatenate(feet)),'left':bounds(feet[0]),'right':bounds(feet[1])}
for garment,attempt,version in [('cardigan','individual-v8','11'),('jacket','jacket-v9','9'),('flannel','flannel-v13','13')]:
 atlas=Image.new('RGBA',(1440,864));roles=Image.new('RGBA',atlas.size);frames={}
 for row,d in enumerate(['down','up']):
  for col,f in enumerate(['idle',0,1,2,3]):
   src=W/f'registered/{garment}-idle-v{version}/{d}.png' if f=='idle' else W/f'sources/rerender-v6/registered/{attempt}/top-{garment}/{d}-{f}.png'
   image=Image.open(src).convert('RGBA');full=Image.new('RGBA',(288,432));full.paste(image,(0,108 if f=='idle' else 0))
   hem=None
   if garment=='flannel' and d=='down' and f==3:hem=json.loads(src.with_suffix('.json').read_text())['materialHemOverride']
   guide=guides[d+'/'+str(f if f!='idle' else 0)]['points']
   footY=125 if f=='idle' else max(guide['handL'][1],guide['handR'][1])+6
   role,part,mat=labels(full,hem,footY,f=='idle');rect=[col*288,row*432,288,432];atlas.paste(full,tuple(rect[:2]));roles.paste(role,tuple(rect[:2]))
   lower=np.argwhere((part==2)&(np.array(full)[:,:,3]>160));waist=float(np.percentile(lower[:,0],2)/3)
   p=dict(guide);p['waist']=[48,waist]
   if f=='idle':p.update(neck=[48,78],handL=[34,113],handR=[62,113])
   for side,left in [('L',True),('R',False)]:
    yy,xx=np.mgrid[:432,:288];hx,hy=p['hand'+side];hand=(mat==1)&(yy>270)&((xx/3-hx)**2+(yy/3-hy)**2<64)&((xx<144) if left else (xx>=144))
    if hand.any():
     last=int(yy[hand].max());palm=hand&(yy>=last-12);p['hand'+side]=[float(np.median(xx[palm])/3),float(np.median(yy[palm])/3)]
   p['nearArm']='L' if p['handL'][1]<p['handR'][1] else 'R'
   lum=np.array(full)[:,:,:3]@[.2126,.7152,.0722]
   bases={str(m):float(np.median(lum[mat==m])) for m in [1,2,3,4]}
   feet=shoe_boxes(part,np.array(full)[:,:,3])
   frames[d+'/'+str(f)]={'rect':rect,'source':src.relative_to(ROOT).as_posix(),'sourceSHA256':sha(src),'keypoints':p,'materialBases':bases,'feet':feet}
   sources[src.relative_to(ROOT).as_posix()]=sha(src)
 ap=W/f'atlases/approved-{garment}.png';rp=W/f'atlases/approved-{garment}-roles.png';atlas.save(ap);roles.save(rp)
 items[garment]={'atlas':ap.relative_to(W).as_posix(),'atlasSHA256':sha(ap),'rolesAtlas':rp.relative_to(W).as_posix(),'rolesSHA256':sha(rp),'frames':frames}
out=W/'approved-outfits/manifest.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'version':'approved-cardigan-jacket-flannel-v1','density':3,'frameCounts':{'down':4,'up':4},'items':items,'sources':sources},indent=2)+'\n',encoding='utf-8',newline='\n')
print('Packed 30 approved idle/walk paintings and masks; no painted pixel modified.')
