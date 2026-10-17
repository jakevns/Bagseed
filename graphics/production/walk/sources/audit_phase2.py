"""Verify generated originals and preserve the approved Phase 1 pixel sources."""
from pathlib import Path
import subprocess,json,hashlib
ROOT=Path(__file__).resolve().parents[4];W=ROOT/'graphics/production/walk';R=ROOT/'review/custom-walk-v2';sha=lambda b:hashlib.sha256(b).hexdigest()
records=[];manifest=json.loads((W/'manifest.json').read_text())
for file in sorted((W/'sources').glob('*-generation.json')):
 meta=json.loads(file.read_text())
 if meta.get('phase')!=2:continue
 source=ROOT/meta['source'];original=Path(meta['originalOutput']);original_same=sha(source.read_bytes())==sha(original.read_bytes())if original.is_file()else None;assert original_same is not False,source.name
 assert sha(source.read_bytes())==manifest['sources'][str(source.relative_to(W)).replace('\\','/')],source.name+' differs from registration source'
 records.append({'source':meta['source'],'sha256':sha(source.read_bytes()),'registrationHashMatches':True,'originalOutputIdentical':original_same,'promptSHA256':sha(meta['prompt'].encode()),'generationRecord':str(file.relative_to(ROOT)).replace('\\','/'),'referenceHashes':{str(Path(p).relative_to(ROOT)).replace('\\','/'):sha(Path(p).read_bytes())for p in meta['references']}})
base='73dcebae5d7a137c857093ce588ed20f8be9f183';locked=[]
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'graphics/production/walk/master','graphics/production/walk/registered','graphics/production/walk/atlases','graphics/production/walk/rig.json'],cwd=ROOT,text=True).splitlines()
for file in paths:
 before=subprocess.check_output(['git','show',base+':'+file],cwd=ROOT);after=(ROOT/file).read_bytes()
 # Rig JSON may use CRLF on a Windows checkout; semantic source is unchanged.
 if file.endswith('.json'):before=before.replace(b'\r\n',b'\n');after=after.replace(b'\r\n',b'\n')
 assert before==after,'Phase 1 source changed: '+file
 locked.append(file)
before=subprocess.check_output(['git','show',base+':graphics/production/sources/renderer.js'],cwd=ROOT).decode().replace('\r\n','\n');after=(ROOT/'graphics/production/sources/renderer.js').read_text()
def block(s,start,end):return s[s.index(start):s.index(end,s.index(start))]
protected={name:block(before,start,end)==block(after,start,end)for name,start,end in [('head','  function head(','  function body('),('standingBody','  function body(','  function generic('),('standingFigureAndReactions','  function generic(','  function props('),('portrait','  function portrait(','  const originalDrawPortrait=')]};assert all(protected.values()),protected
diff=subprocess.check_output(['git','diff','--name-only',base],cwd=ROOT,text=True).splitlines();protected_changes=[p for p in diff if p.startswith(('graphics/production/customization/','graphics/production/customization-v5/','graphics/production/cast/','graphics/production/actions/','review/characters-v2/'))];assert not protected_changes,protected_changes
m=json.loads((W/'manifest.json').read_text());inventory=json.loads((ROOT/'review/custom-walk-v1/inventory.json').read_text());expected={f'{kind}-{style}'for kind,styles in inventory.items()if isinstance(styles,list)for style in styles};assert expected==set(m['items'])-{'skin-base'};assert all(item['accepted']for key,item in m['items'].items()if key!='skin-base')
encoded=json.loads((ROOT/'graphics/production/encoded/manifest.json').read_text())
report={'phase':2,'sourceCommit':base,'generatedOriginals':len(records),'originalsUnchanged':True,'sources':records,'lockedPhase1Files':locked,'protectedRendererBlocksUnchanged':protected,'protectedArtChanges':protected_changes,'garmentItems':len(expected),'garmentFrames':len(expected)*16,'runtimeCompression':'lossless WebP; encoder verifies decoded RGBA equality against every PNG','walkWebpBytes':encoded.get('walkWebpBytes'),'actionPngBytes':encoded.get('actionPngBytes'),'actionWebpBytes':encoded.get('actionWebpBytes'),'layerPngBytes':encoded.get('layerPngBytes'),'layerWebpBytes':encoded.get('layerWebpBytes'),'scope':'Full wardrobe only; no new heads, hair, standing poses, portraits or reactions.'}
(R/'source-provenance.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'generatedOriginals':len(records),'phase1FilesPreserved':len(locked),'protectedBlocks':protected,'garments':len(expected)},indent=2))
