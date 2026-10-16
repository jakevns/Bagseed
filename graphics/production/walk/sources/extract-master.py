"""Reproduce the approved pose crops using the recorded uniform transforms."""
from pathlib import Path
from PIL import Image
import hashlib,json,numpy as np,sys
ROOT=Path(__file__).resolve().parents[4];W=ROOT/'graphics/production/walk'
record=json.loads((W/'sources/master-registration.json').read_text());source=ROOT/record['source'];assert hashlib.sha256(source.read_bytes()).hexdigest()==record['sourceSHA256']
a=np.array(Image.open(source).convert('RGBA'));a[a[:,:,3]<=8]=0;sheet=Image.fromarray(a);verify='--verify' in sys.argv;hashes={}
for key,frame in record['frames'].items():
 crop=sheet.crop(frame['sourceCell']).crop(frame['subjectWithinCell']);s=frame['uniformScale']*record['density'];im=crop.convert('RGBa').resize((round(crop.width*s),round(crop.height*s)),Image.Resampling.LANCZOS).convert('RGBA');out=Image.new('RGBA',(288,432));out.alpha_composite(im,tuple(frame['translation']));file=ROOT/frame['file']
 if verify:assert np.array_equal(np.array(out),np.array(Image.open(file).convert('RGBA'))),key+' differs from recorded extraction'
 else:out.save(file)
 hashes[key]=hashlib.sha256(out.tobytes()).hexdigest()
print('Sixteen master frames '+('verified' if verify else 'extracted')+' with uniform scale and translation only.')
