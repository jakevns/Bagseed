const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium,devices}=require('playwright');
test('mobile loading viewport stays stable while unstyled menu images arrive',async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/loading-first-paint');fs.mkdirSync(out,{recursive:true});
  const html=fs.readFileSync(path.join(root,'public/index.html')),marker=Buffer.from('<!-- bagseed-loading-shell-end -->'),shell=html.indexOf(marker)+marker.length,app=html.indexOf('<div id="app">',shell),menu=html.indexOf('</section>',app)+10,native=html.indexOf('<script id="bagseed-illustrated-production-code">'),responses=new Set();let response,browser;
  const {createStaticServer}=await import('../tools/server.mjs'),assets=createStaticServer(),serveAsset=assets.listeners('request')[0];
  // Delay the HTML stream while serving real companion scripts and artwork.
  const server=http.createServer((req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}if(req.url!=='/'&&req.url!=='/index.html'){serveAsset(req,res);return;}response=res;responses.add(res);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.write(html.subarray(0,shell));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const results=[];
    for(const [name,device,complete]of [['pixel',devices['Pixel 7'],true],['iphone',devices['iPhone 13'],false],['narrow',{viewport:{width:320,height:568},isMobile:true,hasTouch:true,deviceScaleFactor:2},false]]){
      const context=await browser.newContext(device),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'commit'});await page.waitForFunction(()=>window.BagseedLoadingScene?.loaded);await page.evaluate(()=>{BagseedLoadingScene.pause();BagseedLoadingScene.render(3);});
        async function layout(label){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));return page.evaluate(label=>{const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};return {label,viewport:{width:innerWidth,height:innerHeight,visualWidth:visualViewport.width,visualHeight:visualViewport.height,scale:visualViewport.scale},overlay:box(document.getElementById('bagseed-loading')),canvas:box(document.getElementById('bagseed-loading-room')),heading:box(document.querySelector('.loading-heading')),panel:box(document.querySelector('.loading-panel')),appDisplay:document.getElementById('app')?getComputedStyle(document.getElementById('app')).display:null};},label);}
        const initial=await layout('loading-shell');response.write(html.subarray(shell,menu));await page.locator('#menuArtwork').waitFor({state:'attached'});await page.waitForFunction(()=>document.getElementById('menuArtwork')?.complete);const partial=await layout('unstyled-menu');
        assert.deepEqual(partial.viewport,initial.viewport,'Unstyled menu expanded the mobile viewport');assert.deepEqual(partial.canvas,initial.canvas,'Loading artwork zoomed during download');assert.equal(partial.appDisplay,'none');
        assert.ok(partial.heading.x>=0&&partial.heading.right<=initial.viewport.width&&partial.panel.bottom<=initial.viewport.height,'Loading menu left the viewport');
        await page.screenshot({path:path.join(out,name+'-during-download.png')});response.write(html.subarray(menu,native));await page.waitForFunction(()=>window.BagseedMenu?.loaded);const prepared=await layout('native-game-and-menu-styles');assert.deepEqual(prepared.viewport,initial.viewport);assert.deepEqual(prepared.canvas,initial.canvas);
        if(complete){response.end(html.subarray(native));await page.evaluate(()=>BagseedStartup.ready);assert.equal(await page.locator('#bagseed-loading').isVisible(),false);assert.equal(await page.locator('#screen-title').isVisible(),true);assert.notEqual(await page.locator('#app').evaluate(el=>getComputedStyle(el).display),'none');assert.equal(await page.evaluate(()=>innerWidth),initial.viewport.width);await page.screenshot({path:path.join(out,name+'-ready-menu.png')});}
        else response.destroy();assert.deepEqual(errors,[]);results.push({name,initial,partial,prepared,readyMenu:complete,pageErrors:errors});
      }finally{await context.close();}
    }
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({entryPoint:'public/index.html',stagedMobileDownload:true,results},null,2)+'\n');
  }finally{for(const r of responses)r.destroy();await browser?.close();await new Promise(r=>server.close(r));}
});
