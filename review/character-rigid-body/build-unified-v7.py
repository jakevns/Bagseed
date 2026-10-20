"""Six-view native rig review, five panels. No production/walk integration."""
from pathlib import Path
import json,hashlib
from native_review import *
from PIL import ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
BASE=ROOT/'graphics/character-system/sources/unified-body-v6';OUT=ROOT/'graphics/character-system/sources/unified-body-v7'
HANDS=ROOT/'graphics/character-system/sources/torso-hips-v5'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
PAD=230;TOP=80;NATIVE_WIDTH=400
def pad(a):return cv2.copyMakeBorder(a,TOP,TOP,PAD,PAD+NATIVE_WIDTH-a.shape[1],cv2.BORDER_CONSTANT,value=0)
def mapped(m,p):return m[:,:2]@p+m[:,2]
def tint(a):
    b=a.copy();b[:,:,:3]=np.rint(b[:,:,:3]*.8).astype('uint8');return b
def notch(a,fold):
    mask=(a[:,:,3]>128).astype('uint8');closed=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(17,17)))
    yy=np.indices(mask.shape)[0];added=(closed>0)&(mask==0)&(abs(yy-fold)<30)
    distance=cv2.distanceTransform(1-mask,cv2.DIST_L2,5)
    return float(distance[added].max()) if added.any() else 0
def edge_distance(a,b):
    am=a[:,:,3]>128;bm=b[:,:,3]>128
    ae=am&~(cv2.erode(am.astype('uint8'),np.ones((3,3),np.uint8))>0)
    be=bm&~(cv2.erode(bm.astype('uint8'),np.ones((3,3),np.uint8))>0)
    da=cv2.distanceTransform((~ae).astype('uint8'),cv2.DIST_L2,5);db=cv2.distanceTransform((~be).astype('uint8'),cv2.DIST_L2,5)
    values=np.concatenate([da[be],db[ae]])
    if not ae.any() or not be.any():return {'max':None,'p95':None,'mean':None,'error':'empty hand contour'}
    return {'max':float(values.max()),'p95':float(np.percentile(values,95)),'mean':float(values.mean())}
reports=[]
previous_reports={r['key']:r for r in json.loads((OUT/'rig-review.json').read_text())} if (OUT/'rig-review.json').exists() else {}
for item in json.loads((OUT/'prepared.json').read_text()):
    key=item['key'];body=cv2.imread(str(OUT/f'{key}-body.png'),-1);original=cv2.imread(str(BASE/f'{key}-original.png'),-1)
    h,w=body.shape[:2];near=item['near'];side=1 if item['direction']=='right' else -1
    p={k:np.array(v,float) for k,v in item['pins'].items()};waist=p['waist'][1];knee=p['knee'+near][1]
    fold={'male':447,'female':445,'androgynous':447}[item['anatomy']]-item['crop'][1]
    ink={'color':np.array(item['outlineColorBGR'],np.uint8),'width':item['outlineWidth'],'graySkinMedian':item['skinMedian']}
    pieces={'torso':cut(body,bottom=waist+10),'hips':cut(body,waist-10,fold+15),
            'thigh':cut(body,fold-10,knee+12,side,slanted=True),'calf-foot':cut(body,knee-12)}
    # Full deltoid from original painted arm, with its existing curved top.
    ownership=cv2.imread(str(BASE/f'{key}-hole.png'),0)>0
    upper_region=np.indices((h,w))[0]<p['elbow'+near][1]-35
    extension=(cv2.dilate(ownership.astype('uint8'),np.ones((7,7),np.uint8))>0)&upper_region&(original[:,:,3]>128)
    ownership|=extension
    # The inherited generic arm polygon is only a search prior. Follow the
    # ORIGINAL painted forearm ink instead of retaining its extra side skin.
    original_gray=cv2.cvtColor(original,cv2.COLOR_BGRA2GRAY)
    measured_edges={}
    for row in range(int(p['elbow'+near][1]-110),int(p['wrist'+near][1]+20)):
        prior=np.flatnonzero(ownership[row]);threshold=.75 if row<p['elbow'+near][1]-40 else .6
        dark=np.flatnonzero((original_gray[row]<ink['graySkinMedian']*threshold)&(original[row,:,3]>128))
        if len(prior)<2 or len(dark)<2:continue
        groups=np.split(dark,np.flatnonzero(np.diff(dark)>2)+1)
        pairs=[]
        for left in groups:
            for right in groups:
                if right[0]-left[-1]<22:continue
                if right[-1]-left[0]>115:continue
                if abs(left.mean()-prior[0])>38 or abs(right.mean()-prior[-1])>38:continue
                expected_width=np.interp(row,[p['shoulder'+near][1],p['elbow'+near][1],p['wrist'+near][1]],[90,75,55])
                score=abs(left.mean()-prior[0])+abs(right.mean()-prior[-1])+2*abs((right[-1]-left[0]+1)-expected_width)
                pairs.append((score,int(left[0]),int(right[-1])))
        if pairs:
            _,lo,hi=min(pairs);ownership[row]=False;ownership[row,lo:hi+1]=True;measured_edges[row]=(lo,hi)
    edge_rows=sorted(measured_edges)
    if edge_rows:
        edges=np.array([measured_edges[row] for row in edge_rows],np.float32)
        for column in [0,1]:edges[:,column]=np.median(np.lib.stride_tricks.sliding_window_view(np.pad(edges[:,column],(4,4),mode='edge'),9),axis=1)
        for row,(lo,hi) in zip(edge_rows,np.rint(edges).astype(int)):
            ownership[row]=False;ownership[row,lo:hi+1]=True;measured_edges[row]=(int(lo),int(hi))
    old_wrist=p['wrist'+near].copy()
    wrist_rows=np.arange(int(old_wrist[1]-45),int(old_wrist[1]-8))
    wrist_rows=np.array([row for row in wrist_rows if row in measured_edges])
    widths=np.array([measured_edges[row][1]-measured_edges[row][0]+1 for row in wrist_rows],float)
    widths=np.convolve(np.pad(widths,(2,2),mode='edge'),np.ones(5)/5,mode='valid')
    wrist_row=int(wrist_rows[np.argmin(widths)]);wrist_edges=measured_edges[wrist_row]
    p['wrist'+near]=np.array([(wrist_edges[0]+wrist_edges[1])/2,wrist_row],float)
    arm_source=original.copy();arm_source[~ownership]=0
    distance=cv2.distanceTransform((arm_source[:,:,3]>128).astype('uint8'),cv2.DIST_L2,5)
    yy=np.indices((h,w))[0];search=(yy>p['shoulder'+near][1]-20)&(yy<p['elbow'+near][1]-45)
    weighted=distance.copy();weighted[~search]=0
    sy,sx=np.unravel_index(weighted.argmax(),weighted.shape);shoulder=np.array([sx,sy],float)
    # Existing source alpha supplies the whole shoulder. No cut through deltoid.
    arm_source=clean_edge(arm_source,ink,follow_dark=True)
    arm_mask=(arm_source[:,:,3]>128).astype('uint8')
    arm_mask=cv2.morphologyEx(arm_mask,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*ink['width']+1,)*2))
    arm_source[arm_mask==0]=0
    arm_source=clean_edge(arm_source,ink,follow_dark=False)
    # The arm owns its curved exterior. Interior cut-line ink at the shoulder
    # is not anatomy: remove only dark remnants deep inside that painted cap.
    ay,axgrid=np.indices((h,w));arm_depth=cv2.distanceTransform((arm_source[:,:,3]>128).astype('uint8'),cv2.DIST_L2,5)
    shoulder_area=(axgrid-shoulder[0])**2+(ay-shoulder[1])**2<45**2
    arm_gray=cv2.cvtColor(arm_source,cv2.COLOR_BGRA2GRAY)
    seam=shoulder_area&(arm_depth>8)&(arm_gray<ink['graySkinMedian']*.6)
    donor=(arm_depth>8)&(arm_gray>ink['graySkinMedian']*.65)
    if seam.any() and donor.any():arm_source[:,:,:3][seam]=nearest_paint(arm_source,donor)[seam]
    elbow=p['elbow'+near];wrist=p['wrist'+near]
    upper=cut(arm_source,bottom=elbow[1]+12);fore=cut(arm_source,elbow[1]-12,wrist[1]+4)
    hand_file=HANDS/f"{key}-approved-hand.png";approved=cv2.imread(str(hand_file),-1)
    knuckle_rows={'androgynous-right':215,'androgynous-left':215,'female-right':155,'female-left':155,'male-right':158,'male-left':145}
    # The approved cutout begins at its wrist. Measure that actual edge,
    # rather than selecting an attachment row inside the palm.
    occupied_rows=np.flatnonzero((approved[:,:,3]>128).sum(axis=1)>4)
    aw=int(occupied_rows[0]+3);ak=knuckle_rows[key];knuckle_y=int(p['palm'+near][1])
    ax=np.flatnonzero(approved[ak,:,3]>128);wx=np.flatnonzero(approved[aw,:,3]>128)
    native=np.flatnonzero(ownership[min(knuckle_y,h-1)])
    gray=cv2.cvtColor(original,cv2.COLOR_BGRA2GRAY)
    candidates=np.flatnonzero((gray[knuckle_y]<item['skinMedian']*.65)&(original[knuckle_y,:,3]>128)&(np.arange(w)>=native[0]-8)&(np.arange(w)<=native[-1]+8))
    if len(candidates)>1 and candidates[-1]-candidates[0]>=.6*(native[-1]-native[0]):native=np.arange(candidates[0],candidates[-1]+1)
    # Approved cutouts include a short wrist stub. Locate the attachment
    # cross-section by its painted width, rather than attaching the flat cap.
    native_wrist_width=wrist_edges[1]-wrist_edges[0]+1
    native_knuckle_width=native[-1]-native[0]+1
    possible=[]
    for row in range(int(occupied_rows[0])+5,min(int(occupied_rows[0])+66,ak-10)):
        row_x=np.flatnonzero(approved[row,:,3]>128)
        if len(row_x)>1:
            width=(row_x[-1]-row_x[0]+1)*native_knuckle_width/(ax[-1]-ax[0]+1)
            possible.append((abs(width-native_wrist_width),row))
    if possible:aw=min(possible)[1];wx=np.flatnonzero(approved[aw,:,3]>128)
    approved=approved.copy()
    # Preserve the approved hand's shape. The flat ink at its source wrist
    # boundary is a cut edge, so remove that ink from the JOIN interior only.
    # The original approved file and the hand's exterior sides remain intact.
    ap_gray=cv2.cvtColor(approved,cv2.COLOR_BGRA2GRAY);ap_alpha=approved[:,:,3]>128
    source_top=int(occupied_rows[0]);py,px=np.indices(ap_alpha.shape)
    top_band=ap_alpha&(py<=source_top+9)
    middle=(px>wx[0]+4)&(px<wx[-1]-4)
    top_ink=top_band&middle&(ap_gray<np.median(ap_gray[ap_alpha])*.6)
    retained=ap_alpha&(py>source_top+10)&(ap_gray>np.median(ap_gray[ap_alpha])*.65)
    if top_ink.any():approved[:,:,:3][top_ink]=nearest_paint(approved,retained)[top_ink]
    source_axis=np.array([ax.mean()-wx.mean(),ak-aw]);target_axis=wrist-elbow
    source_angle=np.arctan2(source_axis[0],source_axis[1]);target_angle=np.arctan2(target_axis[0],target_axis[1])
    rotation=float(np.degrees(target_angle-source_angle))
    theta=np.radians(rotation);rot=np.array([[np.cos(theta),np.sin(theta)],[-np.sin(theta),np.cos(theta)]])
    native_width=float(native[-1]-native[0]+1)
    hand_scale=native_width/((ax[-1]-ax[0]+1)*abs(np.cos(theta)))
    hm=np.column_stack([hand_scale*rot,wrist-hand_scale*rot@np.array([wx.mean(),aw])])
    # Fit the overlap within the user's existing width/centre tolerances.
    # Each candidate remains a single rigid hand with one uniform scale.
    x0=max(0,int(wrist[0])-75);x1=min(w,int(wrist[0])+76)
    y0=int(wrist[1])-12;y1=int(wrist[1])+13
    fore_roi=fore[y0:y1,x0:x1,3];best_hand=None
    for factor in np.linspace(.96,1.04,9):
        scale=hand_scale*factor;fit_width=(ax[-1]-ax[0])*scale*abs(np.cos(theta))+1
        if abs(fit_width-native_width)/native_width>.05:continue
        for dx in range(-2,3):
            for dy in range(-1,2):
                if dx*dx+dy*dy>4:continue
                target=wrist+[dx,dy]
                matrix=np.column_stack([scale*rot,target-scale*rot@np.array([wx.mean(),aw])])
                local=matrix.copy();local[:,2]-=[x0,y0]
                ha=cv2.warpAffine(approved[:,:,3],local,(x1-x0,y1-y0),flags=cv2.INTER_LINEAR)
                merged=np.maximum(fore_roi,ha)>128;edges=[]
                for row in merged:
                    xs=np.flatnonzero(row)
                    if len(xs):edges.append([xs[0],xs[-1]])
                if len(edges)!=y1-y0:continue
                step=float(np.max(abs(np.diff(np.array(edges),axis=0))))
                score=step+.01*(dx*dx+dy*dy)+.1*abs(factor-1)
                if best_hand is None or score<best_hand[0]:best_hand=(score,scale,matrix)
    if best_hand:_,hand_scale,hm=best_hand
    hand=warp(approved,hm,(w,h))
    hy,hx=np.nonzero(approved[:,:,3]>128)
    transformed_pixels=np.column_stack([hx,hy])@hm[:,:2].T+hm[:,2]
    hand_cut_off=bool(np.any(transformed_pixels[:,0]<0)|np.any(transformed_pixels[:,0]>=w)|np.any(transformed_pixels[:,1]<0)|np.any(transformed_pixels[:,1]>=h))
    fs=cv2.erode((fore[:,:,3]>250).astype('uint8'),np.ones((7,7),np.uint8))>0
    hs=cv2.erode((hand[:,:,3]>250).astype('uint8'),np.ones((7,7),np.uint8))>0
    fg=cv2.cvtColor(fore,cv2.COLOR_BGRA2GRAY);hg=cv2.cvtColor(hand,cv2.COLOR_BGRA2GRAY)
    fs&=fg>item['skinMedian']*.65;hs&=hg>item['skinMedian']*.65
    if not fs.any() or not hs.any():raise ValueError(key+' missing forearm/hand skin samples')
    gain=fore[:,:,:3][fs].mean(axis=0)/np.maximum(hand[:,:,:3][hs].mean(axis=0),1)
    hand[:,:,:3]=np.clip(np.rint(hand[:,:,:3]*gain),0,255).astype('uint8')
    arm=over(upper,fore,hand)
    combined_wrist=over(fore,hand);join_edges=[]
    for row in range(int(wrist[1])-12,int(wrist[1])+13):
        xs=np.flatnonzero(combined_wrist[row,:,3]>128)
        join_edges.append([int(xs[0]),int(xs[-1])])
    wrist_step=float(np.max(np.abs(np.diff(np.array(join_edges),axis=0))))
    wrist_xy=np.rint(wrist).astype(int)
    wrist_gap=bool(combined_wrist[wrist_xy[1]-2:wrist_xy[1]+3,wrist_xy[0]-2:wrist_xy[0]+3,3].min()<250)
    knuckle_ends=np.array([mapped(hm,np.array([ax[0],ak])),mapped(hm,np.array([ax[-1],ak]))])
    fitted_knuckle_width=float(abs(knuckle_ends[1,0]-knuckle_ends[0,0])+1)
    fitted_axis=hm[:,:2]@source_axis
    wrist_angle_error=float(np.degrees(np.arccos(np.clip(np.dot(fitted_axis,target_axis)/(np.linalg.norm(fitted_axis)*np.linalg.norm(target_axis)),-1,1))))
    old_hand=original.copy();old_hand[~ownership]=0;old_hand=cut(old_hand,top=wrist[1]-6)
    reference_hand=cut(old_hand,top=wrist[1]+3);registered_hand=cut(hand,top=wrist[1]+3)
    hand_errors=edge_distance(registered_hand,reference_hand)
    # Search permitted pivot positions INSIDE painted hips. Geometry stays fixed.
    original_hip=p['hip'+near];hip=original_hip.copy();best=None
    old=previous_reports.get(key);same_hip_geometry=bool(old and old['previousHipPivot']==original_hip.tolist() and old['fold']==fold)
    for part_name,part in pieces.items():
        saved=cv2.imread(str(OUT/f'{key}-{part_name}.png'),-1)
        same_hip_geometry&=saved is not None and saved.shape==part.shape and np.array_equal(saved[:,:,3],part[:,:,3])
    if same_hip_geometry:best=(0,np.array(old['hipPivot']),old['hipSearchDepths'])
    for dx in ([] if same_hip_geometry else range(-16,25,4)):
        for dy in range(-8,17,4):
            candidate=original_hip+[side*dx,dy]
            cx,cy=np.rint(candidate).astype(int)
            if not(0<=cx<w and 0<=cy<h and pieces['hips'][cy,cx,3]>128):continue
            scores=[]
            for angle in [-25,25]:
                source_mask=((pieces['calf-foot'][:,:,3]>128)|(pieces['thigh'][:,:,3]>128)).astype('uint8')
                moved=cv2.warpAffine(source_mask,rigid(candidate,angle),(w,h),flags=cv2.INTER_NEAREST)>0
                alpha=moved|(pieces['hips'][:,:,3]>128)|(pieces['torso'][:,:,3]>128)
                test=np.zeros_like(body);test[:,:,3]=alpha.astype('uint8')*255
                scores.append(notch(test,fold))
            score=max(scores)+.003*np.linalg.norm(candidate-original_hip)
            if best is None or score<best[0]:best=(score,candidate,scores)
    if best:hip=best[1]
    # Fixed stages: far leg/arm, near calf, near thigh, hips, torso, near arm.
    far_leg=tint(over(pieces['calf-foot'],pieces['thigh']));far_arm=tint(arm)
    shape=(NATIVE_WIDTH+2*PAD,h+2*TOP);offset=np.array([PAD,TOP]);hip_pad=hip+offset;shoulder_pad=shoulder+offset
    layers=pieces
    def render(thigh_angle=0,arm_angle=0,walk_frame=None):
        phase=0 if walk_frame==0 else 4
        if walk_frame is None:
            leg=warp(pad(over(layers['calf-foot'],layers['thigh'])),rigid(hip_pad,thigh_angle),shape)
            farleg=pad(far_leg);neararm=warp(pad(arm),rigid(shoulder_pad,arm_angle),shape);fararm=pad(far_arm)
            nearhand=warp(pad(hand),rigid(shoulder_pad,arm_angle),shape);farhand=pad(hand)
        else:
            ta=side*(20 if phase==0 else -20);ka=3 if phase==0 else 5;aa=-side*(18 if phase==0 else -18)
            tm=rigid(hip_pad,ta);kp=mapped(tm,p['knee'+near]+offset)
            cm=rigid(p['knee'+near]+offset,ta-side*ka,kp)
            leg=over(warp(pad(layers['calf-foot']),cm,shape),warp(pad(layers['thigh']),tm,shape))
            ftm=rigid(hip_pad,-ta);fkp=mapped(ftm,p['knee'+near]+offset)
            fcm=rigid(p['knee'+near]+offset,-ta-side*(5 if phase==0 else 3),fkp)
            farleg=tint(over(warp(pad(layers['calf-foot']),fcm,shape),warp(pad(layers['thigh']),ftm,shape)))
            neararm=warp(pad(arm),rigid(shoulder_pad,aa),shape);fararm=warp(pad(far_arm),rigid(shoulder_pad,-aa),shape)
            nearhand=warp(pad(hand),rigid(shoulder_pad,aa),shape);farhand=warp(pad(hand),rigid(shoulder_pad,-aa),shape)
        lower=over(farleg,fararm,leg,pad(layers['hips']),pad(layers['torso']))
        raw=over(lower,neararm)
        common=(neararm[:,:,3]==255)&(lower[:,:,3]==255)
        # Pixel proof: near arm is the last opaque contributor, all angles.
        order_errors=int(np.any(raw[:,:,:3]!=neararm[:,:,:3],axis=2)[common].sum())
        bad_order=over(neararm,lower)
        negative_control=int(np.any(bad_order[:,:,:3]!=raw[:,:,:3],axis=2)[common].sum())
        finished=clean_edge(raw,ink,follow_dark=False,preserve_alpha=(nearhand[:,:,3]>128)|(farhand[:,:,3]>128))
        return finished,{'nearArmOrderErrors':order_errors,'overlapPixels':int(common.sum()),'reversedOrderDifferentPixels':negative_control}
    standing,standing_order=render();standing_crop=standing[TOP:TOP+h,PAD:PAD+w]
    armless=clean_edge(over(pieces['calf-foot'],pieces['thigh'],pieces['hips'],pieces['torso']),ink,follow_dark=False)
    cv2.imwrite(str(OUT/f'{key}-standing.png'),standing)
    cv2.imwrite(str(OUT/f'{key}-standing-native.png'),standing_crop)
    cv2.imwrite(str(OUT/f'{key}-armless.png'),pad(armless))
    poses={};order={'standing':standing_order}
    for name,ta,aa in [('thigh-plus25',25,0),('thigh-minus25',-25,0),('arm-plus20',0,20),('arm-minus20',0,-20)]:
        image,o=render(ta,aa);poses[name]=image;order[name]=o;cv2.imwrite(str(OUT/f'{key}-{name}.png'),image)
    for frame in [0,4]:
        image,o=render(walk_frame=frame);poses['walk'+str(frame)]=image;order['walk'+str(frame)]=o;cv2.imwrite(str(OUT/f'{key}-walk{frame}.png'),image)
    # Save SOURCE cuts as inspectable native PNGs. No finishing ink at cut lines.
    for name,image in {**pieces,'upper-arm':upper,'forearm':fore,'hand':hand}.items():cv2.imwrite(str(OUT/f'{key}-{name}.png'),image)
    board=Image.new('RGB',(1600,1500),'#d7dadd');draw=ImageDraw.Draw(board)
    groups=[('1 Armless unified body',[armless]),('2 Standing | original',[standing_crop,original]),
            ('3 Thigh +25 | -25',[poses['thigh-plus25'],poses['thigh-minus25']]),('4 Near arm +20 | -20',[poses['arm-plus20'],poses['arm-minus20']]),
            ('5 Review only: Walk 0 | Walk 4',[poses['walk0'],poses['walk4']])]
    display_scale=min(.46,384/shape[0],440/shape[1])
    for i,(title,images) in enumerate(groups):
        px=(i%2)*800;py=(i//2)*500;draw.text((px+12,py+10),title,font=font,fill='#14212a');slot=800/len(images)
        for j,image in enumerate(images):
            if image.shape[:2]==(h,w):image=pad(image)
            pil=Image.fromarray(cv2.cvtColor(image,cv2.COLOR_BGRA2RGBA));s=display_scale
            pil=pil.resize((round(pil.width*s),round(pil.height*s)),Image.Resampling.LANCZOS)
            board.paste(pil,(round(px+j*slot+(slot-pil.width)/2),py+48),pil)
    draw.multiline_text((820,1070),'Native source scale retained.\nNo image generation or warping.\nWalk 0/4 are review-only renders.\nBody approval is pending.',font=font,fill='#14212a',spacing=10)
    board.save(OUT/f'{key}-five-panel.png')
    record={'key':key,'board':f'{key}-five-panel.png','source':item['source'],'mirror':item.get('mirror'),
            'rigPins':{**{name:value.tolist() for name,value in p.items()},'shoulder'+near:shoulder.tolist(),'hip'+near:hip.tolist()},
            'shoulderPivot':shoulder.tolist(),'previousShoulderPivot':p['shoulder'+near].tolist(),'hipPivot':hip.tolist(),'previousHipPivot':original_hip.tolist(),
            'hipSearchDepths':best[2] if best else None,'fold':fold,'waist':waist,'knee':knee,
            'outlineColorBGR':ink['color'].tolist(),'outlineWidth':ink['width'],'skinMedian':ink['graySkinMedian'],
            'handKnuckleSourceRow':ak,'handWristSourceRow':aw,'handUniformScale':hand_scale,'handMatrix':hm.tolist(),
            'originalContractWrist':old_wrist.tolist(),'measuredPaintingWrist':wrist.tolist(),
            'handRotationDegrees':rotation,'handForearmAngleErrorDegrees':wrist_angle_error,
            'originalKnuckleWidth':native_width,'fittedKnuckleWidth':fitted_knuckle_width,
            'knuckleWidthDifference':abs(fitted_knuckle_width-native_width)/native_width,
            'wristJoinMaxRowStep':wrist_step,'wristJoinGap':wrist_gap,
            'standingHandInFront':standing_order['nearArmOrderErrors']==0,
            'handCutOff':hand_cut_off,
            'handWristError':float(np.linalg.norm(mapped(hm,np.array([wx.mean(),aw]))-wrist)),
            'handEdgeDistances':hand_errors,'handSourceSHA256':hashlib.sha256(hand_file.read_bytes()).hexdigest(),
            'standingOutlineDifference':alpha_difference(standing_crop,original),'nearArmDrawOrder':order,
            'nativePartCanvas':[w,h],'reviewCanvas':list(shape),'testPadding':[PAD,TOP],'partOrder':['far-leg','far-arm','near-calf','near-thigh','hips','torso','near-arm'],
            'displayScale':display_scale,'walkPoseTable':{'0':{'thigh':20,'knee':3,'arm':-18,'farThigh':-20,'farKnee':5},'4':{'thigh':-20,'knee':5,'arm':18,'farThigh':20,'farKnee':3}},
            'imageGenerationCalls':0,'walkIntegrated':False,'approved':False}
    reports.append(record)
(OUT/'rig-review.json').write_text(json.dumps(reports,indent=2,allow_nan=False)+'\n',newline='\n')
(OUT/'contract.json').write_text(json.dumps({'nativePixelUnits':True,'productionContractChanged':False,'views':[{k:r[k] for k in ['key','nativePartCanvas','rigPins','partOrder','walkPoseTable','handMatrix']} for r in reports]},indent=2,allow_nan=False)+'\n',newline='\n')
print(json.dumps([{'key':r['key'],'shoulder':r['shoulderPivot'],'hip':r['hipPivot'],'notches':r['hipSearchDepths'],'handEdge':r['handEdgeDistances'],'outline':r['standingOutlineDifference']} for r in reports],indent=2))
