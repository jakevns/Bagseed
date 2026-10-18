"""User-authorized color-only derivatives of approved flannel v11 geometry.

Each material maps corrected lightness onto one reference color ramp. Alpha,
dimensions, pixel positions and warm dark outline pixels remain unchanged.
Original generated PNGs and registered v11 images are never overwritten.
"""
from pathlib import Path
import importlib.util,json,hashlib
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
s=importlib.util.spec_from_file_location('audit',ROOT/'tools/audit-walk-rerender-v6.py')
audit=importlib.util.module_from_spec(s);s.loader.exec_module(audit)
OUT=ROOT/'review/flannel-proportions-v12'
OUT.mkdir(parents=True,exist_ok=True)

def rgb_from_lab(v):
    fy=(v[...,0]+16)/116;f=np.stack([fy+v[...,1]/500,fy,fy-v[...,2]/200],axis=-1)
    xyz=np.where(f>6/29,f**3,3*(6/29)**2*(f-4/29))*[.95047,1,1.08883]
    linear=xyz@np.array([[3.2404542,-.969266,.0556434],[-1.5371385,1.8760108,-.2040259],[-.4985314,.041556,1.0572252]])
    rgb=np.where(linear>.0031308,1.055*np.maximum(linear,0)**(1/2.4)-.055,12.92*linear)
    return np.clip(np.rint(rgb*255),0,255).astype(np.uint8)

def masks(im,hem=None):
    a=np.array(im);rgb=a[:,:,:3].astype(float);r,g,b=rgb.transpose(2,0,1)
    solid=a[:,:,3]>200;ys,xs=np.where(solid)
    y0,y1=ys.min(),ys.max()+1;h=y1-y0;mid=float(np.median(xs));width=xs.max()-xs.min()+1
    yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];y=(yy-y0)/h
    blue=(b>r*1.10)&(b>g*1.03)
    saturation=(b-r)/np.maximum(b,1)
    # Find the shirt-to-jeans transition in the central body, independently
    # for each pose; never impose one horizontal crop on curved hems.
    samples=[]
    for row in range(y0+round(h*.43),y0+round(h*.61)):
        strip=(abs(xx[row]-mid)<width*.13)&solid[row]&blue[row]
        if strip.any() and np.median(saturation[row,strip])<.37:samples.append(row)
    waist=(samples[0]-y0)/h if samples else .50
    fabric=blue&((y<waist-.018)|((y<waist+.055)&(saturation>.37)))
    jeans=blue&~fabric&(y>.40)
    if hem is not None:
        # Explicit reviewed hem for a source whose upper jeans share the
        # shirt's saturation. Only material labels change, never pixels.
        seam=np.interp(xx,[p[0] for p in hem],[p[1] for p in hem])
        below=(yy>=seam)&(xx>=hem[0][0])&(xx<=hem[-1][0])
        fabric &= ~below
        jeans |= blue&below
    warm=(r>g*1.12)&(g>b*1.12)
    skin=warm&(r>125)&(g>65)&(y<.72)
    cream=(r>140)&(g>130)&(b>95)&((r-b)<100)&(y>.74)
    leather=warm&(y>=.72)&~cream
    ink=((r>g)&(g>b)&(r<125))|(rgb.max(2)<40)
    return {k:m&solid&~ink for k,m in [('flannel',fabric),('jeans',jeans),('skin',skin),('leather',leather),('cream',cream)]},ink&solid

def ramp(values):
    labs=audit.lab(values);light=labs[:,0]
    anchors=[]
    for q in [2,15,50,85,98]:
        level=np.percentile(light,q)
        nearest=np.argsort(abs(light-level))[:max(3,len(light)//30)]
        point=np.median(labs[nearest],axis=0);point[0]=level;anchors.append(point)
    anchors=np.array(anchors);levels=np.linspace(anchors[0,0],anchors[-1,0],256)
    result=np.stack([np.interp(levels,anchors[:,0],anchors[:,c]) for c in range(3)],axis=1)
    return rgb_from_lab(result)

def remap(im,palettes,reference_stats,hem=None):
    a=np.array(im);result=a.copy();regions,ink=masks(im,hem)
    for name,m in regions.items():
        values=a[m,:3];light=audit.lab(values)[:,0]
        lo,mid,hi=np.percentile(light,[25,50,75]);rlo,rmid,rhi=reference_stats[name]
        # Match the material midtone without stretching faint source noise
        # into heavy shading. The common ramp supplies the same hue at each
        # lightness, and bounded gain retains the artist's local creases.
        gain=np.clip((rhi-rlo)/max(.5,hi-lo),.8,1.2)
        corrected=(light-mid)*gain+rmid
        levels=audit.lab(palettes[name])[:,0]
        indices=np.clip(np.rint(np.interp(corrected,levels,np.arange(256))),0,255).astype(int)
        result[m,:3]=palettes[name][indices]
    assert np.array_equal(a[:,:,3],result[:,:,3])
    assert np.array_equal(a[ink],result[ink])
    return Image.fromarray(result),regions

def main():
    reference=ROOT/'graphics/production/walk/sources/rerender-v6/registered/flannel-v11/top-flannel/down-0.png'
    ref=Image.open(reference).convert('RGBA');regions,_=masks(ref);a=np.array(ref)
    palettes={name:ramp(a[m,:3]) for name,m in regions.items()}
    reference_stats={name:np.percentile(audit.lab(a[m,:3])[:,0],[25,50,75]) for name,m in regions.items()}
    (OUT/'shared-palette.json').write_text(json.dumps({'reference':str(reference.relative_to(ROOT)),
      'referenceSHA256':audit.sha(reference),'method':'Smooth shared 256-color material ramps; match midtone with bounded lightness gain (0.8-1.2)',
      'userAuthorization':'Yes - apply a shared palette (2026-10-18)',
      'materials':{k:v.tolist() for k,v in palettes.items()}},indent=2)+'\n',encoding='utf-8')
    records=[];board=Image.new('RGB',(1200,630),'#eee9dd');draw=ImageDraw.Draw(board)
    overlay=Image.new('RGB',(1200,630),'#eee9dd')
    maskcolors={'flannel':(65,130,240),'jeans':(155,95,205),'skin':(250,155,65),'leather':(135,85,40),'cream':(245,235,155)}
    for row,d in enumerate(['down','up']):
        for col,key in enumerate(['idle',0,1,2,3]):
            if key=='idle':
                src=ROOT/f'graphics/production/walk/registered/flannel-idle-v11/{d}.png'
                dst=ROOT/f'graphics/production/walk/registered/flannel-idle-v12/{d}.png'
            else:
                src=ROOT/f'graphics/production/walk/sources/rerender-v6/registered/flannel-v11/top-flannel/{d}-{key}.png'
                dst=ROOT/f'graphics/production/walk/sources/rerender-v6/registered/flannel-v12/top-flannel/{d}-{key}.png'
            before=Image.open(src).convert('RGBA');after,ms=remap(before,palettes,reference_stats)
            dst.parent.mkdir(parents=True,exist_ok=True);after.save(dst)
            ar=np.array(after);old=np.array(before);_,ink=masks(before)
            record={'view':d,'frame':key,'source':str(src.relative_to(ROOT)),'sourceSHA256':audit.sha(src),
                'output':str(dst.relative_to(ROOT)),'outputSHA256':audit.sha(dst),'operation':'user-authorized shared material palette',
                'alphaIdentical':bool(np.array_equal(old[:,:,3],ar[:,:,3])),
                'outlinePixelsIdentical':bool(np.array_equal(old[ink],ar[ink])),
                'dimensionsIdentical':before.size==after.size,'runtimeInstalled':False,
                'materials':{k:{'pixels':int(m.sum()),'medianRGB':np.median(ar[m,:3],axis=0).tolist(),
                  'beforeMedianRGB':np.median(old[m,:3],axis=0).tolist(),
                  'allColorsInSharedRamp':bool(all(tuple(c) in set(map(tuple,palettes[k].tolist())) for c in np.unique(ar[m,:3],axis=0)))} for k,m in ms.items()}}
            assert record['alphaIdentical'] and record['outlinePixelsIdentical'] and record['dimensionsIdentical']
            dst.with_suffix('.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8');records.append(record)
            draw.text((col*240+7,row*315+8),f'{d} / {key}',fill='#352d28')
            board.paste(audit.tile(after,(240,270)),(col*240,row*315+32))
            diagnostic=np.array(before)
            for k,m in ms.items():diagnostic[m,:3]=maskcolors[k]
            overlay.paste(audit.tile(Image.fromarray(diagnostic),(240,270)),(col*240,row*315+32))
    board.save(OUT/'idle-and-walk.png');board.save(OUT/'comparison.png');overlay.save(OUT/'material-masks.png')
    (OUT/'measurements.json').write_text(json.dumps({'status':'Shared-palette source-art review; no runtime installation','frames':records},indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'images':len(records),'alphaIdentical':all(r['alphaIdentical'] for r in records),
      'outlinePixelsIdentical':all(r['outlinePixelsIdentical'] for r in records),
      'materialMedianRGB':{k:[r['materials'][k]['medianRGB'] for r in records] for k in palettes}}))

if __name__=='__main__':main()
