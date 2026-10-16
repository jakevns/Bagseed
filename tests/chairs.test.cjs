const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');

test('approved chairs retain store delivery, style choices, finish purchases, placement, seating and saves',async()=>{
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  const out=path.join(__dirname,'../artifacts/chairs');fs.mkdirSync(out,{recursive:true});
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedChairs.ready);
    assert.equal(await page.evaluate(()=>BagseedChairs.revision),'chairs-2');
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Chair Fixture');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
      state.money=1000;state.sale.day=-1;state.room.placed=[];state.room.rgb.on=false;Panels.app('leafcart');
    });
    const store={};await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    for(const id of ['office','gaming','wood']){
      const c=page.locator(`canvas[data-draw="style:chair:${id}"]`);assert.deepEqual(await c.evaluate(c=>[c.width,c.height]),[320,280]);store['s:chair:'+id]=await c.evaluate(c=>c.toDataURL());
      await page.locator(`[data-act=cartAdd115][data-arg="s:chair:${id}"]`).click();
    }
    await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();assert.equal(await page.evaluate(()=>state.money),805);
    await page.locator('[data-act=decorCat][data-arg=office]').click();const office=page.locator('canvas[data-draw="decor:officechair"]');
    assert.equal(await office.evaluate(c=>{const expected=document.createElement('canvas');drawDecorIcon(expected.getContext('2d'),expected,'officechair');return c.toDataURL()===expected.toDataURL();}),true,'Store hydration replaced the chair artwork');
    store['d:officechair']=await office.evaluate(c=>c.toDataURL());await page.locator('[data-act=cartAdd115][data-arg="d:officechair"]').click();
    await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();assert.equal(await page.evaluate(()=>state.money),760);
    for(const key of ['s:chair:office','s:chair:gaming','s:chair:wood','d:officechair']){
      await page.evaluate(key=>{const i=state.orders.findIndex(o=>o.key===key);if(i<0)throw Error('Chair order missing');state.packages.push(state.orders.splice(i,1)[0]);Panels.pkg(state.packages.length-1);},key);
      await page.locator('[data-act=pkgOpen115]').click();const icon=key==='d:officechair'?'decor:officechair':key.replace('s:','style:');
      assert.equal(await page.locator(`canvas[data-draw="${icon}"]`).evaluate(c=>c.toDataURL()),store[key]);
      if(key.startsWith('s:'))assert.equal(await page.evaluate(()=>state.room.chair),key.split(':')[2]);
    }
    await page.evaluate(()=>{closePanel();Deco.open();});await page.locator('[data-act=decoTab][data-arg=styles]').click();
    for(const id of ['none','folding','office','gaming','wood']){
      await page.locator(`[data-act=style][data-arg="chair:${id}"]`).click();assert.equal(await page.evaluate(()=>state.room.chair),id);
      assert.equal(await page.evaluate(()=>DecoZ.statics('bedroom').some(b=>b[4]==='the desk chair')),id!=='none');
    }
    const saved=await page.evaluate(()=>{
      Deco.close();Deco.open();Deco.pick('officechair');Deco.move(115,145);if(!Deco.place())throw Error('Cannot place Office Chair');
      const chair=state.room.placed.find(d=>d.id==='officechair'),renders=[];
      function render(d){const c=document.createElement('canvas');c.width=160;c.height=240;const g=c.getContext('2d');g.scale(10,10);g.translate(2-d.x,3-d.y);drawDecor(g,d,0);return c.toDataURL();}
      renders.push(render(chair));Deco.pickPlaced(chair);Deco.variant();Deco.flip();Deco.move(115,145);if(!Deco.place())throw Error('Cannot apply Teal finish and flip');
      const teal=state.room.placed.find(d=>d.id==='officechair');renders.push(render(teal));if(renders[0]===renders[1])throw Error('Teal artwork did not change');
      if(teal.v!==1||!teal.flip||!state.room.own['v:officechair:1'])throw Error('Finish or flip missing');Deco.close();
      state.player.energy=50;state.seatDay=-1;interact('decor:'+teal.uid);if(state.seatDay!==state.day||state.player.energy<=50)throw Error('Chair seat interaction failed');
      const energy=state.player.energy,minute=state.minute;interact('decor:'+teal.uid);if(state.player.energy!==energy||state.minute!==minute)throw Error('Seat daily limit changed');
      SaveSys.now('Approved chairs');return {chair:state.room.chair,money:state.money,placed:state.room.placed,owned:state.room.own.officechair,teal:state.room.own['v:officechair:1']};
    });
    assert.equal(saved.money,752);assert.equal(saved.owned,1);
    await page.reload();await page.evaluate(()=>BagseedChairs.ready);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(()=>({chair:state.room.chair,money:state.money,placed:state.room.placed,owned:state.room.own.officechair,teal:state.room.own['v:officechair:1']})),saved);
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{settings.speed=0;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();Panels.app('leafcart');});
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=office]').click();
    const phone=page.locator('canvas[data-draw="decor:officechair"]');await phone.scrollIntoViewIfNeeded();assert.ok(Math.abs(await phone.evaluate(c=>{const r=c.getBoundingClientRect();return r.width/r.height;})-8/7)<.01);
    await phone.locator('..').screenshot({path:path.join(out,'store-office-phone.png')});assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({stylePurchases:3,officeChairPurchase:1,tealUnlock:8,totalPaid:248,styleSwitches:5,packageMatchesStore:true,placementAndFlip:true,seatAndDailyLimit:true,saveReload:true,phoneStore:true,final:saved,errors},null,2)+'\n');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
