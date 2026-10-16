// Serve the reviewed mounting changes without modifying production index.html.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=function patchPlacement(html){
 const root=path.resolve(__dirname,'..'),placement=fs.readFileSync(path.join(root,'graphics/exhaust/sources/placement.js'),'utf8');
 for(const [compiler,loc,fraction]of [['starter-tent','closet','.27'],['tent2','tent2','.26'],['tent4','tent4','.27'],['tent5','tent5','.27']]){
  const original=require('./compile-'+compiler+'.cjs')();assert.ok(html.includes(original),'Current '+compiler+' build missing');let patched=original.replaceAll('y+h*'+fraction,"y+h*BagseedTentPlacement.roof('"+loc+"')");assert.notEqual(patched,original);
  // Ceiling lights sit in front of the filter where compact rigs overlap.
  if(loc==='tent2')patched=patched.replace(/(        Gear.light\([^\n]+;\n)(        Gear.filter\([^\n]+;\n)/, '$2$1');
  if(loc==='tent4')patched=patched.replace('Gear.light(c,...P.light,e.light,on,t);Gear.filter(c,...P.exhaust,e.exhaust,exMul(L)>0,t);','Gear.filter(c,...P.exhaust,e.exhaust,exMul(L)>0,t);Gear.light(c,...P.light,e.light,on,t);');
  if(loc==='tent5')patched=patched.replace('for(const lx of [cx-40,cx+40])Gear.light(c,lx,P.light[1],e.light,on,t);Gear.filter(c,...P.exhaust,e.exhaust,exMul(L)>0,t);','Gear.filter(c,...P.exhaust,e.exhaust,exMul(L)>0,t);for(const lx of [cx-40,cx+40])Gear.light(c,lx,P.light[1],e.light,on,t);');
  html=html.replace(original,()=>compiler==='starter-tent'?'<script>\n'+placement+'\n</script>\n'+patched:patched);
 }
 const original=require('./compile-grow-lights.cjs')();assert.ok(html.includes(original));const data=JSON.parse(fs.readFileSync(path.join(root,'graphics/grow-lights/sources/manifest.json')));data.image=data.runtime.publicPath;const source=fs.readFileSync(path.join(root,'graphics/exhaust/sources/light-placement-proposal.js'),'utf8').replace('__BAGSEED_GROW_LIGHTS_DATA__',()=>JSON.stringify(data));html=html.replace(original,()=>'<script id="bagseed-grow-lights-production-code">\n'+source+'\n</script>\n');return html;
};
