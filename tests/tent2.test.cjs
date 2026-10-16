const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('approved 2x2 art loads before play, purchases and fits all shells, preserves a save and reserves the widened footprint',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedStartup.ready);assert.equal(await page.evaluate(()=>BagseedTent2.loaded&&BagseedStarterTent.loaded),true);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Tent buyer');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  await page.evaluate(()=>{settings.speed=0;settings.reduced=true;state.tut.on=false;state.money=1000;state.stats.harvests=2;state.sale.day=-1;runtime.pauseHelpShown=true;ACT.tipOff();if(runtime.curDialog)ACT.dlg(0);runtime.dialogQ=[];closePanel();});
  const images={};
  for(const [id,price,tier] of [['tent2',89,'standard'],['shell_tent2_pro',49,'pro'],['shell_tent2_premium',95,'premium']]){
   await page.evaluate(()=>{closePanel();Panels.app('leafcart');});await page.locator('[data-act=shopCat][data-arg=spaces]').click();const icon=page.locator('canvas[data-draw="x:'+id+'"]');await icon.scrollIntoViewIfNeeded();images[tier]=await icon.evaluate(c=>c.toDataURL());assert.deepEqual(await icon.evaluate(c=>[c.width,c.height]),[320,240]);
   const money=await page.evaluate(()=>state.money);await page.locator('[data-act=cartAdd115][data-arg="x:'+id+'"]').click();await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();assert.equal(await page.evaluate(()=>state.money),money-price);
   await page.evaluate(id=>{const i=state.orders.findIndex(o=>o.key==='x:'+id);if(i<0)throw Error('Order missing');state.packages.push(state.orders.splice(i,1)[0]);Panels.pkg(state.packages.length-1);},id);await page.locator('[data-act=pkgOpen115]').click();assert.equal(await page.locator('canvas[data-draw="x:'+id+'"] ').evaluate(c=>c.toDataURL()),images[tier]);
   if(tier==='standard')await page.evaluate(()=>{if(!state.locations.tent2.owned||state.locations.tent2.slots.length!==2)throw Error('Tent purchase failed');for(let i=0;i<2;i++){const p=createPlant('porchlight','tent2',i);Object.assign(p,{stage:4,height:8,water:60,health:92,repStress:0,moves:[]});}});
   else await page.evaluate(tier=>{closePanel();const sh=Shell.S().inv.find(s=>s.size==='tent2'&&s.tier===tier),L=state.locations.tent2,snapshot=()=>JSON.stringify([Object.values(state.plants).map(p=>[p.id,p.loc,p.slot,p.lineId,p.name,p.seed,p.pheno]),L.slots,L.equip]),before=snapshot();state.player.x=107;state.player.y=132;Shell.swap(sh.sid,'tent2');if(Shell.of('tent2').tier!==tier||snapshot()!==before)throw Error('Shell fitting failed or changed grow contents: '+JSON.stringify({tier,actual:Shell.of('tent2').tier,energy:state.energy,access:Access.atLoc('tent2'),rect:locRect('tent2'),same:snapshot()===before}));},tier);
  }
  const saved=await page.evaluate(()=>{
   closePanel();const r=locRect('tent2'),solid=SCENES.bedroom.solids().find(r=>r[0]===64&&r[2]===86),wall=WALL_BLOCK113().find(r=>r[4]==='the tent');if(JSON.stringify(r)!=='[64,8,86,112]'||!solid||wall[0]!==64||wall[2]!==86)throw Error('Tent footprint mismatch');
   if(!DecoZ.baseBlocked('bedroom')(70,110)||DecoZ.baseBlocked('bedroom')(107,132))throw Error('Tent floor collision/approach mismatch');
   const L=state.locations.tent2,before=JSON.stringify([L.slots,L.equip,state.plants]);state.gear.water=3;SaveSys.now('2x2 approved');return {before,money:state.money};
  });
  await page.reload();await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();assert.deepEqual(await page.evaluate(()=>({before:JSON.stringify([state.locations.tent2.slots,state.locations.tent2.equip,state.plants]),money:state.money})),saved);assert.equal(await page.evaluate(()=>Shell.of('tent2').tier),'premium');assert.equal(await page.evaluate(()=>state.gear.water),3);assert.deepEqual(errors,[]);
  const out=path.resolve(__dirname,'../review/tents-2x2/publish-validation.json');fs.writeFileSync(out,JSON.stringify({production:true,startup:true,purchases:[89,49,95],deliveryArtwork:true,shellFitting:true,plantAndGearPreservation:true,collisionAndPlacement:true,saveReload:true,errors},null,2)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
