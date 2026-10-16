"""Lossless runtime packaging; preserve the approved original generated PNGs."""
import hashlib,json
from pathlib import Path
from PIL import Image,ImageChops
root=Path(__file__).resolve().parents[1]/'graphics/tents/starter'
manifest_path=root/'sources/manifest.json'
data=json.loads(manifest_path.read_text())
for tier,asset in data['tiers'].items():
    source=root/asset['path']
    assert hashlib.sha256(source.read_bytes()).hexdigest()==asset['sha256']
    image=Image.open(source).convert('RGBA')
    target=root/'assets'/f'{tier}-atlas.webp'
    image.save(target,'WEBP',lossless=True,exact=True,method=6)
    decoded=Image.open(target).convert('RGBA')
    assert decoded.size==image.size
    assert not ImageChops.difference(image,decoded).getbbox(alpha_only=False),'Lossless atlas pixels changed'
    asset['runtime']={'path':f'assets/{target.name}','sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'lossless':True}
data.update(revision='starter-tent-1',status='approved',approvedDate='2026-10-16',slotVisualOffsetY=-10)
manifest_path.write_text(json.dumps(data,indent=2)+'\n')
