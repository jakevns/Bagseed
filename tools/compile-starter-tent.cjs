const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileStarterTent(){
  const root=path.resolve(__dirname,'../graphics/tents/starter'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json')));
  assert.equal(data.status,'approved');assert.deepEqual(Object.keys(data.tiers),['budget','standard']);
  for(const a of Object.values(data.tiers)){
    for(const asset of [a,a.runtime]){const bytes=fs.readFileSync(path.join(root,asset.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,'Starter tent atlas changed');if(asset===a.runtime)a.image='data:image/webp;base64,'+bytes.toString('base64');}
    for(const k of ['open','closed']){const[x,y,w,h]=a[k];assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=a.size[0]&&y+h<=a.size[1]);}
  }
  const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_STARTER_TENT_DATA__',()=>JSON.stringify(data));new(require('node:vm').Script)(code);
  return `<script id="bagseed-starter-tent-production-code">\n${code}\n</script>\n`;
};
