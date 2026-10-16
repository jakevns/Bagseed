"""Audit generated originals, selected cells and protected existing artwork."""
from pathlib import Path
import hashlib,json,re,subprocess,collections
ROOT=Path(__file__).resolve().parents[4];W=ROOT/'graphics/production/walk';R=ROOT/'review/custom-walk-v1';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((W/'manifest.json').read_text());used=collections.defaultdict(list)
for item,info in manifest['items'].items():
 for key,f in info['frames'].items():
  if 'registration'in f:used[f['registration']['source'].replace('\\','/')].append(item+'/'+key)
sources=[]
for meta in sorted((W/'sources').glob('*-generation.json')):
 record=json.loads(meta.read_text());source=ROOT/record['source'];original=record.get('originalOutput','')
 if ' by default' in original:
  match=re.search(r'as ([^\n]+?\.png) by default',original);original=match.group(1)if match else ''
 if source.name=='mannequin-v1.png' and not original:original='C:/Users/Jake Bailey/.codex/generated_images/01a13d50-80c7-7d60-a885-a07ae6d73a67/exec-e3c9bcf3-1138-4f98-8e6f-bc88164a1e21.png'
 same=sha(Path(original))==sha(source)if original and Path(original).is_file()else None
 assert same is not False,source.name+' differs from untouched generated output'
 relative=str(source.relative_to(W)).replace('\\','/');sources.append({'source':str(source.relative_to(ROOT)).replace('\\','/'),'sha256':sha(source),'generationRecord':str(meta.relative_to(ROOT)).replace('\\','/'),'promptSHA256':hashlib.sha256(record['prompt'].encode()).hexdigest(),'originalOutputIdentical':same,'selectedFrames':used.get(relative,[]),'role':'locked mannequin'if source.name in ['mannequin-v3.png','mannequin-rear-01-v4.png']else 'garment cells'if used.get(relative)else 'superseded draft/candidate retained for audit'})
before=subprocess.check_output(['git','show','HEAD:graphics/production/sources/renderer.js'],cwd=ROOT).decode().replace('\r\n','\n');after=(ROOT/'graphics/production/sources/renderer.js').read_text().replace('  __BAGSEED_WALK_RENDERER__\n','')
def block(s,start,end):return s[s.index(start):s.index(end,s.index(start))]
preserved={name:block(before,start,end)==block(after,start,end)for name,start,end in [('head','  function head(','  function body('),('standingBody','  function body(','  function generic('),('standingFigureAndReactions','  function generic(','  function props('),('portrait','  function portrait(','  const originalDrawPortrait=')]}
assert all(preserved.values()),preserved
changed=subprocess.check_output(['git','diff','--name-only'],cwd=ROOT).decode().splitlines();protected=[p for p in changed if p.startswith(('graphics/production/customization-v5/','graphics/production/cast/','review/characters-v2/'))];assert not protected,protected
result={'phase':1,'approval':'pending user visual approval','originalGeneratedImages':len(sources),'originalsUnchanged':all(r['originalOutputIdentical']is not False for r in sources),'sources':sources,'approvedSneakerReuse':used.get('assets/pose-master.png',[]),'protectedRendererBlocksUnchanged':preserved,'protectedArtChanges':protected,'poseMaster':json.loads((W/'sources/master-registration.json').read_text()),'referenceIds':['G03-P14','G03-P15','G03-P16','G03-P17','G03-P01','G03-S04','G04-S03','G07-S05','G15-S12','G17-S03','G26-S01','G01-S08']+['G02-PN'+str(i)for i in range(9,20)],'referenceUse':'Motion/readability principles only. Reference-package pixels are not used in the game assets. Part 12 is truncated.'}
(R/'source-provenance.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'originals':len(sources),'unchanged':result['originalsUnchanged'],'protectedBlocks':preserved,'protectedArtChanges':protected},indent=2))
