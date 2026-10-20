const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('all walking outfits have opaque waist-to-pelvis joins',{timeout:180000},async()=>{
 const root=path.resolve(__dirname,'..'),{createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
 const result=await page.evaluate(async()=>{const data=window.__BAGSEED_ILLUSTRATED_DATA__.walk,tops=Object.values(data.stride.items).filter(i=>i.kind==='top'),bottoms=['jeans','cargo','joggers','shorts','skirt'],failures=[];let composites=0,checkedPixels=0;
 const authoredAlpha={};
 for(const[top,item]of Object.entries(data.approvedOutfits.items)){
  const image=new Image();image.src=__BAGSEED_ILLUSTRATED_DATA__.images['approved-outfits/'+top];await image.decode();
  const c=document.createElement('canvas');c.width=288;c.height=432;const g=c.getContext('2d');
  for(const[frame,view]of Object.entries(item.frames)){g.clearRect(0,0,288,432);g.drawImage(image,...view.rect,0,0,288,432);authoredAlpha[top+'/'+frame]=g.getImageData(0,0,288,432).data;}
 }
 for(const top of tops)for(const bottomS of bottoms)for(const dir of ['down','right','up','left'])for(let f=0;f<(['right','left'].includes(dir)?8:4);f++){
  const walk=['right','left'].includes(dir)?data.stride:data;
  const L=BagseedArt.normalize({topS:top.style,bottomS,shoesS:'sneakers',hairS:'bald',skin:'#cf9670',shirtC:'#5086bf',pantsC:'#36405a',body:'average',pres:'neutral',acc:'none'}),im=BagseedArt.sprite(L,dir,f,0,0,0,false,3,true),a=im.getContext('2d',{willReadFrequently:true}).getImageData(0,0,288,432).data,p=im.bagseedUnifiedV7?.keypoints||(im.bagseedApprovedOutfit?data.approvedOutfits.items[top.style].frames[dir+'/'+f].keypoints:walk.rig.frames[dir+'/'+f].keypoints),scale=BagseedArt.playerFigureScale||1,project=([x,y])=>[48+(x-48)*im.bagseedBodyTransform.width*scale,143+(y-143)*im.bagseedBodyTransform.sy*scale],waist=project(p.waist);let holes=0;
  const reference=im.bagseedApprovedOutfit&&authoredAlpha[top.style+'/'+dir+'/'+f];
  for(let y=Math.ceil((waist[1]-2*scale)*3);y<Math.floor((waist[1]+4*scale)*3);y++)for(let x=Math.ceil((waist[0]-3*scale)*3);x<Math.floor((waist[0]+3*scale)*3);x++){
   if(reference){
    // Preserve the approved painting's natural leg split. Every interior
    // pixel painted opaque at the join must remain opaque after assembly.
    const X=Math.round(3*(48+(x/3-48)/(im.bagseedBodyTransform.width*scale))),Y=Math.round(3*(143+(y/3-143)/(im.bagseedBodyTransform.sy*scale)));
    let interior=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(reference[((Y+dy)*288+X+dx)*4+3]<245)interior=false;
    if(!interior)continue;
   }
   if(a[(y*288+x)*4+3]<180)holes++;checkedPixels++;
  }
  if(holes)failures.push({top:top.style,bottomS,dir,frame:f,holes});composites++;
 }return {composites,checkedPixels,failures};});
 const target=path.join(root,'review/waist-v9/coverage.json');fs.writeFileSync(target+'.tmp',JSON.stringify(result,null,2)+'\n');fs.renameSync(target+'.tmp',target);assert.equal(result.composites,1800);assert.equal(result.failures.length,0,JSON.stringify(result.failures.slice(0,12)));console.log(JSON.stringify({composites:result.composites,checkedPixels:result.checkedPixels,failures:result.failures.length}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
