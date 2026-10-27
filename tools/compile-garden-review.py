from pathlib import Path
import json,sys,hashlib
from PIL import Image
import numpy as np
from scipy import ndimage
key,source=sys.argv[1:3];review=next((a.split('=',1)[1] for a in sys.argv[3:] if a.startswith('--review-root=')),'review/garden-batch-01');r=Path(review)/'kits'/key
(r/'assets').mkdir(parents=True,exist_ok=True);(r/'sources').mkdir(exist_ok=True)
src=Path(source);(r/'assets/stages.png').write_bytes(src.read_bytes());im=Image.open(src).convert('RGBA');a=np.array(im)[:,:,3];lab,n=ndimage.label(a>100);regions=[b for b in ndimage.find_objects(lab) if b and (b[0].stop-b[0].start)*(b[1].stop-b[1].start)>2000];assert len(regions)==4,(key,len(regions))
regions=sorted(regions,key=lambda b:(b[0].start+b[0].stop)/2);regions=sorted(regions[:2],key=lambda b:b[1].start)+sorted(regions[2:],key=lambda b:b[1].start)
anchor_file=r/'sources/attachment-points.json';overrides=json.loads(anchor_file.read_text()) if anchor_file.exists() else {}
crop_file=r/'sources/crop-bounds.json';crop_overrides=json.loads(crop_file.read_text()) if crop_file.exists() else {}
parts=[]
for stage,b in enumerate(regions):
 y0=max(0,b[0].start-2);y1=min(im.height,b[0].stop+2);x0=max(0,b[1].start-2);x1=min(im.width,b[1].stop+2)
 if str(stage) in crop_overrides:
  x0,y0,w,h=crop_overrides[str(stage)];x1,y1=x0+w,y0+h
  assert 0<=x0<x1<=im.width and 0<=y0<y1<=im.height
  assert x0<=b[1].start and x1>=b[1].stop and y0<=b[0].start and y1>=b[0].stop,'Crop clips opaque plant tissue'
 edge=a[max(y0,y1-12):y1,x0:x1];xs=np.where(edge>160)[1];ax=float(np.median(xs)) if len(xs) else (x1-x0)/2;ay=y1-y0-3
 # Pick an actual opaque basal pixel, not a transparent edge/averaged gap.
 core=np.argwhere(a[max(y0,y1-20):y1,x0:x1]>160);core=core[abs(core[:,1]-ax)<(x1-x0)*.12];assert len(core), 'Inspect missing central basal stem' 
 row=int(core[:,0].max());xs=core[core[:,0]==row,1];ax=float(xs[np.argmin(abs(xs-ax))]);ay=float(max(y0,y1-20)-y0+row)
 if str(stage) in overrides:
  sx,sy=overrides[str(stage)];ax,ay=float(sx-x0),float(sy-y0)
 assert 0 <= ax < x1-x0 and 0 <= ay < y1-y0
 assert .3 < ax/(x1-x0) < .7, 'Inspect off-center basal stem before accepting'
 assert a[y0+round(ay),x0+round(ax)]>160
 parts.append({'crop':[x0,y0,x1-x0,y1-y0],'attach':[ax,ay]})
for i,p in enumerate(parts):
 for q in parts[i+1:]:
  x,y,w,h=p['crop'];X,Y,W,H=q['crop'];assert x+w<=X or X+W<=x or y+h<=Y or Y+H<=y,'overlapping stage crops'
im.save(r/'assets/stages.webp','WEBP',lossless=True,exact=True);assert np.array_equal(np.array(im),np.array(Image.open(r/'assets/stages.webp').convert('RGBA')))
ids={'geranium':('P102', 'Geranium'),'portulaca':('P109', 'Portulaca'),'dianthus':('P114', 'Dianthus'),'chrysanthemum':('P116', 'Chrysanthemum'),'sedumstonecrop':('P123', 'Sedum stonecrop'),'hosta':('P135', 'Hosta'),'heuchera':('P136', 'Heuchera'),'coleus':('P137', 'Coleus'),'ornamentalkale':('P138', 'Ornamental kale'),'dustymiller':('P139', 'Dusty miller'),'grapehyacinth':('P087', 'Grape hyacinth'),'snowdrop':('P088', 'Snowdrop'),'primrose':('P090', 'Primrose'),'pansy':('P091', 'Pansy'),'viola':('P092', 'Viola'),'ranunculus':('P093', 'Ranunculus'),'anemone':('P094', 'Anemone'),'petunia':('P099', 'Petunia'),'impatiens':('P100', 'Impatiens'),'begonia':('P101', 'Begonia'),'lemongrass':('P068','Lemongrass'),'tulip':('P083','Tulip'),'daffodil':('P084','Daffodil'),'crocus':('P085','Crocus'),'hyacinth':('P086','Hyacinth'),'tarragon':('P063','Tarragon'),'marjoram':('P064','Marjoram'),'summersavory':('P065','Summer savory'),'chervil':('P066','Chervil'),'lemonverbena':('P067','Lemon verbena'),'broccoli':('P021','Broccoli'),'cauliflower':('P022','Cauliflower'),'cabbage':('P023','Cabbage'),'kohlrabi':('P025','Kohlrabi'),'celery':('P027','Celery'),'tomato':('P031','Tomato'),'bellpepper':('P032','Bell pepper'),'carrot':('P011','Carrot'),'beet':('P012','Beet'),'radish':('P013','Radish'),'kale':('P005','Kale'),'mustardgreens':('P007','Mustard greens'),'mizuna':('P008','Mizuna'),'tatsoi':('P009','Tatsoi'),'collardgreens':('P006','Collard greens'),'parsley':('P054','Parsley'),'sage':('P059','Sage'),'oregano':('P060','Oregano'),'strawberry':('P071','Strawberry'),'jalapeno':('P033','Jalapeno'),'spinach':('P002','Spinach'),'swisschard':('P004','Swiss chard'),'arugula':('P003','Arugula'),'rosemary':('P057','Rosemary'),'lemonbalm':('P062','Lemon balm'),'lettuce':('P001','Lettuce'),'bokchoy':('P010','Bok choy'),'basil':('P051','Basil'),'mint':('P061','Mint'),'marigold':('P098','Marigold'),'chamomile':('P070','Chamomile'),'lavender':('P126','Lavender'),'calendula':('P151','Calendula'),'alyssum':('P108','Sweet alyssum'),'nasturtium':('P105','Nasturtium'),'thyme':('P058','Thyme'),'chives':('P056','Chives'),'dill':('P055','Dill'),'cilantro':('P053','Cilantro'),'thaibasil':('P052','Thai basil')};id,name=ids[key];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();m={'id':id,'key':key,'name':name,'status':'sample-awaiting-approval','revision':key+'-garden-1','generatedSource':src.name,'sourceSHA256':sha(r/'assets/stages.png'),'runtimeSHA256':sha(r/'assets/stages.webp'),'runtime':'/garden-review/'+key+'.webp','stages':parts};(r/'sources/manifest.json').write_text(json.dumps(m,indent=2)+'\n');print(key,'4 isolated growth stages verified')
