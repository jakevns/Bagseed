const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileFans(){
  const root=path.resolve(__dirname,'../graphics/fans'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json')));
  assert.equal(data.status,'approved');assert.deepEqual(Object.keys(data.tiers),['1','2','3']);
  for(const a of [data,data.runtime]){const bytes=fs.readFileSync(path.join(root,a.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,'Fan atlas changed');if(a===data.runtime){const publicFile=path.resolve(__dirname,'../public',a.publicPath);assert.equal(createHash('sha256').update(fs.readFileSync(publicFile)).digest('hex'),a.sha256,'Published fan atlas differs');data.image=a.publicPath;};}
  for(const tier of Object.values(data.tiers))for(const k of ['head','rotor','mount']){const[x,y,w,h]=tier[k];assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.size[0]&&y+h<=data.size[1]);}
  const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_FANS_DATA__',()=>JSON.stringify(data));new(require('node:vm').Script)(code);
  return `<script id="bagseed-fans-production-code">\n${code}\n</script>\n`.replace(/\r\n/g,'\n');
};
