"""Register complete isolated hats; no color-keying faces out of hat studies."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root=Path(__file__).resolve().parent
source=root/'sources/hats.png';image=Image.open(source).convert('RGBA');a=np.array(image);alpha=a[:,:,3]>100
profile=alpha.sum(axis=1);on=profile>max(5,profile.max()*.03)
starts=np.flatnonzero(on&~np.r_[False,on[:-1]]);ends=np.flatnonzero(on&~np.r_[on[1:],False])
runs=[(int(s),int(e)) for s,e in zip(starts,ends) if e-s>20]
assert len(runs)==8,runs
rows=[0]+[round((runs[i-1][1]+runs[i][0])/2) for i in range(1,8)]+[image.height]
names=['beanie','cap','bucket','straw','sunhat','officer','wizard','beret'];dirs=['down','right','up','left']
sizes={'beanie':(128,58,76),'cap':(140,54,78),'bucket':(144,61,80),'straw':(168,60,78),'sunhat':(176,68,82),'officer':(144,57,77),'wizard':(180,82,82),'beret':(132,52,74)}
report={'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'assets':{},'registrations':{},'fits':{}}
for row,name in enumerate(names):
    # The generated views are separated by transparent gutters, but their
    # bills and brims are not contained by equal quarter-width cells.
    # Register the actual gutter for each row before isolating its main hat.
    row_alpha=alpha[rows[row]:rows[row+1]].sum(axis=0);columns=[0]
    for fraction in [.25,.5,.75]:
        lo,hi=round(image.width*(fraction-.075)),round(image.width*(fraction+.075))
        sample=row_alpha[lo:hi];choices=np.flatnonzero(sample==sample.min())+lo
        columns.append(int(choices[np.argmin(abs(choices-image.width*fraction))]))
    columns.append(image.width)
    for i,direction in enumerate(dirs):
        box=[columns[i],rows[row],columns[i+1],rows[row+1]];cell=image.crop(box)
        rgba=np.array(cell);opaque=rgba[:,:,3]>70;yy,xx=np.nonzero(opaque)
        nearest=np.argmin((xx-np.median(xx))**2+(yy-np.median(yy))**2)
        connected=Image.fromarray(np.where(opaque,255,0).astype('uint8')).copy()
        ImageDraw.floodfill(connected,(int(xx[nearest]),int(yy[nearest])),128)
        keep=Image.fromarray(np.where(np.array(connected)==128,255,0).astype('uint8')).filter(ImageFilter.MaxFilter(3))
        rgba[np.array(keep)==0,3]=0;cell=Image.fromarray(rgba)
        bounds=cell.getchannel('A').point(lambda v:255 if v>100 else 0).getbbox();assert bounds is not None,(name,direction)
        crop=cell.crop(bounds);w,_,bottom=sizes[name];h=round(crop.height*w/crop.width)
        art=crop.convert('RGBa').resize((w,h),Image.Resampling.LANCZOS).convert('RGBA')
        canvas=Image.new('RGBA',(192,384));canvas.alpha_composite(art,((192-w)//2,128+bottom-h))
        target=root/'hats'/name/(direction+'.png');target.parent.mkdir(parents=True,exist_ok=True);canvas.save(target)
        report['fits'][name]=min(report['fits'].get(name,1),132/(135-min(0,bottom-h)))
        key=f'hat/{name}/{direction}';report['assets'][key]=str(target.relative_to(root));report['registrations'][key]={'sourceBox':box,'alphaBounds':bounds,'placement':[(192-w)//2,128+bottom-h],'size':[w,h]}
(root/'hats-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print('32 complete isolated hats registered')
