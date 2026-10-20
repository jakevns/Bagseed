"""Native-pixel operations shared by v7 preparation, rendering and audit."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
from PIL import Image

def over(*layers):
    out=Image.new('RGBA',(layers[0].shape[1],layers[0].shape[0]))
    for a in layers:out.alpha_composite(Image.fromarray(cv2.cvtColor(a,cv2.COLOR_BGRA2RGBA)))
    return cv2.cvtColor(np.array(out),cv2.COLOR_RGBA2BGRA)

def warp(a,m,size):
    """Premultiplied-alpha resampling prevents pale RGB leaking out of edges."""
    f=a.astype('float32')/255;f[:,:,:3]*=f[:,:,3,None]
    result=cv2.warpAffine(f,m,size,flags=cv2.INTER_LINEAR)
    alpha=result[:,:,3];valid=alpha>1/255
    result[:,:,:3][valid]/=alpha[valid,None];result[~valid]=0
    return np.clip(np.rint(result*255),0,255).astype('uint8')

def rigid(pivot,angle,target=None):
    m=cv2.getRotationMatrix2D(tuple(map(float,pivot)),float(angle),1)
    if target is not None:m[:,2]+=np.array(target)-pivot
    return m

def contour(mask):
    cs,_=cv2.findContours(mask.astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    return max(cs,key=cv2.contourArea).reshape(-1,2)

def ink_metrics(a):
    mask=a[:,:,3]>128;gray=cv2.cvtColor(a,cv2.COLOR_BGRA2GRAY)
    inner=cv2.erode(mask.astype('uint8'),np.ones((11,11),np.uint8))>0
    skin=float(np.median(gray[inner]));dark=(gray<skin*.6)&mask
    edge=mask&~(cv2.erode(mask.astype('uint8'),np.ones((17,17),np.uint8))>0)
    samples=a[:,:,:3][edge&dark]
    color=np.rint(np.median(samples,axis=0)).astype('uint8') if len(samples) else np.array([30,30,30],np.uint8)
    pts=contour(mask);widths=[];insets=[];edges=[]
    for i,p in enumerate(pts):
        tangent=(pts[(i+5)%len(pts)]-pts[(i-5)%len(pts)]).astype(float)
        norm=np.array([-tangent[1],tangent[0]])/max(np.linalg.norm(tangent),1)
        probe=np.rint(p+norm*3).astype(int)
        if not (0<=probe[0]<mask.shape[1] and 0<=probe[1]<mask.shape[0] and mask[probe[1],probe[0]]):norm=-norm
        first=None;last=None
        for depth in range(15):
            q=np.rint(p+norm*depth).astype(int)
            if not(0<=q[0]<mask.shape[1] and 0<=q[1]<mask.shape[0]):break
            is_dark=dark[q[1],q[0]]
            if first is None and is_dark:first=depth
            elif first is not None and not is_dark:last=depth;break
        if first is not None:
            insets.append(first)
            if last is not None and 1<=last-first<=10:widths.append(last-first)
        edges.append((p,norm,first))
    return {'color':color,'width':int(np.clip(round(np.median(widths)),2,6)) if widths else 3,
            'haloInset':int(round(np.median(insets))) if insets else 1,'edges':edges,'graySkinMedian':skin}

def nearest_paint(a,valid):
    if not valid.any():raise ValueError('No retained skin for local ink cleanup')
    _,labels=cv2.distanceTransformWithLabels((~valid).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
    table=np.zeros((int(labels.max())+1,3),np.uint8);table[labels[valid]]=a[:,:,:3][valid]
    return table[labels]

def clean_edge(a,ink,follow_dark=True,preserve_alpha=None):
    """Trim to existing ink, then normalize only the silhouette's inward rim."""
    out=a.copy();mask=out[:,:,3]>128
    if follow_dark:
        measured=ink_metrics(out);points=[]
        for p,n,first in measured['edges']:
            offset=min(first,5) if first is not None else min(measured['haloInset'],3)
            points.append(np.rint(p+n*offset).astype('int32'))
        # These points follow existing painted contour; no skeleton involved.
        path=np.array(points,float)
        # Suppress alternating raster-normal samples without flattening anatomy.
        path=sum(np.roll(path,i,axis=0) for i in range(-3,4))/7
        path=np.rint(path).astype('int32')
        clean=np.zeros(mask.shape,np.uint8);cv2.fillPoly(clean,[path],1)
        # Adjacent normals can intersect around a ragged painted fringe and
        # leave one-pixel spurs. Remove those before measuring/redrawing ink.
        clean=cv2.morphologyEx(clean,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))
        mask=clean>0
    else:
        # Rigid resampling can leave isolated one-pixel edge spurs. This
        # removes only those raster fringes from the final composite.
        original_mask=mask.copy()
        mask=cv2.morphologyEx(mask.astype('uint8'),cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))>0
        if preserve_alpha is not None:mask|=original_mask&preserve_alpha
    distance=cv2.distanceTransform(mask.astype('uint8'),cv2.DIST_L2,5)
    width=ink['width'];gray=cv2.cvtColor(out,cv2.COLOR_BGRA2GRAY)
    # Remove old ink protruding inward beyond the new uniform outline band.
    excess=mask&(distance>width)&(distance<width+7)&(gray<ink['graySkinMedian']*.6)
    valid=mask&(distance>width+7)&(gray>ink['graySkinMedian']*.65)
    if excess.any() and valid.any():out[:,:,:3][excess]=nearest_paint(out,valid)[excess]
    # On a narrow painted extremity, the two full-width ink bands can meet.
    # Use the permitted median-minus-one thickness there, preserving its alpha
    # and a strip of the painted skin instead of turning the tip solid ink.
    narrow=(cv2.dilate(distance,np.ones((5,5),np.uint8))<=width+1)&(width>=6)
    thin_core=mask&narrow&(distance>width-.5)&(distance<=width+1)
    if thin_core.any() and valid.any():out[:,:,:3][thin_core]=nearest_paint(out,valid)[thin_core]
    rim=mask&(distance<=width-.5*narrow.astype('float32'))
    out[:,:,:3][rim]=ink['color'];out[:,:,3]=mask.astype('uint8')*255;out[~mask]=0
    # At curved raster corners a distance band can measure one pixel too wide
    # along the contour normal. Trim its INNER ink edge, keeping alpha fixed.
    # Never punch through the neighbouring edge of a narrow painted feature.
    points=contour(mask);donor=mask&(distance>width+3)&(gray>ink['graySkinMedian']*.65)
    if donor.any():
        paint=nearest_paint(out,donor)
        signed=distance-cv2.distanceTransform((~mask).astype('uint8'),cv2.DIST_L2,5)
        gy,gx=np.gradient(cv2.GaussianBlur(signed,(0,0),2))
        for i,p in enumerate(points):
            n=np.array([gx[p[1],p[0]],gy[p[1],p[0]]]);n/=max(np.linalg.norm(n),1e-6)
            q=np.rint(p+n*(width+1)).astype(int)
            if 0<=q[0]<mask.shape[1] and 0<=q[1]<mask.shape[0] and distance[q[1],q[0]]>width-1:
                out[q[1],q[0],:3]=paint[q[1],q[0]]
    return out

def match_repair(a,original,mask,skin_only=False):
    out=a.copy();support=(out[:,:,3]>250)
    source_skin=cv2.erode((original[:,:,3]>250).astype('uint8'),np.ones((7,7),np.uint8))>0
    g=cv2.cvtColor(original,cv2.COLOR_BGRA2GRAY);median=float(np.median(g[source_skin]))
    source_skin&=g>median*.65
    ring=(cv2.dilate(mask.astype('uint8'),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(25,25)))>0)&~mask&source_skin
    new=mask&support
    if skin_only:
        inner=cv2.erode(support.astype('uint8'),np.ones((7,7),np.uint8))>0
        source_inner=cv2.erode((original[:,:,3]>128).astype('uint8'),np.ones((11,11),np.uint8))>0
        skin_floor=float(np.median(g[source_inner]))*.6
        new&=inner&(cv2.cvtColor(out,cv2.COLOR_BGRA2GRAY)>skin_floor)
    if not ring.any() or not new.any():raise ValueError('Repair/ring is empty')
    target_mean=original[:,:,:3][ring].mean(axis=0);target_std=original[:,:,:3][ring].std(axis=0)
    values=out[:,:,:3].astype(float);before=values[new]
    values[new]=(before-before.mean(axis=0))*target_std/np.maximum(before.std(axis=0),1)+target_mean
    distance=cv2.distanceTransform(mask.astype('uint8'),cv2.DIST_L2,5)
    feather=np.minimum(distance/6,1)
    boundary=nearest_paint(original,ring).astype(float)
    values[new]=values[new]*feather[new,None]+boundary[new]*(1-feather[new,None])
    # Fit remaining mean/spread in the CORE only; feather boundary stays fixed.
    core=new&(distance>=6)
    for _ in range(30 if skin_only else 12):
        now=values[new];mean=now.mean(axis=0);std=now.std(axis=0)
        if core.any():values[core]=(values[core]-mean)*target_std/np.maximum(std,1)+target_mean
        values=np.clip(values,0,255)
        if skin_only:
            brightness=values[:,:,0]*.114+values[:,:,1]*.587+values[:,:,2]*.299
            low=new&(brightness<skin_floor+2)
            values[low]+=((skin_floor+2)-brightness[low])[:,None]
    out[:,:,:3][new]=np.rint(values[new]).astype('uint8')
    after=out[:,:,:3][new]
    return out,{'ringPixels':int(ring.sum()),'filledPixels':int(new.sum()),'ringMeanBGR':target_mean.tolist(),
                'ringStdBGR':target_std.tolist(),'filledMeanBGR':after.mean(axis=0).tolist(),'filledStdBGR':after.std(axis=0).tolist(),
                'meanDifference':float(np.max(abs(after.mean(axis=0)-target_mean)/np.maximum(target_mean,1))),
                'spreadDifference':float(np.max(abs(after.std(axis=0)-target_std)/np.maximum(target_std,1))),'ringWidth':12,'feather':6}

def cut(a,top=None,bottom=None,side=1,slanted=False):
    h,w=a.shape[:2];yy,xx=np.indices((h,w));keep=np.ones((h,w),bool)
    def line(y,slant=False):
        xs=np.flatnonzero(a[int(np.clip(y,0,h-1)),:,3]>128)
        mid=float(xs.mean()) if len(xs) else w/2;half=max(float(np.ptp(xs))/2,10) if len(xs) else 50
        u=np.clip((xx-mid)/half,-1,1)
        return y+4*np.cos(u*np.pi/2)-(u*side*10 if slant else 0)
    if top is not None:keep&=yy>=line(top,slanted)
    if bottom is not None:keep&=yy<=line(bottom)
    out=a.copy();out[~keep]=0;return out

def alpha_difference(a,b):
    aa=a[:,:,3]>128;bb=b[:,:,3]>128
    return float(np.logical_xor(aa,bb).sum()/max(np.logical_or(aa,bb).sum(),1))
