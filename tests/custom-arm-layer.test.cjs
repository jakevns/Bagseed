const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('approved near hands stay visible over every bottom in all anatomy side poses',{timeout:180000},async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
  const result=await page.evaluate(async()=>{
   const data=__BAGSEED_ILLUSTRATED_DATA__,tops=Object.values(data.walk.stride.items).filter(i=>i.upperComposite),failures=[];let composites=0,skinChecks=0;
   // An independent projection of the approved hand source, rather than the
   // baked skin from the retired whole-outfit atlas, defines visible pixels.
   for(const [key,view]of Object.entries(data.unifiedV7.views)){
    const atlas=new Image();atlas.src=data.images['unified/body/'+key];await atlas.decode();const [anatomy,dir]=key.split('-');
    for(let frame=0;frame<8;frame++){
     const probe=BagseedArt.sprite({anatomy,topS:'tee'},dir,frame,0,0,0,false,3,true),part=view.poses[frame].bodyParts[3],reference=document.createElement('canvas');reference.width=288;reference.height=432;const g=reference.getContext('2d',{willReadFrequently:true}),scale=probe.bagseedFigureScale;
     g.imageSmoothingQuality='high';g.translate(144,429);g.scale(scale,scale);g.translate(-144,-429);g.drawImage(atlas,...part.rect,...part.destination.map(v=>v*3),part.rect[2],part.rect[3]);const source=g.getImageData(0,0,288,432).data,points=[];
     for(let y=1;y<431;y++)for(let x=1;x<287;x++){
      const i=(y*288+x)*4;if(source[i+3]<245||source[i]<100)continue;
      if([-1,0,1].every(dy=>[-1,0,1].every(dx=>{const n=((y+dy)*288+x+dx)*4;return source[n+3]>245&&source[n]>100;})))points.push(i);
     }
     if(points.length<8)failures.push({key,frame,reason:'hand source has no opaque skin interior'});
     for(const top of tops)for(const bottomS of ['jeans','cargo','joggers','shorts','skirt']){
      const im=BagseedArt.sprite({anatomy,topS:top.style,bottomS,shoesS:'sneakers',hairS:'bald',skin:'#cf9670',shirtC:'#5086bf',pantsC:'#36405a',acc:'none'},dir,frame,0,0,0,false,3,true),a=im.getContext('2d',{willReadFrequently:true}).getImageData(0,0,288,432).data;let hidden=0;
      for(const i of points)if(a[i+3]<170||a[i]<=a[i+1]*1.15||a[i+1]<=a[i+2]*1.07)hidden++;
      if(hidden)failures.push({key,frame,top:top.style,bottomS,hidden,expected:points.length});composites++;skinChecks+=points.length;
     }
    }
   }return{tops:tops.length,composites,skinChecks,failures};
  });
  const out=path.resolve('review/unified-v7-shipping');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'hand-layer-validation.json'),JSON.stringify({...result,browserErrors:errors},null,2)+'\n');assert.equal(result.tops,13);assert.equal(result.composites,3120);assert.ok(result.skinChecks>25000);assert.deepEqual(result.failures,[]);assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
