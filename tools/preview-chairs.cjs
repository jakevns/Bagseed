const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/chairs');fs.mkdirSync(out,{recursive:true});
  const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>Promise.all([BagseedArt.ready,BagseedBedroom.ready,BagseedBeds.ready,BagseedDesks.ready,BagseedCurtains.ready,BagseedComputerDesks.ready,BagseedEquipment.ready,BagseedCameras.ready]));
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Chair Review');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    const before=await page.evaluate(()=>{
      settings.speed=0;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.minute=720;state.weather='Sunny';state.room.placed=[];
      const desk=[];settings.reduced=false;for(const t of [0,1.5]){const c=document.createElement('canvas');c.width=480;c.height=360;const g=c.getContext('2d');g.scale(6,6);g.translate(-150,-48);RoomArt.drawDesk(g,t);desk.push(c.toDataURL());}settings.reduced=true;
      const solids={};for(const [id]of STYLES.chair){state.room.chair=id;solids[id]=JSON.stringify(DecoZ.statics('bedroom'));}state.room.chair='folding';
      const cameras=[];for(let tier=0;tier<3;tier++){const c=document.createElement('canvas');drawGearIcon(c.getContext('2d'),c,'camera',tier);cameras.push(c.toDataURL());}
      return {catalog:JSON.stringify({styles:STYLES.chair,p:DECOR.officechair.p,vars:DECOR.officechair.vars,w:DECOR.officechair.w,h:DECOR.officechair.h,fp:DECOR.officechair.fp,seat:DECOR.officechair.seat}),desk,solids,cameras};
    });
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'graphics/chairs/sources/manifest.json'))),integrated=await page.evaluate(()=>!!window.BagseedChairs);
    if(manifest.status==='approved')assert.ok(integrated,'Approved chairs missing from production build');
    if(!integrated){const tag=require('./compile-chairs.cjs')();await page.addScriptTag({content:tag.replace(/^<script[^>]*>\n/,'').replace(/<\/script>\n$/,'')});}await page.evaluate(()=>BagseedChairs.ready);
    const result=await page.evaluate(before=>{
      const check=(v,msg)=>{if(!v)throw Error(msg);},saved=JSON.stringify(state),hits=RoomArt.hits,oldT=runtime.t;
      function chair(id,t=0){state.room.chair=id;runtime.t=t;const c=document.createElement('canvas');c.width=26;c.height=38;const g=c.getContext('2d');g.translate(-177,-83);RoomArt.drawChair(g);return c;}
      function room(id,t=0){state.room.chair=id;runtime.t=t;const c=document.createElement('canvas');c.width=240;c.height=300;const g=c.getContext('2d');g.scale(6,6);g.translate(-170,-78);drawBackground(g);RoomArt.drawDesk(g,t);RoomArt.drawChair(g);return c;}
      try{
        check(before.catalog===JSON.stringify({styles:STYLES.chair,p:DECOR.officechair.p,vars:DECOR.officechair.vars,w:DECOR.officechair.w,h:DECOR.officechair.h,fp:DECOR.officechair.fp,seat:DECOR.officechair.seat}),'Chair prices, finishes or placement metadata changed');
        for(let i=0;i<2;i++){settings.reduced=false;const c=document.createElement('canvas');c.width=480;c.height=360;const g=c.getContext('2d');g.scale(6,6);g.translate(-150,-48);RoomArt.drawDesk(g,[0,1.5][i]);check(c.toDataURL()===before.desk[i],'Desk, coffee cup or steam changed');}settings.reduced=true;
        for(let tier=0;tier<3;tier++){const c=document.createElement('canvas');drawGearIcon(c.getContext('2d'),c,'camera',tier);check(c.toDataURL()===before.cameras[tier],'Camera artwork changed');}
        const renders=[];for(const [id]of STYLES.chair){state.room.chair=id;check(JSON.stringify(DecoZ.statics('bedroom'))===before.solids[id],'Chair collision changed');const c=chair(id);if(id==='none')check(!c.getContext('2d').getImageData(0,0,26,38).data.some((v,i)=>i%4===3&&v),'No Chair still draws a chair');else renders.push(c.toDataURL());const cv=document.createElement('canvas');drawStyleIcon(cv.getContext('2d'),cv,'chair',id);check(cv.width===320&&cv.height===280,'Wrong chair store proportions');}check(new Set(renders).size===4,'Desk-chair drawings are not distinct');
        const finishes=[];for(let v=0;v<2;v++){const c=document.createElement('canvas');c.width=160;c.height=240;const g=c.getContext('2d');g.scale(12,12);drawDecor(g,{id:'officechair',x:.5,y:1,v,zone:'bedroom'},0);finishes.push(c.toDataURL());}check(finishes[0]!==finishes[1],'Office Chair finishes look identical');
        state.room.rgb={on:true,mode:'cycle',speed:1,bright:2,color:'#83bd8e'};settings.reduced=false;
        check(chair('gaming',0).toDataURL()!==chair('gaming',5).toDataURL(),'Gaming chair RGB does not animate');settings.reduced=true;check(chair('gaming',0).toDataURL()===chair('gaming',5).toDataURL(),'Gaming chair ignores reduced motion');
        state.gear.computer=1;state.room.rgb={on:false};
        const board=document.createElement('canvas');board.width=1280;board.height=1140;const g=board.getContext('2d');g.fillStyle='#f8f2e5';g.fillRect(0,0,1280,1140);g.fillStyle='#29483a';g.font='bold 35px Georgia';g.fillText('BAGSEED / DESK CHAIRS',32,50);g.font='18px Georgia';g.fillText('Artwork for approval · All four existing desk-chair styles · Matching store artwork',32,84);
        STYLES.chair.filter(s=>s[0]!=='none').forEach(([id,name,price],i)=>{
          const x=24+(i%2)*636,y=112+Math.floor(i/2)*484;g.fillStyle='#e9ead9';g.fillRect(x,y,608,460);g.fillStyle='#29483a';g.font='bold 27px Georgia';g.fillText(name,x+20,y+38);g.font='18px Georgia';g.fillText(price?'$'+price:'Included',x+20,y+68);
          const cv=document.createElement('canvas');drawStyleIcon(cv.getContext('2d'),cv,'chair',id);g.drawImage(cv,x+20,y+88,336,294);g.drawImage(room(id),x+370,y+88,218,273);g.fillStyle='#29483a';g.font='16px Georgia';g.fillText('Store / package artwork',x+20,y+411);g.fillText('Bedroom placement',x+370,y+393);
          if(id==='gaming')g.fillText('RGB piping follows your desk lighting.',x+20,y+438);
        });g.font='18px Georgia';g.fillText('The No Chair choice stays available. Coffee cup and steam are reserved for the next update.',32,1110);
        const office=document.createElement('canvas');office.width=1120;office.height=800;const q=office.getContext('2d');q.fillStyle='#f8f2e5';q.fillRect(0,0,1120,800);q.fillStyle='#29483a';q.font='bold 34px Georgia';q.fillText('BAGSEED / PLACEABLE OFFICE CHAIR',32,50);q.font='18px Georgia';q.fillText('Both existing finishes · $45 base chair · Move and flip through Decorate',32,83);
        for(let v=0;v<2;v++){
          const x=24+v*560;q.fillStyle='#e9ead9';q.fillRect(x,112,512,600);q.fillStyle='#29483a';q.font='bold 28px Georgia';q.fillText(DECOR.officechair.vars[v].n,x+20,151);q.font='18px Georgia';q.fillText(v?'$45 chair + $8 Teal finish unlock':'$45 chair · Black Mesh included',x+20,183);
          const c=document.createElement('canvas');drawDecorIcon(c.getContext('2d'),c,'officechair',v);q.drawImage(c,x+56,210,400,350);q.font='17px Georgia';q.fillStyle='#29483a';q.fillText('Shared room, store and delivery artwork',x+20,602);q.fillText(v?'Teal is selected while decorating.':'The store card shows Black Mesh.',x+20,635);
        }q.font='18px Georgia';q.fillText('Original seat behavior, footprint, prices, finish ownership and placement controls are preserved.',32,760);
        const corrected=document.createElement('canvas');corrected.width=1160;corrected.height=760;const a=corrected.getContext('2d');a.fillStyle='#f8f2e5';a.fillRect(0,0,1160,760);a.fillStyle='#29483a';a.font='bold 32px Georgia';a.fillText('GAMING CHAIR / ALIGNED LED SEAMS',28,48);a.font='18px Georgia';a.fillText('Rerender for approval · Light follows the painted upholstery in every color',28,82);
        for(const [i,[label,color]]of [['Teal','#40dfd0'],['Violet','#b995ff'],['Amber','#f3bd6b']].entries()){
          state.room.chair='gaming';state.room.rgb={on:true,mode:'static',speed:1,bright:3,color};settings.reduced=true;const c=document.createElement('canvas');c.width=312;c.height=456;const r=c.getContext('2d');r.scale(16,16);r.translate(-180.25,-93);RoomArt.drawChair(r);const x=24+i*380;a.fillStyle='#e9ead9';a.fillRect(x,110,352,560);a.drawImage(c,x+20,130);a.fillStyle='#29483a';a.font='22px Georgia';a.fillText(label+' lighting',x+20,630);
        }a.fillStyle='#29483a';a.font='18px Georgia';a.fillText('One existing $120 Gaming Chair · Room and store use the same attached LED material',28,720);
        const registration=BagseedChairs.rgbRegistration;check(registration?.method==='source-pixel-mask'&&registration.maskPixels>40&&registration.outsideChairPixels===0,'LED material is not registered inside the chair');
        const frames=[];settings.reduced=false;state.room.rgb={on:true,mode:'cycle',speed:1,bright:3,color:'#83bd8e'};for(let i=0;i<32;i++){const c=document.createElement('canvas');c.width=384;c.height=360;const r=c.getContext('2d');r.scale(8,8);r.translate(-166,-82);state.room.chair='gaming';runtime.t=i*.25;drawBackground(r);RoomArt.drawDesk(r,runtime.t);RoomArt.drawChair(r);frames.push(c.toDataURL());}
        return {board:board.toDataURL(),office:office.toDataURL(),corrected:corrected.toDataURL(),frames,checks:{deskChairs:4,officeFinishes:2,noChairPreserved:true,distinctDrawings:6,catalogUnchanged:true,footprintsUnchanged:true,seatFlagUnchanged:true,coffeeAndSteamUnchanged:true,cameraArtworkUnchanged:true,RGBAnimatesAtNativeResolution:true,reducedMotion:true,LEDRegistration:registration}};
      }finally{state=JSON.parse(saved);settings.reduced=true;runtime.t=oldT;RoomArt.hits=hits;}
    },before);
    for(const[key,name]of[['board','approval-desk-chairs.png'],['office','approval-office-finishes.png'],['corrected','approval-gaming-led-alignment.png']])fs.writeFileSync(path.join(out,name),Buffer.from(result[key].split(',')[1],'base64'));
    const frames=path.join(root,'artifacts/chair-preview/frames');fs.mkdirSync(frames,{recursive:true});result.frames.forEach((data,i)=>fs.writeFileSync(path.join(frames,String(i).padStart(3,'0')+'.png'),Buffer.from(data.split(',')[1],'base64')));
    await page.evaluate(()=>{
      const original=RoomArt.drawChair,old={chair:state.room.chair,rgb:state.room.rgb,reduced:settings.reduced};
      state.room.chair='gaming';state.room.rgb={on:true,mode:'cycle',speed:1,bright:3,color:'#83bd8e'};settings.reduced=false;
      const cv=document.createElement('canvas');cv.width=26;cv.height=38;const g=cv.getContext('2d');let samples=[],last=0;
      RoomArt.drawChair=function(c){const value=original.call(this,c);if(c===View.wctx&&performance.now()-last>80){last=performance.now();g.clearRect(0,0,26,38);g.save();g.translate(-177,-83);original.call(this,g);g.restore();samples.push({t:runtime.t,image:cv.toDataURL()});}return value;};
      window.chairPreviewMotion={samples:()=>samples,reset(){settings.reduced=true;samples=[];last=0;},restore(){RoomArt.drawChair=original;state.room.chair=old.chair;state.room.rgb=old.rgb;settings.reduced=old.reduced;}};
    });
    let liveMotion;
    try{
      await page.waitForFunction(()=>{const a=chairPreviewMotion.samples();return a.length>=12&&a.at(-1).t-a[0].t>2;});
      const moving=await page.evaluate(()=>chairPreviewMotion.samples());assert.ok(new Set(moving.map(s=>s.image)).size>2,'No RGB change in the real game loop');
      await page.evaluate(()=>chairPreviewMotion.reset());await page.waitForFunction(()=>chairPreviewMotion.samples().length>=8);const still=await page.evaluate(()=>chairPreviewMotion.samples());assert.equal(new Set(still.map(s=>s.image)).size,1,'Reduced motion changes the chair in the real loop');
      liveMotion={realGameLoop:true,nativeResolution:true,movingFrames:moving.length,reducedMotionStill:true};
    }finally{await page.evaluate(()=>chairPreviewMotion.restore());}
    await page.evaluate(()=>Panels.app('leafcart'));await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    for(const id of ['office','gaming','wood']){const c=page.locator(`canvas[data-draw="style:chair:${id}"]`);await c.waitFor();assert.deepEqual(await c.evaluate(c=>[c.width,c.height]),[320,280]);await c.locator('..').screenshot({path:path.join(out,`store-${id}.png`)});}
    await page.setViewportSize({width:390,height:844});const gaming=page.locator('canvas[data-draw="style:chair:gaming"]');await gaming.scrollIntoViewIfNeeded();await gaming.locator('..').screenshot({path:path.join(out,'store-gaming-phone.png')});
    await page.locator('[data-act=decorCat][data-arg=office]').click();const c=page.locator('canvas[data-draw="decor:officechair"]');await c.waitFor();assert.equal(await c.evaluate(c=>{const expected=document.createElement('canvas');drawDecorIcon(expected.getContext('2d'),expected,'officechair');return c.toDataURL()===expected.toDataURL();}),true,'Placeable chair thumbnail was replaced by legacy hydration');await c.locator('..').screenshot({path:path.join(out,'store-officechair-phone.png')});
    assert.deepEqual(errors,[]);const report={proposalOnly:!integrated,entryPoint:'public/index.html',...result.checks,liveMotion,actualStoreDesktopAndPhone:true,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
