const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');

test('enlarged room figures retain native detail and hair retains outline and interior ink',{timeout:180000},async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Native detail');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const result=await page.evaluate(async()=>{
   settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();Object.assign(state.player,{hairS:'short',hairC:'#c4c4c4',topS:'hoodie',hat:'none',acc:'none',x:250,y:150});
   const calls=[];
   for(const scene of ['bedroom','growroom']){state.scene=scene;const cv=document.createElement('canvas');cv.width=1440;cv.height=600;const c=cv.getContext('2d');c.scale(3,3);const draw=c.drawImage;c.drawImage=function(image,...args){if(image.bagseedFigureScale)calls.push({scene,width:image.width,destinationWidth:args.at(-2)});return draw.call(this,image,...args);};SCENES[scene].draw(c,.5);}
   const hashes={},failures=[],detailedCuts=new Set(HAIRS.map(v=>v[0]).filter(s=>!['bald','buzz','balding','cornrows'].includes(s)));let views=0,inkPixels=0,interiorViews=0;
   for(const[hairS]of HAIRS)if(hairS!=='bald')for(const dir of ['down','right','up','left']){
    let alpha;
    for(const hairC of ['#eeeeee','#9959bd']){
     const im=BagseedArt.hairLayer(BagseedArt.normalize({hairS,hairC,hat:'none'}),dir),a=im.getContext('2d').getImageData(0,0,192,320).data;let ink=0,interior=0;const colors=new Set(),isInk=(data,n)=>data[n+3]>80&&Math.abs(data[n]-58)<=2&&Math.abs(data[n+1]-38)<=2&&Math.abs(data[n+2]-28)<=2;
     for(let n=0;n<a.length;n+=4){if(alpha&&alpha[n+3]!==a[n+3]){failures.push({hairS,dir,hairC,reason:'color changed silhouette'});break;}if(alpha&&isInk(alpha,n)!==isInk(a,n)){failures.push({hairS,dir,hairC,reason:'recoloring lost source ink'});break;}if(a[n+3]===255)colors.add([a[n],a[n+1],a[n+2]].join(','));if(isInk(a,n))ink++;}
     hashes[hairS+'|'+dir+'|'+hairC]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',a))).map(v=>v.toString(16).padStart(2,'0')).join('');
     if(!ink)failures.push({hairS,dir,hairC,reason:'missing outline'});if(colors.size>4)failures.push({hairS,dir,hairC,reason:'noisy palette',colors:colors.size});alpha=a;inkPixels+=ink;views++;
     // A perimeter-only outline cannot pass this: each sampled ink pixel has
     // a fully opaque 9x9 neighborhood, well inside the hair painting.
     // The shaved rear of a high-top fade uses scalp translucency, not long
     // strand strokes. Its outline/palette/alpha still pass the checks above.
     if(detailedCuts.has(hairS)&&!(hairS==='hightop'&&dir==='up')){
      for(let y=4;y<316;y++)for(let x=4;x<188;x++){const n=(y*192+x)*4;if(a[n+3]<240||isInk(a,n))continue;let contrast=0;for(const d of [-3,3,-192*3,192*3])contrast=Math.max(contrast,a[n+d*4]-a[n]);if(contrast<12)continue;let inside=true;for(let dy=-4;dy<=4&&inside;dy++)for(let dx=-4;dx<=4;dx++)if(a[((y+dy)*192+x+dx)*4+3]<240){inside=false;break;}if(inside)interior++;}
      if(interior<25)failures.push({hairS,dir,hairC,reason:'missing interior part/curl/lock lines',interior});interiorViews++;
     }
    }
   }return {calls,views,inkPixels,interiorViews,hashes,failures};
  });
  for(const scene of ['bedroom','growroom']){const calls=result.calls.filter(c=>c.scene===scene);assert.ok(calls.length,scene+' custom character was not drawn');for(const c of calls){assert.equal(c.width,288,JSON.stringify(c));assert.ok(Math.abs(c.destinationWidth-32*1.35)<.01,JSON.stringify(c));}}
  // Hashes remain evidence, not proof of a good hairstyle. Assert actual
  // silhouette, palette and interior strand contrast across every style.
  fs.mkdirSync(path.resolve('review/custom-alignment'),{recursive:true});fs.writeFileSync(path.resolve('review/custom-alignment/hair-material-checks.json'),JSON.stringify(result,null,2)+'\n');
  assert.equal(result.views,480);assert.equal(result.interiorViews,454);assert.ok(result.inkPixels>10000);assert.deepEqual(result.failures,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
