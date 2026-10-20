"""Cut ONE native painted body into overlapping parts; static tests only."""
import sys,json,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent.parent
PACK=ROOT/'graphics/character-system/sources/unified-body-v6'
APPROVED=ROOT/'graphics/character-system/sources/torso-hips-v5'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
def compose(*layers):
    out=Image.new('RGBA',(layers[0].shape[1],layers[0].shape[0]))
    for a in layers:out.alpha_composite(Image.fromarray(cv2.cvtColor(a,cv2.COLOR_BGRA2RGBA)))
    return cv2.cvtColor(np.array(out),cv2.COLOR_RGBA2BGRA)
def rotate(image,pivot,angle):
    m=cv2.getRotationMatrix2D(tuple(pivot),angle,1)
    return cv2.warpAffine(image,m,(image.shape[1],image.shape[0]),flags=cv2.INTER_LANCZOS4)
def crop_curve(image,top=None,bottom=None):
    h,w=image.shape[:2];yy,xx=np.indices((h,w));keep=np.ones((h,w),bool)
    def boundary(y):
        row=image[int(np.clip(y,0,h-1)),:,3]>128;xs=np.flatnonzero(row)
        mid=float(xs.mean()) if len(xs) else w/2;half=max(10,float(xs[-1]-xs[0])/2 if len(xs) else 50)
        return y+4*np.cos(np.clip((xx-mid)/half,-1,1)*np.pi/2)
    if top is not None:keep&=yy>=boundary(top)
    if bottom is not None:keep&=yy<=boundary(bottom)
    out=image.copy();out[~keep]=0;return out
def holes(image):
    alpha=(image[:,:,3]>128).astype('uint8')*255
    pad=cv2.copyMakeBorder(alpha,1,1,1,1,cv2.BORDER_CONSTANT,value=0);flood=pad.copy();cv2.floodFill(flood,None,(0,0),255)
    void=cv2.bitwise_not(flood[1:-1,1:-1])&~alpha
    return int((void>0).sum())
def silhouette_diff(a,b):
    aa=a[:,:,3]>128;bb=b[:,:,3]>128
    return float(np.logical_xor(aa,bb).sum()/max(np.logical_or(aa,bb).sum(),1))
reports=[]
for item in json.loads((PACK/'inputs.json').read_text()):
    key=item['key'];file=PACK/f'{key}-armless.png'
    if not file.exists():continue
    body=cv2.imread(str(file),-1);original=cv2.imread(str(PACK/f'{key}-original.png'),-1)
    h,w=body.shape[:2];p=item['pins'];near=item['near'];waist=p['waist'][1];knee=p['knee'+near][1]
    fold={'male':447,'female':445,'androgynous':447}[item['anatomy']]-item['crop'][1]
    pieces={'torso':crop_curve(body,bottom=waist+10),'hips':crop_curve(body,waist-10,fold+15),
            'thigh':crop_curve(body,fold-15,knee+12),'calf-foot':crop_curve(body,knee-12)}
    union=compose(pieces['calf-foot'],pieces['thigh'],pieces['hips'],pieces['torso'])
    # Extract near arm ONCE from original source ownership; never from v5 art.
    ownership=cv2.imread(str(PACK/f'{key}-hole.png'),0)>0
    # Measure the PAINTING'S dark wrist contour using the original ownership
    # guide; keep the continuous source arm contour for extraction.
    source_gray=cv2.cvtColor(original,cv2.COLOR_BGRA2GRAY)
    source_skin=(original[:,:,3]>128)
    ink_limit=float(np.median(source_gray[source_skin]))*.65
    ownership=ownership&source_skin
    whole_arm=original.copy();whole_arm[~ownership]=0
    # Restore only missing exterior arm ink on the ORIGINAL arm silhouette.
    arm_alpha=whole_arm[:,:,3]>128
    edge=arm_alpha&~(cv2.erode(arm_alpha.astype('uint8'),np.ones((7,7),np.uint8))>0)
    gray=cv2.cvtColor(original,cv2.COLOR_BGRA2GRAY)
    ink=edge&(gray<np.median(gray[arm_alpha])*.6)
    color=np.median(original[:,:,:3][ink],axis=0) if ink.any() else np.array([35,35,35])
    yy=np.indices((h,w))[0]
    xx=np.indices((h,w))[1];back_edge=np.zeros((h,w),bool)
    for row in np.flatnonzero(arm_alpha.any(axis=1)):
        span=np.flatnonzero(arm_alpha[row]);boundary=span[-1] if item['direction']=='left' else span[0]
        back_edge[row]=abs(np.arange(w)-boundary)<=3
    missing=edge&back_edge&(gray>np.median(gray[arm_alpha])*.7)&(yy>p['shoulder'+near][1]+18)&(yy<p['wrist'+near][1]-10)
    whole_arm[:,:,:3][missing]=np.rint(color).astype('uint8')
    elbow=p['elbow'+near][1];wrist=p['wrist'+near][1]
    upper=crop_curve(whole_arm,bottom=elbow+12);fore=crop_curve(whole_arm,elbow-12,wrist+12)
    approved_path=APPROVED/f"{item['anatomy']}-{item['direction']}-approved-hand.png"
    approved=cv2.imread(str(approved_path),-1);source_hash=hashlib.sha256(approved_path.read_bytes()).hexdigest()
    ys,xs=np.where(approved[:,:,3]>128);box=(int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))
    # Manually registered wrist cross-sections in the APPROVED v4 hand PNGs.
    # Their transparent cells include different forearm-stub lengths; a fixed
    # percentage of the bounding box incorrectly makes some hands oversized.
    approved_wrist_rows={'androgynous-right':147,'androgynous-left':137,
                         'female-right':90,'female-left':85,'male-right':100,'male-left':80}
    ay=approved_wrist_rows[key];hand_x=np.flatnonzero(approved[ay,:,3]>128)
    native_x=np.flatnonzero(whole_arm[int(wrist),:,3]>128)
    ends=[]
    for end in [native_x[0],native_x[-1]]:
        ink_x=np.flatnonzero((source_gray[int(wrist)]<ink_limit)&source_skin[int(wrist)]&(abs(np.arange(w)-end)<=28))
        ends.append(int(ink_x[np.argmin(abs(ink_x-end))]) if len(ink_x) else int(end))
    if ends[1]>ends[0]:native_x=np.arange(ends[0],ends[1]+1)
    if not len(hand_x) or not len(native_x):raise ValueError('No wrist cross section')
    scale=(native_x[-1]-native_x[0]+1)/(hand_x[-1]-hand_x[0]+1)
    matrix=np.array([[scale,0,p['wrist'+near][0]-float(hand_x.mean())*scale],[0,scale,wrist-ay*scale]],np.float64)
    hand=cv2.warpAffine(approved,matrix,(w,h),flags=cv2.INTER_LANCZOS4)
    # The approved hand's flat wrist attachment is an internal cut, not ink.
    # Its original PNG is unchanged. Trim within the forearm's 12px overlap.
    hand=crop_curve(hand,top=wrist-10)
    fore_skin=cv2.erode((fore[:,:,3]>250).astype('uint8'),np.ones((5,5),np.uint8))>0
    hand_skin=cv2.erode((hand[:,:,3]>250).astype('uint8'),np.ones((5,5),np.uint8))>0
    fg=cv2.cvtColor(fore,cv2.COLOR_BGRA2GRAY);hg=cv2.cvtColor(hand,cv2.COLOR_BGRA2GRAY)
    fore_skin&=fg>np.median(fg[fore_skin])*.7;hand_skin&=hg>np.median(hg[hand_skin])*.7
    gains=fore[:,:,:3][fore_skin].mean(axis=0)/np.maximum(hand[:,:,:3][hand_skin].mean(axis=0),1)
    hand[:,:,:3]=np.clip(np.rint(hand[:,:,:3]*gains),0,255).astype('uint8')
    arm=compose(upper,fore,hand)
    for name,a in {**pieces,'upper-arm':upper,'forearm':fore,'approved-hand-matched':hand}.items():cv2.imwrite(str(PACK/f'{key}-{name}.png'),a)
    far=compose(pieces['calf-foot'],pieces['thigh']);far[:,:,:3]=np.rint(far[:,:,:3]*.8).astype('uint8')
    pad=220
    def padded(a):return cv2.copyMakeBorder(a,60,60,pad,pad,cv2.BORDER_CONSTANT,value=0)
    def render(thigh_angle=0,arm_angle=0):
        # Calf follows the whole thigh rotation in these hip stress tests.
        hip=np.array(p['hip'+near])+[pad,60];shoulder=np.array(p['shoulder'+near])+[pad,60]
        leg=rotate(padded(compose(pieces['calf-foot'],pieces['thigh'])),hip,thigh_angle)
        return compose(padded(far),leg,padded(pieces['hips']),padded(pieces['torso']),rotate(padded(arm),shoulder,arm_angle))
    standing_full=render();standing=standing_full[60:60+h,pad:pad+w];cv2.imwrite(str(PACK/f'{key}-standing.png'),standing)
    tests={}
    for name,ta,aa in [('thigh-plus25',25,0),('thigh-minus25',-25,0),('arm-plus20',0,20),('arm-minus20',0,-20)]:
        image=render(ta,aa);cv2.imwrite(str(PACK/f'{key}-{name}.png'),image)
        # Enclosed negative space BETWEEN limbs is legitimate. Test a small
        # attachment disk, not every enclosed region of the combined silhouette.
        joint=np.array(p[('hip' if ta else 'shoulder')+near])+[pad,60]
        yy,xx=np.indices(image.shape[:2]);disk=(xx-joint[0])**2+(yy-joint[1])**2<=6**2
        tests[name]={'enclosedTransparentPixelsIncludingBetweenLimbs':holes(image),'jointInteriorTransparentPixels':int(((image[:,:,3]<250)&disk).sum())}
    # Region colors compare only fully opaque common skin, including repaint.
    region_diffs={}
    for name,lo,hi in [('torso',p['neck'][1],waist),('hips',waist,fold),('thigh',fold,knee),('calf-foot',knee,h)]:
        region=np.zeros((h,w),np.uint8);region[int(lo):int(hi)]=1
        common=(standing[:,:,3]>250)&(original[:,:,3]>250)&(region>0)
        if common.any():
            a=standing[:,:,:3][common].mean(axis=0);b=original[:,:,:3][common].mean(axis=0)
            region_diffs[name]=float(np.max(np.abs(a-b)/np.maximum(b,1)))
    # Four panels: two of them contain paired poses, so all four tests are shown.
    panel_w=800;board=Image.new('RGB',(panel_w*2,1000),'#d5d8dc');draw=ImageDraw.Draw(board)
    views=[('1 Armless body (native source)',[body]),('2 Assembled Standing | untouched original',[standing,original]),
           ('3 Thigh at +25° | -25°',[cv2.imread(str(PACK/f'{key}-thigh-plus25.png'),-1),cv2.imread(str(PACK/f'{key}-thigh-minus25.png'),-1)]),
           ('4 Arm at +20° | -20°',[cv2.imread(str(PACK/f'{key}-arm-plus20.png'),-1),cv2.imread(str(PACK/f'{key}-arm-minus20.png'),-1)])]
    for i,(label,images) in enumerate(views):
        px=(i%2)*panel_w;py=(i//2)*500;draw.text((px+12,py+8),label,font=font,fill='#17212b')
        slot=panel_w/len(images)
        for j,image in enumerate(images):
            pil=Image.fromarray(cv2.cvtColor(image,cv2.COLOR_BGRA2RGBA))
            if i>=2:
                # Include all moving pixels; the native source crop is too
                # narrow for +/-25 degree stress poses. Display one uniform fit.
                nonzero=pil.getbbox()
                if nonzero:pil=pil.crop(nonzero)
                fit=min(.52,(slot-20)/pil.width,440/pil.height)
            else:fit=.52
            pil=pil.resize((round(pil.width*fit),round(pil.height*fit)),Image.Resampling.LANCZOS)
            board.paste(pil,(round(px+j*slot+(slot-pil.width)/2),py+45),pil)
    board.save(PACK/f'{key}-four-panel.png')
    reports.append({'key':key,'fourPanel':f'{key}-four-panel.png','sourceNativeSize':[w,h],
                    'cutJoints':{'waist':waist,'buttockFold':fold,'knee':knee},'cutCurveAmplitude':4,
                    'standingOutlineDifference':silhouette_diff(standing,original),'standingOutlinePass':silhouette_diff(standing,original)<.02,
                    'regionMaxChannelDifferences':region_diffs,'regionColorPass':all(v<.03 for v in region_diffs.values()),
                    'armlessCutReassemblyDifference':silhouette_diff(union,body),'armlessEnclosedTransparentPixels':holes(body),
                    'tests':tests,'approvedHandSourceSHA256':source_hash,'approvedHandWristRow':ay,'handUniformScale':scale,'handColorGainsBGR':gains.tolist(),
                    'armOutlineNativeWidth':3,'armOutlineBGR':color.tolist(),'armMissingInkPixelsRestored':int(missing.sum()),
                    'visualReview':'pending','accepted':False,'walkIntegrated':False})
(PACK/'checks.json').write_text(json.dumps(reports,indent=2)+'\n',newline='\n')
print(json.dumps([{'key':r['key'],'standingOutlineDifference':r['standingOutlineDifference'],'regionColorPass':r['regionColorPass'],'testHoles':r['tests']} for r in reports]))
