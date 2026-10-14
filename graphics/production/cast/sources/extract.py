"""Register complete authored characters from retained generated sheets.

Only technical cropping, alpha cleanup, resampling and anchor registration.
"""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageFilter
from collections import deque

ROOT=Path(__file__).resolve().parents[1]
DIRS=['down','right','up','left']
roster=json.loads((ROOT/'sources/cast-roster.json').read_text())

def resize(im,size):return im.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')
def box(mask):
    y,x=np.nonzero(mask)
    if not len(x):raise ValueError('Empty character cell')
    return (int(x.min()),int(y.min()),int(x.max())+1,int(y.max())+1)
def split_rows(profile,count):
    n=len(profile);rows=[0]
    for k in range(1,count):
        center=n*k/count;lo=round(center-n/count*.4);hi=round(center+n/count*.4)
        v=profile[lo:hi];at=np.flatnonzero(v==v.min())+lo
        rows.append(int(at[np.argmin(abs(at-center))]))
    return rows+[n]
def split_columns(profile):
    on=profile>max(3,profile.max()*.025)
    starts=np.flatnonzero(on&~np.r_[False,on[:-1]]);ends=np.flatnonzero(on&~np.r_[on[1:],False])
    runs=[(int(s),int(e))for s,e in zip(starts,ends)if e-s>12]
    if len(runs)<5:return [round(len(profile)*v) for v in [0,.1733,.3466,.52,.65,.77,.89,1]]
    bodies=runs[-4:];portrait_end=round((runs[-5][1]+bodies[0][0])/2)
    cols=[0]
    for k in [1,2]:
        center=portrait_end*k/3;lo=round(center-portrait_end/3*.12);hi=round(center+portrait_end/3*.12)
        v=profile[lo:hi];at=np.flatnonzero(v==v.min())+lo;cols.append(int(at[np.argmin(abs(at-center))]))
    cols.append(portrait_end)
    cols.extend(round((bodies[k-1][1]+bodies[k][0])/2)for k in range(1,4));cols.append(len(profile))
    return cols

def isolate_body(cell):
    """Remove fragments of neighboring portraits from overlapping crop ROIs."""
    data=np.array(cell);mask=data[:,:,3]>24;seen=np.zeros(mask.shape,bool);best=[]
    height,width=mask.shape
    for yy,xx in zip(*np.nonzero(mask)):
        if seen[yy,xx]:continue
        queue=deque([(int(xx),int(yy))]);seen[yy,xx]=True;points=[]
        while queue:
            x,y=queue.popleft();points.append((x,y))
            for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
                nx,ny=x+dx,y+dy
                if 0<=nx<width and 0<=ny<height and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;queue.append((nx,ny))
        if len(points)>len(best):best=points
    keep=np.zeros(mask.shape,np.uint8)
    for x,y in best:keep[y,x]=255
    keep=np.array(Image.fromarray(keep).filter(ImageFilter.MaxFilter(3)))
    data[keep==0]=0
    return Image.fromarray(data)

manifest={'sources':{},'people':[],'limits':'New roster walks use the illustrated standing drawing with a limb rig; five originally approved identities retain their generated walk sheets.'}
for group in roster['groups']:
    source=ROOT/'assets'/f'{group}.png'
    if not source.exists():raise FileNotFoundError(source)
    record=json.loads((ROOT/'sources'/f'{group}-generation.json').read_text())
    data=np.array(Image.open(source).convert('RGBA'));data[data[:,:,3]<=8]=0;im=Image.fromarray(data);mask=data[:,:,3]>80
    rows=split_rows(mask.sum(axis=1),len(record['people']))
    row_columns=[split_columns(mask[rows[k]:rows[k+1]].sum(axis=0)) for k in range(len(record['people']))]
    manifest['sources'][group]={'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'size':list(im.size),'rows':rows,'columnsByRow':row_columns}
    for row,person in enumerate(record['people']):
        cols=row_columns[row]
        result={**person,'group':group,'views':{},'portraits':{},'extraction':[]}
        for column in range(7):
            padding=round(im.width*.025) if column>=3 else 0
            # Portraits and bodies have slightly different baselines in the
            # generated sheets. Find separators in this column, not across
            # the entire row, to exclude adjacent shoes and portrait hems.
            column_rows=split_rows(mask[:,cols[column]:cols[column+1]].sum(axis=1),len(record['people']))
            cell_bounds=[max(0,cols[column]-padding),column_rows[row],min(im.width,cols[column+1]+padding),column_rows[row+1]]
            cell=im.crop(cell_bounds)
            cell=isolate_body(cell)
            a=np.array(cell);subject=box(a[:,:,3]>80);crop=cell.crop(subject)
            kind='portrait'if column<3 else'body'
            target=ROOT/'registered'/person['assetId'];target.mkdir(parents=True,exist_ok=True)
            if column<3:
                scale=min(184/crop.width,184/crop.height);art=resize(crop,(round(crop.width*scale),round(crop.height*scale)))
                out=Image.new('RGBA',(192,192));out.alpha_composite(art,((192-art.width)//2,192-art.height))
                name=['neutral','friendly','concerned'][column];path=target/f'portrait-{name}.png';result['portraits'][name]=str(path.relative_to(ROOT))
            else:
                yy,xx=np.nonzero(np.array(crop)[round(crop.height*.48):round(crop.height*.72),:,3]>80)
                anchor=float(np.median(xx))if len(xx)else crop.width/2
                height=82 if person.get('kid')else 93 if person['look'].get('short')else 104 if person['look'].get('body')=='tall'else 100
                scale=min(height/crop.height,45/max(1,anchor),46/max(1,crop.width-anchor))
                art=resize(crop,(round(crop.width*scale),round(crop.height*scale)));out=Image.new('RGBA',(96,108))
                x=round(48-anchor*scale);y=107-art.height
                if x<1 or x+art.width>95 or y<1:raise ValueError(f'Character crop exceeds registered canvas: {person["assetId"]} {column}')
                out.alpha_composite(art,(x,y));name=DIRS[column-3];path=target/f'{name}-idle.png';result['views'][name]=str(path.relative_to(ROOT))
            out.save(path);result['extraction'].append({'kind':kind,'name':name,'cell':cell_bounds,'subject':list(subject),'scale':scale})
        manifest['people'].append(result)
    print(group,len(record['people']),'complete illustrated identities registered')
(ROOT/'sources/asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(len(manifest['people']),'authored appearances registered, with four views and three portraits each.')
