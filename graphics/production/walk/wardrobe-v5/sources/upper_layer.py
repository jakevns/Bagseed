"""Keep painted shirt/arm pixels together; never synthesize or move limb pixels."""
from register_samples import *

def attach_upper_layers(folder,manifest):
 report={}
 for item,entry in manifest['items'].items():
  if entry['kind']!='top' or entry['style'] in ['crop','tank']:continue
  source=Image.open(W/entry['atlas']).convert('RGBA')
  for frame in entry['frames'].values():frame['parts'].pop('wholeUpper',None)
  baseheight=max(p['rect'][1]+p['rect'][3]for f in entry['frames'].values()for p in f['parts'].values())+2
  parts=[];checks=[]
  for di in ['right','left']:
   for f in range(8):
    key=f'{di}/{f}';frame=manifest['rig']['frames'][key];registered=folder/'registered'/item/f'right-{f}.png'
    if item=='top-hoodie':im=Image.open(W/f'stride-v4/{di}-{f}.png').convert('RGBA')
    else:
     im=Image.open(registered).convert('RGBA')
     if di=='left':im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    a=np.array(im);keep=np.zeros((432,288),bool)
    names=['farArm','torso','nearArm']+(['farLeg','nearLeg']if entry.get('longHem')else[])
    for name in names:
     part=entry['frames'][key]['parts'].get(name)
     if not part:continue
     x,y,w,h=part['rect'];dx,dy=part['destination'];keep[dy:dy+h,dx:dx+w]|=np.array(source.crop((x,y,x+w,y+h)))[:,:,3]>0
    # The old wrist cutoff reclassified sleeve cuffs and palms as trousers.
    # Retain original skin/ink and sleeve pixels along both actual arm paths.
    r,g,b,alpha=[a[:,:,i].astype(float)for i in range(4)];light=.2126*r+.7152*g+.0722*b
    skin=(warm(a)&(Y>88)&(Y<118));skin_edge=np.array(Image.fromarray((skin*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)))>0
    _,arms,_=labels(frame);p=frame['keypoints'];armzone=(np.minimum(arms['L'],arms['R'])<7)&(Y>85)&(Y<max(p['handL'][1],p['handR'][1])+5)
    cloth=(b>r*1.05)&(b>g*.95)&(light>82)&armzone
    cloth_edge=np.array(Image.fromarray((cloth*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)))>0
    before=int((skin&~keep).sum());keep|=skin_edge|(cloth_edge&armzone);keep&=alpha>0
    layer=np.zeros_like(a);layer[keep]=a[keep];yy,xx=np.nonzero(keep);box=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
    parts.append((key,box[:2],Image.fromarray(layer).crop(box)));checks.append({'frame':key,'restoredSkinPixels':before,'missingSkinPixels':int((skin&~keep).sum()),'sourcePixelsUnchanged':True})
  width=source.width;x=0;y=baseheight;rowh=0;placed=[]
  for key,dest,im in parts:
   if x+im.width+2>width:x=0;y+=rowh+2;rowh=0
   placed.append((key,dest,im,x,y));x+=im.width+2;rowh=max(rowh,im.height)
  atlas=Image.new('RGBA',(width,y+rowh+2));atlas.alpha_composite(source.crop((0,0,width,baseheight)))
  for key,dest,im,x,y in placed:
   atlas.alpha_composite(im,(x,y));entry['frames'][key]['parts']['wholeUpper']={'rect':[x,y,im.width,im.height],'destination':dest}
  target=W/entry['atlas'];staging=target.with_suffix('.png.tmp');atlas.save(staging,format='PNG');staging.replace(target);entry['upperComposite']='intact-painted-upper-v6';report[item]=checks
 (folder/'sources/upper-layer-audit.json').write_text(json.dumps(report,indent=2)+'\n')
