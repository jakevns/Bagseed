const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('starter shells layer live contents, animate, share store/package art, fit and survive reload',async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/starter-tent/integration');fs.mkdirSync(out,{recursive:true});
  const game=fs.readFileSync(path.join(root,'src/game.html'),'utf8'),native=game.split('RoomArt.drawCloset = ')[1].split('\nRoomArt.drawTent = ')[0].replace(/;\s*$/,'');
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedStartup.ready);
    assert.ok(await page.evaluate(()=>BagseedStarterTent.loaded));assert.equal(await page.evaluate(()=>BagseedStartup.status),'ready');
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Tent Integration');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
    const result=await page.evaluate(native=>{
      const check=(ok,m)=>{if(!ok)throw Error(m);},nativeDraw=eval('('+native+')');
      settings.speed=0;settings.reduced=true;state.tut.on=false;state.minute=720;state.weather='Sunny';state.room.placed=[];state.room.rgb.on=false;state.mess=[];state.hints.box=1;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
      state.gear.workbench=2;state.locations.closet.equip.light=1;state.locations.closet.equip.pot=1;const L=state.locations.closet;
      const p=createPlant(state.bagLine,'closet',0);Object.assign(p,{stage:5,height:16,nodes:7,water:60,health:92,repStress:0,moves:[]});
      const fixture=JSON.stringify({slots:L.slots,plants:state.plants,equip:L.equip}),footprint=JSON.stringify(DecoZ.statics('bedroom'));
      function tent(){const cv=document.createElement('canvas');cv.width=120;cv.height=120;RoomArt.drawCloset(cv.getContext('2d'),0);return cv;}
      let targetCases=0;
      for(const tier of ['budget','standard'])for(const stage of [3,5,S.drying])for(const door of ['open','closed']){
        Shell.of('closet').tier=tier;L.door=door;p.stage=stage;RoomArt.hits=[];nativeDraw.call(RoomArt,document.createElement('canvas').getContext('2d'),0);const before=JSON.stringify(RoomArt.hits.map(h=>/^(plant|slot|gslot):closet:/.test(h.id)?{...h,x:29+(h.x-29)*.86,y:74+(h.y-92)*.86,w:h.w*.86,h:h.h*.86,walk:[29,112]}:h));
        RoomArt.hits=[];tent();const hits=RoomArt.hits.map(h=>({...h}));
        // Light geometry follows its approved housing; preview-grow-lights checks
        // all 16 fixture targets. Keep identity and every other native hit exact.
        // Sensors intentionally moved from the contents to the exterior header.
        const withoutSensor=hs=>hs.filter(h=>h.id!=='sensor:closet').map(h=>h.id==='light:closet'?{id:h.id,label:h.label,layer:h.layer}:h);
        check(JSON.stringify(withoutSensor(hits))===JSON.stringify(withoutSensor(JSON.parse(before))),'Native interactions changed outside the illustrated plant/light/sensor bounds');
        const sensor=hits.find(h=>h.id==='sensor:closet'),mount=BagseedDehumidifiers.sensors.get('closet');check(sensor&&mount&&sensor.y+sensor.h<BagseedTentPlacement.roofY('closet'),'Exterior sensor missing above the door');targetCases++;
      }
      p.stage=5;L.door='open';const light=Gear.light,pot=Gear.pot;
      const is=(c,x,y,r,g,b)=>{const a=c.getImageData(x,y,1,1).data;return a[0]===r&&a[1]===g&&a[2]===b;};let layeringCases=0;
      try{
        Gear.light=function(c,x,y,...r){light.call(this,c,x,y,...r);c.fillStyle='#ff00ff';c.fillRect(x,y-5,1,1);c.fillStyle='#00ffff';c.fillRect(x,y+2,1,1);};
        Gear.pot=function(c,x,y,...r){pot.call(this,c,x,y,...r);c.fillStyle='#ff0000';c.fillRect(x-1,y+22,3,3);c.fillStyle='#0000ff';c.fillRect(x-1,y+2,3,3);};
        for(const tier of ['budget','standard'])for(const l of [1,2,3,4])for(const n of [1,2,3]){
          Shell.of('closet').tier=tier;L.equip.light=l;L.equip.pot=n;const c=tent().getContext('2d');
          check(!is(c,29,29,255,0,255),'Light crosses the top');check(is(c,29,36,0,255,255),'Light body hidden');check(!is(c,29,94,255,0,0),'Pot crosses tray');check(is(c,29,76,0,0,255),'Pot body hidden');layeringCases++;
        }
      }finally{Gear.light=light;Gear.pot=pot;L.equip.light=1;L.equip.pot=1;}
      const masks=[];for(const tier of ['budget','standard'])for(const minute of [720,1380]){
        Shell.of('closet').tier=tier;state.minute=minute;const isolated=tent(),ic=isolated.getContext('2d');
        for(const[col,a,op]of RoomArt.tint()){ic.globalCompositeOperation=op;ic.globalAlpha=a;ic.fillStyle=col;ic.fillRect(0,0,120,120);}ic.globalAlpha=1;
        const full=document.createElement('canvas');full.width=480;full.height=180;RoomArt.draw(full.getContext('2d'),0);
        // Downsampling the 3x mask before/after tint can round channels by up to 4 levels.
        for(const[x,y]of [[29,12],[29,94]]){const a=ic.getImageData(x,y,1,1).data,b=full.getContext('2d').getImageData(x,y,1,1).data;check(a.every((v,i)=>Math.abs(v-b[i])<=4),'Late effects/tint overwrote the fabric mask '+tier+':'+minute+':'+x+','+y+' '+String(a)+' / '+String(b));}masks.push(tier+':'+minute);
      }
      state.minute=720;Shell.of('closet').tier='budget';settings.reduced=false;L.door='open';runtime.doorAnim={};setDoor('closet','closed');const animation=[];
      for(const dp of [0,.125,.25,.375,.5,.625,.75,.875,1]){const k=dp<.5?Math.sqrt(dp/2):1-Math.sqrt((1-dp)/2);runtime.doorAnim.closet={from:0,t0:performance.now()-380*k};const progress=doorProg('closet');animation.push({progress,image:tent().toDataURL()});}
      check(new Set(animation.map(f=>f.image)).size>=7,'Zipper animation has no intermediate frames');check(animation[0].progress===0&&animation.at(-1).progress===1,'Zipper endpoints incorrect');
      setDoor('closet','open');runtime.doorAnim.closet.t0=performance.now()-190;check(doorProg('closet')>0&&doorProg('closet')<1,'Opening does not animate');settings.reduced=true;check(doorProg('closet')===0,'Reduced motion should open immediately');runtime.doorAnim={};
      check(JSON.stringify({slots:L.slots,plants:state.plants,equip:L.equip})===fixture,'Rendering mutated plants, slots or equipment');check(JSON.stringify(DecoZ.statics('bedroom'))===footprint,'Footprint changed');
      const rooms={};for(const tier of ['budget','standard']){Shell.of('closet').tier=tier;const cv=document.createElement('canvas');cv.width=1440;cv.height=540;const c=cv.getContext('2d');c.scale(3,3);RoomArt.draw(c,0);rooms[tier]=cv.toDataURL();}
      // Closed worn shells still show the existing zipper warning and dry tag.
      Shell.of('closet').tier='budget';L.door='closed';Shell.of('closet').zip=100;const intact=tent().toDataURL();Shell.of('closet').zip=20;check(tent().toDataURL()!==intact,'Worn zipper warning missing');Shell.of('closet').zip=100;
      p.stage=S.drying;p.dry={mold:0};check(tent().toDataURL()!==intact,'Drying tag missing');p.stage=5;p.dry=null;L.door='open';
      return {targetCases,layeringCases,masks,animation,rooms};
    },native);
    for(const[tier,url]of Object.entries(result.rooms))fs.writeFileSync(path.join(out,'bedroom-'+tier+'.png'),Buffer.from(url.split(',')[1],'base64'));
    const frames=await page.evaluate(async frames=>{const cv=document.createElement('canvas');cv.width=1200;cv.height=120;const c=cv.getContext('2d');c.fillStyle='#e7e9db';c.fillRect(0,0,1200,120);for(const[i,f]of frames.entries()){const im=new Image();im.src=f.image;await im.decode();c.drawImage(im,i*133,0);}return cv.toDataURL();},result.animation);fs.writeFileSync(path.join(out,'zip-frames.png'),Buffer.from(frames.split(',')[1],'base64'));
    await page.evaluate(()=>{Shell.of('closet').tier='budget';state.money=1000;state.sale.day=-1;Panels.app('leafcart');});await page.locator('[data-act=shopCat][data-arg=spaces]').click();
    const icon=page.locator('canvas[data-draw="x:shell_closet_standard"]');await icon.scrollIntoViewIfNeeded();assert.deepEqual(await icon.evaluate(c=>[c.width,c.height]),[320,240]);const storeArt=await icon.evaluate(c=>c.toDataURL());await icon.locator('..').screenshot({path:path.join(out,'store-standard.png')});
    await page.setViewportSize({width:390,height:844});await icon.scrollIntoViewIfNeeded();await icon.locator('..').screenshot({path:path.join(out,'store-standard-phone.png')});
    await page.locator('[data-act=cartAdd115][data-arg="x:shell_closet_standard"]').click();await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();assert.equal(await page.evaluate(()=>state.money),965);
    await page.evaluate(()=>{const i=state.orders.findIndex(o=>o.key==='x:shell_closet_standard');if(i<0)throw Error('Shell order absent');state.packages.push(state.orders.splice(i,1)[0]);Panels.pkg(state.packages.length-1);});await page.locator('[data-act=pkgOpen115]').click();
    assert.equal(await page.locator('canvas[data-draw="x:shell_closet_standard"]').evaluate(c=>c.toDataURL()),storeArt);
    const saved=await page.evaluate(()=>{
      closePanel();const H=Shell.S(),sh=H.inv.find(s=>s.size==='closet'&&s.tier==='standard');if(!sh)throw Error('Unused shell absent');
      const cv=document.createElement('canvas');withTier(()=>ShellArt.icon(cv.getContext('2d'),cv,'closet','standard'),'closet','standard');const inventoryArt=cv.toDataURL();
      const before=JSON.stringify({plants:state.plants,slots:state.locations.closet.slots,equip:state.locations.closet.equip});state.player.x=29;state.player.y=112;Shell.swap(sh.sid,'closet');
      if(Shell.of('closet').tier!=='standard')throw Error('Shell fitting failed');if(JSON.stringify({plants:state.plants,slots:state.locations.closet.slots,equip:state.locations.closet.equip})!==before)throw Error('Fitting changed grow contents');
      closePanel();SaveSys.now('Starter tent fixture');return {inventoryArt,contents:before,tier:Shell.of('closet').tier,money:state.money};
    });assert.equal(saved.inventoryArt,storeArt);assert.equal(saved.money,965);
    await page.reload();await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(()=>({contents:JSON.stringify({plants:state.plants,slots:state.locations.closet.slots,equip:state.locations.closet.equip}),tier:Shell.of('closet').tier,money:state.money})),{contents:saved.contents,tier:saved.tier,money:saved.money});assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({entryPoint:'public/index.html',integrated:true,startupWaitsForTent:true,layeringCombinations:result.layeringCases,interactionCases:result.targetCases,dayNightMasks:result.masks,zipFrames:new Set(result.animation.map(f=>f.image)).size,openingAnimation:true,reducedMotion:true,wearWarning:true,dryingTag:true,storeDeliveryInventoryMatch:true,desktopAndPhoneStore:true,purchase:35,fittingEnergy:4,plantsAndGearPreserved:true,saveReload:true,errors},null,2)+'\n');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
