const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('garden plants trade pots with garden and cannabis plants; drying harvests never share a tent with garden plants',async()=>{
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
   // a drying harvest can no longer be swapped into a tent with companion plants
   const drying=grow('tent2',0,S.drying),growing=grow('tent4',0,4),basil=garden('P058','pot','tent4',0);
   out.swapBlocked=TentSwap1151.pair(drying,growing);
   // the companion plant moves to an empty companion pot in the other tent
   out.moveClash=PotShuffle.check({kind:'pot',loc:'tent4',i:0},{kind:'pot',loc:'tent2',i:0});
   PotShuffle.open(basil.gid);out.panel=document.querySelector('#panelBody').innerHTML.includes('Move or trade')||document.querySelector('#panelTitle').textContent;
   // garden plant in a grow pot trades with a drying harvest: harvest lands in a tent with no garden plants left
   GP.pots().tent4[0]=null;GP.remove(basil.gid);
   const mint=garden('P058','slot','tent4',1);
   const trade=[{kind:'slot',loc:'tent4',i:1},{kind:'slot',loc:'tent2',i:0}];
   out.tradeCheck=PotShuffle.check(...trade);
   out.go=PotShuffle.go([PotShuffle.enc(trade[0]),PotShuffle.enc(trade[1]),mint.gid,drying.id].join('|'));
   out.after={dryLoc:drying.loc,drySlot:drying.slot,tent4:state.locations.tent4.slots.slice(),mintAt:mint.at,tent2Garden:GrowPotGarden.arr('tent2')[0],tent4Garden:GrowPotGarden.arr('tent4')[1]};
   // sowing a garden plant beside the drying harvest is refused
   out.sow=GP.canPlant(GP.sp('P058'),{kind:'slot',ref:'tent4'});
   // garden plant trades with a growing plant
   const g2=grow('tent2',1,3);out.growTrade=PotShuffle.go([PotShuffle.enc({kind:'slot',loc:'tent2',i:0}),PotShuffle.enc({kind:'slot',loc:'tent2',i:1}),mint.gid,g2.id].join('|'));
   out.growAfter={slot:g2.slot,mint:GrowPotGarden.arr('tent2')[1]===mint.gid};
   // cannabis can't go into a companion pot, and the garden pot panel shows the button
   out.companionPot=PotShuffle.check({kind:'pot',loc:'tent2',i:0},{kind:'slot',loc:'tent2',i:0});
   Panels.gspot('slot','tent2');out.button=!!document.querySelector('[data-act=potShuffle][data-arg="'+mint.gid+'"]');
   closePanel();return out;
  });
  assert.equal(r.swapBlocked.ok,false);assert.match(r.swapBlocked.why,/drying harvest next to garden plants/);
  assert.equal(r.moveClash.ok,false,'tent2 holds a drying harvest, so the companion cannot move in');
  assert.ok(r.panel);
  assert.equal(r.tradeCheck.ok,true,JSON.stringify(r.tradeCheck));assert.equal(r.go,true);
  assert.equal(r.after.dryLoc,'tent4');assert.equal(r.after.drySlot,1);assert.deepEqual(r.after.mintAt,{kind:'slot',ref:'tent2'});assert.ok(r.after.tent2Garden);assert.equal(r.after.tent4Garden,null);
  assert.equal(r.sow.ok,false);
  assert.equal(r.growTrade,true);assert.equal(r.growAfter.slot,0);assert.equal(r.growAfter.mint,true);
  assert.equal(r.companionPot.ok,false);assert.equal(r.button,true);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
