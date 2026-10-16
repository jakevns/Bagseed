"""Package actual browser captures; source artwork is left untouched."""
from pathlib import Path
from PIL import Image
out = Path(__file__).resolve().parents[1] / 'review/grow-lights'
frames = [Image.open(out / f'dust-{i:02}.png').convert('RGB') for i in range(48)]
# One shared palette prevents static backgrounds from changing color each frame.
samples = Image.new('RGB', (frames[0].width, frames[0].height * 6))
for i in range(6):
    samples.paste(frames[i * 8], (0, i * frames[0].height))
palette = samples.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
indexed = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in frames]
indexed[0].save(out / 'dust-animation.gif', save_all=True, append_images=indexed[1:], duration=160, loop=0, disposal=2, optimize=False)
detail = [im.crop((610, 175, 800, 315)).resize((570, 420), Image.Resampling.NEAREST) for im in frames]
detail[0].save(out / 'dust-detail.gif', save_all=True, append_images=detail[1:], duration=160, loop=0, disposal=2, optimize=False)
print('Saved full lighting animation and 3× dust detail at actual sampled timing.')
