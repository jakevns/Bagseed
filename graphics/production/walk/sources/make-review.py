"""Encode real runtime captures as GIFs and nearest-neighbor review boards."""
from pathlib import Path
from PIL import Image
import json
R=Path(__file__).resolve().parents[4]/'review/custom-walk-v1'
for bg in ['grass','indoor','night']:
 frames=[Image.open(R/f'runtime-{bg}-{f}.png').convert('RGB')for f in range(4)]
 for scale in [1,3]:
  resized=[im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST)for im in frames];resized[0].save(R/f'walk-{bg}-{scale}x.gif',save_all=True,append_images=resized[1:],duration=125,loop=0,disposal=2,optimize=False)
  if scale==3:resized[0].save(R/f'board-{bg}-3x.png')
print('Six animated GIFs and three nearest-neighbor boards encoded from runtime captures.')
