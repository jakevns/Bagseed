const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('published companion pots wait at startup and retain full-resolution layers, native placement and saved crops',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const reports=[];
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  for(const device of [{name:'mobile',viewport:{width:440,height:980},deviceScaleFactor:2},{name:'desktop',viewport:{width:1400,height:1000},deviceScaleFactor:1}]){
   const page=await require('./helpers/art-page.cjs')(browser,device),errors=[];page.on('pageerror',e=>errors.push(e.message));let release,requests=0;const gate=new Promise(r=>release=r);
   await page.route('**/assets/companion-pots/**',async route=>{requests++;await gate;await route.continue();});
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});assert.equal(await page.evaluate(()=>BagseedStartup.canRender),false);assert.equal(await page.evaluate(()=>BagseedCompanionPots.loaded),false);release();await page.evaluate(()=>BagseedStartup.ready);assert.equal(requests,1);await page.unroute('**/assets/companion-pots/**');
   await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Painted companion pots');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
   const result=await page.evaluate(()=>{
    const check=(v,m)=>{if(!v)throw Error(m);},api=BagseedCompanionPots,locs=['closet','tent2','tent4','tent5'],ids=['P058','P056','P055','P053','P052'],plants=[];
    settings.speed=0;settings.reduced=true;state.minute=720;state.tut.on=false;state.flags.growroom=true;state.mess=[];state.room.placed=[];runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();
    for(const [l,loc] of locs.entries()){const L=state.locations[loc];L.owned=true;L.door='open';Object.assign(L.equip,{pot:2,light:2,fan:2,exhaust:1});L.slots.fill(null);GrowPotGarden.arr(loc).fill(null);GP.pots()[loc].forEach((_,i)=>{const p=GP.newPlant(ids[(l+i)%5],{kind:'pot',ref:loc});p.age=GP.sp(p.sp).days;p.water=65;GP.pots()[loc][i]=p.gid;plants.push(p);});}
    const cv=document.createElement('canvas');cv.width=2000;cv.height=1000;const c=cv.getContext('2d');c.scale(4,4);state.scene='growroom';curScene().draw(c,0);curScene().draw(c,0);
    const biology=JSON.stringify(plants),positions=Object.fromEntries(locs.map(loc=>[loc,GP.pots()[loc].map((_,i)=>Companion.potXY(loc,i))])),cases=[];
    for(const scene of ['bedroom','growroom'])for(const zoom of ['wide','normal','close']){
     state.scene=scene;settings.camZoom=zoom;state.player.x=scene==='bedroom'?110:300;state.player.y=150;View.resize();View.snap();View.ensureWorld();const c=View.wctx,draw=c.drawImage,back=[],front=[];
     c.drawImage=function(image,...args){const m=this.getTransform(),d=Math.hypot(m.a,m.b);if(image instanceof HTMLImageElement&&image.src===new URL(api.data.runtime,location.href).href)back.push({source:[image.naturalWidth,image.naturalHeight],crop:args.slice(0,4),smoothing:this.imageSmoothingEnabled,quality:this.imageSmoothingQuality,d});else if(image instanceof HTMLCanvasElement&&image.width===api.data.crop[2]&&image.height===api.data.crop[3])front.push({source:[image.width,image.height],smoothing:this.imageSmoothingEnabled,quality:this.imageSmoothingQuality,d});return draw.call(this,image,...args);};
     try{RoomArt.hits=[];curScene().draw(c,0);}finally{delete c.drawImage;}
     const targets=RoomArt.hits.filter(h=>h.id.startsWith('gpot:'));check(targets.length===(scene==='bedroom'?3:5),'Companion care targets missing: '+JSON.stringify({scene,zoom,count:targets.length,geo:TentArt.geo}));
     for(const loc of locs.filter(loc=>LOC_DEF[loc].room===scene))for(const xy of positions[loc])check(targets.some(h=>h.id==='gpot:'+loc&&h.x===xy[0]-6&&h.y===xy[1]-16&&h.w===13&&h.h===18&&h.walk[0]===xy[0]&&h.walk[1]===xy[1]+8),'Original care geometry changed');
     const drawView=View.ctx.drawImage,passes=[];View.ctx.drawImage=function(image,...args){if(image===View.world)passes.push({args,smoothing:this.imageSmoothingEnabled});return drawView.call(this,image,...args);};try{View.render();}finally{delete View.ctx.drawImage;}
     const css=View.toCSS(80,130),rect=View.cv.getBoundingClientRect(),world=View.toWorld(rect.left+css[0],rect.top+css[1]);check(Math.abs(world[0]-80)<1e-8&&Math.abs(world[1]-130)<1e-8,'Camera interaction moved');
     check(back.length===(scene==='bedroom'?3:5)&&front.length===back.length,'Full-resolution pot layers missing');
     cases.push({scene,zoom,world:[View.world.width,View.world.height],density:View.world.width/curScene().w,back,front,passes,targets:targets.length});
    }
    // Exercise all companion-compatible crops at their actual four stages,
    // with the published renderer rather than an injected review adapter.
    GP.build();const eligible=Object.values(GP._sp).filter(sp=>GP.canPlant(sp,{kind:'pot',ref:'closet'}).ok),arr=GP.pots().closet,keep=arr[0];let stageRenders=0;
    for(const sp of eligible){const p=GP.newPlant(sp.id,{kind:'pot',ref:'closet'});arr[0]=p.gid;for(const age of [0,.2,.65,1]){p.age=sp.days*age;Companion.draw(c,'closet',1);stageRenders++;}GP.remove(p.gid);}arr[0]=keep;
    // Draw a marker through the pot to prove the front conceals its lower
    // portion while the rear artwork leaves upper foliage visible.
    const probe=document.createElement('canvas');probe.width=probe.height=400;const pc=probe.getContext('2d'),[x,y]=positions.closet[0],old=GPArt.draw;pc.translate(200,200);pc.scale(30,30);pc.translate(-x,-y+4);GPArt.draw=function(c,id,stage,x,y){c.fillStyle='#ff00d4';c.fillRect(x-.25,y-4,.5,9);};try{Companion.draw(pc,'closet',0);}finally{GPArt.draw=old;}
    const a=pc.getImageData(200,140,1,1).data,b=pc.getImageData(200,275,1,1).data;check(a[0]>200&&a[2]>150&&a[1]<20,'Back occludes foliage');check(!(b[0]>200&&b[2]>150&&b[1]<20),'Stem leaks through front');
    check(JSON.stringify(plants)===biology,'Drawing changed saved crop biology');
    const detail=document.createElement('canvas');detail.width=1200;detail.height=550;const dc=detail.getContext('2d');dc.fillStyle='#f5efdf';dc.fillRect(0,0,1200,550);dc.fillStyle='#294c3d';dc.font='bold 26px Georgia';dc.fillText('BAGSEED / published companion pots',25,40);
    for(let i=0;i<3;i++){const loc=['closet','tent2','tent5'][i],[x,y]=positions[loc][0];dc.save();dc.beginPath();dc.rect(60+i*400,60,280,490);dc.clip();dc.translate(200+i*400,350);dc.scale(30,30);dc.translate(-x,-y+4);const a=GP.pots()[loc],keep=a.slice();for(let k=1;k<a.length;k++)a[k]=null;try{Companion.draw(dc,loc,0);}finally{a.splice(0,a.length,...keep);dc.restore();}}
    state.scene='bedroom';settings.camZoom='close';state.player.x=140;state.player.y=145;View.resize();View.snap();View.ensureWorld();curScene().draw(View.wctx,0);View.render();SaveSys.now('Companion pot release check');
    return{cases,eligibleSpecies:eligible.length,stageRenders,biologyUnchanged:true,layerOcclusion:true,positions,fixtureIds:plants.map(p=>p.gid),detail:detail.toDataURL(),runtimeSHA256:api.data.runtimeSHA256};
   });
   const manifest=JSON.parse(fs.readFileSync(path.resolve('graphics/companion-pots/sources/manifest.json')));assert.equal(result.runtimeSHA256,manifest.runtimeSHA256);
   for(const c of result.cases){assert.ok(c.density>=3&&c.density<=6);assert.equal(c.passes.length,1);assert.equal(c.passes[0].smoothing,true);for(const a of c.back){assert.deepEqual(a.source,manifest.size);assert.deepEqual(a.crop,manifest.crop);assert.equal(a.smoothing,true);assert.equal(a.quality,'high');}for(const a of c.front){assert.deepEqual(a.source,manifest.crop.slice(2));assert.equal(a.smoothing,true);assert.equal(a.quality,'high');}}
   assert.equal(result.eligibleSpecies,76);assert.equal(result.stageRenders,304);const out=path.resolve('review/companion-pots/production');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,device.name+'-detail.png'),Buffer.from(result.detail.split(',')[1],'base64'));delete result.detail;await page.locator('#room').screenshot({path:path.join(out,device.name+'-game.png')});
   await page.reload();await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);assert.equal(await page.evaluate(ids=>BagseedCompanionPots.loaded&&ids.every(g=>!!GP.plant(g)),result.fixtureIds),true);assert.deepEqual(errors,[]);reports.push({device:device.name,deviceScaleFactor:device.deviceScaleFactor,startupAssetWait:true,saveReload:true,...result,errors});await page.close();
  }
  fs.writeFileSync(path.resolve('review/companion-pots/production/verification.json'),JSON.stringify({productionRenderer:true,injectedAdapter:false,reports},null,2)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
