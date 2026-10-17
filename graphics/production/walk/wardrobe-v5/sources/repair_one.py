"""Repair one source pose at a time, preserving all unrelated wardrobe pixels."""
from pathlib import Path
import sys,json,hashlib,subprocess,io
ROOT=Path(__file__).resolve().parents[5]
sys.path.insert(0,str(ROOT/'graphics/production/walk/sources'))
import profile_v3 as packing
from register_samples import *
from upper_layer import attach_upper_layers

style=sys.argv[1];item='top-'+style
assert style not in ['cardigan','crop','tank'],'The three approved tops must remain untouched'
V=W/'wardrobe-v5';manifest=json.loads((V/'manifest.json').read_text());old=manifest['items'][item]
source=V/f'arm-v7/assets/{item}-contact.png';raw=Image.open(source).convert('RGBA')
frame=dict(manifest['rig']['frames']['right/4']);frame['visibleHands']=['handL']
# Bare forearms use the approved cardigan's corrected shoulder/hand contact,
# rather than the tank's slightly different exposed-neck/hand landmarks.
reference='officer' if style=='tee' else 'cardigan' if style in ['officer','overalls'] else 'tank'
master=Image.open(V/f'registered/top-{reference}/right-4.png').convert('RGBA')
if style=='garden':
 import register_samples as registration
 old_warm=registration.warm;old_pack_warm=packing.warm
 def skin_only(a):
  r,g,b=[a[:,:,i].astype(float)for i in range(3)];return old_warm(a)&(b>g*.55)&(r>g*1.30)
 registration.warm=skin_only;packing.warm=skin_only
 registered,fit=packing.register(raw,frame,master)
 registration.warm=old_warm;packing.warm=old_pack_warm
else:registered,fit=packing.register(raw,frame,master)
if style=='tee':
 # The far shoulder/sleeve/upper arm are deliberately behind the opaque back.
 # Comparing their silhouette to an exposed-arm reference rewards the bug.
 _,arms,legs=labels(frame)
 core=((arms[frame['nearArm']]<2.2)|(np.minimum(legs['L'],legs['R'])<2.2))&(Y>86)&(Y<134)
 aa=(np.array(master)[:,:,3]>100)&core;bb=(np.array(registered)[:,:,3]>100)&core
 fit['visibleLimbCoreIoU']=float((aa&bb).sum()/max(1,(aa|bb).sum()))
 fit['occludedParts']=['farShoulder','farSleeve','farUpperArm']
 fit['accepted']=bool(fit['maxKeypointError']<=2 and fit['visibleHandsMeasured']==1 and fit['visibleLimbCoreIoU']>=.85 and abs(fit['groundError'])<.334)
fit.update(source=str(source.relative_to(W)).replace('\\','/'),sourceCell=[0,0,*raw.size],frame=4,resamplingMethod='single premultiplied affine with full footprint for large sources')
assert fit['accepted'],(style,fit)
target=V/f'registered/{item}/right-4.png';target.parent.mkdir(parents=True,exist_ok=True);staging=target.with_suffix('.png.tmp');registered.save(staging,format='PNG');staging.replace(target)
frames={}
for f in range(8):
 path=(W/f'stride-v4/right-{f}.png')if style=='hoodie'and f!=4 else V/f'registered/{item}/right-{f}.png'
 image=Image.open(path).convert('RGBA');registration=fit if f==4 else old['frames'][f'right/{f}']['registration']
 frames[f'right/{f}']=(image,registration);frames[f'left/{f}']=(image.transpose(Image.Transpose.FLIP_LEFT_RIGHT),registration)
packing.P3=V;packing.newrig=manifest['rig'];entry=packing.pack(item,old,frames,'top',style)
entry['atlas']=entry['atlas'].replace('profile-v3/','wardrobe-v5/');entry['profileRevision']='individual-arm-source-v7'
for field in ['profileBases','profileToneAudit']:
 if field in old:entry[field]=old[field]
# Keep the seven untouched poses' palette and normalize only the replacement
# contact to its original fabric value. This prevents a one-frame color flash.
baseline_path=f'graphics/production/walk/{"stride-v4" if style=="hoodie" else "wardrobe-v5/registered/"+item}/right-4.png'
baseline=Image.open(io.BytesIO(subprocess.check_output(['git','show','c6864e5:'+baseline_path]))).convert('RGBA')
def material_median(im,role):
 a=np.array(im);r,g,b,al=[a[:,:,i].astype(float)for i in range(4)];l=.2126*r+.7152*g+.0722*b
 band=(Y>=84)&(Y<103)&(l>42)if role=='upper'else(Y>=110)&(Y<134)&(l>25)
 mask=(b>r*1.05)&(b>g*.95)&band&(al>200)
 assert mask.any(),(style,role,'No fabric samples')
 return float(np.median(l[mask]))
for key in ['right/4','left/4']:
 entry['frames'][key]['profileBases']={role:round(base*material_median(registered,role)/material_median(baseline,role),3)for role,base in entry.get('profileBases',{}).items()}
fit['paletteMethod']='Per-contact fabric luminance matched to original contact; seven other poses unchanged'
manifest['items'][item]=entry
attach_upper_layers(V,manifest,only={item})
entry['atlasSHA256']=hashlib.sha256((W/entry['atlas']).read_bytes()).hexdigest()
manifest['sources'][str(source.relative_to(W)).replace('\\','/')]=hashlib.sha256(source.read_bytes()).hexdigest()
target=V/'manifest.json';staging=target.with_suffix('.json.tmp');staging.write_text(json.dumps(manifest,indent=2)+'\n');staging.replace(target)
target=V/f'arm-v7/sources/{item}-registration.json';target.write_text(json.dumps(fit,indent=2)+'\n')
# The whole cycle is retained for visual inspection, not just the fixed contact.
board=Image.new('RGBA',(2304,232),(41,35,48,255))
for f in range(8):board.alpha_composite(frames[f'right/{f}'][0].crop((0,200,288,432)),(f*288,0))
target=ROOT/f'review/arms-v7/items/{style}-cycle.png';board.save(target)
print(json.dumps({'top':style,'accepted':fit['accepted'],'handNeckError':fit['maxKeypointError'],'limbCoreIoU':fit['limbCoreIoU'],'groundError':fit['groundError']}))
