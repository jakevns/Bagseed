"""Export the browser-rendered comparison strips without redrawing artwork."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
for motion, count in [('walk', 4), ('idle', 8)]:
    frames = [Image.open(root / 'assets/animation-frames' / f'{motion}-{i:02d}.png').convert('RGB')
              for i in range(count)]
    frames[0].save(root / f'{motion}.gif', save_all=True, append_images=frames[1:],
                   duration=170, loop=0, disposal=2)
    with Image.open(root / f'{motion}.gif') as exported:
        assert exported.n_frames > 1, f'{motion} export is static'
        print(f'{motion}: {exported.n_frames} encoded frames, {exported.size}')
