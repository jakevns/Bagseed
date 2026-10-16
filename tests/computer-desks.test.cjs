const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');

test('approved desks preserve purchases, finish unlocks, attached lamps, flips and saved furniture',async()=>{
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  const out=path.join(__dirname,'../artifacts/computer-desks');fs.mkdirSync(out,{recursive:true});
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedComputerDesks.ready);
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Computer Desk Fixture');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
      state.money=1000;state.sale.day=-1;state.room.placed=[];state.room.own.lavalamp=1;Panels.app('leafcart');
    });
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=office]').click();
    const card=page.locator('canvas[data-draw="decor:sidedesk"]');assert.deepEqual(await card.evaluate(c=>[c.width,c.height]),[320,200]);const store=await card.evaluate(c=>c.toDataURL());
    await page.locator('[data-act=cartAdd115][data-arg="d:sidedesk"]').click();await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();
    assert.equal(await page.evaluate(()=>state.money),950);
    await page.evaluate(()=>{const i=state.orders.findIndex(o=>o.key==='d:sidedesk');if(i<0)throw Error('Desk not ordered');state.packages.push(state.orders.splice(i,1)[0]);Panels.pkg(state.packages.length-1);});
    await page.locator('[data-act=pkgOpen115]').click();assert.equal(await page.evaluate(()=>state.room.own.sidedesk),1);assert.equal(await page.locator('canvas[data-draw="decor:sidedesk"]').evaluate(c=>c.toDataURL()),store);
    const report=await page.evaluate(()=>{
      closePanel();Deco.open();Deco.pick('sidedesk');Deco.move(115,145);if(!Deco.place())throw Error('Cannot place desk');
      const desk=state.room.placed.find(d=>d.id==='sidedesk');
      Deco.pick('lavalamp');Deco.move(desk.x+15,desk.y-7);if(!Deco.place())throw Error('Cannot put lamp on desk');
      const lamp=state.room.placed.find(d=>d.id==='lavalamp');if(lamp.on!==desk.uid||lamp.y+14!==desk.y)throw Error('Lamp not attached to tabletop');
      const frames=[];
      for(let v=0;v<3;v++){
        const current=state.room.placed.find(d=>d.uid===desk.uid);Deco.pickPlaced(current);
        if(v)Deco.variant();if(v===1)Deco.flip();Deco.move(115+v*8,145);
        if(!Deco.place())throw Error('Cannot apply desk finish '+v);
        const rec=state.room.placed.find(d=>d.uid===desk.uid),kid=state.room.placed.find(d=>d.uid===lamp.uid);
        if(rec.v!==v||kid.y+14!==rec.y||kid.on!==rec.uid||kid.x-rec.x!==lamp.x-desk.x)throw Error('Variant or attached lamp lost');
        const c=document.createElement('canvas');c.width=400;c.height=260;const g=c.getContext('2d');g.scale(10,10);g.translate(5-rec.x,5-rec.y);drawDecor(g,rec,0);frames.push(c.toDataURL());
      }
      if(new Set(frames).size!==3)throw Error('Variant artwork is not distinct');
      if(!state.room.own['v:sidedesk:1']||!state.room.own['v:sidedesk:2'])throw Error('Finish ownership missing');
      Deco.close();SaveSys.now('approved computer desks');
      return {money:state.money,records:state.room.placed,variants:3,flipped:state.room.placed.find(d=>d.id==='sidedesk').flip};
    });
    assert.equal(report.money,913);assert.equal(report.flipped,true);
    await page.reload();await page.evaluate(()=>BagseedComputerDesks.ready);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(()=>state.room.placed),report.records);assert.equal(await page.evaluate(()=>state.room.own['v:sidedesk:2']),1);
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,packageMatchesStore:true,saveReload:true,errors},null,2)+'\n');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
