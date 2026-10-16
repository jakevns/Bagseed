const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileCameras(){
  const root=path.resolve(__dirname,'../graphics/cameras'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json')));
  const bytes=fs.readFileSync(path.join(root,data.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),data.sha256,'Camera source atlas changed');
  for(const {rect:[x,y,w,h]}of Object.values(data.assets))assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.size[0]&&y+h<=data.size[1],'Invalid camera crop');
  data.image='data:image/png;base64,'+bytes.toString('base64');
  const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_CAMERA_DATA__',()=>JSON.stringify(data));
  new(require('node:vm').Script)(code);return `<script id="bagseed-cameras-production-code">\n${code}\n</script>\n`;
};
