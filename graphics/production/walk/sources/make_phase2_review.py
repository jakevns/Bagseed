"""Encode full-resolution game-renderer captures without raster enlargement."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[4];R=ROOT/'review/custom-walk-v2'
for group in ['tops-a','tops-b','bottoms','varied']:
 for scene in ['grass','indoor','night']:
  frames=[Image.open(R/f'runtime-{group}-{scene}-{f}.png').convert('RGB')for f in range(4)]
  frames[0].save(R/f'walk-{group}-{scene}.gif',save_all=True,append_images=frames[1:],duration=125,loop=0,disposal=2,optimize=False)
  frames[0].save(R/f'board-{group}-{scene}-native.png')
contact=Image.new('RGB',(1920,1008))
for f in range(4):
 im=Image.open(R/f'runtime-tops-a-indoor-{f}.png')
 for k,col in enumerate([3,6]):contact.paste(im.crop((col*240,0,col*240+240,1008)),((f*2+k)*240,0))
contact.save(R/'coat-apron-all-poses-native.png')
print('12 GIFs and 13 boards encoded directly from the actual game renderer; no thumbnail enlargement.')
