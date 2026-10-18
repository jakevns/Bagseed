"""Compare fresh slim cardigan idle with walking at identical body height.

Raw AI outputs stay immutable. Registration is a single uniform affine fit,
with neck-cap centre and physical foot baseline inherited from the old idle.
Review tiles retain aspect ratio and have no independent width fitting.
"""
from pathlib import Path
import importlib.util,json,hashlib,argparse
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('walk_audit',ROOT/'tools/audit-walk-rerender-v6.py')
audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
parser=argparse.ArgumentParser()
parser.add_argument('--version',default='9')
parser.add_argument('--garment',default='cardigan')
parser.add_argument('--attempt',default='individual-v8')
parser.add_argument('--update-sheet','--update-cardigan-sheet',dest='update_cardigan_sheet',action='store_true')
args=parser.parse_args()
RAW=ROOT/f'graphics/production/walk/sources/{args.garment}-idle-v{args.version}'
REG=ROOT/f'graphics/production/walk/registered/{args.garment}-idle-v{args.version}'
OUT=ROOT/f'review/{args.garment}-proportions-v{args.version}'
for folder in [REG,OUT]:folder.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def widths(im):
    a=np.array(audit.normalized(im));mask=a[:,:,3]>160
    def band(lo,hi):
        widths=[]
        for row in mask[round(lo*240):round(hi*240)]:
            xs=np.flatnonzero(row)
            if len(xs):widths.append(int(xs[-1]-xs[0]+1))
        return float(np.median(widths))
    rgb=a[:,:,:3].astype(float);r,g,b=rgb.transpose(2,0,1)
    denim=mask&(b>r*1.12)&(b>g*1.05)
    spans=[]
    # Exclude warm hands hanging alongside idle hips: their span is not the
    # pelvis width and changes as the arms swing. Same window for every pose.
    for line in denim[120:130]:
        xs=np.flatnonzero(line)
        if len(xs):spans.append(int(xs[-1]-xs[0]+1))
    return {'shoulderBand':band(.12,.18),'upperBodyBand':band(.23,.30),'hipBand':band(.48,.54),'denimHipBand':float(np.median(spans)),'shinBand':band(.76,.82)}
records={};board=Image.new('RGB',(1440,630),'#eee9dd');draw=ImageDraw.Draw(board)
current=Image.new('RGB',(1200,630),'#eee9dd');cd=ImageDraw.Draw(current)
for row,di in enumerate(['down','up']):
    original=ROOT/f'graphics/production/customization/top/{args.garment}/{di}.png'
    source=RAW/f'{di}-raw.png';source_sha=sha(source)
    old=Image.open(original).convert('RGBA');raw=Image.open(source).convert('RGBA')
    reg,transform=audit.fit(raw,old)
    # The idle pack is 288x324. The remainder of the affine's 432px canvas
    # is transparent; discard only that empty margin, never figure pixels.
    assert reg.getchannel('A').crop((0,324,288,432)).getbbox() is None
    reg=reg.crop((0,0,288,324));target=REG/f'{di}.png';reg.save(target)
    walks=[Image.open(ROOT/f'graphics/production/walk/sources/rerender-v6/registered/{args.attempt}/top-{args.garment}/{di}-{f}.png').convert('RGBA') for f in range(4)]
    record={'source':str(source.relative_to(ROOT)),'sourceSHA256':source_sha,
            'oldIdleSHA256':sha(original),'registration':transform,
            'registeredSHA256':sha(target),'oldIdle':widths(old),'newIdle':widths(reg),
            'walk':[widths(w) for w in walks],'runtimeInstalled':False}
    assert sha(source)==source_sha
    (REG/f'{di}.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8',newline='\n')
    records[di]=record
    record['paletteComparedWithOriginal']=audit.palette(old,reg,args.garment)
    record['rawSHA256Unchanged']=sha(source)==source_sha
    for col,(label,im) in enumerate(zip(['REVISED IDLE','walk 0','walk 1','walk 2','walk 3'],[reg]+walks)):
        cd.text((col*240+7,row*315+8),f'{di} / {label}',fill='#352d28')
        current.paste(audit.tile(im,(240,270)),(col*240,row*315+32))
    for col,(label,im) in enumerate(zip(['OLD IDLE','NEW SLIM IDLE','walk 0','walk 1','walk 2','walk 3'],[old,reg]+walks)):
        draw.text((col*240+7,row*315+8),f'{di} / {label}',fill='#352d28')
        tile=audit.tile(im,(240,270));board.paste(tile,(col*240,row*315+32))
board.save(OUT/'comparison.png')
current.save(OUT/'idle-and-walk.png')
if args.update_cardigan_sheet:
    assert all(r['paletteComparedWithOriginal']['pass'] for r in records.values())
    destination=ROOT/f'review/custom-walk-rerender-v6/{args.attempt}'
    prior=destination/'candidate-contact-01.png'
    if not (OUT/'prior-contact-sheet.png').exists():
        (OUT/'prior-contact-sheet.png').write_bytes(prior.read_bytes())
    current.save(prior)
    selection={args.garment:{di:str((REG/f'{di}.png').relative_to(ROOT)).replace('\\','/') for di in records}}
    (destination/'idle-review.json').write_text(json.dumps(selection,indent=2)+'\n',encoding='utf-8',newline='\n')
(OUT/'measurements.json').write_text(json.dumps({'status':'Source-art review; no runtime installation','reviewScale':'Every figure uniformly normalized to 240px body height; width untouched','views':records},indent=2)+'\n',encoding='utf-8',newline='\n')
(OUT/'index.html').write_text(f'<!doctype html><meta charset="utf-8"><title>{args.garment.title()} proportions</title><style>body{{font:17px system-ui;background:#eee9dd;color:#352d28}}img{{max-width:100%;height:auto}}</style><h1>{args.garment.title()} only: idle proportions matched to walking</h1><p>Old idle, new slimmer idle, then four walking phases. All figures use the same body-height scale; widths are not stretched to match. Source-art review, not installed in the game.</p><a href="comparison.png"><img src="comparison.png"></a><p><a href="measurements.json">Measurements and untouched-source hashes</a></p>',encoding='utf-8',newline='\n')
print(json.dumps({di:{'oldIdle':r['oldIdle'],'newIdle':r['newIdle'],'walkMedian':{k:float(np.median([v[k] for v in r['walk']])) for k in r['oldIdle']}} for di,r in records.items()}))
