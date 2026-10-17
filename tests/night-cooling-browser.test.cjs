const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('smart controller cools shared room at lights off, records actual phenotype exposure, persists and respects access',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 const out=path.resolve(__dirname,'../review/night-colors');fs.mkdirSync(out,{recursive:true});
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await require('./helpers/art-page.cjs')(browser,{viewport:{width:1100,height:1200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Autumn Nights');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const setup=await page.evaluate(()=>{
   settings.speed=0;settings.reduced=true;state.tut.on=false;state.scene='bedroom';state.day=100;state.minute=720;state.baseTemp=80;state.outTemp=90;state.fail.outage=0;
   runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();state.locations.tent2.owned=true;
   for(const loc of ['closet','tent2']){const L=state.locations[loc];Object.assign(L.equip,{ctrl:1,light:2,fan:1,exhaust:2,heater:0,ac:0,hvac:loc==='closet'?2:0,sensor:3,pot:2});Object.assign(L.on,{ctrl:true,light:true,fan:true,exhaust:true,hvac:true});L.schedule='flower';L.door='closed';}
   const p=createPlant('velvet','closet',0),green=createPlant('porchlight','tent2',0);
   for(const [plant,color]of [[p,'Red accents'],[green,'Forest green']]){Object.assign(plant,{stage:9,height:50,nodes:11,health:92,water:60,nutr:60,stress:0,sex:'F',sexKnown:true});plant.genome115.alleles.colorName=[color,color];plant.pheno.mut=null;}
   const r=locRect('closet');state.player.x=r[0]+r[2]/2;state.player.y=r[1]+r[3]+6;
   window.nightStudyIds=[p.id,green.id];controllerTick('closet');controllerTick('tent2');Panels.equip('ctrl','closet');
   return{defaults:BagseedNightCooling.config('bedroom'),access:Access.atLoc('closet')};
  });assert.equal(setup.defaults.enabled,false);assert.equal(setup.access,true);
  await page.locator('[data-act=nightCooling][data-arg="closet:toggle"]').click();assert.equal(await page.evaluate(()=>state.nightCooling.bedroom.enabled),true);
  const simulation=await page.evaluate(()=>{
   const [p,green]=nightStudyIds.map(id=>state.plants[id]),records=[];
   for(let cycle=0;cycle<2;cycle++){
    for(let h=8;h<20;h++){state.day=100+cycle;state.minute=h*60;controllerTick('closet');controllerTick('tent2');for(const plant of [p,green]){plant.water=60;plant.nutr=60;plant.health=92;plant.stress=0;plantHourly(plant,envFor(plant.loc));}}
    for(let h=20;h<32;h++){state.day=100+cycle+(h>=24?1:0);state.minute=(h%24)*60;controllerTick('closet');controllerTick('tent2');for(const plant of [p,green]){plant.water=60;plant.nutr=60;plant.health=92;plant.stress=0;const env=envFor(plant.loc);plantHourly(plant,env);if(plant===p)records.push({temp:env.temp,drop:plant.nightColor.drop,qualifying:plant.nightColor.qualifying,watts:env.hvac.watts});}}
   }
   const before=PlantArt.key({...p,nightColor:{...p.nightColor,hours:0}}),after=PlantArt.key(p),snap=snapPlant(p);
   const nativeChanged=PlantArt.build({...p,nightColor:{...p.nightColor,hours:0}}).cv.toDataURL()!==PlantArt.build(p).cv.toDataURL();
   const dryingChanged=PlantArt.build({...p,stage:11,dry:{prog:.3,mold:0},nightColor:{hours:0}}).cv.toDataURL()!==PlantArt.build({...p,stage:11,dry:{prog:.3,mold:0}}).cv.toDataURL();
   const greenUnchanged=PlantArt.build({...green,nightColor:{hours:24}}).cv.toDataURL()===PlantArt.build({...green,nightColor:{hours:0}}).cv.toDataURL();
   return{red:p.nightColor,green:green.nightColor,expression:BagseedNightColor.expression(p,PlantTraits115.for(p)),records,nativeChanged,dryingChanged,greenUnchanged,cacheChanged:before!==after,snapshot:JSON.stringify(snap.nightColor)===JSON.stringify(p.nightColor)};
  });
  assert.equal(simulation.red.hours,24);assert.equal(simulation.green.hours,0);assert.ok(simulation.records.every(r=>r.drop>=9.99&&r.qualifying&&r.watts>0));assert.equal(simulation.expression.palette,'wine red');assert.equal(simulation.nativeChanged,true);assert.equal(simulation.dryingChanged,true);assert.equal(simulation.greenUnchanged,true);assert.equal(simulation.cacheChanged,true);assert.equal(simulation.snapshot,true);
  const guards=await page.evaluate(()=>{
   const before=JSON.stringify(state.nightCooling),L=state.locations.closet,C=state.locations.tent2;state.scene='hallway';ACT.nightCooling('closet:12');const denied=JSON.stringify(state.nightCooling)===before;state.scene='bedroom';
   state.minute=7*60;state.day=102;C.schedule='veg';const mixed=BagseedNightCooling.targets('closet').night;C.schedule='flower';
   L.on.ctrl=false;C.on.ctrl=false;const off=BagseedNightCooling.targets('closet').night;L.on.ctrl=true;C.on.ctrl=true;
   state.fail.outage=1;const outage=envFor('closet').hvac.watts;state.fail.outage=0;
   L.equip.hvac=0;const missing=BagseedNightCooling.targets('closet').night;L.equip.hvac=2;
   const all=nightStudyIds.map(id=>state.plants[id]);for(const p of all)p.stage=11;const drying=BagseedNightCooling.targets('closet').night;for(const p of all)p.stage=9;
   const ref=BagseedNightCooling.reference('bedroom'),normal=BagseedNightCooling.targets('closet');const old=state.nightCooling.bedroom.drop;state.nightCooling.bedroom.drop=8;const eight=BagseedNightCooling.targets('closet');state.nightCooling.bedroom.drop=old;
   return{denied,mixed,off,outage,missing,drying,normal,eight,ref};
  });assert.equal(guards.denied,true);assert.equal(guards.mixed,false);assert.equal(guards.off,false);assert.equal(guards.outage,0);assert.equal(guards.missing,false);assert.equal(guards.drying,false);assert.equal(guards.normal.night,true);assert.equal(guards.normal.cool,guards.ref-10);assert.equal(guards.eight.cool,guards.ref-8);
  await page.evaluate(()=>{Panels.equip('ctrl','closet');document.getElementById('toasts').replaceChildren();});await page.locator('#panel').screenshot({path:path.join(out,'smart-controller.png')});
  await page.setViewportSize({width:440,height:960});const bounds=await page.locator('.note:has([data-act=nightCooling])').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));assert.ok(bounds.scroll<=bounds.client+1,'Night controls overflow on mobile');await page.locator('.note:has([data-act=nightCooling])').screenshot({path:path.join(out,'smart-controller-mobile.png')});await page.setViewportSize({width:1100,height:1200});
  const saved=await page.evaluate(()=>{closePanel();SaveSys.now('Autumn Nights');return{config:state.nightCooling.bedroom,plants:nightStudyIds.map(id=>({id,color:state.plants[id].nightColor})),day:state.day,minute:state.minute};});
  await page.reload({timeout:120000});await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();
  const restored=await page.evaluate(ids=>({config:state.nightCooling.bedroom,plants:ids.map(id=>({id,color:state.plants[id].nightColor}))}),saved.plants.map(p=>p.id));assert.deepEqual(restored,{config:saved.config,plants:saved.plants});
  const sprout=await page.evaluate(id=>{
   const p=state.plants[id];state.vibe='cozy';const snap=snapPlant(p);snap.stage=10;
   const options={cam:0,angle:'full',zoom:.7,filter:'none',bg:'closet',caption:'',tags:[]};
   const samples=[0,6,24].map(hours=>({...snap,nightColor:{...snap.nightColor,hours}}));
   const factors=samples.map(s=>SproutPerf.factors(s,options)),bonuses=factors.map(f=>f.colorBonus),odds=factors.map(f=>SproutPerf.viralChance(1.5,f.colorBonus));
   const mono=SproutPerf.factors(samples[2],{...options,filter:'mono'}).colorBonus;
   const full=samples[2],F=factors[2],expected=SproutPerf.viralChance(SproutPerf.perf(F),F.colorBonus);
   window.sproutReviewHtml=SproutPerf.html(full,options);
   const oldRandom=Math.random,oldViralChance=SproutPerf.viralChance,calls=[];
   try{Math.random=()=>.5;SproutPerf.viralChance=function(...args){const probability=oldViralChance.apply(this,args);calls.push(probability);return probability;};Social.publish(full,options);}finally{Math.random=oldRandom;SproutPerf.viralChance=oldViralChance;}
   const posted=state.social.posts[0],stored=BagseedNightColor.socialBonus(posted.snap,PlantTraits115.for(posted.snap),options);p.nightColor.hours=0;
   return{bonuses,odds,mono,cap:SproutPerf.viralChance(100,.08),expected,rolled:calls[0],forecastHasColor:window.sproutReviewHtml.includes('Color appeal')&&window.sproutReviewHtml.includes('Viral chance'),snapshotStable:stored===BagseedNightColor.socialBonus(posted.snap,PlantTraits115.for(posted.snap),options)};
  },saved.plants[0].id);
  assert.deepEqual(sprout.bonuses,[0,.02,.08]);assert.ok(sprout.odds[0]<sprout.odds[1]&&sprout.odds[1]<sprout.odds[2]);assert.equal(sprout.mono,0);assert.equal(sprout.cap,.45);assert.equal(sprout.rolled,sprout.expected);assert.equal(sprout.forecastHasColor,true);assert.equal(sprout.snapshotStable,true);
  await page.evaluate(()=>{document.getElementById('toasts').replaceChildren();openPanel('Sprout color forecast',()=>window.sproutReviewHtml);});await page.locator('#panel').screenshot({path:path.join(out,'sprout-color-forecast.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({simulation,guards,saveReload:true,sprout,errors},null,2)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
