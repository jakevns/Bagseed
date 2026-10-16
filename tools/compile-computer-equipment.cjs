const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileComputerEquipment(){
  const root=path.resolve(__dirname,'../graphics/computer-equipment');
  const data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json')));
  for(const atlas of Object.values(data.atlases)){
    const bytes=fs.readFileSync(path.join(root,atlas.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),atlas.sha256,'Equipment source atlas changed');
    atlas.image='data:image/png;base64,'+bytes.toString('base64');
  }
  for(const asset of Object.values(data.assets)){
    const atlas=data.atlases[asset.atlas],[x,y,w,h]=asset.rect;
    assert.ok(atlas&&x>=0&&y>=0&&w>0&&h>0&&x+w<=atlas.size[0]&&y+h<=atlas.size[1],'Invalid equipment crop');
    if(asset.screen){const [sx,sy,sw,sh]=asset.screen;assert.ok(sx>=0&&sy>=0&&sw>0&&sh>0&&sx+sw<=1&&sy+sh<=1,'Invalid screen registration');}
  }
  const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_EQUIPMENT_DATA__',()=>JSON.stringify(data));
  new(require('node:vm').Script)(code);
  return `<script id="bagseed-computer-equipment-production-code">\n${code}\n</script>\n`;
};
