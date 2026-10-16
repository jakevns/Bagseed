const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileTent2(){
  const root=path.resolve(__dirname,'../graphics/tents/2x2'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json')));
  assert.equal(data.status,'approved');assert.deepEqual(Object.keys(data.tiers),['standard','pro','premium']);
  for(const a of [data,data.runtime]){const bytes=fs.readFileSync(path.join(root,a.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,'2x2 tent atlas changed');if(a===data.runtime)data.image='data:image/webp;base64,'+bytes.toString('base64');}
  for(const tier of Object.values(data.tiers))for(const k of ['open','closed']){const[x,y,w,h]=tier[k];assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.size[0]&&y+h<=data.size[1]);}
  const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_TENT2_DATA__',()=>JSON.stringify(data));new(require('node:vm').Script)(code);
  return `<script id="bagseed-tent2-production-code">\n${code}\n</script>\n`;
};
