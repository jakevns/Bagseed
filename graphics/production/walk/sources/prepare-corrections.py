"""Crop exact reference poses for focused regeneration; paints no figure pixels."""
from register_samples import *
import sys
version=2 if '--second' in sys.argv else 1
jobs=[('bottom-skirt',['up/0','up/1','up/2','up/3']),('bottom-jeans',['right/0','right/1','right/2','right/3']),('top-overalls',['down/1','down/3','right/0','up/1'])] if version==1 else [('bottom-skirt',['up/0','up/1','up/2','up/3']),('bottom-jeans',['up/0']*4),('top-overalls',['right/2','right/3']*2),('shoe-sandals',['down/1','down/3','up/0','up/2']),('shoe-sneakers',['left/0','left/3']*2),('top-hoodie',['right/0']*4),('top-tee',['up/1']*4)]
corrections=[]
for item,keys in jobs:
 refs=[]
 for name,folder in [('master','master'),('guides' if version==2 else 'mannequin','master' if version==2 else 'registered/mannequin'),('design','registered/'+item)]:
  board=Image.new('RGBA',(576,864))
  for i,key in enumerate(keys):
   di,f=key.split('/');im=Image.open(W/f'{folder}/{di}-{f}.png').convert('RGBA')
   if name in ['master','guides']:im.paste((0,0,0,0),(0,0,288,rig['frames'][key]['keypoints']['neck'][1]*3))
   if name=='guides':
    d=ImageDraw.Draw(im);p=rig['frames'][key]['keypoints']
    for side in ['L','R']:
     elbow=p['elbow'+side];hand=p['hand'+side];d.line([tuple(v*3 for v in elbow),tuple(v*3 for v in hand)],fill='#fc63ff',width=2);x,y=[v*3 for v in hand];d.ellipse((x-4,y-4,x+4,y+4),outline='#fc63ff',width=2)
   board.alpha_composite(im,(i%2*288,i//2*432))
  dest=W/f'assets/{item}-focused-{version}-{name}-reference.png';board.save(dest);refs.append(str(dest))
 original=json.loads((W/f'sources/{item}-generation.json').read_text())
 prompt='Focused pose correction for Bagseed. Generate exactly FOUR headless, neck-down figures in a TWO by TWO grid, portrait 2:3 canvas. True transparent alpha, no text or grid. Keep exact source placement and generous transparent headroom. Reference 1 contains the ACTUAL APPROVED PLAYER BODY, with its head masked away. Its hand shapes and positions, shoulders, elbows, waist, knees, ankles and feet are the absolute pose authority: copy that anatomy frame for frame. Do not make the arms shorter, wider or bigger. Reference 2 is the neutral mannequin; reference 3 is the previous garment design, NOT the pose authority. Only change the clothing, using the tiny friendly hand-drawn soft outlined style of reference 1. Cell order, left-to-right then top-to-bottom: '+', '.join(keys)+'. No mirroring. Neck down only, no heads. Redraw the design from reference 3 on the EXACT anatomy of reference 1. Hands hang at exactly the same heights and x positions as reference 1, even in back view. Use tan skin #cf9670, key blue tops #5086bf, navy bottoms #36405a, brown sneakers #2b1d14 with cream soles. '
 prompt+=original['prompt'].split('Reproduce the exact body geometry of reference 1 rather than drawing a new body. ')[-1]
 if version==2:
  prompt=prompt.replace('Reference 2 is the neutral mannequin; reference 3','Reference 2 shows magenta elbow-to-palm guidelines on the same exact approved body. Position each palm inside its magenta circle, matching forearm length. REMOVE ALL MAGENTA GUIDES from the output; reference 3')
  if item=='bottom-skirt':prompt+=' CRITICAL REAR ARM CORRECTION: previous attempts shortened both forearms, leaving the fists six to seven native pixels too high. Extend the bare forearms DOWNWARD to the exact magenta palm circles. The lowered fist must hang BELOW THE SKIRT WAISTBAND. Copy the approved player pose in reference 1, with the elbow bent at the same height. Do not move waist, hips, skirt, knees, feet or shoulders to accommodate shorter arms.'
  if len(set(keys))<4:prompt+=' Some cells intentionally repeat the SAME pose: reproduce the supplied reference cell in that position exactly. These are four isolated pose candidates, no animation interpolation.'
 corrections.append({'id':item,'version':f'focused-{version}','frames':keys,'grid':[2,2],'prompt':prompt,'referenced_image_paths':refs,'transparent_background':True})
config=W/'sources/focused-corrections.json';existing=json.loads(config.read_text()) if config.exists() else [];existing=[j for j in existing if j.get('version')!=f'focused-{version}'];config.write_text(json.dumps(existing+corrections,indent=2)+'\n')
print([j['id']for j in corrections])
