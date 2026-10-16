"""Crop/register/mask authored walk art. Never draws or warps garments."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np,json,math,hashlib
from prepare import largest,components
ROOT=Path(__file__).resolve().parents[4];W=ROOT/'graphics/production/walk';R=ROOT/'review/custom-walk-v1'
DIRS=['down','right','up','left'];NAMES={1:'farArm',2:'torso',3:'nearArm',4:'farLeg',5:'nearLeg',6:'farFoot',7:'nearFoot'}
rig=json.loads((W/'rig.json').read_text());YY,XX=np.mgrid[:432,:288];X=XX/3;Y=YY/3

def warm(a):
 r,g,b,al=[a[:,:,i].astype(float) for i in range(4)];return (al>160)&(r>g*1.2)&(g>b+10)&(r>90)&(g>50)
def marker(a,p):
 x,y=p;groups=components(warm(a)&(Y>90)&(Y<122))
 groups=[v for v in groups if len(v)>18]
 if not groups:return None
 group=min(groups,key=lambda v:abs(v[:,0].mean()/3-x)*2+abs(v[:,1].max()/3-y))
 # Consistent distal-hand marker for skin-connected bare forearms and gloves
 # of shadow in the master. This is distinct from the rig's palm centroid.
 low=group[:,1].max()-14;group=group[group[:,1]>=low];center=group.mean(0)/3
 return center if np.linalg.norm(center-np.array(p))<11 else None
def ground(a):
 m=a[:,:,3]>100;y=YY[m].max();return (y+1)/3

def separators(profile,n):
 result=[0];size=len(profile)
 for k in range(1,n):
  center=size*k/n;lo=max(result[-1]+1,round(center-size*.08));hi=min(size,round(center+size*.08));v=profile[lo:hi];c=np.flatnonzero(v==v.min())+lo;result.append(int(c[np.argmin(abs(c-center))]))
 return result+[size]

def segment(p,q):
 p=np.array(p,float);q=np.array(q,float);v=q-p;t=np.clip(((X-p[0])*v[0]+(Y-p[1])*v[1])/max(1e-6,v@v),0,1);return np.hypot(X-p[0]-t*v[0],Y-p[1]-t*v[1])
def chain(p,names):return np.minimum.reduce([segment(p[a],p[b]) for a,b in zip(names,names[1:])])
def labels(frame):
 p=frame['keypoints'];near=frame['nearArm'];far='R' if near=='L' else 'L';nl=frame['nearLeg'];fl='R' if nl=='L' else 'L'
 arm={k:chain(p,['shoulder'+k,'elbow'+k,'hand'+k]) for k in ['L','R']};leg={k:chain(p,['hip'+k,'knee'+k,'ankle'+k]) for k in ['L','R']};foot={k:chain(p,['heel'+k,'ankle'+k,'toe'+k]) for k in ['L','R']}
 side=abs(p['shoulderL'][0]-p['shoulderR'][0])<10;spine=segment(p['neck'],p['waist']);out=np.where(Y<p['waist'][1]+1,2,np.where(leg[nl]<=leg[fl],5,4)).astype(np.uint8)
 for k,label in [(far,1),(near,3)]:
  priority=(arm[k]<5.8)&(Y<p['hand'+k][1]+4)&((arm[k]<spine*.85)|(Y>p['waist'][1]-4)|(abs(X-p['waist'][0])>(7 if side else 12)))
  out[priority]=label
 for k,label in [(fl,6),(nl,7)]:
  inside=(Y>=p['ankle'+k][1]-3)&(foot[k]<=leg[k]+1)&(foot[k]<=foot['R' if k=='L' else 'L']+.1)
  out[inside]=label
 return out,arm,leg

def fit_similarity(P,Q,alpha):
 # The ground is a horizontal line, not an invented x=48 landmark. Fit the
 # worst landmark error while keeping the complete painted feet on that line.
 ys,xs=np.nonzero(alpha>100);feet=np.column_stack([xs/3,(ys+1)/3]);feet=feet[feet[:,1]>132]
 scale0=1.;angle0=0.;ds=.18;da=math.pi/90
 for iteration in range(4):
  angles=np.linspace(max(-math.pi/90,angle0-da),min(math.pi/90,angle0+da),17);scales=np.linspace(scale0-ds,scale0+ds,25)
  co=np.cos(angles)[:,None];si=np.sin(angles)[:,None];qx=co*P[:,0]-si*P[:,1];qy=si*P[:,0]+co*P[:,1];bottom=(si*feet[:,0]+co*feet[:,1]).max(1)
  ty=143-bottom[:,None]*scales[None,:];dx=Q[None,None,:,0]-qx[:,None,:]*scales[None,:,None];ey=qy[:,None,:]*scales[None,:,None]+ty[:,:,None]-Q[None,None,:,1];lo=dx.min(2)-1;hi=dx.max(2)+1
  for _ in range(24):
   a=lo+(hi-lo)/3;b=hi-(hi-lo)/3;choose=np.max((a[:,:,None]-dx)**2+ey**2,axis=2)<np.max((b[:,:,None]-dx)**2+ey**2,axis=2);hi=np.where(choose,b,hi);lo=np.where(choose,lo,a)
  tx=(lo+hi)/2;error=np.max(np.hypot(tx[:,:,None]-dx,ey),axis=2);ai,sj=np.unravel_index(np.argmin(error),error.shape);scale0=float(scales[sj]);angle0=float(angles[ai]);t=np.array([tx[ai,sj],ty[ai,sj]]);ds/=8;da/=8
 scale=scale0;angle=angle0
 return scale,angle,scale*np.array([[math.cos(angle),-math.sin(angle)],[math.sin(angle),math.cos(angle)]]),t

def register(raw,frame,master):
 a=np.array(raw);groups=components(a[:,:,3]>40);xy=groups[0];detached=sum(len(group)>225 for group in groups[1:]);clean=np.zeros_like(a);clean[xy[:,1],xy[:,0]]=a[xy[:,1],xy[:,0]];im=Image.fromarray(clean);initial=288/raw.width;im=im.convert('RGBa').resize((288,round(raw.height*initial)),Image.Resampling.LANCZOS).convert('RGBA');a=np.array(im);ys=np.nonzero(a[:,:,3]>100)[0];dy=429-(ys.max()+1);base=Image.new('RGBA',(288,432));base.alpha_composite(im,(0,int(dy)));a=np.array(base);p=frame['keypoints'];pairs=[];names=[]
 for name in ['handL','handR']:
  source=marker(a,p[name]);target=marker(master,p[name])
  if source is not None and target is not None:pairs.append((source,target));names.append(name)
 # A hood or neckline can conceal the anatomical attachment; do not mistake
 # the top of its outline for a measured neck. Keep this anchor explicitly
 # marked as inferred and expose that limitation in the validation report.
 pairs.append((np.array(p['neck'],float),np.array(p['neck'],float)));names.append('inferredNeck')
 if not pairs:pairs=[(np.array(p['waist'],float),np.array(p['waist'],float))];names=['unmeasured']
 P=np.array([v[0] for v in pairs]);Q=np.array([v[1] for v in pairs]);scale,angle,M,t=fit_similarity(P,Q,a[:,:,3]);inv=np.linalg.inv(M);off=-inv@t*3
 out=base.convert('RGBa').transform((288,432),Image.Transform.AFFINE,(inv[0,0],inv[0,1],off[0],inv[1,0],inv[1,1],off[1]),Image.Resampling.BICUBIC).convert('RGBA');delta=round((143-ground(np.array(out)))*3);snap=Image.new('RGBA',(288,432));snap.alpha_composite(out,(0,delta));out=snap;t[1]+=delta/3
 pred=P@M.T+t;errors={k:round(float(np.linalg.norm(x-y)),3) for k,x,y in zip(names,pred,Q)};arr=np.array(out);arr[arr[:,:,3]<=8]=0
 # Above the attachment only accidental source stump material is removed.
 arr[(Y<p['neck'][1]-1)&warm(arr)&(abs(X-p['neck'][0])<9)]=0
 transform={'landmarkScope':'detected full-template distal hands; inferred anatomical neck; physical painted-foot baseline','uniformScale':initial*scale/3,'rotationDegrees':math.degrees(angle),'translationAfterInitial':[float(t[0]),float(t[1])],'initialGroundTranslationPx':int(dy),'maxKeypointError':max(errors.values()),'errors':errors,'groundError':ground(arr)-143,'detachedLargeComponents':int(detached),'sourceLandmarks':dict(zip(names,P.tolist())),'targetLandmarks':dict(zip(names,Q.tolist()))}
 if len(names)<2:transform['maxKeypointError']=1000.;transform['missingLandmarks']=True
 return Image.fromarray(arr),transform

def main():
 manifest={'version':'custom-walk-phase-1','status':'registration review; not approved','canvas':[96,144],'density':3,'rig':'rig.json','rigSHA256':hashlib.sha256((W/'rig.json').read_bytes()).hexdigest(),'items':{},'sources':{},'thresholds':{'maxKeypointError':2,'limbCoreIoU':.85,'rotationDegrees':2,'groundPixels':1/3}}
 allreports=[]
 for file in sorted((W/'assets').glob('*-v1.png')):
  item=file.stem[:-3]
  if not item.startswith(('top-','bottom-','shoe-')):continue
  kind,style=item.split('-',1);sheet=Image.open(file).convert('RGBA');alpha=np.array(sheet)[:,:,3]>40;rows=separators(alpha.sum(1),4);cols=separators(alpha.sum(0),4);full=style in ['overalls','pjs','suit'];info={'kind':kind,'style':style,'fullSuit':full,'frames':{},'source':str(file.relative_to(W))};parts=[];board=Image.new('RGBA',(1152,1728),'#292330');d=ImageDraw.Draw(board)
  manifest['sources'][str(file.relative_to(W))]=hashlib.sha256(file.read_bytes()).hexdigest()
  versions=[]
  for candidate in sorted((W/'assets').glob(item+'-v*.png')):
   source=Image.open(candidate).convert('RGBA');alpha=np.array(source)[:,:,3]>40;versions.append((candidate,source,separators(alpha.sum(1),4),separators(alpha.sum(0),4),None));manifest['sources'][str(candidate.relative_to(W))]=hashlib.sha256(candidate.read_bytes()).hexdigest()
  if item=='shoe-sneakers':
   # The approved player already wears the requested brown/cream sneakers.
   # Reuse that authored artwork at its exact original locked pose.
   candidate=W/'assets/pose-master.png';source=Image.open(candidate).convert('RGBA');versions.append((candidate,source,[0,432,864,1296,1728],[0,288,576,864,1152],None));manifest['sources'][str(candidate.relative_to(W))]=hashlib.sha256(candidate.read_bytes()).hexdigest()
  for correction in json.loads((W/'sources/focused-corrections.json').read_text()):
   candidate=W/f'assets/{item}-{correction["version"]}.png'
   if correction['id']!=item or not candidate.exists():continue
   source=Image.open(candidate).convert('RGBA');alpha=np.array(source)[:,:,3]>40;versions.append((candidate,source,separators(alpha.sum(1),2),separators(alpha.sum(0),2),correction['frames']));manifest['sources'][str(candidate.relative_to(W))]=hashlib.sha256(candidate.read_bytes()).hexdigest()
  for ri,di in enumerate(DIRS):
   for f in range(4):
    key=f'{di}/{f}';frame=rig['frames'][key];master=np.array(Image.open(W/f'master/{di}-{f}.png').convert('RGBA'));lab,arms,legs=labels(frame);p=frame['keypoints'];man=np.array(Image.open(W/f'registered/mannequin/{di}-{f}.png'));core=(np.minimum(arms['L'],arms['R'])<2.2)|(np.minimum(legs['L'],legs['R'])<2.2);core&=(Y>=87)&(Y<=134);choices=[]
    for candidate,source,rs,cs,keys in versions:
     if keys is not None and key not in keys:continue
     slots=[i for i,k in enumerate(keys) if k==key] if keys is not None else [ri*4+f]
     for slot in slots:
      row,col=divmod(slot,2 if keys is not None else 4)
      cell=[cs[col],rs[row],cs[col+1],rs[row+1]];out,fit=register(source.crop(cell),frame,master);arr=np.array(out);ma=(man[:,:,3]>100)&core;mb=(arr[:,:,3]>100)&core;iou=float((ma&mb).sum()/max(1,(ma|mb).sum()));fit['limbCoreIoU']=iou;fit['sourceCell']=cell;fit['sourceSlot']=slot;fit['source']=str(candidate.relative_to(W));fit['accepted']=bool(fit['maxKeypointError']<=2 and iou>=.85 and abs(fit['groundError'])<=1/3+.001 and len(fit['errors'])>1 and not fit['detachedLargeComponents']);choices.append((out,fit))
    out,fit=min(choices,key=lambda v:(not v[1]['accepted'],v[1]['maxKeypointError']+max(0,.85-v[1]['limbCoreIoU'])*100+(1000 if len(v[1]['errors'])<2 else 0)));fit['candidates']=[{'source':v['source'],'maxKeypointError':v['maxKeypointError'],'limbCoreIoU':v['limbCoreIoU'],'accepted':v['accepted']}for _,v in choices];arr=np.array(out);iou=fit['limbCoreIoU']
    folder=W/f'registered/{item}';folder.mkdir(parents=True,exist_ok=True);out.save(folder/f'{di}-{f}.png');(W/'labels').mkdir(exist_ok=True)
    label_file=W/f'labels/{di}-{f}.png'
    if item=='bottom-jeans':Image.fromarray(lab).save(label_file)
    r,g,b,al=[arr[:,:,i].astype(float) for i in range(4)];l=.2126*r+.7152*g+.0722*b;blue=(b>r*1.05)&(b>g*.95);upper=np.isin(lab,[1,2,3]);lower=np.isin(lab,[4,5]);feet=np.isin(lab,[6,7]);active=al>8
    if kind=='top':
     keep=(upper|lower) if full else upper
     if not full:keep&=~((lab==2)&(Y>p['waist'][1]-1)&blue&(l<80))
    elif kind=='bottom':
     # Retain fabric and its adjacent ink, not the companion's skin/boots.
     # The generated locked mannequin supplies continuous legs underneath.
     fabric=blue;adjacent=np.array(Image.fromarray((fabric*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)))>0
     keep=lower&(fabric|((l<45)&adjacent))&~((Y<p['waist'][1]-1)&(l>85)&blue)
    else:keep=feet&~blue
    # No companion garment is synthesized or painted over; only original pixels survive the mask.
    info['frames'][key]={'registration':fit,'parts':{}}
    for label,name in NAMES.items():
     mask=active&keep&(lab==label)
     if not mask.any():continue
     yy,xx=np.nonzero(mask);box=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)];layer=np.zeros_like(arr);layer[mask]=arr[mask];crop=Image.fromarray(layer).crop(tuple(box));parts.append((key,name,box,crop))
    board.alpha_composite(out,(f*288,ri*432));d.text((f*288+4,ri*432+4),f'{key} {"PASS" if fit["accepted"] else "REJECT"} {fit["maxKeypointError"]:.2f}px IoU {iou:.2f}',fill='white');allreports.append({'item':item,'frame':key,**fit})
  # Shelf-pack actual cropped part pixels, not seven mostly empty full canvases.
  width=1024;x=y=rowh=0;placed=[]
  for key,name,box,im in sorted(parts,key=lambda v:-v[3].height):
   if x+im.width+2>width:x=0;y+=rowh+2;rowh=0
   placed.append((key,name,box,im,x,y));x+=im.width+2;rowh=max(rowh,im.height)
  atlas=Image.new('RGBA',(width,y+rowh+2))
  for key,name,box,im,x,y in placed:atlas.alpha_composite(im,(x,y));info['frames'][key]['parts'][name]={'rect':[x,y,im.width,im.height],'destination':box[:2]}
  dest=W/f'atlases/{item}.png';dest.parent.mkdir(exist_ok=True);atlas.save(dest);info['atlas']=str(dest.relative_to(W));info['accepted']=all(f['registration']['accepted'] for f in info['frames'].values());manifest['items'][item]=info;board.convert('RGB').save(R/f'{item}-registration.png');print(item,sum(f['registration']['accepted'] for f in info['frames'].values()),'/16 passed',flush=True)
  (R/'garment-validation.json').write_text(json.dumps({'total':len(allreports),'passed':sum(r['accepted'] for r in allreports),'rejected':[r for r in allreports if not r['accepted']],'frames':allreports},indent=2)+'\n')
 (W/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(R/'garment-validation.json').write_text(json.dumps({'total':len(allreports),'passed':sum(r['accepted'] for r in allreports),'rejected':[r for r in allreports if not r['accepted']],'frames':allreports},indent=2)+'\n')
 print('Registration complete; rejected frames remain excluded from approval.')

if __name__=='__main__':main()
