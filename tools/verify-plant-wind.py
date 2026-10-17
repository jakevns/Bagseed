"""Verify exported component-review animation and the fixed ground landmark."""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageChops
root = Path(__file__).resolve().parents[1]
for strain in sys.argv[1:]:
    folder = root / 'review' / (strain + '-components')
    frames = list((folder / 'frames').glob('*.png'))
    assert len(frames) == 120, (strain, len(frames))
    a = Image.open(folder / 'frames/100.png').convert('RGB')
    b = Image.open(folder / 'frames/110.png').convert('RGB')
    # Left growth is at the same final height in both frames. The soil, not
    # antialiasing at a swaying stem tangent, is our static camera landmark.
    moving = {}
    for label, box in [('giantCanopy', (50,130,560,820)), ('flowerCanopy', (650,180,1150,820))]:
        diff = ImageChops.difference(a.crop(box), b.crop(box))
        moving[label] = sum(any(pixel) for pixel in diff.get_flattened_data())
        assert moving[label] > 100, (strain, label, 'stationary canopy')
    assert ImageChops.difference(a.crop((280,833,330,841)), b.crop((280,833,330,841))).getbbox() is None, (strain, 'ground moved')
    probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=nb_frames,width,height:format=duration','-of','json',str(folder / (strain+'-growth-and-wind.mp4'))]))
    stream = probe['streams'][0]
    assert stream['nb_frames'] == '120' and float(probe['format']['duration']) == 10
    assert stream['width'] == 1200 and stream['height'] == 1000
    gif = Image.open(folder / (strain+'-growth-and-wind.gif'))
    assert gif.n_frames == 120
    result = dict(frames=120,durationSeconds=10,changedCanopyPixels=moving,fixedSoilLandmark=True,rootFixedByModelTests=True)
    (folder / 'wind-validation.json').write_text(json.dumps(result,indent=2)+'\n')
    print(strain+': 120 animated frames, both canopies move; ground fixed; MP4/GIF validated')
