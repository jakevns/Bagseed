const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
test('fixed mobile loading window fits the slow-download Reload notice',async()=>{
  const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'public/index.html')),marker=Buffer.from('<!-- bagseed-loading-shell-end -->'),cut=html.indexOf(marker)+marker.length,responses=new Set();
  const server=http.createServer((req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}responses.add(res);if(req.url.startsWith('/assets/')){res.writeHead(200);res.end(fs.readFileSync(path.join(root,'public',decodeURIComponent(req.url.split('?')[0]))));return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.write(html.subarray(0,cut));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'commit'});await page.evaluate(()=>BagseedLoadingScene.ready);
    await page.evaluate(()=>{BagseedLoadingScene.pause();document.getElementById('bagseed-loading-reload').hidden=false;});
    const layouts=[];
    for(const [width,height]of [[390,844],[375,667],[320,568],[844,390]]){
      await page.setViewportSize({width,height});
      const a=await page.evaluate(()=>{BagseedLoadingScene.render(0);const canvas=document.getElementById('bagseed-loading-room'),room=canvas.parentElement.getBoundingClientRect(),r=canvas.getBoundingClientRect(),b=document.getElementById('bagseed-loading-reload').getBoundingClientRect();return {x:r.x,y:r.y,focus:r.x+r.width*1095/2048,center:room.x+room.width/2,button:{x:b.x,y:b.y,right:b.right,bottom:b.bottom},roomHeight:room.height};});
      assert.ok(a.button.x>=0&&a.button.y>=0&&a.button.right<=width&&a.button.bottom<=height,'Reload clipped at '+width+'×'+height);
      assert.ok(a.roomHeight>100&&Math.abs(a.focus-a.center)<1,'Window lost its focal point');
      const b=await page.evaluate(()=>{BagseedLoadingScene.render(6);const r=document.getElementById('bagseed-loading-room').getBoundingClientRect();return {x:r.x,y:r.y};});assert.deepEqual(b,{x:a.x,y:a.y},'Camera moved at night');
      layouts.push({width,height,reloadVisible:true,reloadFits:true,windowCentered:true,cameraFixed:true});
    }
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'review/loading-mobile-window/reload-layout.json'),JSON.stringify({layouts,pageErrors:errors},null,2)+'\n');
  }finally{await browser?.close();for(const res of responses)res.destroy();await new Promise(r=>server.close(r));}
});
