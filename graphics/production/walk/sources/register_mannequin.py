from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,math
from prepare import largest,points,JOINTS
ROOT=Path(__file__).resolve().parents[4];W=ROOT/'graphics/production/walk';R=ROOT/'review/custom-walk-v1';rig=json.loads((W/'rig.json').read_text());src=Image.open(W/'assets/mannequin-v3.png').convert('RGBA');cw=src.width/4;ch=src.height/4
report=[];board=Image.new('RGBA',(1152,1728),'#292330')
def skin(a):
 a=a.astype(float);r,g,b,al=[a[:,:,i] for i in range(4)];return (al>160)&(r>g*1.2)&(g>b+10)&(r>90)&(g>50)
def hand(a,p):
 yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];x,y=p;m=skin(a)&((xx/3-x)**2+(yy/3-y)**2<9**2)
 return np.array([xx[m].mean()/3,yy[m].mean()/3]) if m.sum()>4 else None
def neckline(a):
 yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];m=skin(a)&(abs(xx/3-48)<3)&(yy/3>60)&(yy/3<90)
 if not m.any():return np.array([48.,80.])
 y=yy[m].max();m=m&(yy>=y-2);return np.array([xx[m].mean()/3,y/3])
def ground(a):
 yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];m=a[:,:,3]>100;y=yy[m].max();m=m&(yy>=y-2);return np.array([xx[m].mean()/3,(y+1)/3])
for row,di in enumerate(['down','right','up','left']):
 for f in range(4):
  key=f'{di}/{f}';raw=src.crop((round(f*cw),round(row*ch),round((f+1)*cw),round((row+1)*ch)))
  if di=='up' and f in [0,1]:
   patch=Image.open(W/'assets/mannequin-rear-01-v4.png').convert('RGBA');pw=patch.width/2;raw=patch.crop((round(f*pw),0,round((f+1)*pw),patch.height))
  # Preserve the original fitting trace used to generate all garment references.
  # Later foot/near-side annotations refine labels, not this accepted body art.
  a=np.array(raw);xy=largest(a[:,:,3]>40);clean=np.zeros_like(a);clean[xy[:,1],xy[:,0]]=a[xy[:,1],xy[:,0]];im=Image.fromarray(clean).convert('RGBa').resize((288,432),Image.Resampling.LANCZOS).convert('RGBA');base=np.array(im);dy=round((143-ground(base)[1])*3);shifted=Image.new('RGBA',(288,432));shifted.alpha_composite(im,(0,dy));im=shifted;base=np.array(im);master=np.array(Image.open(W/f'master/{di}-{f}.png').convert('RGBA'));p=dict(zip(JOINTS,points(di,f)));pairs=[];names=[]
  for name in ['handL','handR']:
   s=hand(base,p[name]);t=hand(master,p[name])
   if s is not None and t is not None:pairs.append((s,t));names.append(name)
  pairs.append((neckline(base),np.array(p['neck'],float)));names.append('neck')
  # A fixed baseline constrains vertical scale; centerline is registered from the neck, not stride width.
  g=ground(base);pairs.append((np.array([48.,g[1]]),np.array([48.,143.])));names.append('ground')
  P=np.array([v[0] for v in pairs]);Q=np.array([v[1] for v in pairs]);pc=P.mean(0);qc=Q.mean(0);z=(P-pc)[:,0]+1j*(P-pc)[:,1];w=(Q-qc)[:,0]+1j*(Q-qc)[:,1];c=(np.conj(z)*w).sum()/(abs(z)**2).sum();theta=float(np.clip(np.angle(c),-math.pi/90,math.pi/90));scale=float(abs(c));M=scale*np.array([[math.cos(theta),-math.sin(theta)],[math.sin(theta),math.cos(theta)]]);t=qc-M@pc;inv=np.linalg.inv(M);off=-inv@t*3
  out=im.convert('RGBa').transform((288,432),Image.Transform.AFFINE,tuple([inv[0,0],inv[0,1],off[0],inv[1,0],inv[1,1],off[1]]),Image.Resampling.BICUBIC).convert('RGBA');delta=round((143-ground(np.array(out))[1])*3);snapped=Image.new('RGBA',(288,432));snapped.alpha_composite(out,(0,delta));out=snapped;t[1]+=delta/3;oa=np.array(out)
  # Remove only excess generated stump skin above the locked jaw attachment; no painted garment is added.
  yy,xx=np.mgrid[:432,:288];stump=skin(oa)&(yy/3<p['neck'][1])&(abs(xx/3-p['neck'][0])<9);oa[stump]=0;out=Image.fromarray(oa)
  pred=P@M.T+t;errs={name:round(float(np.linalg.norm(x-y)),3) for name,x,y in zip(names,pred,Q)}
  ma=master[:,:,3]>100;mb=oa[:,:,3]>100;zone=(yy/3>=85)&(yy/3<=137);union=((ma|mb)&zone).sum();iou=float(((ma&mb)&zone).sum()/max(1,union));accepted=max(errs.values())<=2 and iou>=.85
  is_patch=di=='up' and f in [0,1];source_cell=[round(f*pw),0,round((f+1)*pw),patch.height] if is_patch else [round(f*cw),round(row*ch),round((f+1)*cw),round((row+1)*ch)]
  rig['frames'][key]['mannequinRegistration']={'method':'similarity fit: original detected hand centers, collar, ground','source':'assets/mannequin-rear-01-v4.png' if is_patch else 'assets/mannequin-v3.png','sourceCell':source_cell,'scale':scale*96/raw.width,'rotationDegrees':math.degrees(theta),'translationAfterInitial':t.tolist(),'translation':(M@np.array([0,dy/3])+t).tolist(),'initialGroundTranslationPixels':int(dy),'errors':errs,'bodyIoU':iou,'accepted':bool(accepted)}
  target=W/f'registered/mannequin/{di}-{f}.png'
  if '--verify' in __import__('sys').argv:assert np.array_equal(np.array(out),np.array(Image.open(target).convert('RGBA'))),key+' mannequin changed'
  else:out.save(target)
  board.alpha_composite(out,(f*288,row*432));d=ImageDraw.Draw(board);d.text((f*288+4,row*432+4),f'{key} {"PASS" if accepted else "REJECT"} IoU {iou:.3f}',fill='white')
  for name,q in rig['frames'][key]['keypoints'].items():x=f*288+q[0]*3;y=row*432+q[1]*3;d.ellipse((x-3,y-3,x+3,y+3),fill='#ffeb6b')
  report.append({'frame':key,'keypointErrors':errs,'bodyIoU':round(iou,4),'accepted':accepted});print(key,errs,'IoU',round(iou,3),'PASS' if accepted else 'REJECT')
(W/'rig.json').write_text(json.dumps(rig,indent=2)+'\n');(R/'mannequin-validation.json').write_text(json.dumps({'thresholds':{'maxKeypointError':2,'minIoU':.85,'maxRotationDegrees':2},'passed':sum(x['accepted'] for x in report),'total':16,'frames':report},indent=2)+'\n');board.convert('RGB').save(R/'mannequin-rig-overlay.png')

reference=Image.new('RGBA',(1152,1728))
for ri,di in enumerate(['down','right','up','left']):
 for f in range(4):reference.alpha_composite(Image.open(W/f'registered/mannequin/{di}-{f}.png'),(f*288,ri*432))
reference.save(W/'assets/mannequin-reference.png')
