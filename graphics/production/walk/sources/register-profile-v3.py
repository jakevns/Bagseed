"""Register revised profile drawings to measured neck/hands and a shared floor.

Candidate-only until explicitly published; preserves all front/back pixels.
"""
from register_samples import *
import argparse
V=ROOT/'review/custom-walk-v3';target=json.loads((W/'sources/profile-v3-targets.json').read_text())

def register_profile(raw,frame):
 a=np.array(raw);groups=components(a[:,:,3]>40);xy=groups[0];clean=np.zeros_like(a);clean[xy[:,1],xy[:,0]]=a[xy[:,1],xy[:,0]]
 initial=288/raw.width;im=Image.fromarray(clean).convert('RGBa').resize((288,round(raw.height*initial)),Image.Resampling.LANCZOS).convert('RGBA');ys=np.nonzero(np.array(im)[:,:,3]>100)[0];dy=429-(ys.max()+1);base=Image.new('RGBA',(288,432));base.alpha_composite(im,(0,int(dy)));a=np.array(base);p=frame['keypoints'];pairs=[];names=[]
 skin=warm(a);yy,xx=np.nonzero(skin&(Y<98));top=yy.min();mask=skin&(YY<=top+8);yy,xx=np.nonzero(mask);neck=np.array([np.median(xx)/3,yy.mean()/3]);pairs.append((neck,np.array(p['neck'])+[0,1.]));names.append('measuredNeck')
 for name in (['handL','handR']if frame['phase']=='contact'else['handL']):
  source=marker(a,p[name])
  if source is not None:pairs.append((source,np.array(p[name])+[0,1.5]));names.append(name)
 P=np.array([v[0]for v in pairs]);Q=np.array([v[1]for v in pairs]);scale,angle,M,t=fit_similarity(P,Q,a[:,:,3]);inv=np.linalg.inv(M);off=-inv@t*3
 out=base.convert('RGBa').transform((288,432),Image.Transform.AFFINE,(inv[0,0],inv[0,1],off[0],inv[1,0],inv[1,1],off[1]),Image.Resampling.BICUBIC).convert('RGBA');delta=round((143-ground(np.array(out)))*3);snap=Image.new('RGBA',(288,432));snap.alpha_composite(out,(0,delta));out=snap;t[1]+=delta/3
 errors={name:round(float(np.linalg.norm(pred-q)),3)for name,pred,q in zip(names,P@M.T+t,Q)}
 return out,{'uniformScale':initial*scale/3,'rotationDegrees':math.degrees(angle),'sourceLandmarks':dict(zip(names,P.tolist())),'targetLandmarks':dict(zip(names,Q.tolist())),'errors':errors,'maxKeypointError':max(errors.values()),'groundError':ground(np.array(out))-143,'handLandmarks':len(names)-1,'accepted':max(errors.values())<=2 and len(names)>=2,'scope':'measured source neck and visible distal hand markers; unmeasured hidden limbs require visual inspection'}

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--source',default='assets/profile-v3-mannequin-v1.png');parser.add_argument('--id',default='mannequin');args=parser.parse_args()
 source=Image.open(W/args.source).convert('RGBA');alpha=np.array(source)[:,:,3]>40;rs=separators(alpha.sum(1),2);cs=separators(alpha.sum(0),4);board=Image.new('RGBA',(1152,864),'#292330');d=ImageDraw.Draw(board);reports=[]
 folder=W/'profile-v3'/args.id;folder.mkdir(parents=True,exist_ok=True)
 for row,di in enumerate(['right','left']):
  for f in range(4):
   key=f'{di}/{f}';cell=[cs[f],rs[row],cs[f+1],rs[row+1]];out,fit=register_profile(source.crop(cell),target['frames'][key]);out.save(folder/f'{di}-{f}.png');board.alpha_composite(out,(f*288,row*432));p=target['frames'][key]['keypoints']
   for name in ['neck','handL','handR','kneeL','kneeR','ankleL','ankleR']:
    x,y=p[name];x+=f*96;y+=row*144;d.ellipse((x*3-3,y*3-3,x*3+3,y*3+3),outline='#ffb5e8',width=1)
   d.text((f*288+4,row*432+4),key+' '+str(fit['maxKeypointError'])+'px',fill='white');reports.append({'frame':key,'sourceCell':cell,**fit})
 V.mkdir(exist_ok=True);board.convert('RGB').save(V/f'{args.id}-profile-registration.png');(V/f'{args.id}-profile-registration.json').write_text(json.dumps({'source':args.source,'frames':reports,'passed':sum(v['accepted']for v in reports),'total':8},indent=2)+'\n');print([(v['frame'],v['maxKeypointError'],v['accepted'])for v in reports])

if __name__=='__main__':main()
