"""Verify untouched art against the release that had the approved cardigan."""
from pathlib import Path
import subprocess,json,io,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[5]
V=ROOT/'graphics/production/walk/wardrobe-v5'
BASE='c6864e5'
def original(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
old=json.loads(original('graphics/production/walk/wardrobe-v5/manifest.json'))
new=json.loads((V/'manifest.json').read_text())
report={'baseline':BASE,'approvedAtlasesUnchanged':{},'unchangedParts':0,'changedTops':[],'failures':[]}
for style in ['cardigan','crop','tank']:
 path='graphics/production/walk/'+old['items']['top-'+style]['atlas']
 same=hashlib.sha256(original(path)).digest()==hashlib.sha256((ROOT/path).read_bytes()).digest()
 report['approvedAtlasesUnchanged'][style]=same
 assert same,style
for item,entry in new['items'].items():
 if entry['kind']!='top':continue
 before=old['items'][item]
 a=Image.open(io.BytesIO(original('graphics/production/walk/'+before['atlas']))).convert('RGBA')
 b=Image.open(ROOT/'graphics/production/walk'/entry['atlas']).convert('RGBA')
 changed=entry.get('profileRevision')=='individual-arm-source-v7'
 if changed:report['changedTops'].append(item)
 for key,frame in before['frames'].items():
  if changed and key in ['right/4','left/4']:continue
  for name,part in frame['parts'].items():
   other=entry['frames'][key]['parts'][name]
   def pixels(im,p):
    x,y,w,h=p['rect'];return im.crop((x,y,x+w,y+h)).tobytes()
   if part['destination']!=other['destination']or pixels(a,part)!=pixels(b,other):report['failures'].append([item,key,name])
   else:report['unchangedParts']+=1
assert len(report['changedTops'])==12
target=ROOT/'review/arms-v7/preserved-art.json';target.write_text(json.dumps(report,indent=2)+'\n')
assert not report['failures'],report['failures']
print(json.dumps(report))
