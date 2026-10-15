const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
module.exports=function curtainBatchTests(config){

test('curtain batch '+config.batch+': animation, original window behavior, store/package purchase and saved choices',async()=>{
  const {createStaticServer}=await import('../../tools/server.mjs'),server=createStaticServer();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  const out=path.join(root,'artifacts/curtains-batch-'+config.batch+'/integration');fs.mkdirSync(out,{recursive:true});
  try {
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.evaluate(()=>BagseedCurtains.ready);
    assert.deepEqual(await page.evaluate(()=>BagseedCurtains.styles),['basic','blackout','floral','sheer','pattern','blinds']);
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Curtain Fixture');
    await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();
      runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.minute=720;state.weather='Sunny';state.money=1000;
    });
    const source=fs.readFileSync(path.join(root,'src/game.html'),'utf8');
    const body=source.match(/  drawCurtains\(c, x, y, w, h, t\) \{([\s\S]*?)\n  \},\n  drawDesk/)[1];
    const report=await page.evaluate(({body,ids})=>{
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
          if(BagseedCurtains.styles.includes(id))continue;
          for(const weather of ['Sunny','Windy']) {
            if(cloth(id,.7,weather,false).toDataURL()!==cloth(id,.7,weather,false,legacy).toDataURL())throw Error('Other curtain changed: '+id);
          }
        }
        for(const id of ids) {
          const a=cloth(id,0),b=cloth(id,2),wind=cloth(id,2,'Windy');
          if(a.toDataURL()===b.toDataURL()||b.toDataURL()===wind.toDataURL())throw Error('Missing animated/windy cloth');
          if(cloth(id,0,'Windy',true).toDataURL()!==cloth(id,3,'Windy',true).toDataURL())throw Error('Reduced motion failed');
          const rod=cv=>Array.from(cv.getContext('2d').getImageData(0,0,400,id==='blinds'?117:40).data).join(',');
          if(rod(a)!==rod(wind))throw Error('Hardware moves');
          // Center of the paired curtains must preserve the live window view.
          if(a.getContext('2d').getImageData(200,180,1,1).data[3])throw Error('Curtain has an opaque backdrop');
          state.room.curtains=id;settings.reduced=true;state.weather='Sunny';
          if(JSON.stringify(geometry(original))!==JSON.stringify(geometry(legacy)))throw Error('Window interaction changed');
          RoomArt.drawCurtains=original;
          const cv=document.createElement('canvas');cv.width=ROOM.W*3;cv.height=ROOM.H*3;
          BagseedBedroom.drawLight(cv.getContext('2d'),12);
          const lit=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data.some((v,i)=>i%4===3&&v);
          if(lit!==(id!=='blackout'))throw Error('Curtain light behavior changed');
          checks.push({id,animation:true,wind:true,fixedRod:true,reducedMotion:true,windowGeometry:true,light:true});
        }
        const priorRenders=Object.fromEntries(['basic','none','blackout','floral','sheer'].map(id=>[id,{still:cloth(id,.5,'Sunny',true).toDataURL(),Sunny:cloth(id,.5,'Sunny',false).toDataURL(),Windy:cloth(id,.5,'Windy',false).toDataURL()}]));
        return {checks,unchangedOptions:STYLES.curtains.length-BagseedCurtains.styles.length,catalog:STYLES.curtains,priorRenders};
      } finally {Object.assign(state.room,JSON.parse(before));RoomArt.hits=hits;RoomArt.drawCurtains=original;settings.reduced=true;state.weather='Sunny';}
    },{body,ids:config.ids});
    assert.deepEqual(report.catalog,[['basic','Basic Curtains',0],['none','No Curtains',0],['blackout','Blackout Curtains',20],['floral','Floral Curtains',18],['sheer','Sheer Curtains',14],['pattern','Patterned Curtains',18],['blinds','Blinds',22]]);
    await page.evaluate(()=>Panels.app('leafcart'));
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    const storeImages={};
    for(const id of config.paid) {
      const art=page.locator(`canvas[data-draw="style:curtains:${id}"]`);
      storeImages[id]=await art.evaluate((cv,id)=>{
        const before=JSON.stringify(state.room),hits=RoomArt.hits,expected=document.createElement('canvas');
        drawStyleIcon(expected.getContext('2d'),expected,'curtains',id);
        if(JSON.stringify(state.room)!==before||RoomArt.hits!==hits)throw Error('Store preview mutates state');
        if(cv.toDataURL()!==expected.toDataURL())throw Error('Store differs from shared curtain renderer');
        return cv.toDataURL();
      },id);
      await art.locator('..').screenshot({path:path.join(out,`store-${id}.png`)});
      await art.locator('..').locator(`[data-act=cartAdd115][data-arg="s:curtains:${id}"]`).click();
    }
    await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();
    assert.equal(await page.evaluate(()=>state.money),1000-config.price);
    for(const id of config.paid) {
      await page.evaluate(id=>{const i=state.orders.findIndex(o=>o.key==='s:curtains:'+id);if(i<0)throw Error('Missing curtain order');state.packages.push(state.orders.splice(i,1)[0]);Panels.pkg(state.packages.length-1);},id);
      await page.locator('[data-act=pkgOpen115]').click();
      const pkg=page.locator(`#panelBody canvas[data-draw="style:curtains:${id}"]`);await pkg.waitFor();
      assert.equal(await pkg.evaluate(cv=>cv.toDataURL()),storeImages[id]);
      assert.equal(await page.evaluate(id=>styleOwned('curtains',id),id),true);
      await page.locator('#panelBody').screenshot({path:path.join(out,`package-${id}.png`)});
    }
    const selection=await page.evaluate(ids=>{
      closePanel();const selected=ids.map(id=>{ACT.style('curtains:'+id);return state.room.curtains===id;});
      if(!SaveSys.now('Curtain integration'))throw Error('Save failed');return selected;
    },config.ids);assert.ok(selection.every(Boolean));
    await page.reload();await page.evaluate(()=>BagseedCurtains.ready);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(ids=>[state.room.curtains,ids.every(id=>styleOwned('curtains',id)),state.money],config.ids),[config.ids.at(-1),true,1000-config.price]);
    await page.evaluate(()=>{settings.speed=0;settings.reduced=true;ACT.tipOff();closePanel();View.snap();});
    await page.screenshot({path:path.join(out,'room.png')});
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{View.resize();View.snap();});
    await page.screenshot({path:path.join(out,'phone.png')});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.evaluate(()=>{Panels.app('leafcart');runtime.shopQ='';});
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    for(const id of config.paid) {
      const phoneArt=page.locator(`canvas[data-draw="style:curtains:${id}"]`);await phoneArt.scrollIntoViewIfNeeded();
      const ratio=await phoneArt.evaluate(cv=>{const r=cv.getBoundingClientRect();return r.width/r.height;});
      assert.ok(Math.abs(ratio-320/272)<.01);await phoneArt.locator('..').screenshot({path:path.join(out,`store-${id}-phone.png`)});
    }
    const expected=JSON.parse(fs.readFileSync(path.join(root,'review/curtains-batch-03/prior-render-hashes.json')));
    const {createHash}=require('node:crypto');
    for(const [id,frames] of Object.entries(report.priorRenders))for(const [mode,uri] of Object.entries(frames))assert.equal(createHash('sha256').update(uri).digest('hex'),expected.styles[id][mode],'Previous curtain rendering changed: '+id+':'+mode);
    delete report.priorRenders;
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,purchase:config.price,packageMatchesStore:true,saveReload:true,phone:true,errors},null,2)+'\n');
  } finally {await browser?.close();await new Promise(r=>server.close(r));}
});

};
