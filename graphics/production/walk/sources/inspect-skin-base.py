"""Evaluate the generated bare forearm/shin mannequin; never paint anatomy."""
from register_samples import *
sheet=Image.open(W/'assets/mannequin-v2.png').convert('RGBA');alpha=np.array(sheet)[:,:,3]>40;rs=separators(alpha.sum(1),4);cs=separators(alpha.sum(0),4);report=[];board=Image.new('RGBA',(1152,1728),'#292330')
for ri,di in enumerate(DIRS):
 for f in range(4):
  key=f'{di}/{f}';frame=rig['frames'][key];master=np.array(Image.open(W/f'master/{di}-{f}.png'));out,fit=register(sheet.crop((cs[f],rs[ri],cs[f+1],rs[ri+1])),frame,master);a=np.array(out);skin=warm(a);a[~skin]=0;out=Image.fromarray(a);folder=W/'registered/skin';folder.mkdir(exist_ok=True);out.save(folder/f'{di}-{f}.png');board.alpha_composite(out,(f*288,ri*432));ImageDraw.Draw(board).text((f*288+3,ri*432+3),f'{key} {fit["maxKeypointError"]:.2f}',fill='white');report.append({'frame':key,**fit})
board.save(R/'skin-base-audit.png');(R/'skin-base-audit.json').write_text(json.dumps(report,indent=2)+'\n');print([(r['frame'],r['maxKeypointError'])for r in report])
