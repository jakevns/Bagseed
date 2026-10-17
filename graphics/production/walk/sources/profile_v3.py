"""Single-resample uniform registration and packing for the profile redo."""
from register_samples import *
from copy import deepcopy
P3=W/'profile-v3';newrig=json.loads((P3/'rig.json').read_text())

def neck_marker(a):
 mask=warm(a)&(Y<96);yy,xx=np.nonzero(mask);top=yy.min();yy,xx=np.nonzero(mask&(YY<top+9));return np.array([np.median(xx)/3,yy.mean()/3])

def affine(im,M,t):
 if np.sqrt(abs(np.linalg.det(M)))<.35:
  from affine_footprint import affine_lanczos
  return affine_lanczos(im,M,t)
 inv=np.linalg.inv(M);off=-inv@t
 return im.convert('RGBa').transform((288,432),Image.Transform.AFFINE,(inv[0,0],inv[0,1],off[0],inv[1,0],inv[1,1],off[1]),Image.Resampling.BICUBIC).convert('RGBA')

def register(raw,frame,master):
 a=np.array(raw);groups=components(a[:,:,3]>40);xy=groups[0];mask=np.zeros(a.shape[:2],np.uint8);mask[xy[:,1],xy[:,0]]=255;fringe=np.array(Image.fromarray(mask).filter(ImageFilter.MaxFilter(7)))>0;a[~fringe]=0;original=Image.fromarray(a)
 initial=288/raw.width;im=original.convert('RGBa').resize((288,round(raw.height*initial)),Image.Resampling.LANCZOS).convert('RGBA');dy=429-(np.nonzero(np.array(im)[:,:,3]>100)[0].max()+1);base=Image.new('RGBA',(288,432));base.alpha_composite(im,(0,int(dy)));a=np.array(base);ma=np.array(master);ns=neck_marker(a);nt=neck_marker(ma)
 pre=(143-nt[1])/(143-ns[1]);M0=np.eye(2)*pre;t0=np.array([nt[0]-ns[0]*pre,143-143*pre]);analysis=affine(base,M0,t0*3);a=np.array(analysis);pairs=[(neck_marker(a),nt)];names=['measuredNeck'];p=frame['keypoints']
 for name in frame['visibleHands']:
  s=marker(a,p[name]);q=marker(ma,p[name])
  if s is not None and q is not None:pairs.append((s,q));names.append(name)
 P=np.array([v[0]for v in pairs]);Q=np.array([v[1]for v in pairs]);scale,angle,M,t=fit_similarity(P,Q,a[:,:,3]);A=M@M0*initial;translation=(M@(M0@np.array([0,dy/3])+t0)+t)*3
 # Apply the composed similarity ONCE to original source pixels. The analysis
 # images above determine landmarks only and never supply final painted art.
 out=affine(original,A,translation);delta=round((143-ground(np.array(out)))*3);snap=Image.new('RGBA',(288,432));snap.alpha_composite(out,(0,delta));out=snap
 errors={name:round(float(np.linalg.norm(pred-q)),3)for name,pred,q in zip(names,P@M.T+t,Q)}
 _,arms,legs=labels(frame);core=((np.minimum(arms['L'],arms['R'])<2.2)|(np.minimum(legs['L'],legs['R'])<2.2))&(Y>86)&(Y<134);a=np.array(out);aa=(ma[:,:,3]>100)&core;bb=(a[:,:,3]>100)&core;iou=float((aa&bb).sum()/max(1,(aa|bb).sum()))
 result={'errors':errors,'maxKeypointError':max(errors.values()),'visibleHandsMeasured':len(names)-1,'limbCoreIoU':iou,'groundError':ground(a)-143,'uniformScale':initial*pre*scale/3,'rotationDegrees':math.degrees(angle),'finalSourceToCanvasTranslation':translation.tolist(),'resamplingPasses':1,'sourceLandmarks':dict(zip(names,P.tolist())),'targetLandmarks':dict(zip(names,Q.tolist()))}
 result['accepted']=bool(max(errors.values())<=2 and len(names)==1+len(frame['visibleHands']) and iou>=.85 and abs(result['groundError'])<.334)
 return out,result

def pack(item,old,side_frames,kind,style,skin=False):
 info=deepcopy(old);parts=[];oldatlas=Image.open(W/old['atlas']).convert('RGBA')
 for key in [f'{d}/{f}'for d in ['down','up']for f in range(4)]:
  info['frames'][key]['parts']={}
  for name,part in old['frames'][key]['parts'].items():
   x,y,w,h=part['rect'];parts.append((key,name,part['destination'],oldatlas.crop((x,y,x+w,y+h))))
 for key,(im,fit)in side_frames.items():
  frame=newrig['frames'][key];lab,_,legs=labels(frame);a=np.array(im);r,g,b,al=[a[:,:,i].astype(float)for i in range(4)];light=.2126*r+.7152*g+.0722*b;blue=(b>r*1.05)&(b>g*.95);full=style in ['overalls','pjs','suit'];p=frame['keypoints'];near=frame['nearLeg'];far='R'if near=='L'else'L'
  # Below the wrist, only the painted hand and its ink belong to the arm.
  # A broad arm envelope otherwise steals trouser fabric behind the palm.
  skin_edge=np.array(Image.fromarray((warm(a)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)))>0
  for label,side in [(1,'R'if frame['nearArm']=='L'else'L'),(3,frame['nearArm'])]:
   ghost=(lab==label)&(Y>p['hand'+side][1]-2.5)&~skin_edge
   replacement=np.where(Y<p['waist'][1]+1,2,np.where(legs[near]<=legs[far],5,4));lab[ghost]=replacement[ghost]
  # A lifted foot can project across the planted calf. Geometric foot zones
  # must never erase painted trouser/skin pixels on that planted leg.
  adjacent_blue=np.array(Image.fromarray((blue*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)))>0
  leg_material=blue|((light<45)&adjacent_blue)
  if kind=='bottom'and style in ['shorts','skirt']:leg_material|=warm(a)&(light>88)
  reclaim=np.isin(lab,[6,7])&leg_material
  lab[reclaim]=np.where(legs[near]<=legs[far],5,4)[reclaim]
  if kind=='bottom':
   # The rig's waist cut lies below the painted waistband. Preserve that
   # fabric as pelvis/leg pixels instead of discarding it as shirt torso.
   pelvis=(lab==2)&(Y>=p['waist'][1]-3)&(Y<p['waist'][1]+1)
   lab[pelvis]=np.where(legs[near]<=legs[far],5,4)[pelvis]
  upper=np.isin(lab,[1,2,3]);lower=np.isin(lab,[4,5])
  if skin:keep=lower
  elif kind=='top':
   keep=(upper|lower)if full else upper.copy()
   if not full:keep&=~((lab==2)&(Y>p['waist'][1]-1)&blue&(light<80))
   if style in ['labcoat','garden']:
    end=(p['kneeL'][1]+p['kneeR'][1])/2+(2 if style=='labcoat'else-2);hem=blue&(light>82)&(Y>p['waist'][1]-3)&(Y<end);hem=np.array(Image.fromarray((hem*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)))>0;keep|=hem&lower&(Y<end+1);info['longHem']=True
  elif kind=='bottom':
   adjacent=np.array(Image.fromarray((blue*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)))>0;keep=lower&(blue|((light<45)&adjacent)|(warm(a)if style in ['shorts','skirt']else False)|pelvis)
  else:
   # Preserve complete shoe silhouettes, including shafts and partially hidden
   # raised feet, rather than slicing them with the other leg's ankle plane.
   brown=(r>g*1.08)&(g>b*1.12);cream=(r>170)&(g>155)&(b>120)&(abs(r-g)<45)
   seed=(brown|cream)&(Y>116)&(al>100);adjacent=np.array(Image.fromarray((seed*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)))>0
   keep=(seed|(adjacent&(light<65)))&(al>0);foot={s:chain(p,['heel'+s,'ankle'+s,'toe'+s])for s in ['L','R']}
   for group in components(keep):
    yy,xx=group[:,1],group[:,0];label=7 if foot[near][yy,xx].mean()<=foot[far][yy,xx].mean()else 6;lab[yy,xx]=label
  info['frames'][key]={'registration':fit,'parts':{}}
  for label,name in NAMES.items():
   mask=(al>0)&keep&(lab==label)
   if not mask.any():continue
   yy,xx=np.nonzero(mask);box=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)];layer=np.zeros_like(a);layer[mask]=a[mask];parts.append((key,name,box[:2],Image.fromarray(layer).crop(box)))
 width=1024;x=y=rowh=0;placed=[]
 for key,name,pos,im in sorted(parts,key=lambda v:-v[3].height):
  if x+im.width+2>width:x=0;y+=rowh+2;rowh=0
  placed.append((key,name,pos,im,x,y));x+=im.width+2;rowh=max(rowh,im.height)
 atlas=Image.new('RGBA',(width,y+rowh+2))
 for key,name,pos,im,x,y in placed:atlas.alpha_composite(im,(x,y));info['frames'][key]['parts'][name]={'rect':[x,y,im.width,im.height],'destination':pos}
 folder=P3/'atlases';folder.mkdir(exist_ok=True);target=folder/(item+'.png');staging=target.with_suffix('.png.tmp');atlas.save(staging,format='PNG');staging.replace(target);info['atlas']='profile-v3/atlases/'+item+'.png';info['accepted']=all(v[1]['accepted']for v in side_frames.values());info['profileRevision']='standing-style-profiles-v3'
 if not skin:
  reference=np.array(Image.open(W/f'assets/{item}-standing-style-reference.png').convert('RGBA'))[:432];ref_y=np.indices(reference.shape[:2])[0]/3
  def values(arr,yy,role):
   r,g,b,al=[arr[:,:,i].astype(float)for i in range(4)];l=.2126*r+.7152*g+.0722*b;blue=(b>r*1.05)&(b>g*.95)
   if role=='upper':mask=blue&(yy>=84)&(yy<103)&(l>42)
   elif role=='lower':mask=blue&(yy>=110)&(yy<134)&(l>25)
   else:mask=(yy>129)&(r>g*1.08)&(g>b*1.12)&(l>15)&(l<110)
   return l[mask&(al>200)]
  roles=['upper','lower']if full else['upper']if kind=='top'else['lower']if kind=='bottom'else['shoe'];info['profileBases']={};info['profileToneAudit']={}
  for role in roles:
   ref=values(reference,ref_y,role);samples=np.concatenate([values(np.array(im),Y,role)for im,_ in side_frames.values()]);key_light=126.654 if kind=='top'else 63.755 if kind=='bottom'else 31.32
   if not len(ref)or not len(samples):continue
   desired=float(np.median(ref));source_value=float(np.median(samples));ratio=desired/key_light if desired<=key_light*1.15 else 1.15+(desired-key_light*1.15)/(255-key_light*1.15)/.8
   info['profileBases'][role]=round(float(np.clip(source_value/ratio,20,200)),3);info['profileToneAudit'][role]={'standingMedian':desired,'generatedMedian':source_value,'materialBase':info['profileBases'][role],'method':'Normalize the generated material to the existing standing outfit in its canonical palette; no source pixels repainted.'}
 return info

