const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileDehumidifiers(){
 const root=path.resolve(__dirname,'../graphics/dehumidifiers'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json')));assert.equal(data.status,'approved');assert.deepEqual(Object.keys(data.tiers),['1','2']);
 for(const a of [data,data.runtime]){assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,a.path))).digest('hex'),a.sha256,'Dehumidifier source/runtime checksum differs');if(a===data.runtime){assert.equal(createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../public',a.publicPath))).digest('hex'),a.sha256);data.image=a.publicPath;}}
 for(const a of Object.values(data.tiers))for(const k of ['on','off']){const[x,y,w,h]=a[k];assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.size[0]&&y+h<=data.size[1]);if(a.display){const[d,e,f,g]=a.display[k];assert.ok(d>=x&&e>=y&&d+f<=x+w&&e+g<=y+h);}}
 const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_DEHUMIDIFIERS_DATA__',()=>JSON.stringify(data));new(require('node:vm').Script)(code);return `<script id="bagseed-dehumidifiers-production-code">\n${code}\n</script>\n`;
};
