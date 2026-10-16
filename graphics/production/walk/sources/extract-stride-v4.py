"""Uniform single-resample registration of the complete eight-pose candidate."""
from register_samples import *
V=W/'stride-v4';V.mkdir(exist_ok=True)
draft=json.loads((W/'sources/stride-v4-targets.json').read_text())
source=Image.open(W/'assets/stride-v4-hoodie-right-v2.png').convert('RGBA')
a=np.array(source)[:,:,3]>40;rs=separators(a.sum(1),2);cs=separators(a.sum(0),4)
report=[]
for f in range(8):
 row,col=divmod(f,4);cell=[cs[col],rs[row],cs[col+1],rs[row+1]];raw=source.crop(cell);a=np.array(raw)
 filename='assets/stride-v4-hoodie-right-v2.png'
 if f==7:
  filename='assets/stride-v4-final-arm.png';raw=Image.open(W/filename).convert('RGBA');cell=[0,0,raw.width,raw.height];a=np.array(raw)
 group=components(a[:,:,3]>40)[0];mask=np.zeros(a.shape[:2],np.uint8);mask[group[:,1],group[:,0]]=255
 # Keep antialiased edges around the actual component, remove isolated debris.
 fringe=np.array(Image.fromarray(mask).filter(ImageFilter.MaxFilter(7)))>0;a[~fringe]=0
 yy,xx=np.indices(a.shape[:2]);r,g,b,al=[a[:,:,i].astype(float)for i in range(4)]
 skin=(al>160)&(r>g*1.2)&(g>b+10)&(r>90)&(g>50)
 top=np.nonzero(skin)[0].min();ys,xs=np.nonzero(skin&(yy<top+max(3,raw.height*.02)))
 neck=np.array([np.median(xs),ys.mean()]);floor=np.nonzero(al>100)[0].max()+1
 target=draft['frames']['right/'+str(f)]['keypoints']['neck'];scale=(429-target[1]*3)/(floor-neck[1]);tx=target[0]*3-neck[0]*scale;ty=429-floor*scale
 out=Image.fromarray(a).convert('RGBa').transform((288,432),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.BICUBIC).convert('RGBA')
 out.save(V/f'right-{f}.png')
 # The brief permits mirroring symmetric garments after checking asymmetry.
 # This plain hoodie/jeans/sneakers sample has no emblem, strap or side tie.
 out.transpose(Image.Transpose.FLIP_LEFT_RIGHT).save(V/f'left-{f}.png')
 report.append({'frame':f,'phase':draft['frames']['right/'+str(f)]['phase'],'source':filename,'sourceCell':cell,'uniformScale':scale,'translation':[tx,ty],'neck':target,'groundError':ground(np.array(out))-143,'resamplingPasses':1,'status':'visual gait inspection required; no automatic artwork approval'})
(V/'registration.json').write_text(json.dumps({'frameCount':8,'source':'assets/stride-v4-hoodie-right-v2.png','frames':report},indent=2)+'\n')
print('Extracted eight original distinct drawings with one uniform resampling each.')
