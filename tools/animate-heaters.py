"""Package actual public/index.html browser captures; never edit source artwork."""
from pathlib import Path
from PIL import Image

out = Path(__file__).resolve().parents[1] / 'review/heaters'
frames = [Image.open(out / f'motion-{i:02}.png').convert('RGB') for i in range(60)]
sheet = Image.new('RGB', (frames[0].width, frames[0].height * 6))
for i in range(6):
    sheet.paste(frames[i * 10], (0, i * frames[0].height))
palette = sheet.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
indexed[0].save(out / 'cozy-heater-warmth.gif', save_all=True,
                append_images=indexed[1:], duration=75, loop=0, disposal=2)
print('Saved 60 actual runtime frames at 75ms per frame.')
