const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/computer-desks');fs.mkdirSync(out,{recursive:true});
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'graphics/computer-desks/sources/manifest.json')));
  const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.evaluate(()=>Promise.all([BagseedArt.ready,BagseedBedroom.ready,BagseedBeds.ready,BagseedDesks.ready,BagseedCurtains.ready]));
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Desk Artwork Review');
    await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    const before=await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();
      runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.minute=720;state.weather='Sunny';
      function equipment(tier){const cv=document.createElement('canvas');cv.width=400;cv.height=300;const g=cv.getContext('2d');g.scale(5,5);Gear.computer(g,10,30,tier,0,true);return cv.toDataURL();}
      return {equipment:[0,1,2].map(equipment),catalog:JSON.stringify({p:DECOR.sidedesk.p,vars:DECOR.sidedesk.vars,w:DECOR.sidedesk.w,h:DECOR.sidedesk.h,surfY:DECOR.sidedesk.surfY,fp:DECOR.sidedesk.fp}),surfaces:JSON.stringify(DecoZ.surfaces('bedroom'))};
    });
    const integrated=await page.evaluate(()=>!!window.BagseedComputerDesks);
    if(manifest.status==='approved')assert.ok(integrated,'Approved desks missing from production build');
    if(!integrated){const tag=require('./compile-computer-desks.cjs')();await page.addScriptTag({content:tag.replace(/^<script[^>]*>\n/,'').replace(/<\/script>\n$/,'')});}
    await page.evaluate(()=>BagseedComputerDesks.ready);
    const result=await page.evaluate(({before,manifest})=>{
      const check=(ok,msg)=>{if(!ok)throw Error(msg);};
      check(JSON.stringify({p:DECOR.sidedesk.p,vars:DECOR.sidedesk.vars,w:DECOR.sidedesk.w,h:DECOR.sidedesk.h,surfY:DECOR.sidedesk.surfY,fp:DECOR.sidedesk.fp})===before.catalog,'Catalog or placement geometry changed');
      check(JSON.stringify(DecoZ.surfaces('bedroom'))===before.surfaces,'Tabletop supports changed');
      const oldGear=state.gear.computer,oldHits=RoomArt.hits,oldCamera=state.gear.camera,oldCoffee=state.coffeeDay;
      for(let tier=0;tier<3;tier++){
        const cv=document.createElement('canvas');cv.width=400;cv.height=300;const g=cv.getContext('2d');g.scale(5,5);Gear.computer(g,10,30,tier,0,true);
        check(cv.toDataURL()===before.equipment[tier],'Computer equipment unexpectedly changed');
        state.gear.computer=tier;state.gear.camera=1;state.coffeeDay=-1;RoomArt.hits=[];
        RoomArt.drawDesk(document.createElement('canvas').getContext('2d'),0);
        check(RoomArt.hits.some(h=>h.id==='computer'&&h.x===160&&h.y===56&&h.w===50&&h.h===20),'Computer interaction moved');
        check(RoomArt.hits.some(h=>h.id==='coffee'),'Coffee interaction missing');
      }
      state.gear.computer=oldGear;state.gear.camera=oldCamera;state.coffeeDay=oldCoffee;RoomArt.hits=oldHits;
      const board=document.createElement('canvas');board.width=1280;board.height=1140;const g=board.getContext('2d');
      g.fillStyle='#f9f3e6';g.fillRect(0,0,1280,1140);g.fillStyle='#29483a';g.font='bold 34px Georgia';g.fillText('BAGSEED / BEDROOM DESKS',36,50);
      g.font='18px Georgia';g.fillText('Artwork for approval · Base desk + all three existing Side Desk variations',36,82);
      const captions=['Included bedroom desk','$50 Side Desk · Birch included','$50 desk + $12 finish unlock','$50 desk + $25 upgrade unlock'];
      const art=[];
      for(let i=0;i<4;i++){
        const x=32+(i%2)*632,y=110+Math.floor(i/2)*352;
        g.fillStyle='#e9ead9';g.fillRect(x,y,600,332);g.fillStyle='#29483a';g.font='bold 25px Georgia';g.fillText(manifest.desks[i].name,x+22,y+35);
        g.font='17px Georgia';g.fillText(captions[i],x+22,y+62);
        const cv=document.createElement('canvas');cv.width=560;cv.height=250;const c=cv.getContext('2d');
        if(i===0){
          // The frame can be viewed alone without changing its independent equipment renderer.
          const savedComputer=Gear.computer,savedCamera=state.gear.camera,savedCoffee=state.coffeeDay;
          Gear.computer=()=>{};state.gear.camera=0;state.coffeeDay=state.day;
          try{c.scale(8,8);c.translate(-154,-70);RoomArt.drawDesk(c,0);}finally{Gear.computer=savedComputer;state.gear.camera=savedCamera;state.coffeeDay=savedCoffee;}
        }else{c.scale(13,13);DECOR.sidedesk.d(c,6.5,1.8,false,0,DECOR.sidedesk.vars[i-1]);}
        g.drawImage(cv,x+20,y+77);art.push(cv.toDataURL());
      }
      check(new Set(art).size===4,'Desk variations are not distinct');
      g.fillStyle='#29483a';g.font='bold 22px Georgia';g.fillText('Store artwork',36,850);
      for(let v=0;v<3;v++){
        const cv=document.createElement('canvas');drawDecorIcon(cv.getContext('2d'),cv,'sidedesk',v);
        check(cv.width===320&&cv.height===200,'Incorrect store aspect ratio');
        g.drawImage(cv,36+v*252,870,224,140);g.font='16px Georgia';g.fillText(DECOR.sidedesk.vars[v].n,36+v*252,1035);
      }
      const room=document.createElement('canvas');room.width=400;room.height=240;const c=room.getContext('2d');c.scale(5,5);c.translate(-150,-54);drawBackground(c);RoomArt.drawDesk(c,0);
      g.font='bold 22px Georgia';g.fillText('Bedroom scale',840,850);g.drawImage(room,840,870,400,240);
      return {board:board.toDataURL(),checks:{desks:4,distinctFrames:true,equipmentUnchanged:true,computerAndCoffeeInteractions:true,catalogAndPricesUnchanged:true,tabletopSupportsUnchanged:true,storePreviews:3}};
    },{before,manifest});
    fs.writeFileSync(path.join(out,'approval-board.png'),Buffer.from(result.board.split(',')[1],'base64'));
    await page.evaluate(()=>Panels.app('leafcart'));await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=office]').click();
    const card=page.locator('canvas[data-draw="decor:sidedesk"]');await card.waitFor();assert.deepEqual(await card.evaluate(c=>[c.width,c.height]),[320,200]);
    await card.locator('..').screenshot({path:path.join(out,'store-desktop.png')});
    await page.setViewportSize({width:390,height:844});await card.scrollIntoViewIfNeeded();await card.locator('..').screenshot({path:path.join(out,'store-phone.png')});
    assert.deepEqual(errors,[]);const report={proposalOnly:!integrated,entryPoint:'public/index.html',...result.checks,actualStoreCardDesktopAndPhone:true,errors};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
