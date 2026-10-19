const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('approved outfit pack retains all forty reviewed paintings with verified source hashes',()=>{
 const crypto=require('node:crypto'),manifest=JSON.parse(fs.readFileSync('graphics/production/walk/approved-outfits/manifest.json','utf8')),guides=JSON.parse(fs.readFileSync('graphics/production/walk/pose-guides-v6/manifest.json','utf8')).frames;
 assert.deepEqual(Object.keys(manifest.items).sort(),['cardigan','flannel','hoodie','jacket']);let count=0;
 for(const entry of Object.values(manifest.items))for(const[frame,view]of Object.entries(entry.frames)){
  assert.match(frame,/^(down|up)\/(idle|[0-3])$/);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(view.source)).digest('hex'),view.sourceSHA256);
  if(!frame.endsWith('idle')){const expected=guides[frame].supportImageSide==='left'?1:-1;assert.ok((view.feet.left[3]-view.feet.right[3])*expected>0,'Shoe ownership must follow the authored support leg: '+view.source);}
  count++;
 }assert.equal(count,40);
});
test('approved cardigan, jacket, flannel and hoodie drawings are used by live idle/walk rendering',{timeout:240000},async()=>{
 const{createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:180000});await page.evaluate(()=>BagseedArt.ready);
 const result=await page.evaluate(()=>{
  const failures=[],sheets={},sources=[];
  for(const topS of ['cardigan','jacket','flannel','hoodie']){
   const c=document.createElement('canvas');c.width=1440;c.height=960;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,c.width,c.height);g.fillStyle='#fff';g.font='16px sans-serif';
   for(const[row,dir]of ['down','up'].entries())for(let col=0;col<5;col++){
    const L=BagseedArt.normalize({topS,skin:'#cf9670',shirtC:'#466495',pantsC:'#36405a',shoesC:'#644731',bottomS:'jeans',shoesS:'sneakers',hairS:topS==='hoodie'?'short':'long',hairC:'#c4c4c4',hat:'none',acc:'none'});
    const im=BagseedArt.sprite(L,dir,Math.max(0,col-1),0,0,0,false,3,col>0),meta=im.bagseedApprovedOutfit;
    if(!meta||meta.garment!==topS||meta.frame!==dir+'/'+(col?col-1:'idle'))failures.push({topS,dir,col,meta});
    sources.push(meta);g.fillText(`${topS} ${dir} ${col?'walk '+(col-1):'idle'}`,col*288+8,row*480+20);g.drawImage(im,col*288,row*480+30);
   }
   sheets[topS]=c.toDataURL();
   for(const bottomS of ['jeans','shorts','skirt','cargo','joggers'])for(const shoesS of ['sneakers','boots','sandals','rainboots'])for(const dir of ['down','up']){
    const L=BagseedArt.normalize({topS,bottomS,shoesS,hat:'none',acc:'none'});
    for(const moving of [false,true]){const im=BagseedArt.sprite(L,dir,0,0,0,0,false,3,moving);if(Boolean(im.bagseedApprovedOutfit)!==(bottomS==='jeans'&&shoesS==='sneakers'))failures.push({topS,bottomS,shoesS,dir,moving});}
   }
  }return{failures,sheets,sources};
 });
 const out=path.resolve('review/approved-outfits-live');fs.mkdirSync(out,{recursive:true});for(const[id,data]of Object.entries(result.sheets))fs.writeFileSync(path.join(out,id+'.png'),Buffer.from(data.split(',')[1],'base64'));
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({sources:result.sources,failures:result.failures},null,2)+'\n');assert.deepEqual(result.failures,[]);assert.equal(result.sources.length,40);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
