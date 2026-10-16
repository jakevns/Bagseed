const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');

test('loading cover paints during download, waits for all art, blocks input, and recovers from failure without changing a save',async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/loading-screen');fs.mkdirSync(out,{recursive:true});
  const html=fs.readFileSync(path.join(root,'public/index.html')),marker=Buffer.from('<!-- bagseed-loading-shell-end -->'),cut=html.indexOf(marker)+marker.length;
  assert.ok(cut>marker.length&&cut<500000,'Loading shell must arrive in the first small HTML chunk');
  const coffeePrefix='data:image/png;base64,'+fs.readFileSync(path.join(root,'graphics/coffee/assets/mug.png')).toString('base64').slice(0,120);
  const {createStaticServer}=await import('../tools/server.mjs'),app=createStaticServer();let releaseStream,streamResponse,browser,streamed=false;
  const server=http.createServer((req,res)=>{if(req.url==='/index.html?stream=1'&&!streamed){streamed=true;
    streamResponse=res;res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.write(html.subarray(0,cut));releaseStream=()=>res.end(html.subarray(cut));
  }else app.emit('request',req,res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage(),errors=[],expectedErrors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')expectedErrors.push(m.text());});
    await context.addInitScript(({prefix})=>{
      // The outgoing page performs its normal unload autosave before this runs.
      window.__startupSaveAtEntry=localStorage.getItem('bagseed.save.v1');
      const Native=Image;window.__heldStartupArt=[];
      window.Image=new Proxy(Native,{construct(Target,args){
        const im=Reflect.construct(Target,args);let callback;
        Object.defineProperty(im,'onload',{configurable:true,get:()=>callback,set:fn=>{callback=fn;}});
        im.addEventListener('load',event=>{
          const run=()=>callback?.call(im,event),mode=sessionStorage.getItem('startup-test-mode')||'hold';
          if(!im.src.startsWith(prefix)||mode==='pass')return run();
          if(mode==='reject')return im.onerror?.call(im,new Event('error'));
          window.__heldStartupArt.push(run);
        });return im;
      }});
      // Future art modules with ready promises must participate automatically.
      if((sessionStorage.getItem('startup-test-mode')||'hold')==='hold')window.BagseedFutureFixture={ready:new Promise(resolve=>{window.__releaseFutureArt=resolve;})};
    },{prefix:coffeePrefix});
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?stream=1',{waitUntil:'commit'});
    await page.locator('#bagseed-loading').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>document.readyState),'loading');assert.equal(await page.locator('#screen-title').count(),0);
    await page.evaluate(()=>BagseedLoadingScene.ready);
    const moving=[];for(let i=0;i<6;i++){moving.push(await page.evaluate(()=>document.querySelector('#bagseed-loading-room').toDataURL()));await page.waitForTimeout(150);}assert.ok(new Set(moving).size>4,'Room did not animate');
    await page.evaluate(()=>BagseedLoadingScene.pause());
    const imageAt=async(t,tier=0,cloudTime=t)=>page.evaluate(([t,tier,cloudTime])=>{BagseedLoadingScene.render(t,tier,cloudTime);return document.querySelector('#bagseed-loading-room').toDataURL();},[t,tier,cloudTime]);
    const cloudCheck=await page.evaluate(()=>{
      const cv=document.querySelector('#bagseed-loading-room'),g=cv.getContext('2d');
      BagseedLoadingScene.render(3,0,0);const a=g.getImageData(0,0,cv.width,cv.height).data;
      BagseedLoadingScene.render(3,0,.65);const b=g.getImageData(0,0,cv.width,cv.height).data;
      let changed=0,escaped=0;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){
        const i=(y*cv.width+x)*4;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>3){changed++;const lx=x*2048/cv.width,ly=y*768/cv.height;if(lx<979||lx>1211||ly<59||ly>223)escaped++;}
      }return {changed,escaped};
    });assert.ok(cloudCheck.changed>100,'Clouds did not move across the sky');assert.equal(cloudCheck.escaped,0,'Clouds escaped the window');
    const day=await imageAt(0),night=await imageAt(6);assert.notEqual(day,night);assert.equal(day,await imageAt(12,0,0),'Lighting must return to identical daylight with the cloud position held constant');
    const variants=await Promise.all([0,1,2].map(tier=>imageAt(0,tier)));assert.equal(new Set(variants).size,3);
    const frames=path.join(root,'artifacts/loading-bedroom/frames');fs.mkdirSync(frames,{recursive:true});
    for(let i=0;i<72;i++){const data=await imageAt(i/6);fs.writeFileSync(path.join(frames,String(i).padStart(3,'0')+'.png'),Buffer.from(data.split(',')[1],'base64'));}
    for(const [label,t]of [['day',0],['dusk',3],['twilight',4.5],['night',6]]){await imageAt(t);await page.screenshot({path:path.join(out,'desktop-'+label+'.png')});}
    for(const [label,t]of [['day',0],['sunset',3],['twilight',4.5],['night',6]]){
      await imageAt(t);const buffer=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=960;c.height=750;c.getContext('2d').drawImage(document.querySelector('#bagseed-loading-room'),718.75,0,250,195.3125,0,0,960,750);return c.toDataURL();});fs.writeFileSync(path.join(out,'window-'+label+'.png'),Buffer.from(buffer.split(',')[1],'base64'));
    }
    await imageAt(0);await page.screenshot({path:path.join(out,'desktop-loading.png')});const layouts=[];
    for(const [name,width,height]of [['phone',390,844],['small-phone',375,667],['narrow-phone',320,568],['phone-landscape',844,390]]){
      await page.setViewportSize({width,height});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      // Long preview capture can legitimately show the 20-second Reload notice.
      assert.equal(await page.locator('#bagseed-loading').isVisible(),true);
      const bounds=await page.locator('.loading-panel').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width&&bounds.y+bounds.height<=height);
      const framing=[];
      for(const time of [0,3,6,9,12]){
        await imageAt(time);
        framing.push(await page.locator('#bagseed-loading-room').evaluate(el=>{const a=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return {x:a.x,y:a.y,width:a.width,height:a.height,focus:a.x+a.width*1095/2048,center:p.x+p.width/2};}));
      }
      assert.ok(framing.every(f=>Math.abs(f.focus-f.center)<1),'Window is not centered on '+name);
      assert.ok(framing.every(f=>Math.abs(f.x-framing[0].x)<.1&&Math.abs(f.y-framing[0].y)<.1),'Mobile camera moves during the day/night cycle on '+name);
      await imageAt(3);await page.screenshot({path:path.join(out,name+'-loading.png')});layouts.push(name);
    }
    const mobileOut=path.join(root,'review/loading-mobile-window'),mobileFrames=path.join(root,'artifacts/loading-mobile-window/frames');fs.mkdirSync(mobileOut,{recursive:true});fs.mkdirSync(mobileFrames,{recursive:true});
    await page.setViewportSize({width:390,height:844});
    for(const [label,time]of [['day',0],['sunset',3],['night',6]]){await imageAt(time);await page.screenshot({path:path.join(mobileOut,'phone-'+label+'.png')});}
    const roomBounds=await page.locator('.loading-room').boundingBox();
    for(let i=0;i<72;i++){await imageAt(i/6);await page.screenshot({path:path.join(mobileFrames,String(i).padStart(3,'0')+'.png'),clip:roomBounds});}
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await imageAt(0),await imageAt(6),'Reduced motion room must be still');assert.equal(await page.locator('.loading-track span').evaluate(el=>getComputedStyle(el).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
    releaseStream();await page.waitForFunction(()=>window.BagseedCoffee&&!BagseedCoffee.loaded&&window.__heldStartupArt.length===1&&document.readyState!=='loading');
    await page.evaluate(()=>Promise.all([BagseedMenu.ready,BagseedArt.ready,BagseedBedroom.ready,BagseedBeds.ready,BagseedDesks.ready,BagseedCurtains.ready,BagseedComputerDesks.ready,BagseedEquipment.ready,BagseedCameras.ready,BagseedChairs.ready,BagseedUnderDeskStorage.ready,BagseedLoadingScene.ready]));
    assert.equal(await page.evaluate(()=>BagseedStartup.status),'loading');assert.equal(await page.locator('#screen-title').isVisible(),false);
    assert.equal(await page.locator('#screen-title').evaluate(el=>!!el.closest('[inert]')),true);
    await page.evaluate(()=>document.querySelector('[data-act=newGame]').click());await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>screen),'title');
    const t=await page.evaluate(()=>runtime.t);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>runtime.t),t,'Game time advanced beneath the loader');
    await page.evaluate(()=>window.__heldStartupArt.splice(0).forEach(run=>run()));await page.evaluate(()=>BagseedCoffee.ready);
    assert.equal(await page.evaluate(()=>BagseedStartup.status),'loading','Future artwork was ignored');
    await page.evaluate(()=>window.__releaseFutureArt());await page.evaluate(()=>BagseedStartup.ready);
    assert.equal(await page.locator('#bagseed-loading').isVisible(),false);assert.equal(await page.locator('#screen-title').isVisible(),true);
    assert.equal(await page.locator('#screen-title').evaluate(el=>!!el.closest('[inert]')),false);
    assert.equal(await page.evaluate(()=>['BagseedMenu','BagseedArt','BagseedBedroom','BagseedBeds','BagseedDesks','BagseedCurtains','BagseedComputerDesks','BagseedEquipment','BagseedCameras','BagseedChairs','BagseedCoffee','BagseedUnderDeskStorage','BagseedLoadingScene'].every(k=>window[k].loaded)),true);
    await page.setViewportSize({width:1440,height:960});await page.screenshot({path:path.join(out,'ready-menu.png')});
    await page.locator('[data-act=newGame]').focus();await page.keyboard.press('Enter');await page.locator('#crName').fill('Loading Gardener');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    const saved=await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.money=837;state.gear.storage=2;SaveSys.now('Loading screen save fixture');sessionStorage.setItem('startup-test-mode','reject');return {key:SAVE_KEYS.main,raw:localStorage.getItem(SAVE_KEYS.main),name:state.player.name,money:state.money,look:playerLook()};});
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>BagseedStartup.status==='error');
    assert.equal(await page.locator('#screen-title').isVisible(),false);assert.equal(await page.locator('#bagseed-loading-reload').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'bagseed-loading-reload');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key)===window.__startupSaveAtEntry,saved.key),true,'Failed artwork load modified the saved game');
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'phone-load-error.png')});
    await page.evaluate(()=>sessionStorage.setItem('startup-test-mode','pass'));
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.locator('#bagseed-loading-reload').click()]);await page.evaluate(()=>BagseedStartup.ready);
    assert.equal(await page.evaluate(()=>BagseedLoadingScene.storageTier),2);assert.equal(await page.locator('#bagseed-loading').isVisible(),false);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(()=>({name:state.player.name,money:state.money,look:playerLook()})),{name:saved.name,money:saved.money,look:saved.look});
    assert.deepEqual(errors,[]);assert.ok(expectedErrors.length>0);assert.ok(expectedErrors.every(e=>e.includes('Coffee artwork failed to load')),expectedErrors.join('\n'));
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({entryPoint:'public/index.html',firstChunkBytes:cut,visibleBeforeGameHTML:true,waitsForAllArtwork:true,futureArtworkIncluded:true,noOldGraphicsExposed:true,dayNightPeriod:12,paintedOutdoorStates:4,movingCloudPixels:cloudCheck.changed,cloudsContainedInWindow:cloudCheck.escaped===0,actualAnimationFrames:new Set(moving).size,seamlessLoop:true,approvedStorageVariations:3,gameInputBlocked:true,gameTimeHeld:true,readyMenu:true,keyboardNewGame:true,layouts,mobileCamera:'fixed on window',windowCenteredAcrossCycle:true,reducedMotion:true,failedImageKeepsCover:true,reloadRecovery:true,savedProgressPreserved:true,continueGame:true,pageErrors:errors,expectedImageFailure:expectedErrors.length},null,2)+'\n');
    await context.close();
  }finally{if(streamResponse&&!streamResponse.writableEnded)streamResponse.destroy();await browser?.close();await new Promise(r=>server.close(r));}
});
