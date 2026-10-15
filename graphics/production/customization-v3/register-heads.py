"""Register the replacement chibi head artwork to shared face/neck anchors."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parent
repo = root.parents[2]
hair = [p[0] for p in json.loads((repo/'docs/graphics/roster-audit.json').read_text())['options']['hair']]
dirs = ['down','right','up','left']

def runs(mask,gap=14):
    starts=np.flatnonzero(mask&~np.r_[False,mask[:-1]])
    ends=np.flatnonzero(mask&~np.r_[mask[1:],False])
    merged=[]
    for start,end in zip(starts,ends):
        if merged and start-merged[-1][1]<=gap:merged[-1][1]=int(end)
        else:merged.append([int(start),int(end)])
    return [p for p in merged if p[1]-p[0]>20]

def skin(a):
    r,g,b=a[:,:,:3].astype(int).transpose(2,0,1)
    return (a[:,:,3]>120)&(r>175)&(g>95)&(b>40)&(r>g*1.15)&(r<g*1.85)&(g>b+15)

def bounds(mask):
    yy,xx=np.nonzero(mask)
    if not len(xx):return None
    return [int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1]

def components(mask):
    """Label four-connected row spans without an optional image library."""
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

def complete_subjects(a,columns,rows):
    # Atlas rows have differing silhouettes. A shared horizontal crop cut the
    # neighboring crowns and long strands. Segment before taking any crop.
    alpha=a[:,:,3]>100;original,records=components(alpha)
    interior=np.array(Image.fromarray((alpha*255).astype('uint8')).filter(ImageFilter.MinFilter(17)))>0
    cores,core_records=components(interior);markers=np.zeros(alpha.shape,np.int32);assigned={}
    centers=[((l+r)/2,(t+b)/2) for t,b in zip(rows,rows[1:]) for l,r in zip(columns,columns[1:])]
    for row,(top,bottom) in enumerate(zip(rows,rows[1:])):
        for col,(left,right) in enumerate(zip(columns,columns[1:])):
            counts=np.bincount(cores[top:bottom,left:right].ravel());counts[0]=0
            assert counts.max()>500,('missing head interior',row,col)
            core=int(counts.argmax());identity=row*4+col+1
            assert core not in assigned,('joined head interiors',row,col,assigned.get(core))
            assigned[core]=identity;markers[cores==core]=identity
    for record in core_records:
        if record['label'] in assigned or record['size']<10:continue
        mask=cores==record['label'];parent=int(np.bincount(original[mask]).argmax())
        choices=np.unique(markers[original==parent]);choices=choices[choices>0]
        if not len(choices):continue
        y,x=np.mean(np.argwhere(mask),axis=0)
        identity=min(choices,key=lambda n:(x-centers[n-1][0])**2+(y-centers[n-1][1])**2);markers[mask]=identity
    segments=np.zeros(alpha.shape,np.int32)
    for record in records:
        if record['size']<100:continue
        label=record['label'];l,t,r,b=record['bounds'];mask=original[t:b,l:r]==label;values=markers[t:b,l:r].copy();values[~mask]=0
        identities=np.unique(values[values>0])
        if not len(identities):continue
        if len(identities)==1:values[mask]=identities[0]
        else:
            # Thick neighboring braid tips occasionally touch. Expand separate
            # interior seeds along the original silhouette to keep each strand.
            while True:
                empty=mask&(values==0)
                if not empty.any():break
                expanded=values.copy()
                for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                    source=np.roll(values,(dy,dx),axis=(0,1))
                    if dy==-1:source[-1]=0
                    if dy==1:source[0]=0
                    if dx==-1:source[:,-1]=0
                    if dx==1:source[:,0]=0
                    use=empty&(source>0)&(expanded==0);expanded[use]=source[use]
                assert not np.array_equal(values,expanded),('unreachable head pixels',label)
                values=expanded
        target=segments[t:b,l:r];target[mask]=values[mask]
    return segments

atlases={}
for p in sorted((root/'sources').glob('hair-*.png')):
    image=Image.open(p).convert('RGBA');a=np.array(image);h,w=a.shape[:2]
    alpha=a[:,:,3]>100;profile=alpha.sum(axis=0);cols=[0]
    # Use the transparent gutters rather than imposing a grid on the artwork.
    for fraction in [.3,.525,.735]:
        lo,hi=round(w*(fraction-.065)),round(w*(fraction+.065))
        sample=profile[lo:hi];choices=np.flatnonzero(sample==sample.min())+lo
        cols.append(int(choices[np.argmin(abs(choices-w*fraction))]))
    cols.append(w)
    front=skin(a[:,:cols[1]]).sum(axis=1)
    faces=runs(front>max(10,front.max()*.15),30 if p.stem=='hair-supplement' else 14)
    expected=3 if p.stem=='hair-supplement' else 9 if p.stem=='hair-d' else 10
    assert len(faces)==expected,(p.stem,faces)
    rows=[0];projection=alpha.sum(axis=1)
    for before,after in zip(faces,faces[1:]):
        lo,hi=before[1]+3,after[0]-16
        if hi<=lo:lo,hi=before[1]+1,after[0]
        sample=projection[lo:hi];choices=np.flatnonzero(sample==sample.min())+lo
        rows.append(int(choices[len(choices)//2]))
    rows.append(h)
    atlases[p.stem]={'image':image,'array':a,'columns':cols,'rows':rows,'faces':faces,'segments':complete_subjects(a,cols,rows)}

bindings={}
for index,name in enumerate(hair):
    group='abcdef'[index//10];row=index%10
    if group=='d' and row==7:bindings[name]=('hair-supplement',2)
    elif group=='d' and row>=8:bindings[name]=('hair-d',row-1)
    elif name=='buzz':bindings[name]=('hair-supplement',0)
    elif name=='ponytail':bindings[name]=('hair-supplement',1)
    else:bindings[name]=('hair-'+group,row)

report={'version':'chibi-heads-4','assets':{},'features':{},'sources':{},'registrations':{}}
for name,(source,row) in bindings.items():
    atlas=atlases[source];cols,rows=atlas['columns'],atlas['rows'];parts=[]
    for i,direction in enumerate(dirs):
        keep=atlas['segments']==row*4+i+1;subject_global=bounds(keep);assert subject_global is not None,(name,direction)
        l,t,r,b=subject_global
        box=[max(0,l-2),max(0,t-2),min(atlas['image'].width,r+2),min(atlas['image'].height,b+2)]
        keep=np.array(Image.fromarray((keep*255).astype('uint8')).filter(ImageFilter.MaxFilter(3)))>0
        a=atlas['array'][box[1]:box[3],box[0]:box[2]].copy();a[~keep[box[1]:box[3],box[0]:box[2]],3]=0
        cell=Image.fromarray(a);sk=skin(a);sb=bounds(sk)
        assert not (a[0,:,3]>100).any() and not (a[-1,:,3]>100).any(),(name,direction,'vertical crop')
        assert not (a[:,0,3]>100).any() and not (a[:,-1,3]>100).any(),(name,direction,'horizontal crop')
        subject=bounds(a[:,:,3]>100)
        assert subject is not None,(name,direction)
        if direction=='up':
            # Rear ears may be the only skin. The lower edge of one ear is not
            # the neck anchor; align the skull to the matching front drawing.
            front=parts[0];neck_y=front['neckGlobal'][1]+(t-front['subjectGlobal'][1])-box[1]
            neck_x=(sb[0]+sb[2])/2 if sb else (l+r)/2-box[0]
        elif sb:
            neck_y=sb[3]
            yy,xx=np.nonzero(sk[max(0,neck_y-5):neck_y])
            neck_x=float(np.median(xx)) if len(xx) else (sb[0]+sb[2])/2
        else:
            front=parts[0];neck_y=front['neck'][1];neck_x=(subject[0]+subject[2])/2
        parts.append({'cell':cell,'box':box,'skin':sb,'subject':subject,'subjectGlobal':subject_global,'neck':[neck_x,neck_y],'neckGlobal':[neck_x+box[0],neck_y+box[1]]})
    front=parts[0]['skin'];assert front is not None,name
    scale=min(88/(front[2]-front[0]),90/(front[3]-front[1]))
    for part in parts:
        x,y=part['neck'];l,t,r,b=part['subject']
        scale=min(scale,92/max(1,x-l),92/max(1,r-x),129/max(1,y-t),116/max(1,b-y))
    report['registrations'][name]={'source':source,'row':row,'scale':scale,'views':{}}
    for direction,part in zip(dirs,parts):
        x,y=part['neck'];cell=part['cell']
        art=cell.convert('RGBa').resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.LANCZOS).convert('RGBA')
        canvas=Image.new('RGBA',(192,256));placement=[round(96-x*scale),round(135-y*scale)]
        canvas.alpha_composite(art,placement)
        target=root/'registered'/name/(direction+'.png');target.parent.mkdir(parents=True,exist_ok=True);canvas.save(target)
        key=f'hair/{name}/{direction}';report['assets'][key]=str(target.relative_to(root))
        report['registrations'][name]['views'][direction]={'sourceBox':part['box'],'placement':placement,'skinBounds':part['skin'],'sourceSubjectBounds':part['subjectGlobal'],'sourceNeck':part['neckGlobal'],'neck':[96,135],'sourceCropBoundaryPixels':0}
        a=np.array(canvas);r,g,b=a[:,:,:3].astype(int).transpose(2,0,1)
        whites=(a[:,:,3]>150)&(r>220)&(g>190)&(b>155)&(np.indices(r.shape)[0]>55)&(np.indices(r.shape)[0]<120)
        if direction=='down':
            xx=np.indices(r.shape)[1];eyes=[]
            for region in [xx<96,xx>=96]:
                yy,xs=np.nonzero(whites&region)
                eyes.append([float(np.mean(xs)),float(np.mean(yy))] if len(xs) else ([76,96] if len(eyes)==0 else [116,96]))
            report['features'][key]={'eyes':eyes}
        elif direction!='up':
            yy,xs=np.nonzero(whites)
            report['features'][key]={'eyes':[[float(np.mean(xs)),float(np.mean(yy))]] if len(xs) else [[122 if direction=='right' else 70,96]]}
for source,atlas in atlases.items():
    p=root/'sources'/(source+'.png')
    report['sources'][source]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'columns':atlas['columns'],'rows':atlas['rows']}
(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'{len(bindings)} chibi hairstyles registered in four directions ({len(report["assets"])} assets)')
