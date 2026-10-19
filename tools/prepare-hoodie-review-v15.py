"""Color-only hoodie review derivatives. Raw art and live assets are untouched.

Uses the shared material-palette workflow approved during the flannel review.
Only solid material RGB changes: alpha, geometry, protected ink and pixels
outside material masks remain byte-identical to the registered candidates.
"""
from pathlib import Path
import importlib.util,json,hashlib,shutil
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];W=ROOT/'graphics/production/walk'
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
colors=module('shared_colors',ROOT/'tools/apply-flannel-shared-palette.py');audit=colors.audit
OUT=ROOT/'review/hoodie-proportions-v15';OUT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def regions(im):
 masks,ink=colors.masks(im);a=np.array(im);r,g,b=a[:,:,:3].astype(float).transpose(2,0,1)
 ys,xs=np.where(a[:,:,3]>200);y0,y1=ys.min(),ys.max()+1;yy,xx=np.mgrid[:a.shape[0],:a.shape[1]]
 strings=(a[:,:,3]>200)&(yy<y0+(y1-y0)*.44)&(abs(xx-float(np.median(xs)))<(xs.max()-xs.min()+1)*.25)&(r>140)&(g>130)&(b>95)&(abs(r-g)<45)&((r-b)<100)&~ink
 for k in masks:masks[k]&=~strings
 masks['drawstrings']=strings
 return masks,ink
reference=ROOT/'graphics/production/customization/top/hoodie/down.png';ref=Image.open(reference).convert('RGBA');ms,_=regions(ref);a=np.array(ref)
palettes={name:colors.ramp(a[m,:3]) for name,m in ms.items()}
stats={name:np.percentile(audit.lab(a[m,:3])[:,0],[25,50,75]) for name,m in ms.items()}
records=[];pictures={}
for d in ['down','up']:
 for f in ['idle',0,1,2,3]:
  source=W/f'registered/hoodie-idle-v14/{d}.png' if f=='idle' else W/f'sources/rerender-v6/registered/hoodie-v14/top-hoodie/{d}-{f}.png'
  destination=W/f'registered/hoodie-idle-v15/{d}.png' if f=='idle' else W/f'sources/rerender-v6/registered/hoodie-v15/top-hoodie/{d}-{f}.png'
  destination.parent.mkdir(parents=True,exist_ok=True);before=sha(source);im=Image.open(source).convert('RGBA');a=np.array(im);result=a.copy();masks,ink=regions(im);union=np.zeros(a.shape[:2],bool)
  for name,m in masks.items():
   if not m.any():continue
   light=audit.lab(a[m,:3])[:,0];lo,mid,hi=np.percentile(light,[25,50,75]);rlo,rmid,rhi=stats[name];gain=np.clip((rhi-rlo)/max(.5,hi-lo),.8,1.2)
   target=(light-mid)*gain+rmid;levels=audit.lab(palettes[name])[:,0];indices=np.clip(np.rint(np.interp(target,levels,np.arange(256))),0,255).astype(int)
   result[m,:3]=palettes[name][indices];union|=m
  assert np.array_equal(a[:,:,3],result[:,:,3]) and np.array_equal(a[ink],result[ink]) and np.array_equal(a[~union],result[~union])
  out=Image.fromarray(result);out.save(destination);assert sha(source)==before
  old=Image.open(ROOT/f'graphics/production/customization/top/hoodie/{d}.png').convert('RGBA');it,_=audit.ink(old);ot,black=audit.ink(out)
  checks={'alphaUnchanged':True,'inkUnchanged':True,'outsideMaskUnchanged':True,'sourceHashUnchanged':True,'palette':audit.palette(old,out,'hoodie'),'outlineRatio':ot/max(.001,it),'blackEdgeFraction':black,'backNeckPass':d!='up' or audit.cream_at_neck(out)<.005 or audit.cream_at_neck(old)>.01,'edgeClipped':False}
  solid=result[:,:,3]>100;checks['edgeClipped']=bool(solid[0].any() or solid[-1].any() or solid[:,0].any() or solid[:,-1].any())
  if f!='idle':
   guide=Image.open(W/f'pose-guides-v6/{d}-{f}.png').convert('RGBA');checks['leadingFootPass']=audit.leading_foot_offset(guide)*audit.leading_foot_offset(out)>0
  failures=[k for k,v in [('palette',checks['palette']['pass']),('outline',checks['outlineRatio']<=1.25),('black',black<.02),('rear neck',checks['backNeckPass']),('leading foot',checks.get('leadingFootPass',True)),('clipping',not checks['edgeClipped'])] if not v]
  metadata=json.loads(source.with_suffix('.json').read_text());metadata.update(colorDerivative={'source':source.relative_to(ROOT).as_posix(),'sourceSHA256':before,'method':'Shared 256-color material ramps, bounded lightness gain 0.8–1.2','paletteReference':reference.relative_to(ROOT).as_posix()},registeredSHA256=sha(destination),runtimeInstalled=False,visualApproval=False,checks=checks,failures=failures)
  destination.with_suffix('.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf8',newline='\n')
  medians={k:np.median(result[m,:3],axis=0).tolist() for k,m in masks.items() if m.any()}
  records.append({'direction':d,'frame':f,'source':source.relative_to(ROOT).as_posix(),'destination':destination.relative_to(ROOT).as_posix(),'sourceSHA256':before,'checks':checks,'failures':failures,'materialMedians':medians});pictures[d,str(f)]=out
  # Diagnostic-only mask composite; never a source for final art.
  if d=='down' and f==0:
   preview=np.zeros_like(a);swatches=['#4488ee','#738099','#e8a477','#855739','#e0d5bd','#e9e8dc']
   for m,swatch in zip(masks.values(),swatches):preview[m]=[*tuple(bytes.fromhex(swatch[1:])),255]
   Image.fromarray(preview).save(OUT/'material-masks.png')
report={'status':'Source review only; user approval required before implementation','garment':'hoodie','reference':reference.relative_to(ROOT).as_posix(),'referenceSHA256':sha(reference),'palette':{k:v.tolist() for k,v in palettes.items()},'frames':records,'failedFrames':sum(bool(r['failures']) for r in records)}
(OUT/'shared-palette.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8',newline='\n')
board=Image.new('RGB',(1440,630),'#eee9dd');draw=ImageDraw.Draw(board)
current=Image.new('RGB',(1200,630),'#eee9dd');cd=ImageDraw.Draw(current)
for row,d in enumerate(['down','up']):
 old=Image.open(ROOT/f'graphics/production/customization/top/hoodie/{d}.png').convert('RGBA')
 poses=[pictures[d,'idle']]+[pictures[d,str(f)] for f in range(4)]
 for col,(label,im) in enumerate(zip(['OLD IDLE','NEW IDLE','walk 0','walk 1','walk 2','walk 3'],[old]+poses)):
  draw.text((col*240+7,row*315+8),f'{d} / {label}',fill='#352d28');board.paste(audit.tile(im,(240,270)),(col*240,row*315+32))
 for col,(label,im) in enumerate(zip(['NEW IDLE','walk 0','walk 1','walk 2','walk 3'],poses)):
  cd.text((col*240+7,row*315+8),f'{d} / {label}',fill='#352d28');current.paste(audit.tile(im,(240,270)),(col*240,row*315+32))
board.save(OUT/'comparison.png');current.save(OUT/'idle-and-walk.png')
measure=json.loads((ROOT/'review/hoodie-proportions-v14/measurements.json').read_text())
measure['colorValidation']={'failedFrames':report['failedFrames'],'frames':[{k:r[k] for k in ['direction','frame','checks','failures','materialMedians']} for r in records]}
measure['sourceVersion']='Geometry v14; color-only derivatives v15'
(OUT/'measurements.json').write_text(json.dumps(measure,indent=2)+'\n',encoding='utf8',newline='\n')
prompt_files=list((W/'sources/rerender-v6/hoodie-v14').glob('*-generation.json'))+list((W/'sources/hoodie-idle-v14').glob('*-generation.json'))
(OUT/'generation-prompts.json').write_text(json.dumps([json.loads(p.read_text()) for p in sorted(prompt_files)],indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps({'frames':len(records),'failedFrames':report['failedFrames'],'failures':[(r['direction'],r['frame'],r['failures']) for r in records if r['failures']]}))
