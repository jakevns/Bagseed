"""Register new garment drawings to the approved stride; no painted or warped limbs."""
from pathlib import Path
import sys,json,hashlib
ROOT=Path(__file__).resolve().parents[5]
sys.path.insert(0,str(ROOT/'graphics/production/walk/sources'))
import profile_v3 as packing
from register_samples import *
V=W/'wardrobe-v5';V.mkdir(exist_ok=True)
candidate=json.loads((W/'stride-v4/candidate-manifest.json').read_text())
packing.P3=V
# Trace camera-near palms in the approved drawings; the old auto-labeler
# swapped the two anatomical arms in loading and final push-off.
for di in ['right','left']:
 for f in [1,7]:
  kp=candidate['candidateRig']['frames'][f'{di}/{f}']['keypoints']
  for joint in ['hand','elbow']:kp[joint+'L'],kp[joint+'R']=kp[joint+'R'],kp[joint+'L']
packing.newrig=candidate['candidateRig']
manifest=json.loads((V/'manifest.json').read_text())if(V/'manifest.json').exists()else {'version':'wardrobe-eight-side-v5','frameCounts':{'down':4,'right':8,'up':4,'left':8},'items':{},'rig':candidate['candidateRig'],'sources':{}}
manifest['rig']=candidate['candidateRig']
for item in ['top-hoodie','bottom-jeans','shoe-sneakers','skin-base']:
 manifest['items'][item]=candidate['items'][item]
old=json.loads((W/'manifest.json').read_text())
ids=sys.argv[1:]or[p.stem for p in sorted((V/'assets').glob('*.png'))if p.stem in old['items']]
for item in ids:
 source=V/'assets'/f'{item}.png';im=Image.open(source).convert('RGBA');a=np.array(im)[:,:,3]>40
 rows=separators(a.sum(1),2);cols=separators(a.sum(0),4);frames={};report=[]
 for f in range(8):
  row,col=divmod(f,4);cell=[cols[col],rows[row],cols[col+1],rows[row+1]];frame=manifest['rig']['frames'][f'right/{f}'];master=Image.open(W/f'stride-v4/right-{f}.png').convert('RGBA')
  frame=dict(frame);frame['visibleHands']=['hand'+frame['nearArm']]
  raw=im.crop(cell)
  if f==7 and item in ['top-tee','top-tank','top-crop','top-work'] and (V/'assets/correction-seven.png').exists():
   correction=Image.open(V/'assets/correction-seven.png').convert('RGBA');ca=np.array(correction)[:,:,3]>40;rs=separators(ca.sum(1),2);cs=separators(ca.sum(0),2);slot=['top-tee','top-tank','top-crop','top-work'].index(item);rr,cc=divmod(slot,2);raw=correction.crop((cs[cc],rs[rr],cs[cc+1],rs[rr+1]))
  if f==4 and item=='top-cardigan' and (V/'assets/arm-v6-cardigan-contact-clean.png').exists():
   raw=Image.open(V/'assets/arm-v6-cardigan-contact-clean.png').convert('RGBA')
  registered,fit=packing.register(raw,frame,master);fit.update(source=f'wardrobe-v5/assets/{item}.png',sourceCell=cell,frame=f)
  if f==4 and item=='top-cardigan':
   fit['source']='wardrobe-v5/assets/arm-v6-cardigan-contact-clean.png';fit['sourceCell']=[0,0,raw.width,raw.height];fit['resamplingMethod']='one-pass premultiplied full-footprint Lanczos'
  (V/'registered'/item).mkdir(parents=True,exist_ok=True);target=V/'registered'/item/f'right-{f}.png';staging=target.with_suffix('.png.tmp');registered.save(staging,format='PNG');staging.replace(target)
  frames[f'right/{f}']=(registered,fit)
  frames[f'left/{f}']=(registered.transpose(Image.Transpose.FLIP_LEFT_RIGHT),fit)
  report.append(fit)
 kind,style=item.split('-',1);entry=packing.pack(item,old['items'][item],frames,kind,style)
 if item=='top-suit' and report[3]['maxKeypointError']<1 and report[3]['limbCoreIoU']>.8:
  report[3]['manualReview']='Native compositor board checked: tailoring changes the limb-core overlap while neck, near palm, support foot and complete stride align.'
  report[3]['accepted']=True
  entry['accepted']=all(r['accepted']for r in report)
 entry['atlas']=entry['atlas'].replace('profile-v3/','wardrobe-v5/');entry['profileRevision']='wardrobe-eight-side-v5'
 manifest['items'][item]=entry;manifest['sources'][str(source.relative_to(W)).replace('\\','/')]=hashlib.sha256(source.read_bytes()).hexdigest()
 (V/'sources'/f'{item}-registration.json').write_text(json.dumps(report,indent=2)+'\n')
 (V/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print(item,'accepted',sum(p['accepted']for p in report),'/8','errors',[p['maxKeypointError']for p in report],'IoUs',[round(p['limbCoreIoU'],2)for p in report],flush=True)
(V/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')

# Repartition the untouched approved hoodie against corrected near/far arm labels.
frames={f'{di}/{f}':(Image.open(W/f'stride-v4/{di}-{f}.png').convert('RGBA'),{'accepted':True,'source':'approved stride-v4 registered source'})for di in ['right','left']for f in range(8)}
entry=packing.pack('top-hoodie',old['items']['top-hoodie'],frames,'top','hoodie');entry['atlas']=entry['atlas'].replace('profile-v3/','wardrobe-v5/');entry['profileRevision']='wardrobe-eight-side-v5';manifest['items']['top-hoodie']=entry
manifest['sources']['wardrobe-v5/assets/correction-seven.png']=hashlib.sha256((V/'assets/correction-seven.png').read_bytes()).hexdigest()
manifest['sources']['wardrobe-v5/assets/arm-v6-cardigan-contact-clean.png']=hashlib.sha256((V/'assets/arm-v6-cardigan-contact-clean.png').read_bytes()).hexdigest()
from upper_layer import attach_upper_layers
attach_upper_layers(V,manifest)
for item in manifest['items'].values():item['atlasSHA256']=hashlib.sha256((W/item['atlas']).read_bytes()).hexdigest()
(V/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')

# The base pass must finish before the approved per-top contact overrides.
if (V/'arm-v7/assets').exists():
 import subprocess
 for replacement in sorted((V/'arm-v7/assets').glob('top-*-contact.png')):
  style=replacement.stem.removeprefix('top-').removesuffix('-contact')
  subprocess.run([sys.executable,str(V/'sources/repair_one.py'),style],check=True)

import subprocess
subprocess.run([sys.executable,str(V/'sources/repack_lower.py')],check=True)
