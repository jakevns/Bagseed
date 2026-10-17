const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('both painted arm silhouettes remain visible over every bottom in all side poses',{timeout:180000},async()=>{
 const root=path.resolve(__dirname,'..'),{createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
  const result=await page.evaluate(async()=>{
   const data=window.__BAGSEED_ILLUSTRATED_DATA__,walk=data.walk.stride,failures=[];let composites=0,skinChecks=0;
   const tops=Object.entries(walk.items).filter(([,item])=>item.upperComposite);
   for(const[id,item]of tops){
    const atlas=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=data.images['stride/'+id];});
    for(const dir of ['right','left'])for(let frame=0;frame<8;frame++){
     const key=dir+'/'+frame,part=item.frames[key].parts.wholeUpper,[sx,sy,w,h]=part.rect,[dx,dy]=part.destination,reference=document.createElement('canvas');reference.width=288;reference.height=432;const ctx=reference.getContext('2d',{willReadFrequently:true});ctx.drawImage(atlas,sx,sy,w,h,dx,dy,w,h);const source=ctx.getImageData(0,0,288,432).data,p=walk.rig.frames[key].keypoints;
     const points=[];for(let y=270;y<354;y++)for(let x=0;x<288;x++){
      const i=(y*288+x)*4,r=source[i],g=source[i+1],b=source[i+2];if(source[i+3]<220||r<90||g<50||r<=g*1.2||g<=b+10)continue;
      if(Math.min(...['L','R'].map(s=>Math.hypot(x/3-p['hand'+s][0],y/3-p['hand'+s][1])))<12)points.push(i);
     }
     for(const bottomS of ['jeans','cargo','joggers','shorts','skirt']){
      const look=BagseedArt.normalize({topS:item.style,bottomS,shoesS:'sneakers',hairS:'bald',skin:'#cf9670',shirtC:'#5086bf',pantsC:'#36405a',body:'average',pres:'neutral',acc:'none'}),im=BagseedArt.sprite(look,dir,frame,0,0,0,false,3,true),pixels=im.getContext('2d',{willReadFrequently:true}).getImageData(0,0,288,432).data;let hidden=0;
      for(const i of points){const r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(pixels[i+3]<170||r<=g*1.15||g<=b*1.07)hidden++;}
      if(hidden)failures.push({id,dir,frame,bottomS,hidden,expected:points.length});composites++;skinChecks+=points.length;
     }
    }
   }return {tops:tops.length,composites,skinChecks,failures};
  });
  const target=path.join(root,process.env.BAGSEED_ARM_REVIEW_OUT||'review/arm-v6','pixel-validation.json');fs.writeFileSync(target+'.tmp',JSON.stringify({...result,browserErrors:errors},null,2)+'\n');fs.renameSync(target+'.tmp',target);assert.equal(result.tops,13);assert.equal(result.composites,1040);assert.deepEqual(result.failures,[]);assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
