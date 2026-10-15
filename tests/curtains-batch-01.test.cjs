const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');

test('curtain batch 01 preserves window/other styles, animates cloth, and shares store/package art through purchase and save',async()=>{
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  const out=path.join(root,'artifacts/curtains-batch-01/integration');fs.mkdirSync(out,{recursive:true});
  try {
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.evaluate(()=>BagseedCurtains.ready);
    assert.deepEqual(await page.evaluate(()=>BagseedCurtains.styles),['basic','blackout']);
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Curtain Fixture');
    await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();
      runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.minute=720;state.weather='Sunny';state.money=1000;
    });
    const source=fs.readFileSync(path.join(root,'src/game.html'),'utf8');
    const body=source.match(/  drawCurtains\(c, x, y, w, h, t\) \{([\s\S]*?)\n  \},\n  drawDesk/)[1];
    const report=await page.evaluate(body=>{
      const legacy=eval('(function(c,x,y,w,h,t){'+body+'})'),before=JSON.stringify(state.room),hits=RoomArt.hits;
      const original=RoomArt.drawCurtains,checks=[];
      function cloth(id,t,weather='Sunny',reduced=false,fn=original) {
        state.room.curtains=id;state.weather=weather;settings.reduced=reduced;
        const cv=document.createElement('canvas');cv.width=400;cv.height=340;
        const c=cv.getContext('2d');c.scale(5,5);fn.call(RoomArt,c,14,10,52,42,t);return cv;
      }
      function geometry(fn) {
        RoomArt.drawCurtains=fn;RoomArt.hits=[];
        const cv=document.createElement('canvas');cv.width=ROOM.W*3;cv.height=ROOM.H*3;
        const c=cv.getContext('2d');c.scale(3,3);RoomArt.drawWindow(c,0);
        const hit=RoomArt.hits.find(h=>h.id==='window');return [hit.x,hit.y,hit.w,hit.h,...hit.walk];
      }
      try {
        for(const [id] of STYLES.curtains) {
          if(['basic','blackout'].includes(id))continue;
          for(const weather of ['Sunny','Windy']) {
            if(cloth(id,.7,weather,false).toDataURL()!==cloth(id,.7,weather,false,legacy).toDataURL())throw Error('Other curtain changed: '+id);
          }
        }
        for(const id of ['basic','blackout']) {
          const a=cloth(id,0),b=cloth(id,2),wind=cloth(id,2,'Windy');
          if(a.toDataURL()===b.toDataURL()||b.toDataURL()===wind.toDataURL())throw Error('Missing animated/windy cloth');
          if(cloth(id,0,'Windy',true).toDataURL()!==cloth(id,3,'Windy',true).toDataURL())throw Error('Reduced motion failed');
          const rod=cv=>Array.from(cv.getContext('2d').getImageData(0,0,400,40).data).join(',');
          if(rod(a)!==rod(wind))throw Error('Hardware moves');
          // Center of the paired curtains must preserve the live window view.
          if(a.getContext('2d').getImageData(200,180,1,1).data[3])throw Error('Curtain has an opaque backdrop');
          state.room.curtains=id;settings.reduced=true;state.weather='Sunny';
          if(JSON.stringify(geometry(original))!==JSON.stringify(geometry(legacy)))throw Error('Window interaction changed');
          RoomArt.drawCurtains=original;
          const cv=document.createElement('canvas');cv.width=ROOM.W*3;cv.height=ROOM.H*3;
          BagseedBedroom.drawLight(cv.getContext('2d'),12);
          const lit=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data.some((v,i)=>i%4===3&&v);
          if(lit!==(id==='basic'))throw Error('Curtain light behavior changed');
          checks.push({id,animation:true,wind:true,fixedRod:true,reducedMotion:true,windowGeometry:true,light:true});
        }
        return {checks,unchangedOptions:5,catalog:STYLES.curtains};
      } finally {Object.assign(state.room,JSON.parse(before));RoomArt.hits=hits;RoomArt.drawCurtains=original;settings.reduced=true;state.weather='Sunny';}
    },body);
    assert.deepEqual(report.catalog,[['basic','Basic Curtains',0],['none','No Curtains',0],['blackout','Blackout Curtains',20],['floral','Floral Curtains',18],['sheer','Sheer Curtains',14],['pattern','Patterned Curtains',18],['blinds','Blinds',22]]);
    await page.evaluate(()=>Panels.app('leafcart'));
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    const art=page.locator('canvas[data-draw="style:curtains:blackout"]');
    const storeImage=await art.evaluate(cv=>{
      const before=JSON.stringify(state.room),hits=RoomArt.hits,expected=document.createElement('canvas');
      drawStyleIcon(expected.getContext('2d'),expected,'curtains','blackout');
      if(JSON.stringify(state.room)!==before||RoomArt.hits!==hits)throw Error('Store preview mutates state');
      if(cv.toDataURL()!==expected.toDataURL())throw Error('Store differs from shared curtain renderer');
      return cv.toDataURL();
    });
    await art.locator('..').screenshot({path:path.join(out,'store-card.png')});
    await art.locator('..').locator('[data-act=cartAdd115][data-arg="s:curtains:blackout"]').click();
    await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();
    assert.deepEqual(await page.evaluate(()=>[state.money,state.orders.at(-1).key]),[980,'s:curtains:blackout']);
    await page.evaluate(()=>{const i=state.orders.findIndex(o=>o.key==='s:curtains:blackout');state.packages.push(state.orders.splice(i,1)[0]);Panels.pkg(state.packages.length-1);});
    await page.locator('[data-act=pkgOpen115]').click();
    const pkg=page.locator('#panelBody canvas[data-draw="style:curtains:blackout"]');await pkg.waitFor();
    assert.equal(await pkg.evaluate(cv=>cv.toDataURL()),storeImage);
    assert.equal(await page.evaluate(()=>styleOwned('curtains','blackout')),true);
    await page.locator('#panelBody').screenshot({path:path.join(out,'package.png')});
    const selection=await page.evaluate(()=>{
      closePanel();ACT.style('curtains:basic');const basic=state.room.curtains==='basic';
      ACT.style('curtains:blackout');const blackout=state.room.curtains==='blackout';
      if(!SaveSys.now('Curtain integration'))throw Error('Save failed');return {basic,blackout};
    });assert.deepEqual(selection,{basic:true,blackout:true});
    await page.reload();await page.evaluate(()=>BagseedCurtains.ready);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(()=>[state.room.curtains,styleOwned('curtains','blackout'),state.money]),['blackout',true,980]);
    await page.evaluate(()=>{settings.speed=0;settings.reduced=true;ACT.tipOff();closePanel();View.snap();});
    await page.screenshot({path:path.join(out,'room.png')});
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{View.resize();View.snap();});
    await page.screenshot({path:path.join(out,'phone.png')});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.evaluate(()=>{Panels.app('leafcart');runtime.shopQ='';});
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    const phoneArt=page.locator('canvas[data-draw="style:curtains:blackout"]');await phoneArt.scrollIntoViewIfNeeded();
    const ratio=await phoneArt.evaluate(cv=>{const r=cv.getBoundingClientRect();return r.width/r.height;});
    assert.ok(Math.abs(ratio-320/272)<.01);await phoneArt.locator('..').screenshot({path:path.join(out,'store-phone.png')});
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,purchase:20,packageMatchesStore:true,saveReload:true,phone:true,errors},null,2)+'\n');
  } finally {await browser?.close();await new Promise(r=>server.close(r));}
});
