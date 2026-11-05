const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('garden plants trade pots with garden and cannabis plants; drying harvests never share a tent with grow-pot garden plants',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Pot trader');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const r=await page.evaluate(()=>{
   settings.speed=0;settings.reduced=true;state.tut.on=false;state.flags.growroom=true;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();Access.atLoc=()=>true;Access.atPlant=()=>true;
   for(const loc of ['tent4','tent2']){const L=state.locations[loc];L.owned=true;Object.assign(L.equip,{pot:2,light:2,fan:2});L.slots.fill(null);GrowPotGarden.arr(loc).fill(null);GP.pots()[loc].fill(null);}
   const grow=(loc,slot,stage)=>{const p=createPlant(state.bagLine,loc,slot);Object.assign(p,{stage,height:8,health:92,water:60,repStress:0,moves:[]});if(stage>=S.drying){p.dry=newDry();p.dry.prog=.3;}return p;};
   const garden=(sp,kind,loc,i)=>{const p=GP.newPlant(sp,{kind,ref:loc});(kind==='slot'?GrowPotGarden.arr(loc):GP.pots()[loc])[i]=p.gid;return p;};
   const out={};
   // a drying harvest can't be swapped into a tent with garden plants in grow pots, but companion pots are fine
   const drying=grow('tent2',0,S.drying),growing=grow('tent4',0,4),basil=garden('P058','pot','tent4',0);
   out.swapCompanion=TentSwap1151.pair(drying,growing);
   const sage=garden('P058','slot','tent4',2);
   out.swapBlocked=TentSwap1151.pair(drying,growing);
   // the grow-pot plant can't move into the drying tent's grow pot; the companion plant can join its companion pot
   out.slotClash=PotShuffle.check({kind:'slot',loc:'tent4',i:2},{kind:'slot',loc:'tent2',i:1});
   out.moveCompanion=PotShuffle.check({kind:'pot',loc:'tent4',i:0},{kind:'pot',loc:'tent2',i:0});
   GrowPotGarden.arr('tent4')[2]=null;GP.remove(sage.gid);
   PotShuffle.open(basil.gid);out.panel=document.querySelector('#panelBody').innerHTML.includes('Move or trade')||document.querySelector('#panelTitle').textContent;
   // garden plant in a grow pot trades with a drying harvest: harvest lands in a tent with no garden plants left
   GP.pots().tent4[0]=null;GP.remove(basil.gid);
   const mint=garden('P058','slot','tent4',1);
   const trade=[{kind:'slot',loc:'tent4',i:1},{kind:'slot',loc:'tent2',i:0}];
   out.tradeCheck=PotShuffle.check(...trade);
   out.go=PotShuffle.go([PotShuffle.enc(trade[0]),PotShuffle.enc(trade[1]),mint.gid,drying.id].join('|'));
   out.after={dryLoc:drying.loc,drySlot:drying.slot,tent4:state.locations.tent4.slots.slice(),mintAt:mint.at,tent2Garden:GrowPotGarden.arr('tent2')[0],tent4Garden:GrowPotGarden.arr('tent4')[1]};
   // sowing a garden plant in a grow pot beside the drying harvest is refused; a companion pot is fine
   out.sow=GP.canPlant(GP.sp('P058'),{kind:'slot',ref:'tent4'});
   out.sowCompanion=GP.canPlant(GP.sp('P058'),{kind:'pot',ref:'tent4'});
   // garden plant trades with a growing plant
   const g2=grow('tent2',1,3);out.growTrade=PotShuffle.go([PotShuffle.enc({kind:'slot',loc:'tent2',i:0}),PotShuffle.enc({kind:'slot',loc:'tent2',i:1}),mint.gid,g2.id].join('|'));
   out.growAfter={slot:g2.slot,mint:GrowPotGarden.arr('tent2')[1]===mint.gid};
   // cannabis can't go into a companion pot, and the garden pot panel shows the button
   out.companionPot=PotShuffle.check({kind:'pot',loc:'tent2',i:0},{kind:'slot',loc:'tent2',i:0});
   Panels.gspot('slot','tent2');out.button=!!document.querySelector('[data-act=potShuffle][data-arg="'+mint.gid+'"]');
   closePanel();return out;
  });
  assert.equal(r.swapCompanion.ok,true,JSON.stringify(r.swapCompanion));
  assert.equal(r.swapBlocked.ok,false);assert.match(r.swapBlocked.why,/drying harvest next to garden plants in grow pots/);
  assert.equal(r.slotClash.ok,false,'tent2 holds a drying harvest, so a grow-pot plant cannot move in');
  assert.equal(r.moveCompanion.ok,true,JSON.stringify(r.moveCompanion));
  assert.ok(r.panel);
  assert.equal(r.tradeCheck.ok,true,JSON.stringify(r.tradeCheck));assert.equal(r.go,true);
  assert.equal(r.after.dryLoc,'tent4');assert.equal(r.after.drySlot,1);assert.deepEqual(r.after.mintAt,{kind:'slot',ref:'tent2'});assert.ok(r.after.tent2Garden);assert.equal(r.after.tent4Garden,null);
  assert.equal(r.sow.ok,false);assert.equal(r.sowCompanion.ok,true,JSON.stringify(r.sowCompanion));
  assert.equal(r.growTrade,true);assert.equal(r.growAfter.slot,0);assert.equal(r.growAfter.mint,true);
  assert.equal(r.companionPot.ok,false);assert.equal(r.button,true);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});

test('a drying harvest moves from the greenhouse into an empty tent that keeps herbs in companion pots',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Herb keeper');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const r=await page.evaluate(()=>{
   settings.speed=0;settings.reduced=true;state.tut.on=false;state.flags.growroom=true;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();Access.atLoc=()=>true;Access.atPlant=()=>true;
   const out={};
   // tester save, day 311: an auto drying in the greenhouse; every indoor tent is cannabis-free but keeps herbs in companion pots
   state.locations.gh.owned=true;state.gh=Object.assign(state.gh||{},{tier:2,building:0});
   for(const loc of ['tent4','tent2']){const L=state.locations[loc];L.owned=true;Object.assign(L.equip,{pot:2,light:2,fan:2});L.slots.fill(null);GrowPotGarden.arr(loc).fill(null);GP.pots()[loc].fill(null);}
   const gh=state.locations.gh,slot=gh.slots.findIndex(x=>!x);
   const p=createPlant(state.bagLine,'gh',slot);Object.assign(p,{stage:S.drying,height:20,health:90,moves:[]});p.dry=newDry();p.dry.prog=.2;gh.slots[slot]=p.id;
   const herb=GP.newPlant('P058',{kind:'pot',ref:'tent4'});GP.pots().tent4[0]=herb.gid;
   out.target=HarvestMove1151.target(p,'tent4');
   HarvestMove1151.open(p.id);out.panel=document.querySelector('#panelBody').innerText;
   out.moved=HarvestMove1151.move(runtime.harvestMove1151.token+':tent4');
   out.after={loc:p.loc,slot:p.slot,gh:gh.slots[slot],light:state.locations.tent4.on.light,door:state.locations.tent4.door,herb:GP.pots().tent4[0]===herb.gid&&!!GP.plant(herb.gid)};
   // a garden plant in a full-size grow pot still keeps the tent off-limits
   const mint=GP.newPlant('P058',{kind:'slot',ref:'tent2'});GrowPotGarden.arr('tent2')[1]=mint.gid;
   out.growPot=HarvestMove1151.target(p,'tent2');
   closePanel();return out;
  });
  assert.equal(r.target.ok,true,JSON.stringify(r.target));
  assert.match(r.panel,/1 companion plant stays put/);
  assert.equal(r.moved,true);
  assert.deepEqual(r.after,{loc:'tent4',slot:0,gh:null,light:false,door:'closed',herb:true});
  assert.equal(r.growPot.ok,false);assert.match(r.growPot.why,/garden plants/);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
