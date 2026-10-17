const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
module.exports=function compileSensors(){
 const root=path.resolve(__dirname,'../graphics/sensors'),data=JSON.parse(fs.readFileSync(path.join(root,'sources/manifest.json')));assert.ok(['proposal','approved'].includes(data.status));assert.deepEqual(Object.keys(data.tiers),['0','1','2','3']);
 for(const a of [data,data.runtime]){assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,a.path))).digest('hex'),a.sha256,'Sensor source/runtime checksum differs');if(a===data.runtime){assert.equal(createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../public',a.publicPath))).digest('hex'),a.sha256);data.image=a.publicPath;}}
 for(const a of Object.values(data.tiers)){const[x,y,w,h]=a.crop;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.size[0]&&y+h<=data.size[1]);for(const k of ['display','graph','reading'])if(a[k]){const[d,e,f,g]=a[k];assert.ok(d>=x&&e>=y&&d+f<=x+w&&e+g<=y+h,'Display extends outside sensor');}}
 const code=fs.readFileSync(path.join(root,'sources/renderer.js'),'utf8').replace('__BAGSEED_SENSORS_DATA__',()=>JSON.stringify(data));new(require('node:vm').Script)(code);return `<script id="bagseed-sensors-production-code">\n${code}\n</script>\n`;
};
