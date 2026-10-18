"""Review only: original guides beside new full-body candidates, no art edits."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
board=Image.new('RGB',(1600,1400),'#eee9dd')
draw=ImageDraw.Draw(board)
for row,di in enumerate(['down','up']):
    for frame in range(4):
        paths=[ROOT/f'graphics/production/walk/registered/mannequin/{di}-{frame}.png',
               ROOT/f'graphics/production/walk/sources/rerender-v6/registered/individual-v6c/top-cardigan/{di}-{frame}.png']
        for kind,path in enumerate(paths):
            im=Image.open(path).convert('RGBA')
            box=im.getchannel('A').point(lambda p:255 if p>100 else 0).getbbox()
            crop=im.crop(box)
            crop=crop.resize((round(crop.width*300/crop.height),300),Image.Resampling.LANCZOS)
            x=frame*400+(400-crop.width)//2;y=(row*2+kind)*350
            board.paste(crop,(x,y+35),crop)
            draw.text((frame*400+10,y+10),f'{di}/{frame} '+('original guide' if kind==0 else 'cardigan candidate'),fill='black')
out=ROOT/'review/custom-walk-rerender-v6/original-guides-and-cardigan.png'
board.save(out)
print(out)
