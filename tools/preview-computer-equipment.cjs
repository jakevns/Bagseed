const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require('playwright');
(async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/computer-equipment');fs.mkdirSync(out,{recursive:true});
  const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.evaluate(()=>Promise.all([BagseedArt.ready,BagseedBedroom.ready,BagseedBeds.ready,BagseedDesks.ready,BagseedCurtains.ready,BagseedComputerDesks.ready]));
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Equipment Review');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    const before=await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.minute=720;state.weather='Sunny';state.room.placed=[];
      const images=[];for(let tier=0;tier<3;tier++){const c=document.createElement('canvas');c.width=240;c.height=240;const g=c.getContext('2d');g.scale(6,6);Gear.camera(g,10,10,tier);images.push(c.toDataURL());}
      return {catalog:JSON.stringify({computer:EQ.computer,keyboard:STYLES.keyboard,mat:STYLES.mat,wallpaper:STYLES.wallpaper}),cameras:images,solids:JSON.stringify(SCENES.bedroom.solids()),surfaces:JSON.stringify(DecoZ.surfaces('bedroom'))};
    });
    const integrated=await page.evaluate(()=>!!window.BagseedEquipment);
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'graphics/computer-equipment/sources/manifest.json')));
    if(manifest.status==='approved')assert.ok(integrated,'Approved computer equipment missing from production build');
    if(!integrated){const code=require('./compile-computer-equipment.cjs')().replace(/^<script[^>]*>\n/,'').replace(/<\/script>\n$/,'');await page.addScriptTag({content:code});}
    await page.evaluate(()=>BagseedEquipment.ready);
    const result=await page.evaluate(({before})=>{
      const check=(v,msg)=>{if(!v)throw Error(msg);},saved=JSON.stringify(state),oldHits=RoomArt.hits;
      function equipment(tier,t=0,on=true){const c=document.createElement('canvas');c.width=384;c.height=288;const g=c.getContext('2d');g.scale(6,6);Gear.computer(g,9,18,tier,t,on);return c;}
      function room(tier,t=0){state.gear.computer=tier;const c=document.createElement('canvas');c.width=480;c.height=360;const g=c.getContext('2d');g.scale(6,6);g.translate(-150,-48);drawBackground(g);RoomArt.drawDesk(g,t);return c;}
      try{
        check(before.catalog===JSON.stringify({computer:EQ.computer,keyboard:STYLES.keyboard,mat:STYLES.mat,wallpaper:STYLES.wallpaper}),'Catalog or prices changed');
        check(before.solids===JSON.stringify(SCENES.bedroom.solids())&&before.surfaces===JSON.stringify(DecoZ.surfaces('bedroom')),'Furniture geometry changed');
        for(let tier=0;tier<3;tier++){const c=document.createElement('canvas');c.width=240;c.height=240;const g=c.getContext('2d');g.scale(6,6);Gear.camera(g,10,10,tier);check(c.toDataURL()===before.cameras[tier],'Camera changed ahead of its batch');}
        const base=Object.assign({},state.room,{rgb:{on:false},keyboard:'beige',mat:'none',wallpaper:'leafwp'});Object.assign(state.room,base);
        const tiers=[];for(let tier=0;tier<3;tier++){
          const a=equipment(tier),b=equipment(tier,0,false);check(a.toDataURL()!==b.toDataURL(),'Display power has no effect');tiers.push(a.toDataURL());
          const cv=document.createElement('canvas');drawGearIcon(cv.getContext('2d'),cv,'computer',tier);check(cv.width===320&&cv.height===240,'Computer store aspect ratio');
          state.gear.computer=tier;RoomArt.hits=[];RoomArt.drawDesk(document.createElement('canvas').getContext('2d'),0);
          check(RoomArt.hits.some(h=>h.id==='computer'&&h.x===160&&h.y===56&&h.w===50&&h.h===20),'Computer interaction moved');
        }check(new Set(tiers).size===3,'Computer tiers look identical');
        let combinations=0;
        for(let tier=0;tier<3;tier++)for(const [kb]of STYLES.keyboard){state.room.keyboard=kb;check(equipment(tier).toDataURL().length>2000,'Blank computer/keyboard combination');combinations++;}
        const choices={};for(const slot of ['keyboard','mat','wallpaper']){
          const renders=[];for(const [id]of STYLES[slot]){state.room[slot]=id;const c=document.createElement('canvas');drawStyleIcon(c.getContext('2d'),c,slot,id);check(c.width===320&&c.height===200,'Style store aspect ratio');renders.push(c.toDataURL());}
          check(new Set(renders).size===renders.length,'Indistinct style option: '+slot);choices[slot]=renders.length;
        }
        state.room.wallpaper='stars';state.room.keyboard='rgbkb';state.room.rgb={on:true,mode:'cycle',speed:1,bright:2,color:'#83bd8e'};settings.reduced=false;
        check(equipment(2,0).toDataURL()!==equipment(2,4).toDataURL(),'RGB/screen effects do not animate');
        settings.reduced=true;check(equipment(2,0).toDataURL()===equipment(2,4).toDataURL(),'Reduced motion still animates');
        state.room.rgb={on:false};state.room.wallpaper='plain';
        const log=state.locations.closet.log;state.locations.closet.log=Array.from({length:9},()=>[0,16]);const low=equipment(2).toDataURL();state.locations.closet.log=Array.from({length:9},()=>[0,42]);check(low!==equipment(2).toDataURL(),'Climate dashboard ignores live data');state.locations.closet.log=log;
        Object.assign(state.room,base);
        const board=document.createElement('canvas');board.width=1440;board.height=1000;const g=board.getContext('2d');g.fillStyle='#f8f2e5';g.fillRect(0,0,1440,1000);
        g.fillStyle='#29483a';g.font='bold 35px Georgia';g.fillText('BAGSEED / COMPUTER EQUIPMENT',32,50);g.font='18px Georgia';g.fillText('Artwork for approval · Three computer tiers · Matching store artwork · Live screens and RGB lighting',32,82);
        for(let tier=0;tier<3;tier++){
          const x=24+tier*472;g.fillStyle='#e8ead9';g.fillRect(x,110,448,536);g.fillStyle='#29483a';g.font='bold 26px Georgia';g.fillText(EQ.computer[tier].name,x+18,148);g.font='18px Georgia';g.fillText(tier?'$'+EQ.computer[tier].price:'Included',x+18,177);
          state.room.keyboard=tier===2?'rgbkb':'beige';state.room.mat=tier===2?'green':'none';state.room.wallpaper=tier===0?'leafwp':tier===1?'sunset':'stars';
          g.drawImage(room(tier),x+12,195,424,318);g.font='16px Georgia';g.fillStyle='#29483a';g.fillText('Store / package artwork',x+18,547);
          const cv=document.createElement('canvas');drawGearIcon(cv.getContext('2d'),cv,'computer',tier);g.drawImage(cv,x+250,512,176,132);
        }
        g.fillStyle='#29483a';g.font='bold 23px Georgia';g.fillText('All four keyboards',32,662);
        STYLES.keyboard.forEach(([id,name,price],i)=>{const c=document.createElement('canvas');drawStyleIcon(c.getContext('2d'),c,'keyboard',id);g.drawImage(c,32+i*352,680,320,200);g.font='17px Georgia';g.fillText(name+' · '+(price?'$'+price:'Included'),32+i*352,909);});
        g.font='18px Georgia';g.fillText('Desk mats and monitor wallpapers are shown on the second picture board.',32,966);
        const styles=document.createElement('canvas');styles.width=1440;styles.height=1130;const q=styles.getContext('2d');q.fillStyle='#f8f2e5';q.fillRect(0,0,1440,1130);q.fillStyle='#29483a';q.font='bold 34px Georgia';q.fillText('BAGSEED / DESK MATS & MONITOR WALLPAPERS',32,50);
        q.font='18px Georgia';q.fillText('Existing choices and prices · Shared artwork in the bedroom and store',32,83);
        STYLES.mat.filter(v=>v[0]!=='none').forEach(([id,name,price],i)=>{const c=document.createElement('canvas');drawStyleIcon(c.getContext('2d'),c,'mat',id);q.drawImage(c,32+i*472,115,432,270);q.font='20px Georgia';q.fillText(name+' · $'+price,32+i*472,417);});
        q.font='bold 25px Georgia';q.fillText('All five monitor wallpapers',32,478);
        STYLES.wallpaper.forEach(([id,name,price],i)=>{const x=32+(i%3)*472,y=500+Math.floor(i/3)*310;const c=document.createElement('canvas');drawStyleIcon(c.getContext('2d'),c,'wallpaper',id);q.drawImage(c,x,y,400,250);q.font='19px Georgia';q.fillText(name+' · '+(price?'$'+price:'Included'),x,y+280);});
        const frames=[];state.gear.computer=2;state.room.keyboard='rgbkb';state.room.mat='green';state.room.wallpaper='stars';state.room.rgb={on:true,mode:'cycle',speed:1,bright:2,color:'#83bd8e'};settings.reduced=false;
        for(let i=0;i<32;i++)frames.push(room(2,i*.3).toDataURL());
        return {board:board.toDataURL(),styles:styles.toDataURL(),frames,checks:{tiers:3,choices,combinations,catalogUnchanged:true,geometryUnchanged:true,camerasUnchanged:true,power:true,RGBAndScreensAnimate:true,reducedMotion:true,liveClimateDashboard:true,computerInteraction:true}};
      }finally{state=JSON.parse(saved);settings.reduced=true;RoomArt.hits=oldHits;}
    },{before});
    for(const [key,name]of [['board','approval-computers.png'],['styles','approval-options.png']])fs.writeFileSync(path.join(out,name),Buffer.from(result[key].split(',')[1],'base64'));
    const framesDir=path.join(root,'artifacts/computer-equipment-preview/frames');fs.mkdirSync(framesDir,{recursive:true});result.frames.forEach((data,i)=>fs.writeFileSync(path.join(framesDir,String(i).padStart(3,'0')+'.png'),Buffer.from(data.split(',')[1],'base64')));
    await page.evaluate(()=>{state.gear.computer=0;Panels.app('leafcart');});await page.locator('[data-act=shopCat][data-arg=desk]').click();
    for(const tier of [1,2]){const cv=page.locator(`canvas[data-draw="gear:computer:${tier}"]`);await cv.waitFor();assert.deepEqual(await cv.evaluate(c=>[c.width,c.height]),[320,240]);await cv.locator('..').screenshot({path:path.join(out,`store-computer-${tier}.png`)});}
    await page.setViewportSize({width:390,height:844});const phone=page.locator('canvas[data-draw="gear:computer:2"]');await phone.scrollIntoViewIfNeeded();await phone.locator('..').screenshot({path:path.join(out,'store-phone.png')});
    assert.deepEqual(errors,[]);const report={proposalOnly:!integrated,entryPoint:'public/index.html',...result.checks,actualStoreDesktopAndPhone:true,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
