const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');

test('every hairstyle has identical readable pixels in the external-image game and direct-file standalone',{timeout:300000},async()=>{
 const root=path.resolve(__dirname,'..'),cache=path.join(root,'.cache','hair-standalone-tests'),out=path.join(cache,randomUUID());
 // buildStandalone replaces its output directory. This new unique target is
 // inside the workspace cache, never the checkout or a user-provided path.
 assert.ok(out.startsWith(cache+path.sep));assert.equal(fs.existsSync(out),false);
 const standalone=require('../tools/build-standalone.cjs')(out);
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']});
  const results=[];
  for(const [mode,url]of [['http','http://127.0.0.1:'+server.address().port],['standalone',pathToFileURL(standalone).href]]){
   const page=await require('./helpers/art-page.cjs')(browser);await page.goto(url,{timeout:180000});await page.evaluate(()=>BagseedArt.ready);
   results.push(await page.evaluate(async mode=>{
    const data=window.__BAGSEED_ILLUSTRATED_DATA__,hashes={};let styles=0;
    for(const[hairS]of HAIRS){styles++;for(const dir of ['down','right','up','left'])for(const hairC of ['#eeeeee','#9959bd']){
     const im=BagseedArt.hairLayer(BagseedArt.normalize({hairS,hairC,hairHi:'none',hat:'none'}),dir);
     const pixels=im.getContext('2d').getImageData(0,0,im.width,im.height).data;
     hashes[`${hairS}/${dir}/${hairC}`]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels))).map(v=>v.toString(16).padStart(2,'0')).join('');
    }}
    return {mode,styles,hashes,wigURL:data.images['wig/long/down'],revision:BagseedArt.renderingRevision};
   },mode));await page.close();
  }
  const [http,local]=results;
  assert.match(http.wigURL,/^assets\/embedded\/[0-9a-f]{16}\.(png|webp)$/,'Served hair must exercise the new external-image path');
  assert.match(local.wigURL,/^data:image\//,'Direct-file play must use origin-clean embedded image data');
  assert.equal(http.styles,61);assert.equal(Object.keys(http.hashes).length,488);
  assert.deepEqual(local.hashes,http.hashes,'A deployment-layout change must not change any hairstyle pixels');
  const report=path.resolve('artifacts/hair-external-assets',randomUUID(),'report.json');fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,JSON.stringify({styles:61,views:488,pixelsIdentical:true,revision:http.revision},null,2)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
