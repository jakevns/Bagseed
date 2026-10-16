const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileCoffee(){
  const root=path.resolve(__dirname,'../graphics/coffee'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json'))),bytes=fs.readFileSync(path.join(root,data.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),data.sha256,'Coffee sprite changed');
  const [x,y,w,h]=data.rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.size[0]&&y+h<=data.size[1]);
  assert.ok(data.steam.period>0&&data.steam.wisps===3&&data.steam.height>0);
  data.image='data:image/png;base64,'+bytes.toString('base64');
  const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_COFFEE_DATA__',()=>JSON.stringify(data));new(require('node:vm').Script)(code);
  return `<script id="bagseed-coffee-production-code">\n${code}\n</script>\n`;
};
