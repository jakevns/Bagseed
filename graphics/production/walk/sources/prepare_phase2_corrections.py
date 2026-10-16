"""Make source-pixel reference crops for rejected poses; never draw garments."""
from pathlib import Path
from PIL import Image
import json,collections,argparse
ROOT=Path(__file__).resolve().parents[4];W=ROOT/'graphics/production/walk';R=ROOT/'review/custom-walk-v2'
parser=argparse.ArgumentParser();parser.add_argument('--version',default='correction-1');args=parser.parse_args()
report=json.loads((R/'garment-validation.json').read_text());groups=collections.defaultdict(list)
for f in report['rejected']:groups[f['item']].append(f['frame'])
original=Image.open(W/'assets/phase2-headless-master-reference.png');directions=['down','right','up','left'];records=[]
for item,keys in groups.items():
 for start in range(0,len(keys),4):
  frames=keys[start:start+4];frames+=([frames[-1]]*(4-len(frames)));tag=args.version+'-'+str(start//4)
  for role in ['master','design']:
   board=Image.new('RGBA',(576,864))
   for slot,key in enumerate(frames):
    di,f=key.split('/');x=int(f)*288;y=directions.index(di)*432
    im=original.crop((x,y,x+288,y+432))if role=='master'else Image.open(W/f'registered/{item}/{di}-{f}.png')
    board.alpha_composite(im,(slot%2*288,slot//2*432))
   board.save(W/f'assets/{item}-{tag}-{role}-reference.png')
  records.append({'id':item,'version':tag,'frames':frames,'source':f'assets/{item}-{tag}.png'})
path=W/'sources/phase2-corrections.json';existing=json.loads(path.read_text())if path.exists()else[]
existing=[r for r in existing if not r['version'].startswith(args.version)];path.write_text(json.dumps(existing+records,indent=2)+'\n');print(json.dumps(records,indent=2))
