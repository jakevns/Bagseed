const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('smart controller steers the room mini-split from any space in the room and only locks sliders while steering',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await require('./helpers/art-page.cjs')(browser,{viewport:{width:1100,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Brain Check');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const r=await page.evaluate(()=>{
   settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();state.locations.tent2.owned=true;
   const locked=loc=>/data-input="heatTo" data-loc="[^"]+" disabled/.test(devCtl('hvac',loc));
   const setup=(hvac,ctrl,plant)=>{for(const id in state.plants)delete state.plants[id];for(const loc of ['closet','tent2']){const L=state.locations[loc];L.slots=L.slots.map(()=>null);Object.assign(L.equip,{ctrl:0,heater:0,ac:0,hvac:0});L.heatTo=60;L.coolTo=86;}
    state.locations[hvac].equip.hvac=2;state.locations[hvac].on.hvac=true;state.locations[ctrl].equip.ctrl=1;state.locations[ctrl].on.ctrl=true;if(plant){const p=createPlant('velvet',plant,0);p.stage=6;}};
   const ideal=idealFor(6).t,want=[ideal[0]+1,ideal[1]-1],out={want};
   for(const [name,hvac,ctrl,plant] of [['same','closet','closet','closet'],['plantsElsewhere','closet','closet','tent2'],['ctrlElsewhere','closet','tent2','tent2'],['ctrlElsewherePlantsWithHvac','closet','tent2','closet']]){
    setup(hvac,ctrl,plant);hourly();out[name]={targets:[state.locations.closet.heatTo,state.locations.closet.coolTo],locked:locked('closet')};
   }
   setup('closet','tent2','tent2');out.steering=devCtl('ctrl','tent2').includes(EQ.hvac[2].name);
   setup('closet','closet',null);hourly();out.idle={targets:[state.locations.closet.heatTo,state.locations.closet.coolTo],locked:locked('closet')};
   setup('closet','closet','closet');state.scene='bedroom';const rc=locRect('closet');state.player.x=rc[0]+rc[2]/2;state.player.y=rc[1]+rc[3]+6;state.locations.closet.on.ctrl=false;ACT.pwr('closet:ctrl');out.immediate=[state.locations.closet.heatTo,state.locations.closet.coolTo];
   return out;
  });
  for(const k of ['same','plantsElsewhere','ctrlElsewhere','ctrlElsewherePlantsWithHvac'])assert.deepEqual(r[k],{targets:r.want,locked:true},k);
  assert.equal(r.steering,true);assert.deepEqual(r.idle,{targets:[60,86],locked:false});assert.deepEqual(r.immediate,r.want);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
