"""Register additional authored garments without rewriting the Phase 1 samples.

Only similarity transforms, source-pixel masking and atlas packing are used.
"""
from register_samples import *
import argparse

def pack(parts,info,item):
 width=1024;x=y=rowh=0;placed=[]
 for key,name,box,im in sorted(parts,key=lambda v:-v[3].height):
  if x+im.width+2>width:x=0;y+=rowh+2;rowh=0
  placed.append((key,name,box,im,x,y));x+=im.width+2;rowh=max(rowh,im.height)
 atlas=Image.new('RGBA',(width,y+rowh+2))
 for key,name,box,im,x,y in placed:
  atlas.alpha_composite(im,(x,y));info['frames'][key]['parts'][name]={'rect':[x,y,im.width,im.height],'destination':box[:2]}
 dest=W/f'atlases/{item}.png';atlas.save(dest);info['atlas']=str(dest.relative_to(W))

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--items',nargs='*');args=parser.parse_args()
 review=ROOT/'review/custom-walk-v2';review.mkdir(exist_ok=True)
 manifest=json.loads((W/'manifest.json').read_text());manifest['rigSHA256']=hashlib.sha256((W/'rig.json').read_text().encode()).hexdigest();prior_path=review/'garment-validation.json'
 reports=json.loads(prior_path.read_text())['frames'] if prior_path.exists() else []
 jobs=['top-tank']+[v['id']for v in json.loads((W/'sources/phase2-jobs.json').read_text())]
 for item in args.items or jobs:
  versions=[]
  for candidate in sorted((W/'assets').glob(item+'-v*.png')):
   source=Image.open(candidate).convert('RGBA');alpha=np.array(source)[:,:,3]>40
   versions.append((candidate,source,separators(alpha.sum(1),4),separators(alpha.sum(0),4),None))
   manifest['sources'][str(candidate.relative_to(W))]=hashlib.sha256(candidate.read_bytes()).hexdigest()
  correction_path=W/'sources/phase2-corrections.json'
  if correction_path.exists():
   for correction in json.loads(correction_path.read_text()):
    if correction['id']!=item:continue
    candidate=W/correction['source']
    if not candidate.exists():continue
    source=Image.open(candidate).convert('RGBA');alpha=np.array(source)[:,:,3]>40
    versions.append((candidate,source,separators(alpha.sum(1),2),separators(alpha.sum(0),2),correction['frames']))
    manifest['sources'][str(candidate.relative_to(W))]=hashlib.sha256(candidate.read_bytes()).hexdigest()
  if not versions:print(item,'not generated yet',flush=True);continue
  kind,style=item.split('-',1);full=style in ['overalls','pjs','suit'];info={'kind':kind,'style':style,'fullSuit':full,'frames':{},'source':str(versions[0][0].relative_to(W)),'phase':2};parts=[]
  board=Image.new('RGBA',(1152,1728),'#292330');draw=ImageDraw.Draw(board);reports=[r for r in reports if r['item']!=item]
  for ri,di in enumerate(DIRS):
   for f in range(4):
    key=f'{di}/{f}';frame=rig['frames'][key];p=frame['keypoints'];master=np.array(Image.open(W/f'master/{di}-{f}.png').convert('RGBA'))
    lab,arms,legs=labels(frame);man=np.array(Image.open(W/f'registered/mannequin/{di}-{f}.png'));core=(np.minimum(arms['L'],arms['R'])<2.2)|(np.minimum(legs['L'],legs['R'])<2.2);core&=(Y>=87)&(Y<=134);choices=[]
    for candidate,source,rs,cs,keys in versions:
     if keys is not None and key not in keys:continue
     for slot in ([i for i,k in enumerate(keys)if k==key]if keys is not None else [ri*4+f]):
      row,col=divmod(slot,2 if keys is not None else 4);cell=[cs[col],rs[row],cs[col+1],rs[row+1]];out,fit=register(source.crop(cell),frame,master);arr=np.array(out)
      ma=(man[:,:,3]>100)&core;mb=(arr[:,:,3]>100)&core;iou=float((ma&mb).sum()/max(1,(ma|mb).sum()))
      fit.update(limbCoreIoU=iou,sourceCell=cell,sourceSlot=slot,source=str(candidate.relative_to(W)))
      fit['accepted']=bool(fit['maxKeypointError']<=2 and iou>=.85 and abs(fit['groundError'])<=1/3+.001 and len(fit['errors'])>1 and not fit['detachedLargeComponents']);choices.append((out,fit))
    out,fit=min(choices,key=lambda v:(not v[1]['accepted'],v[1]['maxKeypointError']+max(0,.85-v[1]['limbCoreIoU'])*100+v[1]['detachedLargeComponents']*100))
    fit['candidates']=[{k:v[k]for k in ['source','sourceSlot','maxKeypointError','limbCoreIoU','accepted']}for _,v in choices]
    arr=np.array(out);r,g,b,al=[arr[:,:,i].astype(float)for i in range(4)];light=.2126*r+.7152*g+.0722*b;blue=(b>r*1.05)&(b>g*.95);active=al>8;upper=np.isin(lab,[1,2,3]);lower=np.isin(lab,[4,5])
    if kind=='top':
     keep=(upper|lower)if full else upper.copy()
     if not full:keep&=~((lab==2)&(Y>p['waist'][1]-1)&blue&(light<80))
     if style in ['labcoat','garden']:
      # Bright key-blue hem and adjacent original ink. Companion jeans use
      # the distinct dark-navy value range and remain a separate item.
      hem_end=(p['kneeL'][1]+p['kneeR'][1])/2+(2 if style=='labcoat'else -2)
      hem=blue&(light>82)&(Y>p['waist'][1]-3)&(Y<hem_end)
      hem=np.array(Image.fromarray((hem*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)))>0
      hem&=lower&(Y<hem_end+1);keep|=hem
      info['longHem']=True
    elif kind=='bottom':
     fabric=blue;adjacent=np.array(Image.fromarray((fabric*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)))>0
     keep=lower&(fabric|((light<45)&adjacent)|((warm(arr))if style=='shorts'else False))&~((Y<p['waist'][1]-1)&(light>85)&blue)
    else:
     # Boot shafts belong to footwear, even where they overlap trouser labels.
     near=frame['nearLeg'];far='R'if near=='L'else'L';brown=(r>g*1.1)&(g>b*1.12)
     for side,label in [(far,6),(near,7)]:
      shaft=brown&(Y>p['ankle'+side][1]-(18 if style=='rainboots'else 9))&(legs[side]<=legs['R'if side=='L'else'L']+.1)
      lab[shaft]=label
     keep=np.isin(lab,[6,7])&~blue
    info['frames'][key]={'registration':fit,'parts':{}}
    for label,name in NAMES.items():
     mask=active&keep&(lab==label)
     if not mask.any():continue
     yy,xx=np.nonzero(mask);box=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)];layer=np.zeros_like(arr);layer[mask]=arr[mask];parts.append((key,name,box,Image.fromarray(layer).crop(box)))
    folder=W/f'registered/{item}';folder.mkdir(exist_ok=True);out.save(folder/f'{di}-{f}.png');board.alpha_composite(out,(f*288,ri*432));draw.text((f*288+4,ri*432+4),f'{key} {"PASS"if fit["accepted"]else"REJECT"} {fit["maxKeypointError"]:.2f}px core {fit["limbCoreIoU"]:.2f}',fill='white');reports.append({'item':item,'frame':key,**fit})
  pack(parts,info,item);info['accepted']=all(v['registration']['accepted']for v in info['frames'].values());manifest['items'][item]=info;board.convert('RGB').save(review/f'{item}-registration.png')
  (W/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');prior_path.write_text(json.dumps({'total':len(reports),'passed':sum(r['accepted']for r in reports),'rejected':[r for r in reports if not r['accepted']],'frames':reports},indent=2)+'\n');print(item,sum(v['registration']['accepted']for v in info['frames'].values()),'/16 passed',flush=True)
 print('Phase 1 assets retained. Inspect rejected candidates before runtime acceptance.')

if __name__=='__main__':main()
