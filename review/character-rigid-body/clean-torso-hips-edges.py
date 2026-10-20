"""Remove detached background specks and bright red/yellow fringe only.

Never redraws a contour, fills skin, edits approved hands/thighs or the original.
"""
from pathlib import Path
import sys,json
sys.path.insert(0,str(Path(__file__).parent/'.python-deps'))
import cv2
import numpy as np
HERE=Path(__file__).resolve().parent
PACK=HERE.parent.parent/'graphics/character-system/sources/torso-hips-v5'
reports=[]
for a in ['androgynous','female','male']:
    file=PACK/f'{a}-attempt-02.png'
    if not file.exists():continue
    image=cv2.imread(str(file),cv2.IMREAD_UNCHANGED);h,w=image.shape[:2]
    clean=image.copy();removed=0
    for row in range(2):
        for col in range(2):
            cell=clean[row*h//2:(row+1)*h//2,col*w//2:(col+1)*w//2]
            alpha=cell[:,:,3];solid=(alpha>=128).astype('uint8')
            n,labels,stats,_=cv2.connectedComponentsWithStats(solid)
            if n<2:continue
            main=(labels==1+np.argmax(stats[1:,cv2.CC_STAT_AREA])).astype('uint8')
            support=cv2.dilate(main,np.ones((3,3),np.uint8))>0
            b,g,r=[cell[:,:,i].astype('int16') for i in range(3)]
            fringe=((r>180)&(g<80)&(b<90))|((r>190)&(g>170)&(b<35))
            remove=((alpha>0)&~support)|((alpha>0)&fringe)
            removed+=int(remove.sum());cell[remove]=0
    out=PACK/f'{a}-candidate.png';cv2.imwrite(str(out),clean)
    reports.append({'anatomy':a,'source':file.name,'output':out.name,'removedPixels':removed,'skinPaintAdded':0,'contourPaintAdded':0})
(PACK/'edge-cleanup.json').write_text(json.dumps(reports,indent=2)+'\n',newline='\n')
print(json.dumps(reports))
