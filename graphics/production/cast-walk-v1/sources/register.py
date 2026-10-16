"""Register high-resolution authored cast walks without repainting or warping."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageFilter,ImageDraw
ROOT=Path(__file__).resolve().parents[4];W=ROOT/'graphics/production/cast-walk-v1';OLD=ROOT/'review/characters-v2';REVIEW=ROOT/'review/cast-walk-v1'
DIRS=['down','right','up','left'];HEIGHTS={'remy':300,'priya':300,'doug':288}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def separators(profile,n):
 out=[0];size=len(profile)
 for k in range(1,n):
  c=size*k/n;lo=round(c-size*.065);hi=round(c+size*.065);v=profile[lo:hi];xs=np.flatnonzero(v==v.min())+lo;out.append(int(xs[np.argmin(abs(xs-c))]))
 return out+[size]
def subject(raw):
 a=np.array(raw.convert('RGBA'));mask=a[:,:,3]>80;ys,xs=np.nonzero(mask)
 if not len(xs):raise ValueError('Empty sprite cell')
 box=[max(0,int(xs.min())-2),max(0,int(ys.min())-2),min(raw.width,int(xs.max())+3),min(raw.height,int(ys.max())+3)];im=raw.crop(box).convert('RGBA');a=np.array(im);a[a[:,:,3]<=8]=0;im=Image.fromarray(a)
 # Torso center, not bounds center: props and forward-reaching feet must not
 # pull Doug's anatomical anchor sideways from one frame to the next.
 alpha=a[:,:,3]>100;yy,xx=np.nonzero(alpha[int(im.height*.52):int(im.height*.69)]);anchor=float(np.median(xx)) if len(xx)else im.width/2
 return im,anchor,box
def place(im,anchor,scale):
 # One premultiplied-alpha resample, uniform in x/y. No 96-pixel intermediate.
 s=(round(im.width*scale),round(im.height*scale));art=im.convert('RGBa').resize(s,Image.Resampling.LANCZOS).convert('RGBA');out=Image.new('RGBA',(288,324));x=round(144-anchor*scale);bottom=int(np.nonzero(np.array(art)[:,:,3]>100)[0].max())+1;y=321-bottom
 if x<1 or x+art.width>287 or y<1:raise ValueError(f'Out of bounds: {x},{y},{s}')
 out.alpha_composite(art,(x,y));return out,[x,y],s
def main():
 old=json.loads((OLD/'sources/asset-manifest.json').read_text());master=Image.open(OLD/'assets/master-cast.png').convert('RGBA');m=old['masterGrid'];manifest={'version':'cast-walk-eight-v1','standard':'eight-frame-full-stride-v1','frameCount':8,'density':3,'canvas':[288,324],'logicalCanvas':[96,108],'groundBaseline':107,'frameDurationMs':125,'sources':{},'people':{},'notes':'Eight authored frames per direction. Original identity/outfits retained. Matching high-resolution standing views; portraits and actions unchanged.'}
 for ident in ['remy','priya','doug']:
  dest=W/'registered'/ident;dest.mkdir(parents=True,exist_ok=True);info={'frameCount':8,'walk':{},'idle':{},'extraction':[]};pending={}
  for di in DIRS:
   if di=='left'and ident!='doug':continue
   versions=[W/f'assets/{ident}-{di}-v{v}.png'for v in [3,2,1]];file=next((p for p in versions if p.exists()),versions[-1])
   if not file.exists():raise FileNotFoundError(file)
   manifest['sources'][str(file.relative_to(W))]=sha(file);sheet=Image.open(file).convert('RGBA');a=np.array(sheet)[:,:,3]>80;rs=separators(a.sum(1),2);cs=separators(a.sum(0),4);pending[di]=[]
   for f in range(8):
    row,col=divmod(f,4);cell=[cs[col],rs[row],cs[col+1],rs[row+1]];selected=file;raw=sheet.crop(cell)
    correction=W/'assets/doug-left-frame4-v1.png'
    if ident=='doug'and di=='left'and f==4 and correction.exists():
     selected=correction;raw=Image.open(correction).convert('RGBA');cell=[0,0,raw.width,raw.height];manifest['sources'][str(correction.relative_to(W))]=sha(correction)
    im,anchor,bounds=subject(raw);pending[di].append((im,anchor,cell,bounds,selected))
  for di,frames in pending.items():
   info['walk'][di]=[]
   for f,(im,anchor,cell,bounds,file)in enumerate(frames):
    # Generated rows can differ in drawing scale. Normalize uniformly per
    # source figure, preserving the requested small gait bob, rather than
    # letting the character shrink halfway through its stride.
    height=HEIGHTS[ident]+[0,-3,0,3,0,-3,0,3][f];scale=min(height/im.height,141/max(1,anchor),141/max(1,im.width-anchor),315/im.height)
    out,pos,size=place(im,anchor,scale);target=dest/f'{di}-{f}.png';out.save(target);info['walk'][di].append(str(target.relative_to(W)));info['extraction'].append({'direction':di,'frame':f,'source':str(file.relative_to(W)),'sourceCell':cell,'subjectBounds':bounds,'uniformScale':scale,'destination':pos,'size':size,'resamplingPasses':1,'sha256':sha(target)})
  if ident!='doug':
   info['walk']['left']=[]
   for f in range(8):
    p=dest/f'left-{f}.png';Image.open(dest/f'right-{f}.png').transpose(Image.Transpose.FLIP_LEFT_RIGHT).save(p);info['walk']['left'].append(str(p.relative_to(W)))
   info['leftView']='Mirrored right: symmetric clothes/glasses; Priya ponytail stays behind head; no asymmetric hand-held props.'
  else:info['leftView']='Independently drawn left profile preserves watering-can hand.'
  standing=W/f'assets/{ident}-standing-v1.png';manifest['sources'][str(standing.relative_to(W))]=sha(standing);idle=Image.open(standing).convert('RGBA');alpha=np.array(idle)[:,:,3]>80;ir=separators(alpha.sum(1),2);ic=separators(alpha.sum(0),2)
  for j,di in enumerate(DIRS):
   row,col=divmod(j,2);cell=[ic[col],ir[row],ic[col+1],ir[row+1]];im,anchor,bounds=subject(idle.crop(cell));scale=min(HEIGHTS[ident]/im.height,141/max(1,anchor),141/max(1,im.width-anchor),315/im.height);out,pos,size=place(im,anchor,scale);target=dest/f'{di}-idle.png';out.save(target);info['idle'][di]=str(target.relative_to(W))
  for di in DIRS:
   hashes=[sha(W/p)for p in info['walk'][di]]
   if len(set(hashes))!=8:raise ValueError(f'Duplicate frames: {ident}/{di}')
  info['registeredSHA256']={str(p.relative_to(W)):sha(p)for p in dest.glob('*.png')};manifest['people'][ident]=info
 manifest['sources']['original-master']=sha(OLD/'assets/master-cast.png');(W/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print('Registered 96 authored walk frames + 12 high-resolution standing views; no low-resolution intermediate.')
if __name__=='__main__':main()
