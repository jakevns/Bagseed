const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('people stand at a believable height in the home grow spaces only',async()=>{
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Person Scale');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
    const report=await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;state.minute=720;state.weather='Sunny';state.mess=[];runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.flags.growroom=true;
      // Height of the player's drawn pixels: the scene with the player minus
      // the same scene with the player moved out of the way.
      const height=(scene,x,y)=>{
        state.scene=scene;const S=curScene(),frame=px=>{state.player.x=px;state.player.y=y;state.player.dir='down';const cv=document.createElement('canvas');cv.width=S.w;cv.height=S.h;const c=cv.getContext('2d');S.draw(c,0);return c.getImageData(0,0,S.w,S.h).data;};
        const a=frame(x),b=frame(x>S.w/2?40:S.w-40);let top=S.h,bottom=-1;
        for(let yy=0;yy<S.h;yy++)for(let xx=x-30;xx<=x+30;xx++){const i=(yy*S.w+xx)*4;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>40){top=Math.min(top,yy);bottom=Math.max(bottom,yy);}}
        RoomArt.hits=[];frame(x);const hit=RoomArt.hits.find(h=>h.id==='player');
        return {height:bottom-top+1,hitHeight:hit?.h??null};
      };
      return {bedroom:height('bedroom',250,150),growroom:height('growroom',400,160),hallway:height('hallway',120,160),scale:BagseedPersonScale.scale,scenes:BagseedPersonScale.scenes};
    });
    assert.deepEqual(errors,[]);assert.equal(report.scale,1.35);assert.deepEqual(report.scenes,['bedroom','growroom']);
    for(const scene of ['bedroom','growroom'])assert.ok(report[scene].height>=38,`${scene} player is ${report[scene].height} world units tall`);
    for(const scene of ['bedroom','growroom'])assert.ok(report[scene].hitHeight>=38,'tap area follows the taller sprite');
    assert.ok(report.hallway.height<=40,`hallway player stays at its original size, got ${report.hallway.height}`);
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
