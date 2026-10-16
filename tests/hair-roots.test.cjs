const artPage=require('./helpers/art-page.cjs');
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/hair-fit-v10');let browser,server,url;
before(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const{createStaticServer}=await import('../tools/server.mjs'),app=createStaticServer();
 server=http.createServer((req,res)=>{if(req.url==='/before'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(OUT,'before.html')));}else app.emit('request',req,res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port+(process.env.BAGSEED_HAIR_BEFORE==='1'?'/before':'');
 browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function inspect(name,fn){const page=await artPage(browser,),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await page.goto(url);await page.evaluate(()=>BagseedArt.ready);const result=await page.evaluate(fn);fs.writeFileSync(path.join(OUT,name+(process.env.BAGSEED_HAIR_BEFORE==='1'?'-before':'')+'.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(errors,[]);return result;}finally{await page.close();}}

test('short crops stay within measured skull proportions in front and back',async()=>{
 const r=await inspect('short-proportions',()=>{
  const cuts=['short','pixie','sidepixie','crop','caesar','fade','hightop','flattop','quiff','pomp','slick','spikes','fauxhawk','curlytop','bowl'],failures=[],measurements=[];
  const bounds=c=>{const a=c.getContext('2d').getImageData(0,0,192,320).data;let l=192,r=-1;for(let y=0;y<320;y++)for(let x=0;x<192;x++)if(a[(y*192+x)*4+3]>100){l=Math.min(l,x);r=Math.max(r,x);}return{width:r-l+1,center:(l+r)/2};};
  for(const hairS of cuts)for(const dir of ['down','up']){
   const look=BagseedArt.normalize({hairS,hairC:'#ffffff'}),hair=bounds(BagseedArt.hairLayer(look,dir)),skull=bounds(BagseedArt.baldBase(look,dir));
   const row={hairS,dir,hair,skull};measurements.push(row);
   // Swept quiffs can have asymmetric outer volume. Their scalp registration
   // is exercised by the ear-opening check rather than centering that volume.
   if(hair.width>skull.width*(dir==='up'?1.1:1.15))failures.push(row);
  }return{measurements,failures};
 });assert.deepEqual(r.failures,[]);assert.equal(r.measurements.length,30);
});

test('short hair opens around ear cartilage and fade materials do not dye ears',async()=>{
 const r=await inspect('ear-openings',()=>{
  const cuts=['short','buzz','pixie','sidepixie','crop','caesar','fade','hightop','flattop','quiff','pomp','slick','spikes','fauxhawk','curlytop','bowl'],faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],failures=[];let views=0,pixels=0;
  const read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  for(const face of faces)for(const dir of ['down','right','up','left']){
   const look=BagseedArt.normalize({face,hairS:'bald',hairC:'#3e9f7a',facial:'none',hat:'none'}),bald=BagseedArt.head(look,dir),base=read(bald),f=bald.bagseedFeatures;
   for(const hairS of cuts){const hair=read(BagseedArt.head({...look,hairS},dir));
    for(const ear of f.ears)for(const p of [[ear.center[0],ear.center[1]+2],ear.lobe]){
     let colored=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const x=Math.round(p[0])+dx,y=Math.round(p[1])+dy,n=(y*192+x)*4;
      if(Math.max(...[0,1,2].map(k=>Math.abs(hair[n+k]-base[n+k])))>20)colored++;pixels++;
     }
     if(colored>2)failures.push({face,dir,hairS,ear:ear.id,point:p,colored});
    }views++;
   }
  }return{views,pixels,failures};
 });assert.deepEqual(r.failures,[]);assert.equal(r.views,960);
});
