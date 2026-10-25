const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('installed gear moves from its tent to an open spot in another tent, or trades places with what is there',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Gear mover');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  await page.evaluate(()=>{settings.speed=0;settings.reduced=true;state.tut.on=false;state.money=1000;state.flags.growroom=true;runtime.pauseHelpShown=true;ACT.tipOff();if(runtime.curDialog)ACT.dlg(0);runtime.dialogQ=[];closePanel();});
  const r=await page.evaluate(()=>{
   applyExtra('tent2');applyExtra('tent4');installEquip('light',2,'closet');installEquip('fan',2,'tent2');installEquip('fan',1,'tent4');installEquip('light',3,'tent4');Gear115.sync();
   const btn=()=>[...document.querySelectorAll('[data-act=gearMove]')].map(b=>b.textContent+(b.disabled?' (disabled)':''));
   const standAt=loc=>{const r=locRect(loc);state.scene=Access.sceneOf(loc);state.player.x=r[0]+r[2]/2;state.player.y=r[1]+r[3]+4;if(!Access.atLoc(loc))throw Error('Not at '+loc);};
   const out={};
   Panels.inventory('installed');out.away=btn().filter(t=>t.includes('4x4'));
   standAt('closet');Panels.space('closet');out.closet=btn();
   const up=state.stats.upgrades,rep=state.rep.equipment;
   ACT.gearMove(Gear115.at('closet','light').iid+':tent2');
   out.open={closet:state.locations.closet.equip.light,tent2:state.locations.tent2.equip.light,unused:Gear115.unused().length,upgrades:state.stats.upgrades-up,rep:state.rep.equipment-rep};
   standAt('tent2');Panels.equip('fan','tent2');out.equip=btn();
   ACT.gearMove(Gear115.at('tent2','fan').iid+':tent4');
   out.swap={tent2:state.locations.tent2.equip.fan,tent4:state.locations.tent4.equip.fan,at:[Gear115.at('tent2','fan')?.tier,Gear115.at('tent4','fan')?.tier],unused:Gear115.unused().length};
   return out;});
  assert.ok(r.away.length&&r.away.every(t=>t.endsWith('(disabled)')),'gear is picked up at its own tent');
  assert.deepEqual(r.closet,['Move → 2x2 tent','Swap ↔ 4x4 tent']);
  assert.deepEqual(r.open,{closet:0,tent2:2,unused:0,upgrades:0,rep:0});
  assert.deepEqual(r.equip,['Move → starter tent','Swap ↔ 4x4 tent']);
  assert.deepEqual(r.swap,{tent2:1,tent4:2,at:[1,2],unused:0});
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
