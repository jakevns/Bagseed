"""Package actual runtime captures into a review animation; never edit source art."""
from pathlib import Path
from PIL import Image
out = Path(__file__).resolve().parents[1] / 'review/humidifiers'
frames = [Image.open(out / f'motion-{i:02}.png').convert('RGB') for i in range(96)]
samples = Image.new('RGB', (frames[0].width, frames[0].height * 8))
for i in range(8):
    samples.paste(frames[i * 12], (0, i * frames[0].height))
palette = samples.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
indexed[0].save(out / 'humidifier-mist.gif', save_all=True, append_images=indexed[1:], duration=60, loop=0, disposal=2, optimize=False)
print('Saved 96 actual runtime frames at 60ms each.')

# Enlarge actual tank captures for reviewing tiny bubbles without changing art.
details = []
for frame in frames:
    canvas = Image.new('RGB', (1080, 330), '#e7e9db')
    for i in range(3):
        cx = 192 + i * 378
        crop = frame.crop((cx - 90, 280, cx + 90, 445)).resize((360, 330), Image.Resampling.NEAREST)
        canvas.paste(crop, (i * 360, 0))
    details.append(canvas.quantize(palette=palette, dither=Image.Dither.NONE))
details[0].save(out / 'water-bubbles-detail.gif', save_all=True, append_images=details[1:], duration=60, loop=0, disposal=2, optimize=False)
print('Saved enlarged water-bubble detail from actual runtime captures.')
