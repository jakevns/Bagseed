// Reproduce canvas-origin failures separately from the hairstyle renderer.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']});
  const records=[];
  const targets=[['external-file',pathToFileURL(path.resolve('public/index.html')).href],['external-http','http://127.0.0.1:'+server.address().port]];
  if(fs.existsSync('dist/standalone/index.html'))targets.push(['standalone-file',pathToFileURL(path.resolve('dist/standalone/index.html')).href]);
  for(const [mode,url] of targets){
   const page=await require('../tests/helpers/art-page.cjs')(browser);let errorCount=0;
   page.on('pageerror',()=>errorCount++);
   await page.goto(url,{timeout:180000,waitUntil:'domcontentloaded'});
   await page.evaluate(()=>BagseedArt.ready);
   const result=await page.evaluate(()=>{
    try{
     const layer=BagseedArt.hairLayer(BagseedArt.normalize({hairS:'bob',hairC:'#eeeeee'}),'down');
     const a=layer.getContext('2d').getImageData(0,0,layer.width,layer.height).data;
     let opaque=0;for(let i=3;i<a.length;i+=4)if(a[i]>100)opaque++;
     return {ok:true,opaque,revision:BagseedArt.renderingRevision};
    }catch(e){return{ok:false,name:e.name,message:e.message,revision:BagseedArt.renderingRevision};}
   });
   records.push({mode,url,...result,pageErrors:errorCount});await page.close();
  }
  fs.mkdirSync('review/hair-external-assets',{recursive:true});
  fs.writeFileSync('review/hair-external-assets/origin-check.json',JSON.stringify(records,null,2)+'\n');
  console.log(JSON.stringify(records,null,2));
  if(records.some(r=>r.mode!=='external-file'&&!r.ok))process.exitCode=1;
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
