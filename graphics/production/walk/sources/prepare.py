from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[4];WALK=ROOT/'graphics/production/walk';REVIEW=ROOT/'review/custom-walk-v1'
DIRS=['down','right','up','left']
JOINTS=['neck','shoulderL','shoulderR','elbowL','elbowR','handL','handR','waist','hipL','hipR','kneeL','kneeR','ankleL','ankleR','heelL','heelR','toeL','toeR']
def components(mask):
 # Union connected horizontal runs, rather than visiting every painted pixel.
 runs=[];parent=[];previous=[]
 def root(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for y,row in enumerate(mask):
  changes=np.diff(np.r_[False,row,False].astype(np.int8));starts=np.flatnonzero(changes==1);ends=np.flatnonzero(changes==-1);current=[];j=0
  for x0,x1 in zip(starts,ends):
   idx=len(runs);runs.append((y,int(x0),int(x1)));parent.append(idx);current.append(idx)
   while j<len(previous) and runs[previous[j]][2]<=x0:j+=1
   k=j
   while k<len(previous) and runs[previous[k]][1]<x1:
    parent[root(previous[k])]=root(idx);k+=1
  previous=current
 groups={}
 for i,run in enumerate(runs):groups.setdefault(root(i),[]).append(run)
 result=[]
 for group in groups.values():
  result.append(np.concatenate([np.column_stack([np.arange(x0,x1),np.full(x1-x0,y)]) for y,x0,x1 in group]))
 return sorted(result,key=len,reverse=True)
def largest(mask):
 groups=components(mask)
 return groups[0] if groups else np.empty((0,2),int)
def points(di,f):
 # Manual anatomical landmarks traced on the approved registered master.
 front=[[[48,80],[38,86],[57,86],[32,98],[65,96],[36,109],[65,104],[48,107],[42,111],[54,111],[40,124],[54,128],[40,134],[53,138],[36,139],[48,142],[46,140],[60,143]],
 [[48,79],[38,85],[57,85],[32,97],[65,97],[35,108],[64,106],[48,106],[42,110],[54,110],[41,120],[53,127],[42,130],[53,138],[37,133],[48,142],[47,134],[60,143]],
 [[48,80],[38,86],[57,86],[32,96],[65,98],[32,105],[64,110],[48,107],[42,111],[54,111],[42,128],[54,122],[42,138],[55,132],[36,142],[51,135],[48,143],[60,136]],
 [[48,79],[38,85],[57,85],[34,96],[65,97],[36,103],[65,106],[48,106],[42,110],[54,110],[42,120],[53,127],[42,130],[53,138],[37,134],[48,142],[47,135],[60,143]]]
 if di=='down':return front[f]
 if di=='up':
  p=[q.copy() for q in front[f]];p[0]=[48,79];return p
 side=[[[48,80],[46,86],[52,86],[40,99],[59,98],[35,111],[63,104],[48,107],[47,111],[51,111],[52,125],[38,124],[59,137],[31,136],[52,143],[27,138],[72,139],[43,143]],
 [[48,79],[46,85],[52,85],[53,98],[42,97],[60,106],[36,106],[48,106],[47,110],[51,110],[36,123],[52,126],[27,137],[56,139],[24,139],[51,143],[35,143],[68,141]],
 [[48,80],[46,86],[52,86],[54,98],[40,97],[63,107],[31,107],[48,107],[47,111],[51,111],[52,125],[38,125],[59,138],[31,137],[53,143],[26,140],[73,140],[44,143]],
 [[48,79],[46,85],[52,85],[39,99],[60,98],[34,110],[65,104],[48,106],[47,110],[51,110],[36,123],[52,126],[27,137],[56,139],[24,139],[51,143],[36,143],[70,141]]]
 p=side[f]
 return [[96-x,y] for x,y in p] if di=='left' else p

def prepare():
 for d in ['master','registered/mannequin','labels','sources']: (WALK/d).mkdir(parents=True,exist_ok=True)
 REVIEW.mkdir(parents=True,exist_ok=True)
 rig={'version':'custom-walk-phase-1','status':'draft landmarks; visual approval required','canvas':[96,144],'density':3,'groundBaseline':143,'headAttach':'jaw underside 184 after face-shape transform; no new head artwork','partLabels':{'farArm':1,'torso':2,'nearArm':3,'farLeg':4,'nearLeg':5,'farFoot':6,'nearFoot':7},'frames':{}}
 prior=json.loads((WALK/'rig.json').read_text()) if (WALK/'rig.json').exists() else {'frames':{}}
 overrides=json.loads((WALK/'sources/rig-overrides.json').read_text())['frames']
 rig['landmarkNotes']={'profiles':'Each left and right row traced independently; no mirrored profile landmarks.','neck':'Rear anatomical attachment inferred underneath the approved hood/hair at y=79.','hands':'Visible hand centroids detected in the original long-sleeved master; hidden hands retain inferred anatomical coordinates.','status':'Manual joints plus measured visible hands; not all joints can be independently detected through clothing.'}
 board=Image.new('RGB',(1152,1728),'#292330');draw=ImageDraw.Draw(board)
 for row,di in enumerate(DIRS):
  for f in range(4):
   key=f'{di}/{f}';p=dict(zip(JOINTS,points(di,f)));near='L' if di in ['right','left'] else ('L' if f in [0,1] else 'R');override=overrides.get(key,{});p.update(override.get('keypoints',{}));out=Image.open(WALK/f'master/{di}-{f}.png').convert('RGBA');a=np.array(out).astype(float);r,g,b,alpha=[a[:,:,i]for i in range(4)];yy,xx=np.mgrid[:432,:288];groups=components((alpha>160)&(r>g*1.2)&(g>b+10)&(r>90)&(g>50)&(yy>270)&(yy<366));groups=[v for v in groups if len(v)>18];visible=[]
   for name in ['handL','handR']:
    if not groups:continue
    group=min(groups,key=lambda v:np.linalg.norm(v.mean(0)/3-np.array(p[name])));center=group.mean(0)/3
    if np.linalg.norm(center-np.array(p[name]))<11:p[name]=[round(float(v),3)for v in center];visible.append(name)
   rig['frames'][key]={'keypoints':p,'nearArm':override.get('nearArm',near),'nearLeg':override.get('nearLeg','R' if near=='L' else 'L'),'visibleHands':visible,'phase':['left-contact','passing','right-contact','opposite-passing'][f],'ground':143,'mannequinRegistration':prior['frames'].get(key,{}).get('mannequinRegistration',{})}
   board.paste(out,(f*288,row*432),out)
   edges=[['neck','waist'],['shoulderL','shoulderR'],['shoulderL','elbowL','handL'],['shoulderR','elbowR','handR'],['hipL','hipR'],['hipL','kneeL','ankleL','toeL'],['hipR','kneeR','ankleR','toeR']]
   for edge in edges:draw.line([(f*288+p[k][0]*3,row*432+p[k][1]*3) for k in edge],fill='#53f4f0',width=2)
   for name,(x,y) in p.items():draw.ellipse((f*288+x*3-3,row*432+y*3-3,f*288+x*3+3,row*432+y*3+3),fill='#ffeb6b')
   draw.text((f*288+5,row*432+4),key,fill='white')
 (WALK/'rig.json').write_text(json.dumps(rig,indent=2)+'\n');board.save(REVIEW/'master-rig-overlay.png')
 print('Master landmarks prepared; mannequin registration remains a separate reproducible step.')
if __name__=='__main__':prepare()
