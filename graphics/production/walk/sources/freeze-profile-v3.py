"""Freeze the regenerated profile underlayer using the standing collar/floor.

Hand positions are measured on the frozen artwork; hidden joints are inferred.
This candidate rig does not replace the live front/back or profile rig yet.
"""
from register_samples import *
V=ROOT/'review/custom-walk-v3';draft=json.loads((W/'sources/profile-v3-targets.json').read_text());refs=[]
for filename,rows,cols,keys in [('profile-v3-mannequin-v1.png',2,4,[f'{d}/{f}'for d in ['right','left']for f in range(4)]),('profile-v3-passing-v2.png',2,2,['right/1','right/3','left/1','left/3'])]:
 im=Image.open(W/'assets'/filename).convert('RGBA');a=np.array(im)[:,:,3]>40;rs=separators(a.sum(1),rows);cs=separators(a.sum(0),cols);refs.append((filename,im,rs,cs,keys,cols))
out_rig={'version':'standing-style-profiles-v3','groundBaseline':143,'canvas':[96,144],'density':3,'frames':{},'notes':'Neck/floor match the existing standing figure. Visible palms measured after uniform registration; shoulders and hidden joints inferred from the source silhouette. Initial motion-guide point errors are retained separately, not counted as passing.'};board=Image.new('RGBA',(1152,864));records=[]
for row,di in enumerate(['right','left']):
 for f in range(4):
  key=f'{di}/{f}';filename,im,rs,cs,keys,cols=refs[f%2];slot=keys.index(key);sy,sx=divmod(slot,cols);cell=[cs[sx],rs[sy],cs[sx+1],rs[sy+1]];raw=im.crop(cell);a=np.array(raw);group=components(a[:,:,3]>40)[0];clean=np.zeros_like(a);clean[group[:,1],group[:,0]]=a[group[:,1],group[:,0]]
  initial=288/raw.width;scaled=Image.fromarray(clean).convert('RGBa').resize((288,round(raw.height*initial)),Image.Resampling.LANCZOS).convert('RGBA');a=np.array(scaled);yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];r,g,b,alpha=[a[:,:,i].astype(float)for i in range(4)];skin=(alpha>160)&(r>g*1.2)&(g>b+10)&(r>90)&(g>50)
  top=np.nonzero(skin)[0].min();ys,xs=np.nonzero(skin&(yy<top+9));neck=np.array([np.median(xs),ys.mean()]);bottom=(np.nonzero(alpha>100)[0].max()+1);target_neck=(77 if f%2 else 78)*3;scale=(429-target_neck)/(bottom-neck[1]);tx=144-neck[0]*scale;ty=429-bottom*scale
  inv=1/scale;registered=scaled.convert('RGBa').transform((288,432),Image.Transform.AFFINE,(inv,0,-tx*inv,0,inv,-ty*inv),Image.Resampling.BICUBIC).convert('RGBA');a=np.array(registered);delta=round((143-ground(a))*3);out=Image.new('RGBA',(288,432));out.alpha_composite(registered,(0,delta));a=np.array(out)
  frame=json.loads(json.dumps(draft['frames'][key]));p=frame['keypoints'];p['neck']=[48,77 if f%2 else 78];hands=[v for v in components(warm(a)&(Y>94)&(Y<119))if len(v)>20];hands.sort(key=lambda v:len(v),reverse=True)
  centers=[v.mean(0)/3 for v in hands[:2]]
  if f%2:
   palm=min(centers,key=lambda q:abs(q[0]-49));p['handL']=[round(float(v),3)for v in palm];p['handR']=p['handL'].copy();frame['visibleHands']=['handL']
  else:
   centers.sort(key=lambda q:q[0]);near_left=(di=='right')==(f==0);near,far=centers if near_left else centers[::-1];p['handL']=[round(float(v),3)for v in near];p['handR']=[round(float(v),3)for v in far];frame['visibleHands']=['handL','handR']
  for side in ['L','R']:
   shoulder=np.array(p['shoulder'+side]);hand=np.array(p['hand'+side]);p['elbow'+side]=[round(float(v),3)for v in shoulder+(hand-shoulder)*.55]
  frame['registration']={'source':'assets/'+filename,'sourceCell':cell,'uniformScale':initial*scale/3,'translation':[tx/3,(ty+delta)/3],'rotationDegrees':0,'groundError':ground(a)-143,'neckMarkerY':target_neck/3,'visiblePalmsMeasured':True};out_rig['frames'][key]=frame
  folder=W/'profile-v3/mannequin-locked';folder.mkdir(parents=True,exist_ok=True);out.save(folder/f'{di}-{f}.png');board.alpha_composite(out,(f*288,row*432));records.append({'frame':key,'handL':p['handL'],'neck':p['neck'],'groundError':ground(a)-143})
(W/'profile-v3/rig.json').write_text(json.dumps(out_rig,indent=2)+'\n');board.save(W/'assets/profile-v3-locked-reference.png');(V/'profile-lock.json').write_text(json.dumps({'status':'candidate for standing-style garment trial','frames':records},indent=2)+'\n');print(records)

