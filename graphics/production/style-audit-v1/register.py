"""Register retained redraws; crop, alpha-clean and uniformly scale whole art."""
from pathlib import Path
import sys,json,hashlib
import numpy as np
from PIL import Image,ImageFilter
HERE=Path(__file__).resolve().parent;ART=HERE.parent
sys.path.insert(0,str(ART/'cast/sources'))
# Do not import extract.py: its top-level loop would overwrite registrations.
sys.path.insert(0,str(ART/'walk/sources'))
from prepare import components

def separators(profile,count):
 n=len(profile);out=[0]
 for k in range(1,count):
  center=n*k/count;lo=max(out[-1]+1,round(center-n/count*.47));hi=min(n,round(center+n/count*.47))
  v=profile[lo:hi];idx=np.flatnonzero(v==v.min())+lo;out.append(int(idx[np.argmin(abs(idx-center))]))
 return out+[n]

def subject(cell):
 a=np.array(cell);groups=components(a[:,:,3]>80)
 if not groups:raise ValueError('Empty atlas cell')
 keep=np.zeros(a.shape[:2],np.uint8);xy=groups[0];keep[xy[:,1],xy[:,0]]=255
 keep=np.array(Image.fromarray(keep).filter(ImageFilter.MaxFilter(5)))>0;a[~keep]=0
 ys,xs=np.nonzero(a[:,:,3]>80);box=(int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))
 return Image.fromarray(a).crop(box),list(box)

def body(crop,height):
 a=np.array(crop);_,xx=np.nonzero(a[round(crop.height*.48):round(crop.height*.72),:,3]>80)
 anchor=float(np.median(xx))if len(xx)else crop.width/2
 scale=min(height/crop.height,45/max(1,anchor),46/max(1,crop.width-anchor))
 im=crop.convert('RGBa').resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS).convert('RGBA')
 out=Image.new('RGBA',(96,108));out.alpha_composite(im,(round(48-anchor*scale),107-im.height))
 return out,scale

def main():
 config=json.loads((HERE/'manifest.json').read_text(encoding='utf-8-sig'));cast=json.loads((ART/'cast/sources/asset-manifest.json').read_text())
 people={p['assetId']:p for p in cast['people']};selected=sys.argv[1:];selected=[]if selected==['--cast-only']else selected
 for id,spec in config['people'].items():
  if selected and id not in selected:continue
  person=people[id];source=HERE/spec['source'];im=Image.open(source).convert('RGBA');a=np.array(im);rows=separators((a[:,:,3]>80).sum(1),3)
  target=ART/'cast/registered'/id;actions=HERE/'actions'/id;target.mkdir(exist_ok=True,parents=True);actions.mkdir(exist_ok=True,parents=True)
  height=82 if person.get('kid')else 93 if person['look'].get('short')else 104 if person['look'].get('body')=='tall'else 100
  report={'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'height':height,'cells':[]}
  for row in range(3):
   columns=separators((a[rows[row]:rows[row+1],:,3]>80).sum(0),3)
   for col in range(3):
    bounds=[columns[col],rows[row],columns[col+1],rows[row+1]];crop,box=subject(im.crop(bounds))
    if row==1:
     expression=['neutral','friendly','concerned'][col];s=min(184/crop.width,184/crop.height)
     drawing=crop.convert('RGBa').resize((round(crop.width*s),round(crop.height*s)),Image.Resampling.LANCZOS).convert('RGBA');out=Image.new('RGBA',(192,192));out.alpha_composite(drawing,((192-drawing.width)//2,192-drawing.height));file=target/f'portrait-{expression}.png'
    else:
     direction=['down','right','up'][col];out,s=body(crop,height);file=(target/f'{direction}-idle.png')if row==0 else(actions/f'{direction}.png')
     if direction=='right':
      mirror=(target/'left-idle.png')if row==0 else(actions/'left.png');out.transpose(Image.Transpose.FLIP_LEFT_RIGHT).save(mirror)
    temp=file.with_suffix('.png.tmp');out.save(temp,format='PNG');temp.replace(file)
    report['cells'].append({'row':row,'column':col,'cell':bounds,'subject':box,'scale':s,'output':str(file.relative_to(ART)).replace('\\','/')})
  person['styleRedraw']={'source':str(source.relative_to(ART)).replace('\\','/'),'sha256':report['sourceSHA256'],'height':height,'approvedStyle':'Remy/Priya/Doug/Poppy'}
  cast['sources']['style-audit/'+id]={'sha256':report['sourceSHA256']}
  (HERE/'sources'/f'{id}-registration.json').write_text(json.dumps(report,indent=2)+'\n',newline='\n')
  print(id,'registered at',height,flush=True)
 file=ART/'cast/sources/asset-manifest.json';tmp=file.with_suffix('.json.tmp');tmp.write_text(json.dumps(cast,indent=2)+'\n',newline='\n');tmp.replace(file)
if __name__=='__main__':main()
