"""Package actual browser captures for artwork review; leave source art untouched."""
from pathlib import Path
from PIL import Image

out = Path(__file__).resolve().parents[1] / 'review/dehumidifiers'
frames = [Image.open(out / f'motion-{i:02}.png').convert('RGB') for i in range(60)]
sheet = Image.new('RGB', (frames[0].width, frames[0].height * 6))
for i in range(6):
    sheet.paste(frames[i * 10], (0, i * frames[0].height))
palette = sheet.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
indexed[0].save(out / 'starter-split-fans.gif', save_all=True,
                append_images=indexed[1:], duration=60, loop=0, disposal=2)
print('Saved 60 actual browser captures at 60ms per frame.')
