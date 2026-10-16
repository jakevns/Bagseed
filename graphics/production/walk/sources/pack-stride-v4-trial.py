"""Review-only modular sample. Keeps all original front/back part pixels."""
import profile_v3 as packing
from profile_v3 import *
P4=W/'stride-v4';draft=json.loads((W/'sources/stride-v4-targets.json').read_text());reg=json.loads((P4/'registration.json').read_text());new={'version':'eight-pose-profiles-v4','frames':{}}
for di in ['right','left']:
 for f in range(8):
  key=f'{di}/{f}';frame=deepcopy(draft['frames'][f'right/{f}']);p=frame['keypoints']
  if di=='left':
   for k,(x,y)in p.items():p[k]=[96-x,y]
  a=np.array(Image.open(P4/f'{di}-{f}.png').convert('RGBA'))
  groups=[g for g in components(warm(a)&(Y>95)&(Y<118))if len(g)>20];centers=[g.mean(0)/3 for g in groups[:2]]
  pending=['L','R'];visible=[]
  if centers:
   for c in sorted(centers,key=lambda v:np.linalg.norm(v-np.array(p['handL']))):
    s=min(pending,key=lambda s:np.linalg.norm(c-np.array(p['hand'+s])));pending.remove(s);p['hand'+s]=[round(float(v),3)for v in c];visible.append('hand'+s)
  for s in ['L','R']:
   p['elbow'+s]=[round(float(v),3)for v in np.array(p['shoulder'+s])*.45+np.array(p['hand'+s])*.55]
  frame['visibleHands']=visible;frame['landmarkScope']='Visible palms measured in source; hidden joints inferred from motion guide. Not an independent gait-quality test.';new['frames'][key]=frame
(P4/'rig.json').write_text(json.dumps(new,indent=2)+'\n')
packing.newrig=new;packing.P3=P4
manifest=json.loads((W/'manifest.json').read_text());frames={key:(Image.open(P4/(key.replace('/','-')+'.png')).convert('RGBA'),{'accepted':True,'source':reg['frames'][int(key.split('/')[1])]['source'],'sourceRegistration':reg['frames'][int(key.split('/')[1])],'scope':'Frozen sample source, not independent garment-fit or visual approval.'})for key in new['frames']}
for item in ['top-hoodie','bottom-jeans','shoe-sneakers','skin-base']:
 kind,style=item.split('-',1);info=packing.pack(item,manifest['items'][item],frames,kind if item!='skin-base'else'skin',style,skin=item=='skin-base');info['profileRevision']='eight-pose-profiles-v4';info['atlas']=info['atlas'].replace('profile-v3/','stride-v4/');manifest['items'][item]=info
combined=json.loads((W/'rig.json').read_text());combined['frames'].update(new['frames']);manifest['candidateRig']=combined;manifest['frameCounts']={'down':4,'right':8,'up':4,'left':8};manifest['status']='Eight-pose sample only; remaining wardrobe still uses previous motion.'
(P4/'candidate-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Packed 16 side poses each for hoodie, jeans, sneakers and underlayer. Original front/back parts retained.')
