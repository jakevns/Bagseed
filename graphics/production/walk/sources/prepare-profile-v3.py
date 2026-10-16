"""Annotate revised side-view motion guides; no garment pixels are drawn."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[4];W=ROOT/'graphics/production/walk'
base={'neck':[48,78],'shoulderL':[50,84],'shoulderR':[47,84],'waist':[48,105],'hipL':[50,110],'hipR':[47,110]}
poses=[
 {'elbowL':[43,96],'handL':[39,106],'elbowR':[54,95],'handR':[58,104],'kneeL':[55,124],'ankleL':[61,138],'heelL':[54,143],'toeL':[73,143],'kneeR':[40,124],'ankleR':[34,136],'heelR':[28,138],'toeR':[46,143]},
 {'elbowL':[46,96],'handL':[44,108],'elbowR':[52,95],'handR':[54,106],'kneeL':[47,124],'ankleL':[47,139],'heelL':[40,143],'toeL':[59,143],'kneeR':[55,121],'ankleR':[50,129],'heelR':[43,130],'toeR':[62,133]},
 {'elbowL':[54,95],'handL':[58,104],'elbowR':[42,96],'handR':[38,106],'kneeL':[40,124],'ankleL':[34,136],'heelL':[28,138],'toeL':[46,143],'kneeR':[55,124],'ankleR':[61,138],'heelR':[54,143],'toeR':[73,143]},
 {'elbowL':[52,95],'handL':[54,106],'elbowR':[46,96],'handR':[44,108],'kneeL':[55,121],'ankleL':[50,129],'heelL':[43,130],'toeL':[62,133],'kneeR':[47,124],'ankleR':[47,139],'heelR':[40,143],'toeR':[59,143]}
]
board=Image.new('RGBA',(1152,864));d=ImageDraw.Draw(board);frames={}
for row,di in enumerate(['right','left']):
 for f,pose in enumerate(poses):
  p={**base,**pose}
  if f%2:
   p={k:[x,y-1]if k in base else[x,y]for k,(x,y)in p.items()}
  if di=='left':p={k:[96-x,y]for k,(x,y)in p.items()}
  frames[f'{di}/{f}']={'keypoints':p,'nearArm':'L','nearLeg':'L','phase':'contact'if f%2==0 else'passing','groundBaseline':143}
  def q(name):x,y=p[name];return (f*288+x*3,row*432+y*3)
  for side,color in [('R','#6da4d9'),('L','#e7a15d')]:
   for chain in [['shoulder','elbow','hand'],['hip','knee','ankle'],['heel','ankle','toe']]:d.line([q(k+side)for k in chain],fill=color,width=4)
  d.line([q('neck'),q('waist')],fill='#bca6cf',width=3)
  for k in ['neck','handL','handR','hipL','hipR','kneeL','kneeR','ankleL','ankleR']:
   x,y=q(k);d.ellipse((x-4,y-4,x+4,y+4),outline='#fff2df',width=2)
  d.line([(f*288+18*3,row*432+429),(f*288+78*3,row*432+429)],fill='#8b8f82',width=2)
  d.text((f*288+10,row*432+12),f'{di} {f}: '+frames[f'{di}/{f}']['phase'],fill='#aaa28f')
(W/'sources/profile-v3-targets.json').write_text(json.dumps({'purpose':'User requested corrected side motion and standing-art proportions; front/back remain unchanged.','torsoWidthNative':20,'handSizeNative':[5,5],'footLengthNative':19,'frames':frames},indent=2)+'\n')
board.save(W/'assets/profile-v3-motion-guides.png');print('Eight side-view guides: contact, passing, opposite contact, passing.')
