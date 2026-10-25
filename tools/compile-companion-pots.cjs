const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
module.exports=function(){
 const root=path.resolve(__dirname,'..'),base=path.join(root,'graphics/companion-pots'),m=JSON.parse(fs.readFileSync(path.join(base,'sources/manifest.json'))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 assert.equal(m.status,'approved');assert.equal(sha(fs.readFileSync(path.join(base,'assets/pot.png'))),m.sourceSHA256);assert.equal(sha(fs.readFileSync(path.join(base,'assets/pot.webp'))),m.runtimeSHA256);assert.equal(sha(fs.readFileSync(path.join(root,'public',m.runtime.replace(/^\//,'')))),m.runtimeSHA256);
 const [x,y,w,h]=m.crop,[cx,cy,rx,ry]=m.soil;assert.ok(x>=0&&y>=0&&w>=512&&h>=512&&x+w<=m.size[0]&&y+h<=m.size[1]);assert.ok(rx>0&&ry>0&&cx-rx>=x&&cx+rx<=x+w&&cy-ry>=y&&cy+ry<=y+h);assert.equal(m.height,6);assert.ok(w*m.height/h<=9);assert.equal(m.nativePlantScale,.8);assert.deepEqual(m.nativeRootOffset,[0,-4]);assert.deepEqual(m.nativePotCapacity,{closet:1,tent2:2,tent4:2,tent5:3});
 const code=fs.readFileSync(path.join(base,'sources/renderer.js'),'utf8').replace('__BAGSEED_COMPANION_POTS_DATA__',()=>JSON.stringify(m));new(require('node:vm').Script)(code);return '<script id="bagseed-companion-pots-code">\n'+code+'\n</script>\n';
};
