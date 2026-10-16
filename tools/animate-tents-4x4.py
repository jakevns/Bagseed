"""Make a review GIF from actual browser-rendered zipper frames, without changing source art."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[1]
out = root / 'review/tents-4x4'
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
frames = []
for step in [*range(9), *range(7, 0, -1)]:
    board = Image.new('RGB', (1350, 565), '#f8f2e5')
    draw = ImageDraw.Draw(board)
    for i, tier in enumerate(['standard', 'pro', 'premium']):
        draw.text((i * 450 + 18, 12), '4×4 · ' + tier.title(), font=font, fill='#29483a')
        with Image.open(out / f'zip-{tier}-{step}.png') as im:
            board.paste(im.convert('RGB'), (i * 450, 50))
    frames.append(board)
frames[0].save(out / 'zip-animation.gif', save_all=True, append_images=frames[1:], duration=90, loop=0, disposal=2, optimize=False)
print('Saved zipper preview, slowed for visual review; runtime retains native 380 ms timing.')
