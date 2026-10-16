const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('approved 4x4 art loads before play, purchases and fits all shells, preserves a save and keeps the four-slot grow-room footprint',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);assert.equal(await page.evaluate(()=>BagseedTent4.loaded&&BagseedStarterTent.loaded),true);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Tent buyer');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  await page.evaluate(()=>{settings.speed=0;settings.reduced=true;state.tut.on=false;state.money=1000;state.stats.harvests=2;state.flags.growroom=true;state.sale.day=-1;runtime.pauseHelpShown=true;ACT.tipOff();if(runtime.curDialog)ACT.dlg(0);runtime.dialogQ=[];closePanel();});
  const images={};
  for(const [id,price,tier] of [['tent4',249,'standard'],['shell_tent4_pro',119,'pro'],['shell_tent4_premium',219,'premium']]){
   await page.evaluate(()=>{closePanel();Panels.app('leafcart');});await page.locator('[data-act=shopCat][data-arg=spaces]').click();const icon=page.locator('canvas[data-draw="x:'+id+'"]');await icon.scrollIntoViewIfNeeded();images[tier]=await icon.evaluate(c=>c.toDataURL());assert.deepEqual(await icon.evaluate(c=>[c.width,c.height]),[320,240]);
   const money=await page.evaluate(()=>state.money);await page.locator('[data-act=cartAdd115][data-arg="x:'+id+'"]').click();await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();assert.equal(await page.evaluate(()=>state.money),money-price);
   await page.evaluate(id=>{const i=state.orders.findIndex(o=>o.key==='x:'+id);if(i<0)throw Error('Order missing');state.packages.push(state.orders.splice(i,1)[0]);Panels.pkg(state.packages.length-1);},id);await page.locator('[data-act=pkgOpen115]').click();assert.equal(await page.locator('canvas[data-draw="x:'+id+'"] ').evaluate(c=>c.toDataURL()),images[tier]);
   if(tier==='standard')await page.evaluate(()=>{if(!state.locations.tent4.owned||state.locations.tent4.slots.length!==4)throw Error('Tent purchase failed');for(let i=0;i<4;i++){const p=createPlant('porchlight','tent4',i);Object.assign(p,{stage:4,height:8,water:60,health:92,repStress:0,moves:[]});}});
   else await page.evaluate(tier=>{closePanel();const sh=Shell.S().inv.find(s=>s.size==='tent4'&&s.tier===tier),L=state.locations.tent4,snapshot=()=>JSON.stringify([Object.values(state.plants).map(p=>[p.id,p.loc,p.slot,p.lineId,p.name,p.seed,p.pheno]),L.slots,L.equip]),before=snapshot();state.scene='growroom';state.player.x=88;state.player.y=146;Shell.swap(sh.sid,'tent4');if(Shell.of('tent4').tier!==tier||snapshot()!==before)throw Error('Shell fitting failed or changed grow contents: '+JSON.stringify({tier,actual:Shell.of('tent4').tier,energy:state.energy,access:Access.atLoc('tent4'),rect:locRect('tent4'),same:snapshot()===before}));},tier);
  }
  const saved=await page.evaluate(()=>{
   closePanel();const r=locRect('tent4'),solid=SCENES.growroom.solids().find(r=>r[0]===22&&r[2]===132);if(JSON.stringify(r)!=='[22,6,132,128]'||!solid)throw Error('Tent footprint mismatch');
   if(!Move.blocked(88,120)||Move.blocked(88,146))throw Error('Tent floor collision/approach mismatch');
   const L=state.locations.tent4,before=JSON.stringify([L.slots,L.equip,state.plants]);state.gear.water=3;SaveSys.now('4x4 approved');return {before,money:state.money};
  });
  await page.reload();await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();assert.deepEqual(await page.evaluate(()=>({before:JSON.stringify([state.locations.tent4.slots,state.locations.tent4.equip,state.plants]),money:state.money})),saved);assert.equal(await page.evaluate(()=>Shell.of('tent4').tier),'premium');assert.equal(await page.evaluate(()=>state.gear.water),3);assert.deepEqual(errors,[]);
  const out=path.resolve(__dirname,'../review/tents-4x4/publish-validation.json');fs.writeFileSync(out,JSON.stringify({production:true,startup:true,purchases:[249,119,219],deliveryArtwork:true,shellFitting:true,plantAndGearPreservation:true,collisionAndPlacement:true,saveReload:true,errors},null,2)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
