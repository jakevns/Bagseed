"""Ship approved v7 pixels: three requested cleanups, rigid poses, explicit roles."""
from pathlib import Path
import sys,json,hashlib
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'review/character-rigid-body'))
from native_review import *
SOURCE=ROOT/'graphics/character-system/sources/unified-body-v7'
OUT=Path(__file__).parent;OUT.mkdir(exist_ok=True)
STRIDE=ROOT/'graphics/production/walk'
old=json.loads((STRIDE/'wardrobe-v5/manifest.json').read_text())
records=json.loads((SOURCE/'rig-review.json').read_text())
S=.09;D=3;W=288;H=432
TABLE=[(20,3,18),(15,15,10),(0,38,0),(-15,20,-10),(-20,5,-18),(-15,35,-10),(0,5,0),(15,10,10)]
manifest={'version':'unified-v7-1','canvas':[96,144],'density':D,'uniformBodyScale':S,'views':{},'garments':{},'sourceHashes':{},'fixes':[],'missing':['Front/back retain the existing renderer and artwork.','Drawn variants for slim, broad, curvy, stocky and tall are not supplied; side views retain the approved base anatomy.'],'closestFits':['Non-core coats, overalls, skirts and full suits reuse their existing painted panels fitted to the new joints; some hems may overlap.','Non-core Standing clothing uses contact-frame panels fitted to the neutral rig; core clothing uses the independent prepared layers.','Core collar/shoulder coverage and boot/cuff transitions need further art fitting.']}
sha=lambda b:hashlib.sha256(b).hexdigest()
manifest['closestFits']+=['Sandals and rainboots retain translucent legacy edges.','The sole/cuff pixel-equality check remains failing for some trouser versus shorts/skirt combinations; attachment and geometry checks pass.']
core_index=json.loads((OUT/'core-sources.json').read_text())
core_images={item['file']:cv2.imread(str(OUT/item['file']),-1) for item in core_index}
for item in core_index:
    manifest['sourceHashes'][item['svg']]=sha((ROOT/item['svg']).read_bytes())
    manifest['sourceHashes'][str((OUT/item['file']).relative_to(ROOT)).replace('\\','/')]=sha((OUT/item['file']).read_bytes())
def save(name,a):
    cv2.imwrite(str(OUT/name),a);return name
def transformed(m,p):return m[:,:2]@np.array(p)+m[:,2]
def combine(m,n):return (np.vstack([m,[0,0,1]])@np.vstack([n,[0,0,1]]))[:2]
def skin_clean(a):
    """Remove only short, isolated dark ink; retain connected exterior lines."""
    b=a.copy();alpha=b[:,:,3]>128;g=cv2.cvtColor(b,cv2.COLOR_BGRA2GRAY)
    inner=cv2.erode(alpha.astype('uint8'),np.ones((9,9),np.uint8))>0
    if not inner.any():return b,0
    median=np.median(g[inner]);ink=alpha&(g<median*.45)
    rim=alpha&~(cv2.erode(alpha.astype('uint8'),np.ones((5,5),np.uint8))>0)
    n,labels,stats,_=cv2.connectedComponentsWithStats(ink.astype('uint8'),8)
    remove=np.zeros(alpha.shape,bool)
    for i in range(1,n):
        x,y,w,h,area=stats[i]
        if max(w,h)<15 and not np.any((labels==i)&rim):remove|=labels==i
    donors=inner&~ink
    if remove.any() and donors.any():b[:,:,:3][remove]=nearest_paint(b,donors)[remove]
    return b,int(remove.sum())
def open_shoulder(arm,torso,sp):
    b=arm.copy();alpha=b[:,:,3]>128;g=cv2.cvtColor(b,cv2.COLOR_BGRA2GRAY)
    depth=cv2.distanceTransform(alpha.astype('uint8'),cv2.DIST_L2,5)
    y,x=np.indices(alpha.shape);sx,sy=sp
    skin=alpha&(depth>7)&(g>np.median(g[alpha])*.65)
    radius=max(22,float(depth[int(sy),int(sx)])+12)
    cap=(x-sx)**2+(y-sy)**2<(radius*1.6)**2
    contact=(torso[:,:,3]>128)&(y<sy+radius*.9)
    remove=alpha&cap&contact&(g<np.median(g[alpha])*.6)
    if remove.any():b[:,:,:3][remove]=nearest_paint(b,skin)[remove]
    return b,int(remove.sum())
def neutral(a,reference):
    """Explicit skin role, with the painting's own luminance and dark ink."""
    b=a.copy();alpha=b[:,:,3]>128;g=cv2.cvtColor(b,cv2.COLOR_BGRA2GRAY)
    ref=reference
    skin=alpha&(g>ref*.4)
    tone=np.clip(g.astype(float)*160/max(ref,1),0,255).astype('uint8')
    b[:,:,:3][skin]=tone[skin,None]
    role=np.zeros_like(b);role[:,:,3]=b[:,:,3];role[:,:,0][skin]=255
    return b,role
def affine_image(a,m):return warp(a,m,(W,H))
def triangle(source,target):return cv2.getAffineTransform(np.float32(source),np.float32(target)*D)
def bone(a,b,c,d,width=1):
    a,b,c,d=map(lambda x:np.array(x,float),(a,b,c,d));u=b-a;v=(d-c)*D
    sl=np.linalg.norm(u);tl=np.linalg.norm(v);e=u/sl;f=v/tl
    matrix=np.outer(f,e)*(tl/sl)+np.outer([-f[1],f[0]],[-e[1],e[0]])*width
    return np.column_stack([matrix,c*D-matrix@a])
def pack_part(atlas,roles,a,role,row,column):
    atlas[row*H:(row+1)*H,column*W:(column+1)*W]=a
    roles[row*H:(row+1)*H,column*W:(column+1)*W]=role
    yy,xx=np.nonzero(a[:,:,3]>0)
    if not len(xx):return None
    x0,y0,x1,y1=int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)
    return {'rect':[column*W+x0,row*H+y0,x1-x0,y1-y0],'destination':[x0/D,y0/D]}
def compact(atlas,roles,parts):
    """Pack only painted bounds so decoding does not allocate empty canvases."""
    entries=[p for p in parts if p is not None];entries.sort(key=lambda p:-p['rect'][3])
    placements=[];x=y=row_height=0;width=512
    for part in entries:
        sx,sy,w,h=part['rect']
        if x+w+2>width:x=0;y+=row_height+2;row_height=0
        placements.append((part,x,y,atlas[sy:sy+h,sx:sx+w].copy(),roles[sy:sy+h,sx:sx+w].copy()))
        x+=w+2;row_height=max(row_height,h)
    height=y+row_height;image=np.zeros((height,width,4),np.uint8);mask=np.zeros_like(image)
    for part,x,y,a,m in placements:
        h,w=a.shape[:2];image[y:y+h,x:x+w]=a;mask[y:y+h,x:x+w]=m;part['rect']=[x,y,w,h]
    return image,mask
for r in records:
    key=r['key'];anatomy,direction=key.split('-');side=1 if direction=='right' else -1
    near='R' if side==1 else 'L';far='L' if near=='R' else 'R'
    p={k:np.array(v,float) for k,v in r['rigPins'].items()}
    parts={name:cv2.imread(str(SOURCE/f'{key}-{name}.png'),-1) for name in ['torso','hips','thigh','calf-foot','upper-arm','forearm','hand']}
    erased=0
    body_original=cv2.imread(str(SOURCE/f'{key}-body.png'),-1);body_clean,body_count=skin_clean(body_original)
    manifest['sourceHashes'][str((SOURCE/f'{key}-body.png').relative_to(ROOT)).replace('\\','/')]=sha((SOURCE/f'{key}-body.png').read_bytes())
    changed=np.any(body_clean!=body_original,axis=2)
    for name in ['torso','hips','thigh','calf-foot']:
        selected=changed&(parts[name][:,:,3]>128);parts[name][:,:,:3][selected]=body_clean[:,:,:3][selected]
    erased+=body_count
    for name in parts:parts[name],count=skin_clean(parts[name]);erased+=count
    parts['upper-arm'],cap_ink=open_shoulder(parts['upper-arm'],parts['torso'],r['shoulderPivot'])
    reference_gray=cv2.cvtColor(parts['torso'],cv2.COLOR_BGRA2GRAY)
    reference=float(np.median(reference_gray[(parts['torso'][:,:,3]>128)&(reference_gray>80)]))
    fy,fx=np.nonzero(parts['calf-foot'][:,:,3]>128);foot_bottom=float(fy.max());sole_x=fx[fy>foot_bottom-12]
    heel_x,toe_x=(float(sole_x.min()),float(sole_x.max())) if side==1 else (float(sole_x.max()),float(sole_x.min()))
    p['heel'+near]=np.array([heel_x,foot_bottom]);p['toe'+near]=np.array([toe_x,foot_bottom])
    # Scale only the approved hand, around its registered wrist.
    wr=np.array(r['measuredPaintingWrist']);row=int(wr[1]);fore=parts['forearm']
    xs=np.flatnonzero(fore[row,:,3]>128);wrist_width=float(xs[-1]-xs[0]+1)
    knuckle=float(r['fittedKnuckleWidth']);factor=max(1,1.1*wrist_width/knuckle) if knuckle<wrist_width else 1
    if factor>1:
        matrix=np.array([[factor,0,wr[0]*(1-factor)],[0,factor,wr[1]*(1-factor)]])
        parts['hand']=warp(parts['hand'],matrix,(fore.shape[1],fore.shape[0]))
    manifest['fixes'].append({'view':key,'handScale':factor,'knuckleWidth':knuckle*factor,'wristWidth':wrist_width,'shoulderInkPixelsRemoved':cap_ink,'isolatedInkPixelsRemoved':erased})
    atlas=np.zeros((H*9,W*4,4),np.uint8);roles=np.zeros_like(atlas);view={'atlas':key+'.png','roles':key+'-roles.png','poses':{},'anatomy':anatomy}
    torso_x=np.flatnonzero(parts['torso'][int(p['waist'][1]),:,3]>128)
    view['torsoWidth']=float((torso_x[-1]-torso_x[0]+1)*S)
    core_docs={}
    for item in core_index:
        slot,style,view_dir=item['document'].split('/')
        if view_dir==direction:core_docs.setdefault(slot+'-'+style,[]).append(item)
    core_atlases={id:np.zeros((H*9,W*3,4),np.uint8) for id in core_docs}
    core_roles={id:np.zeros_like(a) for id,a in core_atlases.items()}
    view['core']={id:{'atlas':key+'-'+id+'.png','roles':key+'-'+id+'-roles.png','poses':{}} for id in core_docs}
    for index,frame in enumerate([None,*range(8)]):
        moving=frame is not None;transforms={};joint={};phase=frame or 0
        waist=p['waist'];torso_angle=side*([2,1,0,-1,-2,-1,0,1][phase] if moving else 0)
        tm=rigid(waist,torso_angle)
        for which,offset in [('near',0),('far',4)]:
            thigh,knee,arm=TABLE[(phase+offset)%8] if moving else (0,0,0)
            hip=p['hip'+near];kp=p['knee'+near];ank=p['ankle'+near]
            lm=rigid(hip,side*thigh);new_knee=transformed(lm,kp)
            cm=rigid(kp,side*(thigh-knee),new_knee)
            am=rigid(p['shoulder'+near],-side*arm,transformed(tm,p['shoulder'+near]))
            elbow=transformed(am,p['elbow'+near]);bend=side*7 if moving and arm<0 else 0
            fm=rigid(p['elbow'+near],-side*arm+bend,elbow)
            transforms[which]=(lm,cm,am,fm)
            s=near if which=='near' else far
            for name,value in [('hip',hip),('knee',new_knee),('ankle',transformed(cm,ank)),('heel',transformed(cm,p['heel'+near])),('toe',transformed(cm,p['toe'+near])),('shoulder',transformed(am,p['shoulder'+near])),('elbow',elbow),('wrist',transformed(fm,wr)),('hand',transformed(fm,p['palm'+near]))]:joint[name+s]=np.array(value)
        # Ground with the actual painted foot pixels, not a fixed foot offset.
        foot_y,foot_x=np.nonzero(parts['calf-foot'][:,:,3]>128);foot=np.column_stack([foot_x,foot_y]);foot=foot[foot[:,1]>p['ankle'+near][1]-10]
        lowest=max(float((foot@m[1][:,:2].T+m[1][:,2])[:,1].max()) for m in transforms.values())
        origin=np.array([48-p['neck'][0]*S,143-lowest*S]);bob=([2,0,-2,0,2,0,-2,0][phase] if moving else 0)
        def output(m,bounce=False):
            projection=np.array([[S*D,0,origin[0]*D],[0,S*D,(origin[1]+(bob if bounce else 0))*D]])
            return combine(projection,m)
        layers={}
        for which in ['far','near']:
            lm,cm,am,fm=transforms[which]
            layers[which+'Leg']=over(affine_image(parts['calf-foot'],output(cm)),affine_image(parts['thigh'],output(lm)))
            layers[which+'Arm']=over(affine_image(parts['upper-arm'],output(am,True)),affine_image(parts['forearm'],output(fm,True)),affine_image(parts['hand'],output(fm,True)))
        hips=affine_image(parts['hips'],output(np.array([[1.,0,0],[0,1.,0]]),True));torso=affine_image(parts['torso'],output(tm,True))
        layers['farLeg'][:,:,:3]=(layers['farLeg'][:,:,:3]*.8).astype('uint8');layers['farArm'][:,:,:3]=(layers['farArm'][:,:,:3]*.8).astype('uint8')
        hand_plane=affine_image(parts['hand'],output(transforms['near'][3],True))
        planes=[over(layers['farLeg'],layers['farArm']),over(layers['nearLeg'],hips,torso),layers['nearArm'],hand_plane]
        body_parts=[]
        for column,a in enumerate(planes):
            a,role=neutral(a,reference);atlas[index*H:(index+1)*H,column*W:(column+1)*W]=a;roles[index*H:(index+1)*H,column*W:(column+1)*W]=role
            by,bx=np.nonzero(a[:,:,3]>0);x0,y0,x1,y1=int(bx.min()),int(by.min()),int(bx.max()+1),int(by.max()+1)
            body_parts.append({'rect':[column*W+x0,index*H+y0,x1-x0,y1-y0],'destination':[x0/D,y0/D]})
        anchors={name:(v*S+origin+([0,bob] if name.startswith(('shoulder','elbow','wrist','hand')) else [0,0])).tolist() for name,v in joint.items()}
        anchors['neck']=(transformed(tm,p['neck'])*S+origin+[0,bob]).tolist();anchors['waist']=(waist*S+origin+[0,bob]).tolist()
        pose_key='idle' if frame is None else str(frame)
        view['poses'][pose_key]={'row':index,'keypoints':anchors,'nearArm':near,'nearLeg':near,'phase':'Standing' if frame is None else phase,'bodyParts':body_parts}
        # The core catalogue uses the existing prepared independent layers,
        # including its previously authored concealed garment surfaces.
        for id,items in core_docs.items():
            slot,style=id.split('-');paint=[np.zeros((H,W,4),np.uint8) for _ in range(3)];material=[np.zeros((H,W,4),np.uint8) for _ in range(3)];levels=[]
            for item in items:
                image=core_images[item['file']];layer=item['id'];s=layer[-1] if layer[-1] in ['R','L'] else None
                target_side=s or near;is_far=target_side!=near
                point=lambda name:np.array(anchors[name+target_side])
                if slot=='upper':
                    if 'sleeveUpper' in layer:
                        a=[137,145] if direction=='right' and s==near else [144,145];b=[143 if direction=='right' else 144,180]
                        end=point('elbow') if style=='hoodie' else point('shoulder')+(point('elbow')-point('shoulder'))*.57
                        matrix=bone(a,b,point('shoulder'),end,1.0);column=0 if is_far else 2
                    elif 'sleeveLower' in layer:
                        matrix=bone([143,180],[143,217],point('elbow'),point('wrist'),.95);column=0 if is_far else 2
                    else:
                        neck=np.array(anchors['neck']);waist=np.array(anchors['waist']);half=view['torsoWidth']/2+(2.5 if style=='hoodie' else 1.5)
                        matrix=triangle([[144,135],[144,221],[175,221]],[neck+[0,1],waist+[0,2],waist+[half,2]]);column=1
                elif slot=='lower':
                    if 'waist' in layer:
                        waist=np.array(anchors['waist']);half=view['torsoWidth']/2+.7
                        matrix=triangle([[130,235],[158,235],[144,249]],[waist+[-half,1],waist+[half,1],point('hip')]);column=1
                    else:
                        low='calf' in layer or 'cuff' in layer
                        if low:matrix=bone([140,278],[138 if direction=='right' else 151,307],point('knee'),point('ankle'),.88)
                        else:
                            end=point('knee') if style=='jeans' else point('hip')+(point('knee')-point('hip'))*.63
                            matrix=bone([143,246],[140,278 if style=='jeans' else 274],point('hip'),end,1.0)
                        column=0 if is_far else 1
                else:
                    # The prepared shoe's painted sole ends at ~320, before
                    # the 324px sheet boundary. Anchor the ART, not its canvas.
                    sole=core_images[next(v['file'] for v in items if 'sole.' in v['id'])]
                    sy,sx=np.nonzero(sole[:,:,3]>128);sole_y=float(sy.max());edge_x=sx[sy>sole_y-3]
                    lo,hi=float(edge_x.min()),float(edge_x.max())
                    src=[[138,307],[lo,sole_y],[hi,sole_y]] if direction=='right' else [[150,307],[hi,sole_y],[lo,sole_y]]
                    matrix=triangle(src,[point('ankle'),point('heel'),point('toe')]);column=0 if is_far else 1
                transformed_image=affine_image(image,matrix)
                role=image.copy();role[:,:,:3]=0
                if item['role'] in ['upper.primary','lower.primary','footwear.primary']:
                    g=cv2.cvtColor(image,cv2.COLOR_BGRA2GRAY);role[:,:,0][g>25]=255;levels.extend(g[(image[:,:,3]>128)&(g>30)].tolist())
                transformed_role=affine_image(role,matrix)
                if is_far:transformed_image[:,:,:3]=np.rint(transformed_image[:,:,:3]*.8).astype('uint8')
                paint[column]=over(paint[column],transformed_image);material[column]=over(material[column],transformed_role)
                if slot=='footwear' and 'sole.' in layer and s==near:
                    fs=far;matrix_far=triangle(src,[anchors['ankle'+fs],anchors['heel'+fs],anchors['toe'+fs]])
                    paint[0]=over(paint[0],affine_image(image,matrix_far));material[0]=over(material[0],affine_image(role,matrix_far))
            if slot=='lower':
                # Fill concealed cloth from its OWN painted pixels over the
                # actual posed leg/hips alpha. The body pixels never deform.
                yy,xx=np.indices((H,W));pixels=np.stack([xx,yy],axis=-1)
                for column,which in [(0,'far'),(1,'near')]:
                    s=far if which=='far' else near
                    covered=layers[which+'Leg'][:,:,3]>128
                    if style=='jeans':
                        start=np.array(anchors['knee'+s])*D;end=np.array(anchors['ankle'+s])*D;limit=1.12
                    else:
                        start=np.array(anchors['hip'+s])*D;end=np.array(anchors['knee'+s])*D;limit=.65
                    vector=end-start;position=np.sum((pixels-start)*vector,axis=2)/np.dot(vector,vector)
                    covered&=position<limit
                    if which=='near':covered|=hips[:,:,3]>128
                    covered=cv2.dilate(covered.astype('uint8'),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))>0
                    a=paint[column];gray=cv2.cvtColor(a,cv2.COLOR_BGRA2GRAY);donor=(a[:,:,3]>128)&(gray>25)
                    fill=covered&(a[:,:,3]<128)
                    if fill.any() and donor.any():
                        a[:,:,:3][fill]=nearest_paint(a,donor)[fill];a[:,:,3][fill]=255
                        material[column][:,:,0][fill]=255;material[column][:,:,3][fill]=255
                    alpha=a[:,:,3]>128;edge=alpha&~(cv2.erode(alpha.astype('uint8'),np.ones((3,3),np.uint8))>0)
                    a[:,:,:3][edge]=[30,35,45];material[column][:,:,:3][edge]=0
            view['core'][id]['base']=float(np.median(levels)) if levels else 100
            view['core'][id]['poses'][pose_key]=[pack_part(core_atlases[id],core_roles[id],a,m,index,col) for col,(a,m) in enumerate(zip(paint,material))]
    atlas,roles=compact(atlas,roles,[part for pose in view['poses'].values() for part in pose['bodyParts']])
    save(view['atlas'],atlas);save(view['roles'],roles);manifest['views'][key]=view
    for id,entry in view['core'].items():
        a,m=compact(core_atlases[id],core_roles[id],[part for pose in entry['poses'].values() for part in pose])
        save(entry['atlas'],a);save(entry['roles'],m)
    for name in parts:
        source=SOURCE/f'{key}-{name}.png';manifest['sourceHashes'][str(source.relative_to(ROOT)).replace('\\','/')]=sha(source.read_bytes())
# Freeze garment role masks once; runtime never guesses skin from pixel colour.
for id,entry in old['items'].items():
    if entry['kind']=='skin':continue
    source=STRIDE/entry['atlas'];a=cv2.imread(str(source),-1);b=a.copy();blue=b[:,:,0].astype(float);green=b[:,:,1].astype(float);red=b[:,:,2].astype(float)
    brass=(red>120)&(green>85)&(green>blue*2.6)&(red<green*1.65)
    skin=(red>55)&(green>25)&(red>green*1.15)&(green>blue+6)&~brass
    if entry['kind']=='shoe' and entry['style']!='sandals':skin=np.zeros(skin.shape,bool)
    b[skin]=0
    role=np.zeros_like(b);role[:,:,3]=b[:,:,3]
    cream=(red>175)&(green>160)&(blue>125)&(abs(red-green)<45)
    fixed=brass|((cream if entry['kind']=='top' and not entry.get('fullSuit') else np.zeros(skin.shape,bool)))
    role[:,:,0][~fixed]=255
    name='garment-'+id+'.png';role_name='garment-'+id+'-roles.png';save(name,b);save(role_name,role)
    manifest['garments'][id]={'atlas':name,'roles':role_name,'kind':entry['kind'],'style':entry['style'],'fullSuit':entry.get('fullSuit',False),'longHem':entry.get('longHem',False),'profileBases':entry.get('profileBases',{}),'frames':{k:{'parts':v['parts'],'profileBases':v.get('profileBases',{})} for k,v in entry['frames'].items() if k.startswith(('right/','left/'))}}
    manifest['sourceHashes'][str(source.relative_to(ROOT)).replace('\\','/')]=sha(source.read_bytes())
manifest['sourceRig']=old['rig']
(OUT/'manifest.json').write_text(json.dumps(manifest,separators=(',',':'),allow_nan=False)+'\n',newline='\n')
print(json.dumps({'views':len(manifest['views']),'bodyPoses':54,'garments':len(manifest['garments']),'fixes':manifest['fixes']},indent=2))
