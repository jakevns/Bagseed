"""Replace only the outdated down/3 drawing, retaining the approved palette."""
from pathlib import Path
import importlib.util,json,shutil
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
s=importlib.util.spec_from_file_location('color',ROOT/'tools/apply-flannel-shared-palette.py')
color=importlib.util.module_from_spec(s);s.loader.exec_module(color);audit=color.audit
out=ROOT/'review/flannel-proportions-v13';out.mkdir(parents=True,exist_ok=True)
palettefile=ROOT/'review/flannel-proportions-v12/shared-palette.json'
palettes={k:np.array(v,dtype=np.uint8) for k,v in json.loads(palettefile.read_text())['materials'].items()}
reference=Image.open(ROOT/'graphics/production/walk/sources/rerender-v6/registered/flannel-v11/top-flannel/down-0.png').convert('RGBA')
refregions,_=color.masks(reference);refarray=np.array(reference)
stats={k:np.percentile(audit.lab(refarray[m,:3])[:,0],[25,50,75]) for k,m in refregions.items()}
rawpath=ROOT/'graphics/production/walk/sources/rerender-v6/flannel-v13-retry1/top-flannel-down-3.png'
raw=Image.open(rawpath).convert('RGBA');guide=Image.open(ROOT/'graphics/production/walk/pose-guides-v6/down-3.png').convert('RGBA')
registered,transform=audit.fit(raw,guide)
uncolored=ROOT/'graphics/production/walk/sources/rerender-v6/registered/flannel-v13-uncolored/top-flannel/down-3.png'
uncolored.parent.mkdir(parents=True,exist_ok=True);registered.save(uncolored)
hem=[[115,325],[130,328],[149,331],[165,330],[187,326]]
corrected,regions=color.remap(registered,palettes,stats,hem=hem)
records=json.loads((ROOT/'review/flannel-proportions-v12/measurements.json').read_text())['frames']
board=Image.new('RGB',(1200,630),'#eee9dd');draw=ImageDraw.Draw(board)
for record in records:
    previous=ROOT/record['output'];target=ROOT/record['output'].replace('flannel-v12','flannel-v13').replace('flannel-idle-v12','flannel-idle-v13')
    target.parent.mkdir(parents=True,exist_ok=True)
    if record['view']=='down' and record['frame']==3:
        corrected.save(target);before=np.array(registered);after=np.array(corrected);_,ink=color.masks(registered)
        record.update(source=str(uncolored.relative_to(ROOT)),sourceSHA256=audit.sha(uncolored),
          generatedRaw=str(rawpath.relative_to(ROOT)),generatedRawSHA256=audit.sha(rawpath),registration=transform,
          operation='Fresh down/3 drawing, uniform registration, user-authorized shared material palette',
          materialHemOverride=hem,alphaIdentical=bool(np.array_equal(before[:,:,3],after[:,:,3])),
          outlinePixelsIdentical=bool(np.array_equal(before[ink],after[ink])),dimensionsIdentical=True)
        record['materials']={k:{'pixels':int(m.sum()),'medianRGB':np.median(after[m,:3],axis=0).tolist(),
          'beforeMedianRGB':np.median(before[m,:3],axis=0).tolist(),
          'allColorsInSharedRamp':bool(all(tuple(c) in set(map(tuple,palettes[k].tolist())) for c in np.unique(after[m,:3],axis=0)))} for k,m in regions.items()}
        assert audit.leading_foot_offset(corrected)*audit.leading_foot_offset(guide)>0
    else:
        shutil.copyfile(previous,target);assert audit.sha(previous)==audit.sha(target)
        record['unchangedCopyOf']=str(previous.relative_to(ROOT))
    record.update(output=str(target.relative_to(ROOT)),outputSHA256=audit.sha(target))
    target.with_suffix('.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
    row=['down','up'].index(record['view']);col=['idle',0,1,2,3].index(record['frame'])
    draw.text((col*240+7,row*315+8),f"{record['view']} / {record['frame']}",fill='#352d28')
    board.paste(audit.tile(Image.open(target).convert('RGBA'),(240,270)),(col*240,row*315+32))
board.save(out/'idle-and-walk.png');board.save(out/'comparison.png')
shutil.copyfile(palettefile,out/'shared-palette.json')
(out/'measurements.json').write_text(json.dumps({'status':'Source review only; only down/3 drawing replaced','frames':records},indent=2)+'\n',encoding='utf-8')
print('One new down/3 drawing; nine other images byte-identical. Shared palette preserved.')
