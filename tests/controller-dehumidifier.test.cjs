const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('smart controller switches a plain dehumidifier at the plug and says when humidity outruns it',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await require('./helpers/art-page.cjs')(browser,{viewport:{width:1100,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Dry Check');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const r=await page.evaluate(()=>{
   settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();
   state.scene='bedroom';const rc=locRect('closet');state.player.x=rc[0]+rc[2]/2;state.player.y=rc[1]+rc[3]+6;
   const L=state.locations.closet;for(const id in state.plants)delete state.plants[id];L.slots=L.slots.map(()=>null);
   Object.assign(L.equip,{ctrl:1,dehum:1,humid:0,heater:0,ac:0,hvac:0});L.on.ctrl=true;L.dehumOn=false;const p=createPlant('velvet','closet',0);p.stage=9;
   const ceiling=Math.round((idealFor(9).h[0]+idealFor(9).h[1])/2)+4,out={ceiling};
   state.baseHum=70;hourly();out.muggy={on:L.dehumOn,locked:/data-act="dehum"[^>]*disabled/.test(devCtl('dehum','closet')),listed:devCtl('ctrl','closet').includes(EQ.dehum[1].name),outrun:devCtl('dehum','closet').includes('Running flat out')};
   ACT.dehum('closet');out.manualIgnored=L.dehumOn;
   state.baseHum=20;hourly();out.dry=L.dehumOn;
   L.on.ctrl=false;ACT.dehum('closet');out.manual=L.dehumOn;
   return out;
  });
  assert.deepEqual(r.muggy,{on:true,locked:true,listed:true,outrun:true});
  assert.equal(r.manualIgnored,true);assert.equal(r.dry,false);assert.equal(r.manual,true);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
