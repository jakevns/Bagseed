const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
module.exports=function(){
 const root=path.resolve(__dirname,'..'),base=path.join(root,'graphics/garden-plants'),data={},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 for(const key of fs.readdirSync(base)){
  const dir=path.join(base,key),file=path.join(dir,'sources/manifest.json');if(!fs.existsSync(file))continue;
  const m=JSON.parse(fs.readFileSync(file));assert.equal(m.status,'approved-growth-artwork');assert.equal(m.stages.length,4);assert.equal(sha(fs.readFileSync(path.join(dir,'assets/stages.png'))),m.sourceSHA256);assert.equal(sha(fs.readFileSync(path.join(dir,'assets/stages.webp'))),m.runtimeSHA256);assert.equal(sha(fs.readFileSync(path.join(root,'public',m.runtime.replace(/^\//,'')))),m.runtimeSHA256);
  for(const p of m.stages){assert.ok(p.crop.length===4&&p.attach.length===2);assert.ok(p.attach[0]>=0&&p.attach[0]<p.crop[2]&&p.attach[1]>=0&&p.attach[1]<p.crop[3]);}
  assert.ok(!data[m.id]);data[m.id]=m;
 }
 assert.equal(Object.keys(data).length,50);
 const code=fs.readFileSync(path.join(base,'sources/renderer.js'),'utf8').replace('__BAGSEED_GARDEN_DATA__',()=>JSON.stringify(data));new(require('node:vm').Script)(code);return '<script id="bagseed-garden-plants-code">\n'+code+'\n</script>\n';
};
