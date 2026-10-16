const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileChairs(){
  const root=path.resolve(__dirname,'../graphics/chairs'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json')));
  const bytes=fs.readFileSync(path.join(root,data.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),data.sha256,'Chair source atlas changed');
  assert.equal(Object.keys(data.assets).length,6,'Expected four desk chairs and two placeable office-chair finishes');
  for(const [id,{rect:[x,y,w,h]}]of Object.entries(data.assets)){const size=id==='gaming'?data.gaming.size:data.size;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=size[0]&&y+h<=size[1],'Invalid chair crop');}
  const gaming=fs.readFileSync(path.join(root,data.gaming.path));assert.equal(createHash('sha256').update(gaming).digest('hex'),data.gaming.sha256,'Gaming chair source changed');
  data.gaming.image='data:image/png;base64,'+gaming.toString('base64');
  data.image='data:image/png;base64,'+bytes.toString('base64');
  const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_CHAIR_DATA__',()=>JSON.stringify(data));
  new(require('node:vm').Script)(code);return `<script id="bagseed-chairs-production-code">\n${code}\n</script>\n`;
};
