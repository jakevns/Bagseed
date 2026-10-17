"""Idempotently wire cast walk clocks into the existing character compiler."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
p=ROOT/'graphics/production/sources/renderer.js';s=p.read_text()
if 'walkFrameCount:castWalkFrameCount' not in s:s=s.replace('walkReview:{','walkFrameCount:castWalkFrameCount,walkReview:{')
p.write_text(s)
p=ROOT/'graphics/production/sources/build.cjs';s=p.read_text()
if ".replace('__BAGSEED_CAST_WALK_CLOCKS__'" not in s:
 needle=".replace('__BAGSEED_WALK_RENDERER__',"
 replacement=r""".replace('__BAGSEED_CAST_WALK_CLOCKS__',()=>fs.readFileSync(path.join(castWalkRoot,'sources/clocks.js'),'utf8').replace(/\r\n/g,'\n')).replace('__BAGSEED_WALK_RENDERER__',"""
 if needle not in s:raise ValueError('Missing compiler insertion point')
 s=s.replace(needle,replacement)
needle="for(const file of ['graphics/production/walk/sources/renderer.js'"
s=s.replace(needle,"for(const file of ['graphics/production/cast-walk-v1/manifest.json','graphics/production/cast-walk-v1/sources/clocks.js','graphics/production/walk/sources/renderer.js'")
p.write_text(s)
p=ROOT/'tools/check.mjs';s=p.read_text();needle="sources.push('graphics/production/walk/sources/renderer.js'";s=s.replace(needle,"sources.push('graphics/production/cast-walk-v1/manifest.json', 'graphics/production/cast-walk-v1/sources/clocks.js', 'graphics/production/walk/sources/renderer.js'");p.write_text(s)
print('Wired cast clocks, exposed frame counts and added source freshness checks.')
