"""Eight chronological gait guides. These annotate joints, never paint assets."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[4]
W=ROOT/'graphics/production/walk'
# Right-facing profile. L is the camera-near leg throughout the entire loop.
# The stance foot moves back while the swing foot clears the floor and advances.
legs=[
 ([[57,124],[64,139],[57,143],[75,143]],[[40,124],[32,136],[27,137],[44,143]]),
 ([[54,125],[58,139],[51,143],[69,143]],[[39,125],[35,133],[30,133],[46,139]]),
 ([[48,125],[48,139],[41,143],[59,143]],[[53,122],[43,130],[37,130],[53,135]]),
 ([[43,124],[39,138],[32,142],[50,143]],[[58,122],[55,133],[48,137],[66,137]]),
 ([[40,124],[32,136],[27,137],[44,143]],[[57,124],[64,139],[57,143],[75,143]]),
 ([[39,125],[35,133],[30,133],[46,139]],[[54,125],[58,139],[51,143],[69,143]]),
 ([[53,122],[43,130],[37,130],[53,135]],[[48,125],[48,139],[41,143],[59,143]]),
 ([[58,122],[55,133],[48,137],[66,137]],[[43,124],[39,138],[32,142],[50,143]])]
phases=['near heel contact','near loading / far toe off','near stance / far passing','near push off / far swing','far heel contact','far loading / near toe off','far stance / near passing','far push off / near swing']
board=Image.new('RGBA',(1152,864));draw=ImageDraw.Draw(board);frames={}
for f,(near,far) in enumerate(legs):
 bob=[0,1,0,-1,0,1,0,-1][f]
 p={'neck':[48,78+bob],'waist':[48,105+bob],'shoulderL':[50,84+bob],'shoulderR':[47,84+bob],'hipL':[50,110+bob],'hipR':[47,110+bob]}
 for side,points in [('L',near),('R',far)]:
  for joint,xy in zip(['knee','ankle','heel','toe'],points):p[joint+side]=xy
 near_hand=[39,42,48,55,58,55,48,42][f]
 for side,hx in [('L',near_hand),('R',96-near_hand)]:
  p['hand'+side]=[hx,106+bob];p['elbow'+side]=[(p['shoulder'+side][0]+hx)/2,96+bob]
 frames['right/'+str(f)]={'keypoints':p,'phase':phases[f],'nearLeg':'L','nearArm':'L','groundBaseline':143,'cycleLength':8}
 ox=f%4*288;oy=f//4*432
 def q(k):return (ox+p[k][0]*3,oy+p[k][1]*3)
 for s,c in [('R','#6da4d9'),('L','#e7a15d')]:
  for chain in [['shoulder','elbow','hand'],['hip','knee','ankle'],['heel','ankle','toe']]:draw.line([q(j+s) for j in chain],fill=c,width=4)
 draw.line([q('neck'),q('waist')],fill='#bca6cf',width=3)
 for k in p:
  x,y=q(k);draw.ellipse((x-3,y-3,x+3,y+3),fill='white')
 draw.text((ox+8,oy+8),str(f+1)+' '+phases[f],fill='#aaa28f')
 draw.line((ox+48,oy+429,ox+252,oy+429),fill='#8b8f82',width=2)
(W/'assets/stride-v4-guides.png').parent.mkdir(parents=True,exist_ok=True)
board.save(W/'assets/stride-v4-guides.png')
(W/'sources/stride-v4-targets.json').write_text(json.dumps({'status':'motion specification, not artwork approval','frames':frames},indent=2)+'\n')
print('Eight distinct chronological poses: two contacts, two loading, two passing, two push off.')
