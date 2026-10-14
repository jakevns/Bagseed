"""Register generated modular art; preserve sources and document every crop.

This performs technical extraction, alpha cleanup and scale registration only.
It does not synthesize or paint character artwork.
"""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
DIRS = ['down', 'right', 'up', 'left']
audit = json.loads((REPO/'docs/graphics/roster-audit.json').read_text())
hair = [p[0] for p in audit['options']['hair']]
tops = ['tee','tank','hoodie','flannel','sweater','cardigan','overalls','work','crop','jacket','garden','pjs','labcoat','suit','officer']
faces = [p[0] for p in audit['options']['face']]
facial = ['stubble','mustache','shortbeard','beard','goatee','soul','chinstrap','handlebar','pencil','mutton','circle','anchor','scruff','vandyke']
sets = {**{f'hair-{c}': ('hair', hair[i*10:i*10+10]) for i,c in enumerate('abcdef')},
        **{f'tops-{c}': ('top', tops[i*5:i*5+5]) for i,c in enumerate('abc')},
        **{f'nose-{c}': ('nose', tops[i*5:i*5+5]) for i,c in enumerate('abc')},
        'bottoms': ('bottom', ['jeans','joggers','cargo','shorts','skirt']),
        'hats': ('hat',['beanie','cap','bucket','straw','sunhat']),
        'special-hats': ('hat',['officer','wizard']),
        'beret': ('hat',['beret']),
        'faces': ('face',faces), 'facial': ('facial',facial),
        'shoes': ('shoe',['sneakers','boots','sandals','rainboots'])}

def separators(profile, count):
    n=len(profile); result=[0]
    on=profile>max(3,profile.max()*.02)
    starts=np.flatnonzero(on&~np.r_[False,on[:-1]])
    ends=np.flatnonzero(on&~np.r_[on[1:],False])
    runs=[(int(s),int(e)) for s,e in zip(starts,ends) if e-s>8]
    if len(runs)==count:
        return [0]+[round((runs[k-1][1]+runs[k][0])/2) for k in range(1,count)]+[n]
    occupied=np.flatnonzero(profile>max(3,profile.max()*.01))
    first,last=int(occupied.min()),int(occupied.max())+1
    for k in range(1,count):
        center=first+(last-first)*k/count; radius=(last-first)/count*.2
        lo=max(result[-1]+1,round(center-radius));hi=min(n,round(center+radius))
        sample=profile[lo:hi]; at=np.flatnonzero(sample==sample.min())+lo
        result.append(int(at[np.argmin(abs(at-center))]))
    return result+[n]

def resize(im,size):
    return im.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')

def box(mask):
    y,x=np.nonzero(mask)
    if not len(x):raise ValueError('Empty asset region')
    return (int(x.min()),int(y.min()),int(x.max())+1,int(y.max())+1)

def skinmask(a):
    r,g,b=a[:,:,:3].astype(float).transpose(2,0,1)
    return (a[:,:,3]>120)&(r>g+20)&(g>b+12)&(r>135)&(g>72)

manifest={'version':'illustrated-production-1','sources':{},'assets':{},'sprite':[96,108],'head':[192,192]}
for source,(kind,ids) in sets.items():
    path=ROOT/'assets'/f'{source}.png'
    if not path.exists():raise FileNotFoundError(f'Missing generated source: {path}')
    original=Image.open(path).convert('RGBA');a=np.array(original);a[a[:,:,3]<=8]=0;im=Image.fromarray(a)
    alpha=a[:,:,3]>80;cols=separators(alpha.sum(axis=0),4)
    if kind in ['face','facial']:
        # Face rows vary in height; the necks sometimes touch the next scalp.
        # Find each frontal head by its width, then cut at the narrowest neck
        # between heads instead of imposing a uniform raster grid.
        profile=alpha[:,cols[0]:cols[1]].sum(axis=1)
        rows=None
        for fraction in [.28,.32,.36,.4]:
            on=profile>profile.max()*fraction
            starts=np.flatnonzero(on&~np.r_[False,on[:-1]])
            ends=np.flatnonzero(on&~np.r_[on[1:],False])
            runs=[(int(s),int(e))for s,e in zip(starts,ends)if e-s>15]
            if len(runs)==len(ids):
                rows=[0]
                for k in range(1,len(ids)):
                    lo,hi=runs[k-1][1]+1,runs[k][0]+1
                    rows.append(lo+int(np.argmin(profile[lo:hi])))
                rows.append(im.height);break
        if rows is None:raise ValueError(f'Cannot identify {len(ids)} individual face rows in {source}')
    else:rows=separators(alpha.sum(axis=1),len(ids))
    manifest['sources'][source]={'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'size':list(im.size),'rows':rows,'columns':cols}
    for row,ident in enumerate(ids):
        for column,direction in enumerate(DIRS):
            bounds=[cols[column],rows[row],cols[column+1],rows[row+1]]
            cell=im.crop(bounds);data=np.array(cell);opaque=data[:,:,3]>80
            subject=box(opaque);crop=cell.crop(subject)
            if kind in ['hair','hat']:
                sm=skinmask(data)
                # Neck and face skin establish a consistent scale even for long hair.
                if sm.sum()<25:
                    # Long back hair can cover the entire nape. Register it to
                    # the matching front view's scalp scale and neck height.
                    front=np.array(im.crop((cols[0],rows[row],cols[1],rows[row+1])))
                    fm=skinmask(front);fx0,fy0,fx1,fy1=box(fm)
                    center=(subject[0]+subject[2])/2
                    sx0,sx1=center-(fx1-fx0)/2,center+(fx1-fx0)/2
                    sy0,sy1=fy0,fy1
                    sm=None
                else:
                    sx0,sy0,sx1,sy1=box(sm)
                # Ignore tiny skin-like stray pixels using projection support.
                if sm is not None:
                    yy=np.flatnonzero(sm.sum(axis=1)>max(2,sm.sum(axis=1).max()*.12))
                    xx=np.flatnonzero(sm.sum(axis=0)>max(2,sm.sum(axis=0).max()*.08))
                    sx0,sx1=int(xx.min()),int(xx.max())+1;sy0,sy1=int(yy.min()),int(yy.max())+1
                skinbox=[sx0,sy0,sx1,sy1]
                scale=min(72/(sx1-sx0),100/(sy1-sy0))
                scale=min(scale,184/max(1,subject[2]-subject[0]),184/max(1,subject[3]-subject[1]),130/max(1,sy1-subject[1]))
                x=round(96-(sx0+sx1)/2*scale);y=round(135-sy1*scale)
                out=Image.new('RGBA',(192,192));out.alpha_composite(resize(cell,(round(cell.width*scale),round(cell.height*scale))),(x,y))
            elif kind in ['face','facial']:
                skinbox=None; scale=min(80/crop.width,108/crop.height)
                art=resize(crop,(round(crop.width*scale),round(crop.height*scale)))
                out=Image.new('RGBA',(192,192));out.alpha_composite(art,((192-art.width)//2,135-art.height))
            else:
                skinbox=None
                height=66 if kind in ['top','nose'] else 31 if kind=='bottom' else 14
                # Pose sheets include the raised hand above the neck: match their
                # leg scale to standing sheets rather than shrinking the body.
                if kind=='nose':
                    base_source=ROOT/'assets'/f'tops-{chr(ord("a")+tops.index(ident)//5)}.png'
                    base_info=manifest['sources'][base_source.stem]
                    ba=np.array(Image.open(base_source).convert('RGBA'))
                    br=base_info['rows'];bc=base_info['columns'];rr=tops.index(ident)%5
                    bm=ba[br[rr]:br[rr+1],bc[column]:bc[column+1],3]>80
                    b=box(bm)
                    scale=66/(b[3]-b[1])
                    # Different sheets may have different raster dimensions.
                    scale*=Image.open(base_source).height/original.height
                else:scale=height/crop.height
                scale=min(scale,68/crop.width)
                art=resize(crop,(max(1,round(crop.width*scale)),max(1,round(crop.height*scale))))
                out=Image.new('RGBA',(96,108));out.alpha_composite(art,((96-art.width)//2,107-art.height))
                if kind=='nose':
                    # Raised-hand silhouettes have extra art above the neck.
                    # Normalize the shoulder/neck to the standing body's height,
                    # rather than fitting the entire pose into a shorter body.
                    profile=(np.array(out)[:,:,3]>80).sum(axis=1)
                    threshold=profile[35:80].max()*.9
                    shoulder=int(np.flatnonzero(profile[20:80]>=threshold)[0])+20
                    neck=shoulder-3
                    pose_scale=max(1,min(1.35,66/max(1,107-neck)))
                    pose=resize(out,(round(96*pose_scale),round(108*pose_scale)))
                    registered=Image.new('RGBA',(96,108))
                    registered.alpha_composite(pose,(round(48-48*pose_scale),round(107-107*pose_scale)))
                    out=registered
            key=f'{kind}/{ident}/{direction}'
            target=ROOT/'registered'/f'{key}.png';target.parent.mkdir(parents=True,exist_ok=True);out.save(target)
            manifest['assets'][key]={'path':str(target.relative_to(ROOT)),'source':source,'cell':bounds,'subjectBounds':list(subject),'skinBounds':skinbox,'scale':scale}
    print(source,len(ids)*4,'views registered')
(ROOT/'sources/asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Registered',len(manifest['assets']),'modular views; original sources retained.')
