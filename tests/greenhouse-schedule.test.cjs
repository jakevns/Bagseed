const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('a greenhouse light schedule picked by hand survives the next morning; Follow season hands it back',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Greenhouse grower');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const r=await page.evaluate(()=>{
   settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();Access.atLoc=()=>true;Access.atPlant=()=>true;
   Seasons.name=()=>'Summer';state.gh.tier=2;state.gh.building=0;
   const L=state.locations.gh;L.owned=true;Object.assign(L.equip,{light:4,ctrl:1,pot:3});L.on.ctrl=true;L.slots.fill(null);delete L.manualSchedule;L.schedule='veg';
   const p=createPlant(state.bagLine,'gh',0);Object.assign(p,{stage:S.matveg,height:30,health:95,water:60});GEN(p.lineId).lifecycle='photo';GEN(p.lineId).revealed.lifecycle=true;
   const out={};
   // the light panel's 12/12 chip (the tester's case, with the controller running)
   ACT.sched('gh:flower');Seasons.daily();out.chip=L.schedule;
   // Follow season goes back to long summer days
   ACT.sched('gh:season');out.seasonNow=L.schedule;out.manualAfterSeason=!!L.manualSchedule;Seasons.daily();out.seasonNext=L.schedule;
   // the plant's "Flip lights to 12/12" action sticks too
   runtime.plantSel=p.id;ACT.care('flip');Seasons.daily();out.flip=L.schedule;closePanel();
   return out;
  });
  assert.equal(r.chip,'flower','12/12 chosen in the greenhouse must survive Seasons.daily');
  assert.equal(r.seasonNow,'veg');assert.equal(r.manualAfterSeason,false);assert.equal(r.seasonNext,'veg');
  assert.equal(r.flip,'flower','the plant Flip action must survive Seasons.daily');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
