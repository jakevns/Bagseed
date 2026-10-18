"""Register fresh v6 sheets using a single similarity transform; never repaint.

Raw generated PNGs are immutable. This command stages registered candidates and
reports failures; it deliberately cannot promote candidates into the live atlas.
Review composites are evidence only and are never used as art sources.
"""
from pathlib import Path
import json, hashlib, itertools, argparse
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
W = ROOT / 'graphics/production/walk'
SRC = W / 'sources/rerender-v6'
OUT = ROOT / 'review/custom-walk-rerender-v6'
STAGE = SRC / 'registered'
BG = '#e9e6dc'

def binary_erosion(mask):
    padded=np.pad(mask,1)
    return np.logical_and.reduce([padded[y:y+mask.shape[0],x:x+mask.shape[1]]
                                  for y in range(3) for x in range(3)])

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2)+'\n', encoding='utf-8', newline='\n')

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def bbox(im):
    return im.getchannel('A').point(lambda p: 255 if p > 100 else 0).getbbox()

def sheet_columns(sheet):
    # Locate actual empty gutters. Generators do not place cell boundaries
    # at exact quarters, especially for long side strides. This extracts
    # complete source figures instead of borrowing a neighbor's shoe tip.
    profile=(np.array(sheet)[:,:,3]>100).sum(0)
    cuts=[0]
    for slot in range(1,4):
        target=sheet.width*slot/4
        lo=max(cuts[-1]+1,round(target-sheet.width*.08))
        hi=min(sheet.width,round(target+sheet.width*.08))
        values=profile[lo:hi]; candidates=np.flatnonzero(values==values.min())+lo
        cuts.append(int(candidates[np.argmin(abs(candidates-target))]))
    return cuts+[sheet.width]

def component_areas(mask):
    parents=[];sizes=[];previous=[]
    def find(i):
        while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
        return i
    for row in mask:
        edges=np.diff(np.pad(row.astype(np.int8),(1,1)))
        spans=list(zip(np.flatnonzero(edges==1),np.flatnonzero(edges==-1)))
        current=[]
        for start,end in spans:
            identity=len(parents);parents.append(identity);sizes.append(int(end-start))
            for a,b,other in previous:
                if a<=end and b>=start:
                    x,y=find(identity),find(other)
                    if x!=y:parents[y]=x;sizes[x]+=sizes[y]
            current.append((start,end,identity))
        previous=current
    return sorted([sizes[i] for i in range(len(parents)) if find(i)==i],reverse=True)

def fit(raw, guide):
    """One uniform scale + translation, feet anchored. No masks or pixel edits."""
    a, b = bbox(raw), bbox(guide)
    s = (b[3]-b[1])/(a[3]-a[1])
    def cap(im, bounds):
        aa = np.array(im)[:, :, 3]
        yy, xx = np.nonzero(aa[bounds[1]:bounds[1]+3] > 100)
        return float(np.median(xx))
    tx = cap(guide, b) - s*cap(raw, a)
    ty = b[3] - s*a[3]
    out = raw.convert('RGBa').transform((288,432), Image.Transform.AFFINE,
        (1/s,0,-tx/s,0,1/s,-ty/s), Image.Resampling.BICUBIC).convert('RGBA')
    return out, {'uniformScale':s, 'rotationDegrees':0, 'translationPixels':[tx,ty],
                 'groundError':(bbox(out)[3]-b[3])/3,
                 'operations':['uniform-scale','translate'],
                 'sourceBounds':list(a), 'guideBounds':list(b)}

def normalized(im):
    c = im.crop(bbox(im))
    return c.convert('RGBa').resize((max(1,round(c.width*240/c.height)),240),
                                  Image.Resampling.LANCZOS).convert('RGBA')

def lab(rgb):
    x = np.asarray(rgb, dtype=float)/255
    x = np.where(x <= .04045, x/12.92, ((x+.055)/1.055)**2.4)
    x = x @ np.array([[.4124564,.2126729,.0193339],
                      [.3575761,.7151522,.1191920],
                      [.1804375,.0721750,.9503041]])
    x /= np.array([.95047,1,1.08883])
    f = np.where(x > (6/29)**3, np.cbrt(x), x/(3*(6/29)**2)+4/29)
    return np.stack([116*f[...,1]-16,500*(f[...,0]-f[...,1]),
                     200*(f[...,1]-f[...,2])],axis=-1)

def garment_colors(im, garment='tee'):
    a=np.array(normalized(im)); h,w=a.shape[:2]
    yy,xx=np.mgrid[:h,:w]; rgb=a[:,:,:3].astype(float)
    r,g,b=rgb.transpose(2,0,1)
    # Central upper garment, excluding neck, hands, jeans and dark outlines.
    mx=rgb.max(2); mn=rgb.min(2); diff=mx-mn
    hue=np.zeros_like(mx); active=diff>0
    for channel,expr in [(0,(g-b)/np.maximum(diff,1)%6),
                         (1,(b-r)/np.maximum(diff,1)+2),
                         (2,(r-g)/np.maximum(diff,1)+4)]:
        mask=active & (rgb.argmax(2)==channel); hue[mask]=expr[mask]*60
    skin=(hue>5)&(hue<32)&(diff/np.maximum(mx,1)>.2)
    colors=lab(rgb)
    # Jeans and ink have L* below 30. A dark suit is the explicit exception.
    fabric=colors[:,:,0]>(12 if garment=='suit' else 30)
    if garment!='suit':
        denim=(b>r*1.05)&(b>g*.95)&(diff/np.maximum(mx,1)<.43)
        fabric &= ~denim
    m=(a[:,:,3]>220)&(yy>h*.12)&(yy<h*.5)&(xx>w*.27)&(xx<w*.73)&~skin&fabric
    values=colors[m]; return values[::max(1,len(values)//5000)]

def means(values, k=4):
    if len(values)<k: raise ValueError('Insufficient garment pixels')
    centers=[np.median(values,axis=0)]
    while len(centers)<k:
        dist=np.min(np.sum((values[:,None]-np.array(centers)[None])**2,axis=2),axis=1)
        centers.append(values[np.argmax(dist)])
    starts=[np.array(centers)]
    # A single farthest-point start spends clusters on tiny button/antialias
    # outliers and can merge the entire plaid into one color. Deterministic
    # k-means++ restarts choose the minimum squared-error solution instead.
    # Keep every sampled pixel, k=4, occupancy weighting and DeltaE limit.
    rng=np.random.default_rng(0)
    for _ in range(8):
        seed=[values[rng.integers(len(values))]]
        while len(seed)<k:
            dist=np.min(np.sum((values[:,None]-np.array(seed)[None])**2,axis=2),axis=1)
            total=dist.sum()
            seed.append(values[rng.choice(len(values),p=dist/total)] if total else values[0])
        starts.append(np.array(seed))
    best=None
    for centers in starts:
        for _ in range(100):
            ids=np.argmin(np.sum((values[:,None]-centers[None])**2,axis=2),axis=1)
            new=np.array([values[ids==i].mean(0) if np.any(ids==i) else centers[i] for i in range(k)])
            converged=np.max(np.abs(new-centers))<.001
            centers=new
            if converged: break
        distances=np.sum((values[:,None]-centers[None])**2,axis=2)
        ids=distances.argmin(1)
        error=float(distances[np.arange(len(values)),ids].sum())
        if best is None or error<best[0]:
            best=(error,centers.copy(),np.bincount(ids,minlength=k)/len(ids))
    return best[1],best[2]

def palette(idle,walk,garment='tee'):
    a,aw=means(garment_colors(idle,garment)); b,bw=means(garment_colors(walk,garment))
    costs=np.linalg.norm(a[:,None]-b[None],axis=2)
    rows=np.arange(4)
    cols=np.array(min(itertools.permutations(range(4)),
        key=lambda c:sum(costs[i,c[i]]*(aw[i]+bw[c[i]])/2 for i in range(4))))
    distances=costs[rows,cols]
    weights=(aw[rows]+bw[cols])/2
    dominant_delta=float(np.sum(distances*weights)/weights.sum())
    return {'clusterDeltaE':distances.tolist(),'maxDeltaE':float(distances.max()),
            'dominantDeltaE':dominant_delta,
            'comparison':'k=4 matched Lab centroids, weighted by average cluster occupancy',
            'idleWeights':aw.tolist(),'walkWeights':bw.tolist(),'pass':bool(dominant_delta<=6)}

def ink(im):
    a=np.array(normalized(im)); solid=a[:,:,3]>160
    edge=solid & ~binary_erosion(solid)
    inner=solid.copy()
    for _ in range(5): inner=binary_erosion(inner)
    rgb=a[:,:,:3].astype(float); dark=rgb.max(2)<70
    thickness=float((dark & solid & ~inner).sum()/max(1,edge.sum()))
    black=float(((rgb.max(2)<=20)&edge).sum()/max(1,edge.sum()))
    return thickness,black

def cream_at_neck(im):
    a=np.array(normalized(im)); w=a.shape[1]
    # Six game pixels at source density, scaled to a 240px body for comparison.
    roi=a[10:32,max(0,w//2-18):w//2+18]; r,g,b,al=roi.transpose(2,0,1)
    return float(((al>160)&(r>175)&(g>160)&(b>125)&(abs(r.astype(float)-g)<45)).mean())

def leading_foot_offset(im):
    """Side of the lowest foot relative to lower legs, independent of canvas size.

    This catches mirrored front/back steps; it does not approve arm anatomy or
    distinguish contact from passing. Those still require full-cycle review.
    """
    bounds=bbox(im); alpha=np.array(im)[:,:,3]>160
    height=bounds[3]-bounds[1]
    foot_rows=max(2,round(height*.02))
    # Compare the two lower legs, not the neck: the torso leans sideways
    # during contact and can put both shoes to one side of its neck cap.
    _,lower_x=np.nonzero(alpha[bounds[1]+round(height*.65):bounds[3]])
    foot_pair_center=(lower_x.min()+lower_x.max())/2
    _,foot_x=np.nonzero(alpha[bounds[3]-foot_rows:bounds[3]])
    return float((np.median(foot_x)-foot_pair_center)/height)

def tile(im, size=(190,255)):
    out=Image.new('RGBA',size,BG); c=normalized(im)
    out.alpha_composite(c,((size[0]-c.width)//2,size[1]-c.height))
    return out.convert('RGB')

def main():
    global OUT
    parser=argparse.ArgumentParser()
    parser.add_argument('--attempt',default='')
    parser.add_argument('--guides',default='registered/mannequin',help='Front/rear reference directory relative to walk/')
    args=parser.parse_args()
    active=SRC/args.attempt if args.attempt else SRC
    if args.attempt: OUT=OUT/args.attempt
    OUT.mkdir(exist_ok=True,parents=True); records=[]; seen=set(); candidates={}; idle_hashes={}
    preview_file=OUT/'idle-review.json'
    preview_idles=read(preview_file) if preview_file.exists() else {}
    for meta in sorted(active.glob('*-generation.json')):
        data=read(meta)
        if 'source' not in data: continue
        source=ROOT/data['source'] if not Path(data['source']).is_absolute() else Path(data['source'])
        if not source.exists(): continue
        garment,di=data['garment'],data['dir']; first=data.get('firstFrame',0)
        idle_path=ROOT/f'graphics/production/customization/top/{garment}/{di}.png'
        idle=Image.open(idle_path).convert('RGBA'); idle_hashes[str(idle_path.relative_to(ROOT))]=sha(idle_path)
        sheet=Image.open(source).convert('RGBA'); original_sha=sha(source)
        count=data.get('count',4)
        if count not in [1,4]: raise ValueError(f'Unsupported source count: {count}')
        columns=[0,sheet.width] if count==1 else sheet_columns(sheet)
        for slot in range(count):
            f=first+slot; key=f'{di}/{f}'; identity=(garment,key)
            if identity in seen: raise ValueError(f'Duplicate {identity}')
            seen.add(identity)
            raw=sheet.crop((columns[slot],0,columns[slot+1],sheet.height))
            guide_path=W/data.get('poseReference',f'stride-v4/{di}-{f}.png' if di in ['left','right'] else f'{args.guides}/{di}-{f}.png')
            guide=Image.open(guide_path).convert('RGBA')
            registered,registration=fit(raw,guide)
            destination=(STAGE/args.attempt if args.attempt else STAGE)/f'top-{garment}/{di}-{f}.png'; destination.parent.mkdir(parents=True,exist_ok=True)
            registered.save(destination)
            registration.update(source=str(source.relative_to(W)).replace('\\','/'),sourceSHA256=original_sha,
                sourceSlot=slot,sourceFrame=key,sourceCell=[columns[slot],0,columns[slot+1],sheet.height],
                poseReference=str(guide_path.relative_to(W)).replace('\\','/'),poseReferenceSHA256=sha(guide_path),registeredSHA256=sha(destination))
            write(destination.with_suffix('.json'),registration)
            col=palette(idle,registered,garment); it,ib=ink(idle); wt,wb=ink(registered)
            checks={'palette':col,'outlineRatio':wt/max(.001,it),'blackEdgeFraction':wb,
                    'outlinePass':wt<=it*1.25,'blackPass':wb<.02,
                    'backNeckCreamFraction':cream_at_neck(registered) if di=='up' else None,
                    'idleBackNeckCreamFraction':cream_at_neck(idle) if di=='up' else None}
            # The rule permits cream when the idle back already has cream
            # here (labcoat and the overalls undershirt). Its area changes
            # with shoulder pose, so do not demand an identical pixel count.
            checks['backNeckPass']=di!='up' or checks['idleBackNeckCreamFraction']>.01 or checks['backNeckCreamFraction']<.005
            failures=[name for name,ok in [('palette',col['pass']),('outline',checks['outlinePass']),
                      ('black stroke',checks['blackPass']),('back neckline',checks['backNeckPass'])] if not ok]
            if di in ['down','up']:
                expected_foot=leading_foot_offset(guide); actual_foot=leading_foot_offset(registered)
                checks['leadingFoot']={'guideOffset':expected_foot,'candidateOffset':actual_foot,
                    'pass':bool(abs(expected_foot)<.025 or expected_foot*actual_foot>0)}
                if not checks['leadingFoot']['pass']: failures.append('reversed leading foot')
            alpha=np.array(registered)[:,:,3]>100
            areas=component_areas(alpha); checks['detachedComponentAreas']=areas[1:]
            if any(area>9 for area in areas[1:]): failures.append('detached source pixels')
            checks['edgeClipped']=bool(alpha[0].any() or alpha[-1].any() or alpha[:,0].any() or alpha[:,-1].any())
            if checks['edgeClipped']: failures.append('canvas clipping')
            records.append({'garment':garment,'frame':key,'registration':registration,'checks':checks,'failures':failures,
                            'visualApproval':False})
            candidates[identity]=registered
        assert sha(source)==original_sha,'Raw image changed'
    expected=sum(j['count'] for j in read(SRC/'plan.json')['jobs'])
    guide_cycles={}
    for di in ['down','up']:
        offsets=[leading_foot_offset(Image.open(W/f'{args.guides}/{di}-{f}.png').convert('RGBA')) for f in range(4)]
        guide_cycles[di]={'lowestFootOffsets':offsets,'leftLeading':sum(x<-.025 for x in offsets),
            'rightLeading':sum(x>.025 for x in offsets),
            'balanced':sum(x<-.025 for x in offsets)==2 and sum(x>.025 for x in offsets)==2}
    report={'status':'NOT APPROVED: numeric gates and visual review required','expected':expected,'generated':len(records),
            'missing':expected-len(records),'failedFrames':sum(bool(r['failures']) for r in records),
            'idleSHA256':idle_hashes,'poseGuideCycles':guide_cycles,'previewIdles':preview_idles,'frames':records}
    write(OUT/'acceptance.json',report)
    # Full source bodies, identical uniform body-height scale; never squeeze figures.
    garments=sorted(set(g for g,k in candidates))
    for start in range(0,len(garments),3):
        subset=garments[start:start+3]; board=Image.new('RGB',(1200,len(subset)*2*285),BG); draw=ImageDraw.Draw(board)
        for row,(g,di) in enumerate(itertools.product(subset,['down','up'])):
            draw.text((8,row*285+5),f'{g} {di}   IDLE | new 0 | new 1 | new 2 | new 3 (not approved)',fill='black')
            if any((g,f'{di}/{f}') not in candidates for f in range(4)): continue
            idle=Image.open(ROOT/preview_idles.get(g,{}).get(di,f'graphics/production/customization/top/{g}/{di}.png')).convert('RGBA')
            for col,im in enumerate([idle]+[candidates[g,f'{di}/{f}'] for f in range(4)]):
                board.paste(tile(im,(240,255)),(col*240,row*285+25))
        board.save(OUT/f'candidate-contact-{start//3+1:02}.png')
    rows=[]
    for r in records:
        c=r['checks']; rows.append(f"<tr><td>{r['garment']}</td><td>{r['frame']}</td><td>{c['palette']['dominantDeltaE']:.2f} (max cluster {c['palette']['maxDeltaE']:.2f})</td><td>{c['outlineRatio']:.2f}</td><td>{c['blackEdgeFraction']:.3%}</td><td>{', '.join(r['failures']) or 'numeric gates pass; visual review pending'}</td></tr>")
    images=''.join(f'<a href="{p.name}"><img src="{p.name}" style="max-width:100%"></a>' for p in sorted(OUT.glob('candidate-contact-*.png')))
    (OUT/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>New walk art — NOT APPROVED</title><style>body{font:16px sans-serif;background:#e9e6dc;color:#222}td,th{padding:5px;border:1px solid #999}table{border-collapse:collapse}</style><h1>New walk art — NOT APPROVED</h1>'+f'<p>{len(records)}/{expected} candidates generated. {report["failedFrames"]} fail numeric gates. Live art has not been replaced. Raw pixels are unchanged. Seed is unavailable from the built-in tool.</p>'+images+'<table><tr><th>Garment</th><th>Frame</th><th>Dominant ΔE (≤6); max cluster shown separately</th><th>Outline (≤1.25)</th><th>Black edge (&lt;2%)</th><th>Result</th></tr>'+''.join(rows)+'</table>',encoding='utf-8')
    print(json.dumps({k:report[k] for k in ['expected','generated','missing','failedFrames']}))

if __name__=='__main__': main()
