const artPage=require('./helpers/art-page.cjs');
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/hair-layer-v13');let browser,server,url;
before(async()=>{fs.mkdirSync(OUT,{recursive:true});const{createStaticServer}=await import('../tools/server.mjs');server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function inspect(name,fn){const page=await artPage(browser,),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await page.goto(url);await page.evaluate(()=>BagseedArt.ready);const result=await page.evaluate(fn);fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(errors,[]);return result;}finally{await page.close();}}

test('loose hair and afros conceal ears and their jewelry for all head and ear shapes',async()=>{
 const r=await inspect('covered-ears',()=>{
  const cuts=['medium','long','bob','curly','wavy','locs','afro','curtains','angledbob','asymbob','braidbob','lob','shag','wolf','curlybob','twistout','halfup','layered','bluntlong','beachwaves','longcurls','boxbraids','longtwists','bigafro'],faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],failures=[];let views=0;
  for(const hairS of cuts)for(const face of faces)for(const dir of ['down','right','up','left']){
   const look=BagseedArt.normalize({hairS,face,ears:'hidden',hairC:'#c4c4c4',hat:'none',facial:'none',acc:'none',pierce:[],glasses:'round'}),hidden=BagseedArt.head(look,dir).toDataURL();
   for(const[ears]of EARS115){if(ears==='hidden')continue;
    const a=BagseedArt.head({...look,ears,pierce:['earL','earR','hoops','double','tragus','industrial'],acc:'moon'},dir).toDataURL();
    if(a!==hidden)failures.push({hairS,face,dir,ears});views++;
   }
  }
  // Concealment is presentation only: the creator's saved anatomy and jewelry
  // must reappear when the player switches to an exposed-ear style.
  const selected=BagseedArt.normalize({hairS:'long',ears:'elf',pierce:['hoops'],acc:'moon'}),snapshot=JSON.stringify(selected);BagseedArt.head(selected,'up');
  const revealed=BagseedArt.head({...selected,hairS:'bun'},'up').toDataURL(),none=BagseedArt.head({...selected,hairS:'bun',ears:'hidden',acc:'none',pierce:[]},'up').toDataURL();
  return{views,failures,selectionUnchanged:snapshot===JSON.stringify(selected),revealsWithUpdo:revealed!==none};
 });assert.deepEqual(r.failures,[]);assert.equal(r.views,12960);assert.equal(r.selectionUnchanged,true);assert.equal(r.revealsWithUpdo,true);
});

test('complete hair ends remain above garments in figures, walking and nose-covering poses',async()=>{
 const r=await inspect('figure-hair-over-clothes',()=>{
  const failures=[],faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],cuts=['long','halfup','boxbraids','longcurls','bluntlong','locs'];let views=0,pixels=0;
  const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},read=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  for(const hairS of cuts)for(const face of faces)for(const body of ['slim','average','broad','curvy','stocky','tall'])for(const dir of ['down','right','up','left']){
   const look=BagseedArt.normalize({hairS,face,body,pres:'fem',hairC:'#b64fd2',hat:'none',facial:'none',topS:'jacket',shirtC:'#20ed32',topPat:'stripe',topC2:'#edfc21',acc:'none'}),h=BagseedArt.head(look,dir,false,true),mask=cv(288,432),g=mask.getContext('2d'),sy=body==='tall'?1.07:1,neck=143-65*sy,shapeY=(199-BagseedArt.landmarks(look,'down').chin[1])/16,headY=neck-(199-15*shapeY)/3;
   // Project the independently composed transparent head at the documented
   // jaw attachment to the body's single neck. Inspect hair below the collar,
   // erased it. Testing only head() could never detect that figure-layer bug.
   const factor=BagseedArt.playerFigureScale,original=cv(288,432);original.getContext('2d').drawImage(h,48,headY*3,192,320);g.imageSmoothingQuality='high';g.setTransform(factor,0,0,factor,144*(1-factor),429*(1-factor));g.drawImage(original,0,0);g.resetTransform();
   const expected=read(mask),points=[];
   for(let y=Math.ceil((143+(neck+3-143)*factor)*3);y<420;y++)for(let x=0;x<288;x++){
    const n=(y*288+x)*4;if(expected[n+3]>250&&expected[n]>expected[n+1]*1.5&&expected[n+2]>expected[n+1]*1.5)points.push(n);
   }
   for(const nose of [false,true]){
    let reference=expected,referencePoints=points;
    const a=read(BagseedArt.sprite(look,dir,0,0,0,0,nose,3));let mismatch=0;
    for(const n of referencePoints)if(Math.max(...[0,1,2].map(k=>Math.abs(a[n+k]-reference[n+k])))>12)mismatch++;
    if(mismatch>Math.max(2,referencePoints.length*.01))failures.push({hairS,face,body,dir,nose,points:referencePoints.length,mismatch});views++;pixels+=referencePoints.length;
   }
   // Changing the underlying shirt must not tint or erase opaque hair while
   // the complete figure moves. Frame 1 includes shear and vertical motion.
   const moving=cv(288,432),mg=moving.getContext('2d'),movingSprite=BagseedArt.sprite(look,dir,1,0,0,0,false,3),raw=cv(288,432);
   // Project independent hair from the accepted walking rig's neck, including
   // rear views where eyes are intentionally absent.
   const data=window.__BAGSEED_ILLUSTRATED_DATA__,walk=movingSprite.bagseedWalkProfile==='stride/'?data.walk.stride:data.walk,p=walk.rig.frames[dir+'/1'].keypoints,width=({slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[body])*.955;
   raw.getContext('2d').drawImage(h,(48+(p.neck[0]-48)*width-32)*3,(143+(p.neck[1]-143)*sy-(199-15*shapeY)/3)*3);
   mg.imageSmoothingQuality='high';mg.setTransform(factor,0,0,factor,144*(1-factor),429*(1-factor));mg.drawImage(raw,0,0);
   const opaque=read(moving),a=read(movingSprite),b=read(BagseedArt.sprite({...look,shirtC:'#fd2137',topC2:'#2363fa'},dir,1,0,0,0,false,3));let samples=0,mismatch=0;
   // Use the independent hair alpha, not the composited sprite alpha: garment
   // color can legitimately show through partially transparent edge strands.
   for(let y=Math.ceil((neck+4)*3);y<420;y++)for(let x=1;x<287;x++){const n=(y*288+x)*4;if(opaque[n+3]>253&&opaque[n]>opaque[n+1]*1.5&&opaque[n+2]>opaque[n+1]*1.5&&[-1,0,1].every(dy=>[-1,0,1].every(dx=>opaque[((y+dy)*288+x+dx)*4+3]>253))){samples++;if(Math.max(...[0,1,2].map(k=>Math.abs(a[n+k]-b[n+k])))>8)mismatch++;}}
   if(mismatch>Math.max(2,samples*.015))failures.push({hairS,face,body,dir,frame:1,samples,mismatch});views++;
  }return{views,pixels,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,10)));assert.equal(r.views,6480);assert.ok(r.pixels>100000);
});

test('portraits preserve loose hair over the shoulders without a neckline crop',async()=>{
 const r=await inspect('portrait-hair-over-clothes',()=>{
  let views=0,pixels=0;const failures=[];
  for(const hairS of ['long','halfup','boxbraids','longcurls','bluntlong','locs'])for(const face of ['soft','wide','petite','long','heart']){
   const look=BagseedArt.normalize({hairS,face,hairC:'#b64fd2',topS:'jacket',shirtC:'#20ed32',topPat:'stripe',topC2:'#edfc21',acc:'none',hat:'none'}),h=BagseedArt.head(look,'down',false,true),raw=h.getContext('2d').getImageData(0,0,192,320).data;let top=320;
   for(let y=0;y<320&&top===320;y++)for(let x=0;x<192;x++)if(raw[(y*192+x)*4+3]>100){top=y;break;}
   const shapeY=(199-BagseedArt.landmarks(look,'down').chin[1])/16,anchor=199-15*shapeY+5,fit=Math.min(1,116/(anchor-top)),c=document.createElement('canvas');c.width=c.height=192;const g=c.getContext('2d');g.translate(96,148);g.scale(fit,fit);g.drawImage(h,-96,-anchor);
   const expected=g.getImageData(0,0,192,192).data,a=BagseedArt.portrait(look).getContext('2d').getImageData(0,0,192,192).data;let samples=0,mismatch=0;
   for(let y=151;y<192;y++)for(let x=0;x<192;x++){const n=(y*192+x)*4;if(expected[n+3]>250&&expected[n]>expected[n+1]*1.5&&expected[n+2]>expected[n+1]*1.5){samples++;if(Math.max(...[0,1,2].map(k=>Math.abs(a[n+k]-expected[n+k])))>10)mismatch++;}}
   if(mismatch>Math.max(2,samples*.01))failures.push({hairS,face,samples,mismatch});views++;pixels+=samples;
  }return{views,pixels,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures));assert.equal(r.views,30);assert.ok(r.pixels>1000);
});
