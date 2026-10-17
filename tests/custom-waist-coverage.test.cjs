const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('all walking outfits have opaque waist-to-pelvis joins',{timeout:180000},async()=>{
 const root=path.resolve(__dirname,'..'),{createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
 const result=await page.evaluate(()=>{const data=window.__BAGSEED_ILLUSTRATED_DATA__.walk,tops=Object.values(data.stride.items).filter(i=>i.kind==='top'),bottoms=['jeans','cargo','joggers','shorts','skirt'],failures=[];let composites=0,checkedPixels=0;
 for(const top of tops)for(const bottomS of bottoms)for(const dir of ['down','right','up','left'])for(let f=0;f<(['right','left'].includes(dir)?8:4);f++){
  const walk=['right','left'].includes(dir)?data.stride:data;
  const L=BagseedArt.normalize({topS:top.style,bottomS,shoesS:'sneakers',hairS:'bald',skin:'#cf9670',shirtC:'#5086bf',pantsC:'#36405a',body:'average',pres:'neutral',acc:'none'}),im=BagseedArt.sprite(L,dir,f,0,0,0,false,3,true),a=im.getContext('2d',{willReadFrequently:true}).getImageData(0,0,288,432).data,p=walk.rig.frames[dir+'/'+f].keypoints;let holes=0;
  for(let y=Math.ceil((p.waist[1]-2)*3);y<Math.floor((p.waist[1]+4)*3);y++)for(let x=Math.ceil((p.waist[0]-3)*3);x<Math.floor((p.waist[0]+3)*3);x++){if(a[(y*288+x)*4+3]<180)holes++;checkedPixels++;}
  if(holes)failures.push({top:top.style,bottomS,dir,frame:f,holes});composites++;
 }return {composites,checkedPixels,failures};});
 const target=path.join(root,'review/waist-v9/coverage.json');fs.writeFileSync(target+'.tmp',JSON.stringify(result,null,2)+'\n');fs.renameSync(target+'.tmp',target);assert.equal(result.composites,1800);assert.equal(result.failures.length,0,JSON.stringify(result.failures.slice(0,12)));console.log(JSON.stringify({composites:result.composites,checkedPixels:result.checkedPixels,failures:result.failures.length}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
