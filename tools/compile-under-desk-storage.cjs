const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileUnderDeskStorage(){
  const root=path.resolve(__dirname,'../graphics/under-desk-storage'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json'))),bytes=fs.readFileSync(path.join(root,data.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),data.sha256,'Storage atlas changed');assert.equal(data.tiers.length,3);assert.equal(Object.keys(data.assets).length,4);
  for(const a of Object.values(data.assets)){const[x,y,w,h]=a.rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.size[0]&&y+h<=data.size[1]&&a.width>0&&a.height>0);}
  data.image='data:image/png;base64,'+bytes.toString('base64');const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_UNDER_DESK_STORAGE_DATA__',()=>JSON.stringify(data));new(require('node:vm').Script)(code);
  return `<script id="bagseed-under-desk-storage-production-code">\n${code}\n</script>\n`;
};
