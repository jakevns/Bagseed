const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileExhaust(){
 const root=path.resolve(__dirname,'../graphics/exhaust'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json')));assert.equal(data.status,'approved');assert.deepEqual(Object.keys(data.tiers),['1','2','3']);
 for(const a of [data,data.rotor]){for(const asset of [a,a.runtime]){assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,asset.path))).digest('hex'),asset.sha256,'Exhaust source/runtime checksum differs');if(asset===a.runtime){assert.equal(createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../public',asset.publicPath))).digest('hex'),asset.sha256,'Published exhaust asset differs');a.image=asset.publicPath;}}}
 for(const tier of Object.values(data.tiers))for(const k of ['on','off']){const[x,y,w,h]=tier[k];assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.size[0]&&y+h<=data.size[1]);}
 const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_EXHAUST_DATA__',()=>JSON.stringify(data));new(require('node:vm').Script)(code);return `<script id="bagseed-exhaust-production-code">\n${code}\n</script>\n`.replace(/\r\n/g,'\n');
};
