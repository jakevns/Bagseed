const artPage=require('./helpers/art-page.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('painted live window follows game time, layers scheduled neighbors, preserves weather, sill, curtains, interactions and saves',async()=>{
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/bedroom-window'),frames=path.join(root,'artifacts/bedroom-window/frames');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(frames,{recursive:true});
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});
    const page=await artPage(browser,{viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedStartup.ready);
    assert.equal(await page.evaluate(()=>BagseedBedroomWindow.loaded&&BagseedWindowScenery.loaded),true);
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Window Gardener');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    for(const [name,t]of [['000',0],['018',3],['036',6]]){const image=await page.evaluate(t=>{BagseedLoadingScene.pause();BagseedLoadingScene.render(t);return document.querySelector('#bagseed-loading-room').toDataURL();},t);const target=path.join(root,'artifacts/bedroom-window/loading-'+name+'.png');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,Buffer.from(image.split(',')[1],'base64'));}
    await page.evaluate(()=>{settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.gear.workbench=2;state.story='free';state.mess=[];state.minute=720;state.weather='Sunny';runtime.walkers={};});
    const checks=await page.evaluate(()=>{
      const cv=document.createElement('canvas');cv.width=520;cv.height=420;const c=cv.getContext('2d');
      const oldMinute=state.minute,oldWeather=state.weather,oldReduced=settings.reduced,where=Neighbor.inYard,draw=drawTinyPerson,ambient=Cat.ambient,oldWalkers=runtime.walkers;
      function picture(t=0){c.setTransform(10,0,0,10,-2260,-140);c.clearRect(226,14,52,42);RoomArt.drawWindow(c,t);return cv.toDataURL();}
      const report={};try{
        Neighbor.inYard=()=>false;Cat.ambient=()=>null;
        const samples=[0,5.75,6.5,8,12,17,18.75,20,21,23.99].map(h=>BagseedWindowScenery.timeOfDay(h));
        if(samples[0]!==1||samples[4]!==0||samples[8]!==1)throw Error('Outdoor time does not follow the game clock');
        report.timeSamples=samples;const palettes=[];for(const h of [12,18.75,20,23]){state.minute=h*60;palettes.push(picture());}if(new Set(palettes).size!==4)throw Error('Missing outdoor lighting state');
        state.minute=720;settings.reduced=false;if(picture(0)===picture(3))throw Error('Clouds do not move');settings.reduced=true;if(picture(0)!==picture(3))throw Error('Reduced motion did not stop window motion');
        report.gameClock=true;report.cloudMotion=true;report.reducedMotion=true;
        // Probe occlusion with a known actor color, using the real yard function.
        Neighbor.inYard=()=>true;drawTinyPerson=(g,x,y)=>{g.fillStyle='#ff00ff';g.fillRect(x-4,y-18,8,18);};
        c.setTransform(10,0,0,10,0,0);c.clearRect(0,0,52,42);HouseWing115c.yard(c,0,0,52,42,0);
        const pixels=c.getImageData(0,0,520,420).data;let visible=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]===255&&pixels[i+1]===0&&pixels[i+2]===255)visible++;
        if(visible<1000||visible>=8*18*100*.95)throw Error('Neighbor must remain visible with legs occluded by the fence/shrubs: '+visible);
        report.neighborVisiblePixels=visible;report.foregroundOcclusion=true;drawTinyPerson=draw;Neighbor.inYard=()=>false;
        const empty=picture();runtime.walkers={ines:{id:'ines',scene:'street',x:430},priya:{id:'priya',scene:'backyard',x:430}};if(picture()===empty)throw Error('Scheduled street neighbor was hidden');
        runtime.walkers={priya:{id:'priya',scene:'backyard',x:430}};if(picture()!==empty)throw Error('Unrelated scene neighbor appeared in window');
        runtime.walkers={ines:{id:'ines',scene:'street',x:700}};if(picture()!==empty)throw Error('Offscreen neighbor appeared in window');report.walkersFilteredBySceneAndRoute=true;
        runtime.walkers={};Neighbor.inYard=()=>true;if(picture()===empty)throw Error('Doug missing');report.doug=true;Neighbor.inYard=()=>false;
        Cat.ambient=place=>place==='window'?{pose:'sit',seed:5}:null;if(picture()===empty)throw Error('Sill cat missing');report.cat=true;Cat.ambient=()=>null;
        state.npc.doug.gifts.tomato=1;if(picture()===empty)throw Error('Tomato gift missing');state.npc.doug.gifts.tomato=0;report.tomatoGift=true;
        const weather=[];for(const w of ['Sunny','Cloudy','Rain','Storm','Fog','Muggy','Windy','Cold Snap','Heat Wave','Dry Spell']){state.weather=w;weather.push(picture());}if(new Set(weather).size<8)throw Error('Weather treatment missing');report.weatherVariants=new Set(weather).size;
        report.curtains=[];state.weather='Sunny';for(const id of ['basic','none','blackout','floral','sheer','pattern','blinds']){state.room.curtains=id;picture();report.curtains.push(id);}state.room.curtains='basic';
        Neighbor.inYard=where;const yardTimes=[];for(let minute=0;minute<1440;minute+=15){state.minute=minute;if(Neighbor.inYard())yardTimes.push(minute);}if(!yardTimes.length||yardTimes.length===96)throw Error('Native neighbor schedule lost');report.nativeSchedule=true;
      }finally{Neighbor.inYard=where;drawTinyPerson=draw;Cat.ambient=ambient;runtime.walkers=oldWalkers;state.minute=oldMinute;state.weather=oldWeather;settings.reduced=oldReduced;}
      return report;
    });
    // Exercise the original window action and cat action, rather than new UI.
    const actions=await page.evaluate(()=>{const old=Neighbor.inYard,talk=Hood.talk,visit=Cat.windowVisit,at=Cat.at,calls=[];try{Neighbor.inYard=()=>true;Hood.talk=(id,opts)=>calls.push([id,opts.via]);interact('window');Neighbor.inYard=()=>false;Cat.at=()=>true;Cat.windowVisit=()=>calls.push(['cat']);interact('window');return calls;}finally{Neighbor.inYard=old;Hood.talk=talk;Cat.windowVisit=visit;Cat.at=at;}});assert.deepEqual(actions,[['doug','window'],['cat']]);
    // Keep the actual sprite renderer and curtain animation in approval pictures.
    await page.evaluate(()=>{window.windowPreviewNative={where:Neighbor.inYard,ambient:Cat.ambient};Neighbor.inYard=()=>true;Cat.ambient=place=>place==='window'?{pose:'sit',seed:7}:null;runtime.walkers={ines:{id:'ines',scene:'street',x:480}};settings.reduced=false;state.room.curtains='basic';});
    for(const [label,hour]of [['day',12],['sunset',18.75],['twilight',20],['night',23]]){
      await page.evaluate(hour=>{state.minute=hour*60;updateHUD();View.snap();},hour);await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'room-'+label+'.png')});
      const image=await page.evaluate(()=>{const cv=document.createElement('canvas');cv.width=800;cv.height=680;const c=cv.getContext('2d');c.scale(10,10);c.translate(-212,-4);drawBackground(c);RoomArt.drawWindow(c,1);return cv.toDataURL();});fs.writeFileSync(path.join(out,'window-'+label+'.png'),Buffer.from(image.split(',')[1],'base64'));
    }
    for(let i=0;i<72;i++){
      const image=await page.evaluate(i=>{const t=i/6;state.minute=18.75*60;runtime.walkers={ines:{id:'ines',scene:'street',x:300+(i/72)*260}};const cv=document.createElement('canvas');cv.width=800;cv.height=680;const c=cv.getContext('2d');c.scale(10,10);c.translate(-212,-4);drawBackground(c);RoomArt.drawWindow(c,t);return cv.toDataURL();},i);fs.writeFileSync(path.join(frames,String(i).padStart(3,'0')+'.png'),Buffer.from(image.split(',')[1],'base64'));
    }
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{state.minute=18.75*60;state.player.x=252;state.player.y=116;updateHUD();View.resize();View.snap();});await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'phone-sunset.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.evaluate(()=>{Neighbor.inYard=windowPreviewNative.where;Cat.ambient=windowPreviewNative.ambient;runtime.walkers={};settings.reduced=true;state.room.curtains='sheer';state.minute=1125;SaveSys.now('Window art fixture');});
    await page.reload();await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(()=>({name:state.player.name,curtains:state.room.curtains,minute:state.minute})),{name:'Window Gardener',curtains:'sheer',minute:1125});assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...checks,entryPoint:'public/index.html',sharedApprovedArtwork:true,windowActions:true,saveReload:true,mobile:true,pageErrors:errors},null,2)+'\n');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
