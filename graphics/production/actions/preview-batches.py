"""Build a local transparency/registration contact sheet for supplied batches."""
from pathlib import Path
import json
import sys
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
out = Path(sys.argv[1])
entries = [(root / batch / name, asset) for batch in sys.argv[2:]
           for name, asset in json.loads((root / batch / 'sheet.json').read_text())['assetIds'].items()]
board = Image.new('RGB', (1040, 136 * len(entries)), '#e2ecea')
draw = ImageDraw.Draw(board)
for i, (folder, asset) in enumerate(entries):
    y = i * 136
    draw.text((5, y+8), asset, fill='black')
    for j, view in enumerate(['down', 'right', 'up', 'left']):
        art = Image.open(folder / (view+'.png'))
        board.paste(art, (160+j*150, y+20), art)
        draw.text((160+j*150, y+4), view, fill='black')
        small = art.resize((32,36), Image.Resampling.LANCZOS)
        board.paste(small, (260+j*150,y+86),small)
    art = Image.open(folder / 'portrait.png')
    art.thumbnail((128,128))
    board.paste(art, (800,y+5),art)
out.parent.mkdir(parents=True, exist_ok=True)
board.save(out)
