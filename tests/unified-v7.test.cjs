const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('v7 side Standing/walk share anatomy, head and attachments across the core wardrobe',{timeout:600000},async()=>{
 const{createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port,{timeout:180000});await page.evaluate(()=>BagseedArt.ready);
 const result=await page.evaluate(()=>{const failures=[];let cases=0,contrasts=0;
 for(const anatomy of ['male','female','androgynous'])for(const dir of ['right','left'])for(let pose=-1;pose<8;pose++){
  let reference,head;const shirtPixels={};
  for(const topS of ['tee','hoodie'])for(const bottomS of ['jeans','shorts'])for(const shoesS of ['sneakers','boots'])for(const hairS of ['short','long']){
   const look={anatomy,topS,bottomS,shoesS,hairS,skin:'#cf9670',shirtC:'#216cbb',pantsC:'#36405a',shoesC:'#49372a'},im=BagseedArt.sprite(look,dir,Math.max(pose,0),0,0,0,false,3,pose>=0),meta=im.bagseedUnifiedV7;
   const label=[anatomy,dir,pose,topS,bottomS,shoesS,hairS].join('/');cases++;
   if(!meta||meta.anatomy!==anatomy||im.bagseedWalkProfile!=='unified-v7/')failures.push(label+': wrong body route');
   const geometry=JSON.stringify(meta.keypoints);reference??=geometry;if(reference!==geometry)failures.push(label+': outfit changed anatomy');
   head??=JSON.stringify(im.bagseedHeadOrigin);if(head!==JSON.stringify(im.bagseedHeadOrigin))failures.push(label+': outfit or hair moved head');
   const pixels=im.getContext('2d').getImageData(0,0,im.width,im.height).data;let bottom=-1,count=0;for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(pixels[(y*im.width+x)*4+3]>100){bottom=y;count++;}
   if(bottom<423||bottom>431||count<5400)failures.push(label+': incomplete or ungrounded figure');
   if(bottomS==='jeans'&&shoesS==='sneakers'&&hairS==='short')shirtPixels[topS]=pixels;
  }
  let delta=0,occupied=0;const a=shirtPixels.tee,b=shirtPixels.hoodie;for(let i=0;i<a.length;i+=4){if(a[i+3]||b[i+3])occupied++;if(Math.max(...[0,1,2,3].map(c=>Math.abs(a[i+c]-b[i+c])))>8)delta++;}
  if(delta/occupied<.03)failures.push([anatomy,dir,pose].join('/')+': tee and hoodie nearly identical');contrasts++;
 }
 return{cases,contrasts,failures};});
 const output=path.resolve('review/unified-v7-shipping');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'wardrobe-interchangeability.json'),JSON.stringify(result,null,2)+'\n');assert.equal(result.cases,864);assert.equal(result.contrasts,54);assert.deepEqual(result.failures,[]);assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
