"""Register generated bald anatomy and independent transparent accessories.

This script only crops, registers and normalizes material channels. Hair is
never extracted from a painted face, and the bald base never contains hair.
"""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'sources'))
from retained_png import save_png
import hashlib
import json
import numpy as np
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parent
DIRS=['down','right','up','left']
SPECS=json.loads((ROOT/'sources/prompts.json').read_text(encoding='utf-8-sig'))['specs']
OUT=ROOT/'registered'
RESAMPLE=Image.Resampling.LANCZOS
PAD=64
HEIGHT=320
report={'version':'bald-and-hair-10','assets':{},'features':{},'anatomy':{},'hair':{},'sources':{}}
# Optional haircut IDs make local registration corrections reproducible without
# reprocessing unrelated atlases. The default still rebuilds the complete pack.
ONLY=set(sys.argv[1:])
if ONLY:
    assert ONLY<={s[0] for s in SPECS},('Unknown hairstyle',ONLY)
    report=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8-sig'))
    report['version']='bald-and-hair-10'

def bbox(mask):
    yy,xx=np.nonzero(mask)
    if len(xx)==0:raise ValueError('Empty source cell')
    return [int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1]

def source(name):
    p=ROOT/'sources'/name
    im=Image.open(p).convert('RGBA')
    assert im.getchannel('A').getextrema()[0]==0,(name,'background is not transparent')
    report['sources'][name]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':list(im.size)}
    return im

def split(profile,n):
    on=profile>3
    starts=np.flatnonzero(on&~np.r_[False,on[:-1]])
    ends=np.flatnonzero(on&~np.r_[on[1:],False])
    runs=[]
    for start,end in zip(starts,ends):
        if runs and start-runs[-1][1]<12:runs[-1][1]=int(end)
        elif end-start>12:runs.append([int(start),int(end)])
    if len(runs)==n:return [0]+[round((runs[i-1][1]+runs[i][0])/2) for i in range(1,n)]+[len(profile)]
    size=len(profile);edges=[0]
    for i in range(1,n):
        center=size*i/n;radius=size/n*.28
        lo,hi=max(edges[-1]+1,round(center-radius)),min(size,round(center+radius))
        sample=profile[lo:hi];candidates=np.flatnonzero(sample==sample.min())+lo
        edges.append(int(candidates[np.argmin(abs(candidates-center))]))
    return edges+[size]

def save(im,key):
    file=OUT/(key+'.png');file.parent.mkdir(parents=True,exist_ok=True)
    # Browsers and Windows image previews may hold the previous PNG mapped.
    # Replace complete files atomically instead of truncating a mapped image.
    save_png(im,file)
    report['assets'][key]=file.relative_to(ROOT).as_posix()

def resize(im,size):
    return im.convert('RGBa').resize(size,RESAMPLE).convert('RGBA')

def assert_cell_margin(cell,label):
    alpha=np.asarray(cell)[:,:,3]
    border=np.r_[alpha[:2,:].ravel(),alpha[-2:,:].ravel(),alpha[:,:2].ravel(),alpha[:,-2:].ravel()]
    assert not (border>100).any(),('source silhouette touches cell boundary',label)

def components(mask):
    parent=[];spans=[];previous=[]
    def find(n):
        while parent[n]!=n:parent[n]=parent[parent[n]];n=parent[n]
        return n
    for y,row in enumerate(mask):
        delta=np.diff(np.r_[False,row,False].astype(np.int8));current=[];j=0
        for left,right in zip(np.flatnonzero(delta==1),np.flatnonzero(delta==-1)):
            n=len(parent);parent.append(n);spans.append((y,int(left),int(right),n));current.append((int(left),int(right),n))
            while j<len(previous) and previous[j][1]<=left:j+=1
            k=j
            while k<len(previous) and previous[k][0]<right:
                p,q=find(previous[k][2]),find(n)
                if p!=q:parent[q]=p
                k+=1
        previous=current
    groups={}
    for y,left,right,n in spans:groups.setdefault(find(n),[]).append((y,left,right))
    labels=np.zeros(mask.shape,np.int32);records=[]
    for label,values in enumerate(groups.values(),1):
        size=0
        for y,left,right in values:labels[y,left:right]=label;size+=right-left
        records.append({'label':label,'size':size,'bounds':[min(v[1] for v in values),values[0][0],max(v[2] for v in values),values[-1][0]+1]})
    return labels,records

def isolate_cells(a,rows):
    """Partition whole silhouettes, including strands crossing grid gutters."""
    alpha=a[:,:,3]>70;labels,records=components(alpha)
    cores,core_records=components(np.asarray(Image.fromarray((alpha*255).astype('uint8')).filter(ImageFilter.MinFilter(9)))>0)
    boxes=[]
    for row in range(len(rows)-1):
        columns=split(alpha[rows[row]:rows[row+1]].sum(axis=0),4)
        for col in range(4):boxes.append([columns[col],rows[row],columns[col+1],rows[row+1]])
    markers=np.zeros(alpha.shape,np.int32)
    for core in core_records:
        if core['size']<40:continue
        mask=cores==core['label'];areas=[int(mask[t:b,l:r].sum()) for l,t,r,b in boxes]
        markers[mask]=int(np.argmax(areas))+1
    result=np.zeros(alpha.shape,np.int32)
    for item in records:
        if item['size']<20:continue
        l,t,r,b=item['bounds'];mask=labels[t:b,l:r]==item['label'];values=markers[t:b,l:r].copy();values[~mask]=0
        ids=np.unique(values[values>0])
        if not len(ids):
            areas=[int((labels[tt:bb,ll:rr]==item['label']).sum()) for ll,tt,rr,bb in boxes];values[mask]=int(np.argmax(areas))+1
        elif len(ids)==1:values[mask]=ids[0]
        else:
            while True:
                empty=mask&(values==0)
                if not empty.any():break
                expanded=values.copy()
                for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                    shifted=np.roll(values,(dy,dx),axis=(0,1))
                    if dy==-1:shifted[-1]=0
                    if dy==1:shifted[0]=0
                    if dx==-1:shifted[:,-1]=0
                    if dx==1:shifted[:,0]=0
                    use=empty&(shifted>0)&(expanded==0);expanded[use]=shifted[use]
                assert not np.array_equal(values,expanded),'unreachable hair strand'
                values=expanded
        target=result[t:b,l:r];target[mask]=values[mask]
    cells=[]
    for identity in range(1,len(boxes)+1):
        mask=result==identity;assert mask.any(),('missing isolated source cell',identity,boxes[identity-1]);b=bbox(mask);l,t,r,bottom=b;box=[max(0,l-3),max(0,t-3),min(a.shape[1],r+3),min(a.shape[0],bottom+3)]
        grow=np.asarray(Image.fromarray((mask*255).astype('uint8')).filter(ImageFilter.MaxFilter(3)))>0
        aa=a[box[1]:box[3],box[0]:box[2]].copy();aa[~grow[box[1]:box[3],box[0]:box[2]],3]=0
        border=np.r_[aa[0,:,3],aa[-1,:,3],aa[:,0,3],aa[:,-1,3]]
        assert not (border>100).any(),('source silhouette is cropped',identity,box)
        cells.append((Image.fromarray(aa),box))
    return cells

base=source('bald-base.png');a=np.asarray(base);cols=split((a[:,:,3]>100).sum(axis=0),4)
front=base.crop((cols[0],0,cols[1],base.height));fb=bbox(np.asarray(front)[:,:,3]>100)
scale=98/(fb[3]-fb[1])
bases={};features={}
for i,direction in enumerate(DIRS):
    cell=base.crop((cols[i],0,cols[i+1],base.height));a=np.array(cell);b=bbox(a[:,:,3]>100)
    # The bottom 8 source pixels are the bare neck stub in every view.
    yy,xx=np.nonzero((a[:,:,3]>100)&(np.indices(a.shape[:2])[0]>=b[3]-8))
    nx=float(np.median(xx));ny=b[3]
    art=resize(cell,(round(cell.width*scale),round(cell.height*scale)))
    im=Image.new('RGBA',(192,HEIGHT));place=[round(96-nx*scale),round(135+PAD-ny*scale)];im.alpha_composite(art,place)
    save(im,'base/'+direction);bases[direction]=im
    a=np.asarray(im);r,g,blue=a[:,:,:3].astype(float).transpose(2,0,1);yy,xx=np.indices(r.shape)
    white=(a[:,:,3]>160)&(r>210)&(g>185)&(blue>155)&(r-g<40)&(yy>65+PAD)&(yy<112+PAD)
    f={}
    if direction=='down':
        f['eyes']=[]
        for region in [xx<96,xx>=96]:
            ey,ex=np.nonzero(white&region);assert len(ex)>4,(direction,'missing eye');f['eyes'].append([float(ex.mean()),float(ey.mean())])
        eye_y=float(np.mean([p[1] for p in f['eyes']]))
        dark=(a[:,:,3]>150)&(r<175)&(g<110)&(blue<75)&(xx>80)&(xx<112)&(yy>eye_y+15)&(yy<122+PAD)
        counts=dark.sum(axis=1);candidates=np.flatnonzero(counts>=5)
        mouth_y=float(candidates[0]+2) if len(candidates) else eye_y+22
        f.update(mouth=[96,mouth_y],ear=[53,eye_y+9])
    elif direction!='up':
        ey,ex=np.nonzero(white);assert len(ex)>4,(direction,'missing eye');f['eyes']=[[float(ex.mean()),float(ey.mean())]]
        # Side ear centers follow the stable anatomy, not the hairstyle notch.
        f.update(mouth=[f['eyes'][0][0]+(7 if direction=='right' else -7),f['eyes'][0][1]+23],ear=[87 if direction=='right' else 105,f['eyes'][0][1]+8])
    report['anatomy'][direction]={'sourceBox':[cols[i],0,cols[i+1],base.height],'placement':place,'scale':scale,'neck':[96,135+PAD]}
    features[direction]=f
    report['features']['base/'+direction]=f

# Authored scalp/ear landmarks replace silhouette scoring. Hair volume cannot
# push roots sideways or make the cut sit lower to avoid touching an ear.
FITTING=json.loads((ROOT/'hair-fit.json').read_text(encoding='utf-8-sig'))
assert set(FITTING['styles'])=={s[0] for s in SPECS}
report['fitting']={'version':FITTING['version'],'sha256':hashlib.sha256((ROOT/'hair-fit.json').read_text(encoding='utf-8-sig').encode()).hexdigest()}

def fit_hair(cell,direction,style):
    raw=np.asarray(cell);box=bbox(raw[:,:,3]>50);crop=cell.crop(box)
    # Neutral RGB and premultiplied resampling retain natural translucent tips.
    a=np.array(crop);light=np.round(a[:,:,:3]@np.array([.2126,.7152,.0722])).astype('uint8');a[:,:,:3]=light[:,:,None];a[a[:,:,3]<10]=0;crop=Image.fromarray(a)
    spec=FITTING['styles'][style][direction];w,h=spec['size']
    rx,ry=spec['sourceRoot'];tx,ty=spec['targetRoot']
    x,y=round(tx-rx*w),round(ty-ry*h)
    assert min(x,y)>=3 and x+w<=189 and y+h<=315,('Hair fit exceeds canvas',style,direction,[x,y,w,h])
    art=resize(crop,(w,h));out=Image.new('RGBA',(192,HEIGHT));out.alpha_composite(art,(x,y))
    return out,{'sourceBounds':box,'placement':[x,y],'size':[w,h],'sourceRoot':spec['sourceRoot'],'targetRoot':spec['targetRoot'],'root':spec['root'],'material':'neutral-grayscale-alpha','fit':FITTING['version']}

for group in range(15):
    if ONLY and not ONLY.intersection(s[0] for s in SPECS[group*4:group*4+4]):continue
    name=f'hair-{group+1:02}.png'
    if not (ROOT/'sources'/name).exists():continue
    print('Registering',name,flush=True)
    atlas=source(name);a=np.asarray(atlas);rows=split((a[:,:,3]>100).sum(axis=1),4);cells=isolate_cells(a,rows)
    for row in range(4):
        style=SPECS[group*4+row][0]
        if ONLY and style not in ONLY:continue
        report['hair'][style]={}
        for col,direction in enumerate(DIRS):
            cell,box=cells[row*4+col];art,registration=fit_hair(cell,direction,style);key=f'wig/{style}/{direction}'
            save(art,key);registration['sourceBox']=box;registration['source']=name
            report['hair'][style][direction]=registration
            registration['sourceCropBoundaryPixels']=0
            report['features'][f'hair/{style}/{direction}']=features[direction]

if (ROOT/'sources/rounded-volume.png').exists() and (not ONLY or ONLY.intersection(['afro','bigafro','puffs'])):
    atlas=source('rounded-volume.png');a=np.asarray(atlas);rows=split((a[:,:,3]>100).sum(axis=1),3);cells=isolate_cells(a,rows)
    for row,style in enumerate(['afro','bigafro','puffs']):
        if ONLY and style not in ONLY:continue
        for col,direction in enumerate(DIRS):
            cell,box=cells[row*4+col];art,registration=fit_hair(cell,direction,style);save(art,f'wig/{style}/{direction}')
            registration.update(source='rounded-volume.png',sourceBox=box,sourceCropBoundaryPixels=0);report['hair'][style][direction]=registration

for direction in DIRS:
    save(Image.new('RGBA',(192,HEIGHT)),'wig/bald/'+direction)
    report['features']['hair/bald/'+direction]=features[direction]

if (ROOT/'sources/short-twists.png').exists() and (not ONLY or 'twistsS' in ONLY):
    atlas=source('short-twists.png');a=np.asarray(atlas);columns=split((a[:,:,3]>100).sum(axis=0),4)
    for col,direction in enumerate(DIRS):
        box=[columns[col],0,columns[col+1],atlas.height];cell=atlas.crop(box);assert_cell_margin(cell,('short-twists',direction));art,registration=fit_hair(cell,direction,'twistsS')
        save(art,f'wig/twistsS/{direction}');registration.update(source='short-twists.png',sourceBox=box,sourceCropBoundaryPixels=0)
        report['hair']['twistsS'][direction]=registration

if (ROOT/'sources/short-thinning.png').exists() and (not ONLY or 'balding' in ONLY):
    atlas=source('short-thinning.png');a=np.asarray(atlas)
    # Sparse temple/nape hair intentionally leaves the crown bare. Register
    # those anatomical locations directly instead of maximizing scalp cover.
    for col,direction in enumerate(DIRS):
        box=[round(atlas.width*col/4),0,round(atlas.width*(col+1)/4),atlas.height]
        cell=atlas.crop(box);assert_cell_margin(cell,('short-thinning',direction));out,registration=fit_hair(cell,direction,'balding')
        save(out,f'wig/balding/{direction}');registration.update(source='short-thinning.png',sourceBox=box,sourceCropBoundaryPixels=0)
        report['hair']['balding'][direction]=registration

# Hat paintings show the outside as worn on a level head, not hollow objects.
hat_settings={
    'cap':(110,1.17,95),'beanie':(108,1.02,95),'bucket':(124,1.04,90),'straw':(146,1.04,60),
    'sunhat':(164,1.02,75),'officer':(122,1.1,65),'wizard':(148,1.03,128),'beret':(114,1.05,65)}
if not ONLY:report['hats']={}
for group,names in [(1,['cap','beanie','bucket','straw']),(2,['sunhat','officer','wizard','beret'])]:
    if ONLY:continue
    filename=f'hats-{group:02}.png'
    if not (ROOT/'sources'/filename).exists():continue
    atlas=source(filename);a=np.asarray(atlas);rows=split((a[:,:,3]>100).sum(axis=1),4);cells=isolate_cells(a,rows)
    for row,name in enumerate(names):
        for col,direction in enumerate(DIRS):
            cell,box=cells[row*4+col];b=bbox(np.asarray(cell)[:,:,3]>50);crop=cell.crop(b)
            width,side_ratio,max_height=hat_settings[name];side=direction in ['right','left'];w=round(width*(side_ratio if side else 1))
            eye_y=float(np.mean([e[1] for e in features['down' if direction=='up' else direction]['eyes']]))
            clearance={'cap':10,'beanie':7,'bucket':9,'straw':10,'sunhat':10,'officer':10,'wizard':10,'beret':8}[name]
            bottom=round(eye_y-clearance);h=min(max_height,bottom-8,round(crop.height*w/crop.width))
            anchor=.42 if name in ['cap','officer'] and direction=='right' else .58 if name in ['cap','officer'] and direction=='left' else .5
            x=max(4,min(188-w,round(96-w*anchor)));y=bottom-h
            out=Image.new('RGBA',(192,HEIGHT));out.alpha_composite(resize(crop,(w,h)),(x,y));key=f'headwear/{name}/{direction}';save(out,key)
            report['hats'][key]={'source':filename,'sourceBox':box,'bounds':b,'position':[x,y],'size':[w,h],'brimY':bottom}

temporary=ROOT/'manifest.json.tmp';temporary.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n');temporary.replace(ROOT/'manifest.json')
print(f'{len(report["hair"])} independent hairstyles registered; bald anatomy saved in four directions')
