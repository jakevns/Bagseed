const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('native canopy care updates rendering, persists through save, snapshots, and harvests exactly once',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Canopy Study');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const id=await page.evaluate(()=>{
   settings.speed=0;settings.reduced=true;state.tut.on=false;state.day=100;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();state.scene='bedroom';
   const p=createPlant('porchlight','closet',0);Object.assign(p,{stage:7,height:50,nodes:11,health:92,water:60,nutr:60,stress:0,sex:'F',sexKnown:true,yieldPot:10});
   const r=locRect('closet');state.player.x=r[0]+r[2]/2;state.player.y=r[1]+r[3]+6;state.player.energy=100;
   window.canopyBefore={key:PlantArt.key(p),image:PlantArt.build(p).cv.toDataURL()};Panels.plant(p.id,'care');return p.id;
  });
  await page.locator('[data-act=care][data-arg=defol]').click();
  const result=await page.evaluate(id=>{
   const p=state.plants[id],snap=snapPlant(p),clean=JSON.stringify(p.canopy),key=PlantArt.key(p),changed=PlantArt.build(p).cv.toDataURL()!==canopyBefore.image;
   const stress=p.stress;doCare('defol');const blocked=p.stress===stress;state.day+=3;state.player.energy=100;doCare('defol');const capped=JSON.stringify(p.canopy)===clean;
   const snapshotIndependent=snap.canopy!==p.canopy&&JSON.stringify(snap.canopy)===clean;
   closePanel();SaveSys.now('Canopy Study');return{changed,keyChanged:key!==canopyBefore.key,blocked,capped,snapshotIndependent,canopy:p.canopy};
  },id);
  for(const field of ['changed','keyChanged','blocked','capped','snapshotIndependent'])assert.equal(result[field],true,field);assert.equal(result.canopy.credit,1);
  await page.reload({waitUntil:'load',timeout:120000});await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const quantities=await page.evaluate(id=>{
   settings.speed=0;const p=state.plants[id],saved=JSON.stringify(p.canopy);p.stage=10;harvestPlant(p);const frozen=JSON.stringify(p.canopyHarvest);p.canopy={v:1,cleaned:0,credit:0};
   const base={...p,stage:12,stress:0,dry:{result:{label:'Good Dry',q:.93}},pheno:{...p.pheno},seeded:false};
   function jars(c){const q={...base,id:'canopy-harvest-'+Math.random(),canopyHarvest:c};state.plants[q.id]=q;state.locations[q.loc].slots[q.slot]=q.id;return jarPlant(q)?.jars;}
   const untouched=jars({v:1,cleaned:0,credit:0}),shaped=jars({v:1,cleaned:1,credit:1});return{saved,frozen,untouched,shaped};
  },id);
  assert.equal(quantities.saved,JSON.stringify(result.canopy));assert.equal(quantities.saved,quantities.frozen);assert.ok(quantities.shaped>quantities.untouched,JSON.stringify(quantities));assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
