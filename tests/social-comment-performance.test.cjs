const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
// Commenting on Sprout and Trellis redrew the panel once per stacked comment layer and every feed photo
// once per hydrate drawer; Trellis clip snapshots also saved a PNG per video forever until storage filled.
test('Sprout and Trellis comments redraw once, reuse feed art, and keep clip snapshots out of the save',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('./helpers/art-page.cjs')(browser,{viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded',timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Comment speed');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const r=await page.evaluate(()=>{
   const settle=()=>{runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);};
   settings.speed=0;state.tut.on=false;settle();ACT.tipOff();closePanel();
   for(let d=0;d<3;d++){newDay();settle();}state.minute=1200;state.energy=999;
   const count={hydrate:0,photo:0};const h=hydrate;hydrate=function(root){count.hydrate++;return h.apply(this,arguments);};const rp=renderPhoto;renderPhoto=function(){count.photo++;return rp.apply(this,arguments);};
   const reset=()=>{count.hydrate=0;count.photo=0;};
   // Sprout: one comment, one redraw; photos already shown come from the cache and match a fresh paint.
   Panels.sprout('feed');document.querySelector('#panelBody [data-act=sproutReply]').click();
   const photos=document.querySelectorAll('#panelBody canvas[data-draw^="npcpost:"]').length;
   const button=document.querySelector('#panelBody [data-act=sproutComment]'),fid=button.dataset.arg.slice(0,button.dataset.arg.lastIndexOf(':'));
   reset();button.click();const sprout={...count,commented:!!state.social.feed.find(f=>f.id===fid)?.myComment};
   const shown=document.querySelector('#panelBody canvas[data-draw^="npcpost:"]'),f=state.social.feed[+shown.dataset.draw.split(':')[1]],fresh=document.createElement('canvas');fresh.width=shown.width;fresh.height=shown.height;Photo115.draw(fresh,f);
   // Under load Chrome may move some canvases to software rendering, which resamples the smoothed pot sprite slightly differently.
   const pixels=cv=>cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,changed=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n/a.length;};
   const photoDiff=changed(pixels(shown),pixels(fresh));
   // Trellis: one comment, one redraw.
   closePanel();Panels.trellis();const vid=document.querySelector('#panelBody [data-act=trOpen]').dataset.arg;Panels.trellisVideo(vid);
   reset();document.querySelector('#panelBody [data-act=trComment]').click();const trellis={...count,commented:!!state.trellis.notice[vid]?.done};
   closePanel();Panels.trellis();
   const media=state.completion115.media,ids=Object.keys(media),pngs=Object.fromEntries(ids.map(id=>[id,media[id].png]));
   media.gone_video={id:'gone_video',png:'data:image/png;base64,AAAA',plant:media[ids[0]].plant};
   SaveSys.now('comment performance');
   const saved=JSON.parse(localStorage.getItem(SAVE_KEYS.main)).completion115.media;
   return{photos,sprout,photoDiff,trellis,ids,pngs,saved:{ids:Object.keys(saved),withPng:Object.values(saved).filter(m=>'png' in m).length,bytes:JSON.stringify(saved).length},orphanInMemory:'gone_video' in media};
  });
  assert.ok(r.photos>0);assert.equal(r.sprout.commented,true);assert.equal(r.sprout.hydrate,1);assert.equal(r.sprout.photo,0,'feed photos already shown are reused');assert.ok(r.photoDiff<.05,'cached photo matches a fresh paint: '+r.photoDiff);
  assert.equal(r.trellis.commented,true);assert.equal(r.trellis.hydrate,1);
  assert.ok(r.ids.length>0);assert.deepEqual(r.saved.ids.sort(),[...r.ids].sort());assert.equal(r.saved.withPng,0);assert.equal(r.orphanInMemory,false);assert.ok(r.saved.bytes<r.ids.length*3000,'snapshots save only their recipe');
  // A save from before this fix still carries PNGs (injected on the menu, after the unload autosave): loading it rebuilds identical art and the next save drops them.
  await page.reload({timeout:120000});await page.evaluate(()=>BagseedStartup.ready);await page.evaluate(pngs=>{const s=JSON.parse(localStorage.getItem(SAVE_KEYS.main));for(const [id,png] of Object.entries(pngs))s.completion115.media[id].png=png;localStorage.setItem(SAVE_KEYS.main,JSON.stringify(s));},r.pngs);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const after=await page.evaluate(pngs=>{const ids=Object.keys(pngs),loaded=ids.filter(id=>state.completion115.media[id]?.png===pngs[id]).length;SaveSys.now('legacy');const saved=JSON.parse(localStorage.getItem(SAVE_KEYS.main)).completion115.media;
   for(const id of ids)delete state.completion115.media[id].png;const rebuilt=ids.filter(id=>Clip115.ensure(id).png===pngs[id]).length;return{loaded,rebuilt,total:ids.length,withPng:Object.values(saved).filter(m=>'png' in m).length};},r.pngs);
  assert.equal(after.loaded,after.total);
  assert.equal(after.rebuilt,after.total);assert.equal(after.withPng,0);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
