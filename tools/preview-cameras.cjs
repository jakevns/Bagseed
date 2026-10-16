const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/cameras');fs.mkdirSync(out,{recursive:true});
  const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.evaluate(()=>Promise.all([BagseedArt.ready,BagseedBedroom.ready,BagseedBeds.ready,BagseedDesks.ready,BagseedCurtains.ready,BagseedComputerDesks.ready,BagseedEquipment.ready]));
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Camera Review');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    const before=await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.minute=720;state.weather='Sunny';state.room.placed=[];
      window.cameraReviewPhoto=(tier,filter='none',angle='front')=>{const c=document.createElement('canvas');c.width=c.height=240;renderPhoto(c,Object.assign(demoPlant(LINES[0].id,9,145),{name:'Camera Test',loc:'tent2',lightTier:3,organic:false,pest:{type:null,lvl:0}}),{cam:tier,filter,bg:'studio',angle,zoom:1.15});return c;};
      const photos=[];for(let tier=0;tier<3;tier++)photos.push(cameraReviewPhoto(tier).toDataURL());
      photos.push(cameraReviewPhoto(1,'vintage','low').toDataURL(),cameraReviewPhoto(2,'dreamy','macro').toDataURL());
      const solids=[];for(let tier=0;tier<3;tier++){state.gear.camera=tier;solids.push(JSON.stringify(DecoZ.statics('bedroom')));}state.gear.camera=0;
      const computers=[];for(let tier=0;tier<3;tier++){const c=document.createElement('canvas');c.width=320;c.height=240;drawGearIcon(c.getContext('2d'),c,'computer',tier);computers.push(c.toDataURL());}
      return {catalog:JSON.stringify({camera:EQ.camera,vintage:{name:DECOR.camdisplay.n,price:DECOR.camdisplay.p,w:DECOR.camdisplay.w,h:DECOR.camdisplay.h,k:DECOR.camdisplay.k}}),photos,solids,computers};
    });
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'graphics/cameras/sources/manifest.json'))),integrated=await page.evaluate(()=>!!window.BagseedCameras);
    if(manifest.status==='approved')assert.ok(integrated,'Approved cameras missing from production build');
    if(!integrated){const tag=require('./compile-cameras.cjs')();await page.addScriptTag({content:tag.replace(/^<script[^>]*>\n/,'').replace(/<\/script>\n$/,'')});}
    await page.evaluate(()=>BagseedCameras.ready);
    const result=await page.evaluate(before=>{
      const check=(v,msg)=>{if(!v)throw Error(msg);},saved=JSON.stringify(state),hits=RoomArt.hits;
      try{
        check(before.catalog===JSON.stringify({camera:EQ.camera,vintage:{name:DECOR.camdisplay.n,price:DECOR.camdisplay.p,w:DECOR.camdisplay.w,h:DECOR.camdisplay.h,k:DECOR.camdisplay.k}}),'Camera catalog changed');
        const photos=[];for(let tier=0;tier<3;tier++)photos.push(cameraReviewPhoto(tier).toDataURL());photos.push(cameraReviewPhoto(1,'vintage','low').toDataURL(),cameraReviewPhoto(2,'dreamy','macro').toDataURL());
        check(JSON.stringify(photos)===JSON.stringify(before.photos),'Existing photo output changed');
        const frames=[];for(let tier=0;tier<3;tier++){
          state.gear.camera=tier;check(before.solids[tier]===JSON.stringify(DecoZ.statics('bedroom')),'Tripod collision changed');
          const cv=document.createElement('canvas');drawGearIcon(cv.getContext('2d'),cv,'camera',tier);check(cv.width===320&&cv.height===240,'Camera store proportions wrong');frames.push(cv.toDataURL());
          const g=document.createElement('canvas');g.width=320;g.height=240;drawGearIcon(g.getContext('2d'),g,'computer',tier);check(g.toDataURL()===before.computers[tier],'Computer artwork changed');
        }check(new Set(frames).size===3,'Camera tiers are not distinct');
        // Check the phone yields to a decoration already occupying its desk corner.
        const originalCamera=Gear.camera;let phoneCalls=0;
        Gear.camera=function(c,x,y,tier){if(tier===0)phoneCalls++;return originalCamera.call(this,c,x,y,tier);};
        try{
          state.gear.camera=0;state.room.placed=[];RoomArt.drawDesk(document.createElement('canvas').getContext('2d'),0);check(phoneCalls===1,'Flat phone missing from desk');
          state.room.placed=[{uid:'phone-overlap',id:'notebook',x:199,y:71}];RoomArt.drawDesk(document.createElement('canvas').getContext('2d'),0);check(phoneCalls===1,'Phone overlaps existing decoration');
        }finally{Gear.camera=originalCamera;state.room.placed=[];}
        state.gear.computer=1;state.room.wallpaper='leafwp';state.room.keyboard='beige';state.room.mat='none';state.room.rgb={on:false};
        const board=document.createElement('canvas');board.width=1280;board.height=1140;const g=board.getContext('2d');g.fillStyle='#f8f2e5';g.fillRect(0,0,1280,1140);g.fillStyle='#29483a';g.font='bold 36px Georgia';g.fillText('BAGSEED / CAMERAS',32,50);g.font='18px Georgia';g.fillText('Artwork for approval · All three camera tiers + the Vintage Camera Display',32,84);
        const names=[...EQ.camera.map(it=>it.name),DECOR.camdisplay.n],captions=['Included · cracked glass retained','$89 · pocket digital camera','$349 · camera with floor tripod','$20 · decorative camera on an oak stand'];
        for(let i=0;i<4;i++){
          const x=24+(i%2)*636,y=112+Math.floor(i/2)*484;g.fillStyle='#e9ead9';g.fillRect(x,y,608,460);g.fillStyle='#29483a';g.font='bold 27px Georgia';g.fillText(names[i],x+20,y+38);g.font='17px Georgia';g.fillText(captions[i],x+20,y+68);
          const cv=document.createElement('canvas');if(i<3)drawGearIcon(cv.getContext('2d'),cv,'camera',i);else drawDecorIcon(cv.getContext('2d'),cv,'camdisplay');
          g.drawImage(cv,x+20,y+88,336,252);g.font='16px Georgia';g.fillStyle='#29483a';g.fillText('Store / package artwork',x+20,y+367);
          const room=document.createElement('canvas');room.width=240;room.height=300;const c=room.getContext('2d');
          state.gear.camera=i<3?i:0;
          if(i===2){c.scale(7,7);c.translate(-191,-83);drawBackground(c);RoomArt.drawDesk(c,0);Gear.camera(c,206,100,2);}
          else{c.scale(8,8);c.translate(-190,-57);drawBackground(c);RoomArt.drawDesk(c,0);if(i===3)drawDecor(c,{id:'camdisplay',x:198,y:66},0);}
          g.drawImage(room,x+370,y+88,218,273);g.fillStyle='#29483a';g.fillText(i===2?'Floor placement':'Desk placement',x+390,y+384);
          const thumb=document.createElement('canvas');if(i<3)drawGearIcon(thumb.getContext('2d'),thumb,'camera',i);else drawDecorIcon(thumb.getContext('2d'),thumb,'camdisplay');g.drawImage(thumb,x+20,y+385,80,60);
          if(i===0){g.font='16px Georgia';g.fillStyle='#29483a';g.fillText('Phone lies face-up on the desk.',x+116,y+415);}
          if(i===1){g.font='16px Georgia';g.fillStyle='#29483a';g.fillText('Low angle · Vintage / Neon filters',x+116,y+415);}
          if(i===2){g.font='16px Georgia';g.fillStyle='#29483a';g.fillText('Macro · Dreamy filter',x+116,y+415);}
          if(i===3){g.font='16px Georgia';g.fillStyle='#29483a';g.fillText('Placeable décor · existing $20 item',x+116,y+415);}
        }
        g.font='18px Georgia';g.fillStyle='#29483a';g.fillText('Photo resolutions, filter unlocks, saved gear, tabletop supports and tripod collision remain unchanged.',32,1110);
        return {board:board.toDataURL(),checks:{cameraTiers:3,decorativeCamera:1,distinctStoreArt:true,computerArtUnchanged:true,photoOutputsUnchanged:photos.length,catalogUnchanged:true,tripodCollisionUnchanged:true,phoneYieldsToPlacedDecor:true}};
      }finally{state=JSON.parse(saved);RoomArt.hits=hits;}
    },before);
    fs.writeFileSync(path.join(out,'approval-board.png'),Buffer.from(result.board.split(',')[1],'base64'));
    await page.evaluate(()=>{state.gear.camera=0;Panels.app('leafcart');});await page.locator('[data-act=shopCat][data-arg=desk]').click();
    for(const tier of [1,2]){const cv=page.locator(`canvas[data-draw="gear:camera:${tier}"]`);await cv.waitFor();assert.deepEqual(await cv.evaluate(c=>[c.width,c.height]),[320,240]);await cv.locator('..').screenshot({path:path.join(out,`store-camera-${tier}.png`)});}
    await page.setViewportSize({width:390,height:844});const cv=page.locator('canvas[data-draw="gear:camera:2"]');await cv.scrollIntoViewIfNeeded();await cv.locator('..').screenshot({path:path.join(out,'store-camera-phone.png')});
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=desk]').click();const vintage=page.locator('canvas[data-draw="decor:camdisplay"]');await vintage.waitFor();assert.deepEqual(await vintage.evaluate(c=>[c.width,c.height]),[320,240]);
    assert.equal(await vintage.evaluate(c=>{const expected=document.createElement('canvas');drawDecorIcon(expected.getContext('2d'),expected,'camdisplay');return c.toDataURL()===expected.toDataURL();}),true,'Store hydration shrank or replaced vintage artwork');
    await vintage.locator('..').screenshot({path:path.join(out,'store-vintage-phone.png')});
    assert.deepEqual(errors,[]);const report={proposalOnly:!integrated,entryPoint:'public/index.html',...result.checks,actualStoreDesktopAndPhone:true,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
