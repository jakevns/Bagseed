const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('painted tent plants retain detail at mobile zoom without shifting camera or interaction coordinates',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs');const server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  const {chromium}=require('playwright');browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await require('./helpers/art-page.cjs')(browser,{viewport:{width:440,height:980},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Tent detail review');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const r=await page.evaluate(()=>{
   settings.speed=0;settings.reduced=true;state.minute=720;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();
   const plants=[];for(const loc of ['closet','tent2','tent4','tent5']){const L=state.locations[loc];L.owned=true;L.door='open';Object.assign(L.equip,{pot:3,light:2,fan:2,exhaust:1});const p=createPlant('cl_acdc',loc,0,{h:1,b:1,y:1,a:1,deep:false,mut:null,muts:[]});Object.assign(p,{stage:8,height:22,nodes:9,sex:'F',sexKnown:true,health:100,water:60,nutr:60,stress:0,burn:0,mold:0,pest:{type:null,lvl:0},training:'natural'});p.paintArt115.seed='resolution:'+loc;plants.push(p);}
   const biology=JSON.stringify(plants),cases=[];
   for(const scene of ['bedroom','growroom','backyard'])for(const zoom of ['wide','normal','close']){
    state.scene=scene;settings.camZoom=zoom;state.player.x=scene==='growroom'?210:52;state.player.y=125;View.resize();View.snap();View.ensureWorld();
    const S=curScene(),d=View.world.width/S.w,c=View.wctx;c.save();S.draw(c,0);c.restore();const draw=View.ctx.drawImage,calls=[];
    View.ctx.drawImage=function(image,...a){if(image===View.world)calls.push({source:a.slice(0,4),destination:a.slice(4),smooth:this.imageSmoothingEnabled});return draw.call(this,image,...a);};try{View.render();}finally{View.ctx.drawImage=draw;}
    const xy=View.toCSS(70,130),rect=View.cv.getBoundingClientRect(),world=View.toWorld(rect.left+xy[0],rect.top+xy[1]);
    cases.push({scene,zoom,d,pixels:View.world.width*View.world.height,world:[View.world.width,View.world.height],calls,roundTrip:Math.abs(world[0]-70)<1e-8&&Math.abs(world[1]-130)<1e-8,hits:RoomArt.hits.filter(h=>h.id.startsWith('plant:')).map(h=>h.id)});
   }
   state.scene='bedroom';settings.camZoom='close';View.resize();View.snap();View.ensureWorld();curScene().draw(View.wctx,0);View.render();
   const p=plants[0],s=PlantArt.get(p),ctx=document.createElement('canvas').getContext('2d');ctx.canvas.width=ctx.canvas.height=800;ctx.scale(6,6);settings.reduced=true;PlantArt.draw(ctx,p,50,100,1,0,1);const still=BagseedPlants.frame(p,s,0,1),a=still.toDataURL();const stable=a===BagseedPlants.frame(p,s,1,1).toDataURL();settings.reduced=false;const b=BagseedPlants.frame(p,s,0,1).toDataURL(),wind=b!==BagseedPlants.frame(p,s,1,1).toDataURL();settings.reduced=true;
   return{cases,biologyUnchanged:JSON.stringify(plants)===biology,stillSize:[still.width,still.height],logicalSize:[s.w,s.h],stable,wind};
  });
  for(const c of r.cases){assert.ok(c.roundTrip);assert.equal(c.calls.length,1);assert.deepEqual(c.calls[0].source,[0,0,...c.world]);if(c.scene==='backyard')assert.equal(c.d,3);else{assert.ok(c.d>=3&&c.d<=6);assert.ok(c.pixels<=4_000_000);assert.equal(c.calls[0].smooth,true);assert.ok(c.hits.includes('plant:'+(c.scene==='bedroom'?'closet':'tent4')+':0'));}}
  assert.ok(r.cases.some(c=>c.d>3));assert.equal(r.stillSize[0],Math.ceil(r.logicalSize[0]*6));assert.equal(r.stable,true);assert.equal(r.wind,true);assert.equal(r.biologyUnchanged,true);assert.deepEqual(errors,[]);
  fs.mkdirSync(path.resolve('review/plant-resolution'),{recursive:true});fs.writeFileSync(path.resolve('review/plant-resolution/verification.json'),JSON.stringify({...r,errors},null,2)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
