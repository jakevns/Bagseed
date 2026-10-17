const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
module.exports=function(){
 const root=path.resolve(__dirname,'..'),base=path.join(root,'graphics/plants'),kits={};
 for(const id of fs.readdirSync(base)){
  const file=path.join(base,id,'sources/manifest.json');if(!fs.existsSync(file))continue;
  const m=JSON.parse(fs.readFileSync(file)),pfile=path.join(base,id,'sources/profile.json');
  assert.ok(['approved-component-prototype','approved-growth-prototype'].includes(m.status),'Unapproved plant atlas: '+id);
  const bytes=fs.readFileSync(path.join(root,'public',m.runtime));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.runtimeSHA256);
  const spec=fs.existsSync(pfile)?JSON.parse(fs.readFileSync(pfile)):{id,name:'Porchlight',traits:{leafShape:'broad',leafKey:'forest',colorName:'Forest green',branching:1.1}};
  kits[id]={...m,traits:spec.traits,lineId:spec.lineId||id};
 }
 assert.equal(Object.keys(kits).length,14);
 const model=fs.readFileSync(path.join(base,'porchlight/sources/model.cjs'),'utf8');
 const renderer=fs.readFileSync(path.join(base,'sources/live-renderer.js'),'utf8').replace('__BAGSEED_LIVE_PLANTS__',()=>JSON.stringify(kits));
 const code='(()=>{const module={exports:{}};'+model+';window.BagseedPlantModel=module.exports;})();\n'+renderer;
 new(require('node:vm').Script)(code);return '<script id="bagseed-live-plants-code">\n'+code+'\n</script>\n';
};
