from profile_v3 import *
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--id',default='top-hoodie');parser.add_argument('--source',default='assets/profile-v3-top-hoodie-v1.png');parser.add_argument('--companions',action='store_true');args=parser.parse_args()
source=Image.open(W/args.source).convert('RGBA');a=np.array(source)[:,:,3]>40;rs=separators(a.sum(1),2);cs=separators(a.sum(0),4);frames={};board=Image.new('RGBA',(1152,864),'#292330');d=ImageDraw.Draw(board);reports=[]
for row,di in enumerate(['right','left']):
 for f in range(4):
  key=f'{di}/{f}';cell=[cs[f],rs[row],cs[f+1],rs[row+1]];master=Image.open(P3/f'mannequin-locked/{di}-{f}.png').convert('RGBA');out,fit=register(source.crop(cell),newrig['frames'][key],master);fit.update(source=args.source,sourceCell=cell);frames[key]=(out,fit);folder=P3/args.id;folder.mkdir(exist_ok=True);out.save(folder/f'{di}-{f}.png');board.alpha_composite(out,(f*288,row*432));d.text((f*288+4,row*432+4),key+' '+str(fit['maxKeypointError'])+'px '+('PASS'if fit['accepted']else'REJECT'),fill='white');reports.append({'frame':key,**fit})
review=ROOT/'review/custom-walk-v3';board.convert('RGB').save(review/(args.id+'-profile-registration.png'));(review/(args.id+'-profile-registration.json')).write_text(json.dumps({'frames':reports,'passed':sum(v['accepted']for v in reports),'total':8},indent=2)+'\n')
manifest=json.loads((W/'manifest.json').read_text());items=[args.id]+(['bottom-jeans','shoe-sneakers']if args.companions else[])
for item in items:
 kind,style=item.split('-',1);manifest['items'][item]=pack(item,manifest['items'][item],frames,kind,style)
gray={key:(Image.open(P3/f'mannequin-locked/{key.replace("/","-")}.png').convert('RGBA'),{'accepted':True,'source':'locked new profile underlayer'})for key in newrig['frames']};manifest['items']['skin-base']=pack('skin-base',manifest['items']['skin-base'],gray,'skin','locked-underlayer',skin=True)
combined=json.loads((W/'rig.json').read_text());combined['frames'].update(newrig['frames']);manifest['candidateRig']=combined;manifest['status']='candidate; standing/style/profile correction not approved';(P3/'candidate-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print([(v['frame'],v['maxKeypointError'],round(v['limbCoreIoU'],3),v['accepted'])for v in reports])
