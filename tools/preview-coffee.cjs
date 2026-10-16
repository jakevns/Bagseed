const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/coffee'),frames=path.join(root,'artifacts/coffee-preview/frames');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(frames,{recursive:true});
  const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>Promise.all([BagseedArt.ready,BagseedBedroom.ready,BagseedComputerDesks.ready,BagseedEquipment.ready,BagseedCameras.ready,BagseedChairs.ready]));
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Coffee Review');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    await page.evaluate(()=>{settings.speed=0;settings.reduced=false;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.minute=720;state.weather='Sunny';state.room.placed=[];state.room.rgb.on=false;state.coffeeDay=-1;});
    const before=await page.evaluate(()=>{
      const saved=JSON.stringify(state),hits=RoomArt.hits,images=[];
      try{for(let computer=0;computer<3;computer++)for(let camera=0;camera<3;camera++){
        state.gear.computer=computer;state.gear.camera=camera;const c=document.createElement('canvas');c.width=ROOM.W;c.height=ROOM.H;RoomArt.hits=[];RoomArt.drawDesk(c.getContext('2d'),1.2);images.push({computer,camera,pixels:Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data),hits:RoomArt.hits});
      }return {images,catalog:JSON.stringify({styles:STYLES,office:DECOR.officechair.vars}),coffeeDay:state.coffeeDay};}finally{state=JSON.parse(saved);RoomArt.hits=hits;}
    });
    const integrated=await page.evaluate(()=>!!window.BagseedCoffee),manifest=JSON.parse(fs.readFileSync(path.join(root,'graphics/coffee/sources/manifest.json')));
    if(manifest.status==='approved')assert.ok(integrated,'Approved coffee missing from production');
    async function inject(file){const code=require(file)().replace(/^<script[^>]*>\n/,'').replace(/<\/script>\n$/,'');await page.addScriptTag({content:code});}
    if(!integrated){
      // Preview the small drawCoffee extraction without changing public/index.html.
      await inject('./compile-computer-desks.cjs');await page.evaluate(()=>BagseedComputerDesks.ready);
      await inject('./compile-cameras.cjs');await page.evaluate(()=>BagseedCameras.ready);
      await inject('./compile-coffee.cjs');
    }await page.evaluate(()=>BagseedCoffee.ready);
    const result=await page.evaluate(before=>{
      const check=(v,s)=>{if(!v)throw Error(s);},saved=JSON.stringify(state),hits=RoomArt.hits,oldT=runtime.t;
      function coffee(t,scale=1){const c=document.createElement('canvas');c.width=12*scale;c.height=16*scale;const g=c.getContext('2d');g.scale(scale,scale);g.translate(-205,-60);RoomArt.drawCoffee(g,t);return c;}
      function context(t){const c=document.createElement('canvas');c.width=704;c.height=496;const g=c.getContext('2d');g.scale(8,8);g.translate(-143,-47);drawBackground(g);RoomArt.drawDesk(g,t);return c;}
      try{
        check(before.catalog===JSON.stringify({styles:STYLES,office:DECOR.officechair.vars}),'Unrelated catalog changed');
        for(const image of before.images){state.gear.computer=image.computer;state.gear.camera=image.camera;const c=document.createElement('canvas');c.width=ROOM.W;c.height=ROOM.H;RoomArt.hits=[];RoomArt.drawDesk(c.getContext('2d'),1.2);const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          check(JSON.stringify(RoomArt.hits)===JSON.stringify(image.hits),'Desk interaction geometry changed');
          for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){if(x>=206&&x<216&&y>=61&&y<75)continue;const i=(y*c.width+x)*4;for(let n=0;n<4;n++)check(pixels[i+n]===image.pixels[i+n],'Artwork outside coffee changed at '+x+','+y);}
        }
        state.gear.computer=1;state.gear.camera=1;settings.reduced=false;
        const native=[];for(const t of [0,.4,.8,1.2,2,3])native.push(coffee(t).toDataURL());check(new Set(native).size>=5,'Steam is not visibly animated at native resolution');
        check(coffee(.35).toDataURL()===coffee(4.35).toDataURL(),'Steam loop seam changed');
        settings.reduced=true;check(coffee(0).toDataURL()===coffee(2).toDataURL(),'Reduced motion still animates');
        const steam=document.createElement('canvas');steam.width=ROOM.W;steam.height=ROOM.H;BagseedCoffee.drawSteam(steam.getContext('2d'),1);check(!steam.getContext('2d').getImageData(0,0,steam.width,steam.height).data.some((v,i)=>i%4===3&&v),'Reduced motion still draws steam');settings.reduced=false;
        const board=document.createElement('canvas');board.width=1160;board.height=800;const g=board.getContext('2d');g.fillStyle='#f8f2e5';g.fillRect(0,0,1160,800);g.fillStyle='#29483a';g.font='bold 35px Georgia';g.fillText('BAGSEED / COFFEE & RISING STEAM',28,50);g.font='19px Georgia';g.fillText('Artwork for approval · Ivory stoneware, sage glaze and a little sprout',28,86);
        g.fillStyle='#e8eadb';g.fillRect(24,114,368,570);g.fillRect(412,114,724,570);
        const detail=coffee(1.2,28);g.drawImage(detail,40,130);g.fillStyle='#29483a';g.font='22px Georgia';g.fillText('Ivory + sage ceramic',44,628);g.font='17px Georgia';g.fillText('Three soft wisps · Four-second loop',44,658);
        g.drawImage(context(1.2),436,124,676,476.27);g.fillStyle='#29483a';g.font='22px Georgia';g.fillText('On the bedroom desk',432,628);g.font='17px Georgia';g.fillText('Same position and once-per-day coffee interaction',432,658);
        g.font='18px Georgia';g.fillText('Steam rises from the coffee and fades as it drifts. Reduced motion keeps the mug still.',28,731);g.fillText('The mug and steam disappear after drinking and return the next day.',28,765);
        const frames=[];for(let i=0;i<40;i++){const frame=document.createElement('canvas');frame.width=840;frame.height=500;const q=frame.getContext('2d');q.fillStyle='#e8eadb';q.fillRect(0,0,840,500);q.drawImage(coffee(i*.1,28),12,16);q.drawImage(context(i*.1),366,58,462,326);q.fillStyle='#29483a';q.font='bold 23px Georgia';q.fillText('COFFEE & STEAM',384,425);q.font='17px Georgia';q.fillText('Looping in the actual game renderer',384,455);frames.push(frame.toDataURL());}
        state.coffeeDay=state.day;const empty=coffee(1);check(!empty.getContext('2d').getImageData(0,0,12,16).data.some((v,i)=>i%4===3&&v),'Used coffee still drawn');RoomArt.hits=[];const desk=document.createElement('canvas');RoomArt.drawDesk(desk.getContext('2d'),1);check(!RoomArt.hits.some(h=>h.id==='coffee'),'Used coffee is still interactive');
        state.day++;const fresh=coffee(1);check(fresh.getContext('2d').getImageData(0,0,12,16).data.some((v,i)=>i%4===3&&v),'Coffee does not return next day');
        return {board:board.toDataURL(),frames,checks:{computerCameraCombinations:9,artOutsideCoffeeUnchanged:true,hitboxesUnchanged:true,catalogUnchanged:true,steamAnimatedAtNativeResolution:true,seamlessFourSecondLoop:true,reducedMotion:true,consumedMugAndSteamHidden:true,nextDayReturns:true}};
      }finally{state=JSON.parse(saved);RoomArt.hits=hits;runtime.t=oldT;settings.reduced=false;}
    },before);
    fs.writeFileSync(path.join(out,'approval-coffee.png'),Buffer.from(result.board.split(',')[1],'base64'));result.frames.forEach((f,i)=>fs.writeFileSync(path.join(frames,String(i).padStart(3,'0')+'.png'),Buffer.from(f.split(',')[1],'base64')));
    await page.evaluate(()=>{
      const original=RoomArt.drawCoffee;const c=document.createElement('canvas');c.width=12;c.height=16;const g=c.getContext('2d');let samples=[],last=0;
      RoomArt.drawCoffee=function(ctx,t){const value=original.call(this,ctx,t);if(ctx===View.wctx&&performance.now()-last>90){last=performance.now();g.clearRect(0,0,12,16);g.save();g.translate(-205,-60);original.call(this,g,t);g.restore();samples.push({t,image:c.toDataURL()});}return value;};
      window.coffeePreviewMotion={samples:()=>samples,reduce(){settings.reduced=true;samples=[];last=0;},restore(){RoomArt.drawCoffee=original;settings.reduced=false;}};
    });
    let motion;try{await page.waitForFunction(()=>{const a=coffeePreviewMotion.samples();return a.length>=15&&a.at(-1).t-a[0].t>2;});const moving=await page.evaluate(()=>coffeePreviewMotion.samples());assert.ok(new Set(moving.map(x=>x.image)).size>5,'Steam does not move in real game loop');await page.evaluate(()=>coffeePreviewMotion.reduce());await page.waitForFunction(()=>coffeePreviewMotion.samples().length>=8);const still=await page.evaluate(()=>coffeePreviewMotion.samples());assert.equal(new Set(still.map(x=>x.image)).size,1);motion={realGameLoop:true,nativeResolution:true,movingFrames:moving.length,reducedMotionStill:true};}finally{await page.evaluate(()=>coffeePreviewMotion.restore());}
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{View.snap();});await page.screenshot({path:path.join(out,'phone-game.png')});
    const consumption=await page.evaluate(()=>{
      settings.speed=0;state.coffeeDay=-1;state.player.energy=40;const day=state.day;interact('coffee');if(state.coffeeDay!==day||state.player.energy<=40)throw Error('Coffee interaction failed');SaveSys.now('Coffee artwork fixture');return {coffeeDay:state.coffeeDay,day:state.day,energy:state.player.energy};
    });
    await page.reload();await page.evaluate(()=>BagseedChairs.ready);await page.locator('[data-act=continueGame]').click();assert.deepEqual(await page.evaluate(()=>({coffeeDay:state.coffeeDay,day:state.day,energy:state.player.energy})),consumption);
    assert.deepEqual(errors,[]);const report={proposalOnly:!integrated,entryPoint:'public/index.html',...result.checks,liveMotion:motion,phoneGame:true,actualDrinkInteraction:true,consumptionSaveReload:true,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
