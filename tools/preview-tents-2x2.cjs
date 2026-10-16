const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto'),{chromium}=require('playwright');
(async()=>{
  const root=path.resolve(__dirname,'..'),dir=path.join(root,'graphics/tents/2x2'),out=path.join(root,'review/tents-2x2'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'sources/manifest.json'))),bytes=fs.readFileSync(path.join(dir,manifest.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);fs.mkdirSync(out,{recursive:true});
  const code=fs.readFileSync(path.join(dir,'sources/proposal.js'),'utf8').replace('__TENT2_PROPOSAL__',()=>JSON.stringify({...manifest,image:'data:image/png;base64,'+bytes.toString('base64')}));
  const swapDir=path.join(root,'graphics/tents/width-swap'),starter=JSON.parse(fs.readFileSync(path.join(swapDir,'sources/manifest.json'))),starterBytes=fs.readFileSync(path.join(swapDir,starter.path));assert.equal(createHash('sha256').update(starterBytes).digest('hex'),starter.sha256);
  const starterData={...starter,tiers:Object.fromEntries(Object.entries(starter.tiers).map(([k,v])=>[k,{...v,image:'data:image/png;base64,'+starterBytes.toString('base64')}]))};
  const starterCode=fs.readFileSync(path.join(root,'graphics/tents/starter/sources/renderer.js'),'utf8').replace('__BAGSEED_STARTER_TENT_DATA__',()=>JSON.stringify(starterData)).replace('window.BagseedStarterTent=','window.BagseedStarterTentWidthProposal=').replace('sprite(c,tier,true,66,16,188,208)','sprite(c,tier,true,98,16,125,208)').replaceAll('*.212','*.25');
  const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedStartup.ready);await page.addScriptTag({content:fs.readFileSync(path.join(swapDir,'sources/layout-proposal.js'),'utf8')});await page.addScriptTag({content:starterCode});await page.evaluate(()=>BagseedStarterTentWidthProposal.ready);await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Two by Two');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
    const before=await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;state.minute=720;state.weather='Sunny';state.room.placed=[];state.room.rgb.on=false;state.mess=[];state.hints.box=1;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
      state.gear.workbench=2;state.locations.tent2.owned=true;state.stats.harvests=2;Object.assign(state.locations.tent2.equip,{light:1,pot:2});
      Object.assign(state.locations.closet.equip,{light:1,pot:1});state.locations.closet.door='open';const first=createPlant('porchlight','closet',0);Object.assign(first,{stage:4,height:9,nodes:4,water:60,health:92});
      for(let i=0;i<2;i++){const p=createPlant('porchlight','tent2',i);Object.assign(p,{stage:4,height:7+i*3,nodes:4,water:60,health:92});}
      const hits={};for(const door of ['open','closed']){state.locations.tent2.door=door;RoomArt.hits=[];RoomArt.drawTent(document.createElement('canvas').getContext('2d'),0);hits[door]=RoomArt.hits;}
      return {hits,catalog:JSON.stringify(Shop.items('spaces')),geometry:JSON.stringify([SLOT_POS.tent2,DEV_POS.tent2,locRect('tent2'),DecoZ.statics('bedroom')]),contents:JSON.stringify(state.locations.tent2)};
    });
    await page.addScriptTag({content:code});await page.evaluate(()=>BagseedTent2Proposal.ready);
    const result=await page.evaluate(before=>{
      const check=(v,m)=>{if(!v)throw Error(m);},L=state.locations.tent2,hits={};
      for(const door of ['open','closed']){L.door=door;RoomArt.hits=[];RoomArt.drawTent(document.createElement('canvas').getContext('2d'),0);hits[door]=RoomArt.hits.map(h=>({...h,walk:h.walk.slice()}));}
      for(const door of ['open','closed'])for(const h of hits[door]){
        const m=/^(plant|slot|gslot):tent2:(\d+)$/.exec(h.id);if(m){check(h.walk[1]>120,'Pot approach is inside the tent footprint');h.y+=12;}
      }
      check(JSON.stringify(hits)===JSON.stringify(before.hits),'Unexpected target change');
      check(JSON.stringify([SLOT_POS.tent2,DEV_POS.tent2,locRect('tent2'),DecoZ.statics('bedroom')])===before.geometry,'Logical geometry changed');
      check(JSON.stringify(L)===before.contents,'Grow contents changed');check(JSON.stringify(Shop.items('spaces'))===before.catalog,'Catalog changed');
      const board=document.createElement('canvas');board.width=1500;board.height=1170;const c=board.getContext('2d');c.fillStyle='#f8f2e5';c.fillRect(0,0,1500,1170);c.fillStyle='#29483a';c.font='bold 35px Georgia';c.fillText('BAGSEED / 2×2 TENTS · WIDER FRAME',30,48);c.font='20px Georgia';c.fillText('Standard, Pro & Premium · Artwork samples for approval',30,83);
      const rooms={},closedRooms={},animation=[];
      for(const[i,tier]of ['standard','pro','premium'].entries()){
        const x=24+i*492,y=111;c.fillStyle='#e7e9db';c.fillRect(x,y,476,985);c.fillStyle='#29483a';c.font='bold 27px Georgia';c.fillText({standard:'Standard',pro:'Pro',premium:'Premium'}[tier],x+18,y+38);c.font='18px Georgia';c.fillText(tier==='standard'?'$89 tent · Standard shell included':tier==='pro'?'$49 replacement shell':'$95 replacement shell',x+18,y+69);
        for(const[j,closed]of [false,true].entries()){BagseedTent2Proposal.sprite(c,tier,closed,x+24+j*228,y+94,198,258);c.fillStyle='#29483a';c.font='18px Georgia';c.fillText(closed?'Zipped closed':'Open shell',x+30+j*228,y+380);}
        Shell.of('tent2').tier=tier;L.door='open';state.player.x=107;state.player.y=128;
        function scene(){const cv=document.createElement('canvas');cv.width=1440;cv.height=540;const g=cv.getContext('2d');g.scale(3,3);RoomArt.draw(g,0);return cv;}
        const room=scene();rooms[tier]=room.toDataURL();c.drawImage(room,180,0,282,426,x+18,y+416,216,326);L.door='closed';closedRooms[tier]=scene().toDataURL();
        const icon=document.createElement('canvas');ShellArt.icon(icon.getContext('2d'),icon,'tent2',tier);c.drawImage(icon,x+246,y+416,212,159);
        c.fillStyle='#29483a';c.font='17px Georgia';c.fillText('Bedroom · Two live plants',x+18,y+773);c.fillText('Matching store art',x+247,y+604);c.font='16px Georgia';
        const lines=tier==='standard'?['Charcoal canvas','Quiet sage seams','Plain silver lining']:tier==='pro'?['Reinforced green binding','Double seams & rivets','Covered zipper channel']:['Brass trim & padded flap','Armored corner caps','Diamond reflective lining'];lines.forEach((line,n)=>c.fillText(line,x+247,y+656+n*29));
        for(let step=0;step<9;step++){L.door='closed';settings.reduced=false;const dp=step/8,k=dp<.5?Math.sqrt(dp/2):1-Math.sqrt((1-dp)/2);runtime.doorAnim={tent2:{from:0,t0:performance.now()-380*k}};const cv=document.createElement('canvas');cv.width=280;cv.height=390;const g=cv.getContext('2d');g.scale(3,3);g.translate(-61,0);RoomArt.drawTent(g,0);animation.push({tier,step,image:cv.toDataURL()});}settings.reduced=true;runtime.doorAnim={};
      }
      c.fillStyle='#29483a';c.font='19px Georgia';c.fillText('Same 2×2 frame and two-plant capacity · Separate live equipment · Player stays in front',30,1140);
      Shell.of('tent2').tier='standard';L.door='open';
      const comparison=document.createElement('canvas');comparison.width=1000;comparison.height=1000;const g=comparison.getContext('2d');g.fillStyle='#f8f2e5';g.fillRect(0,0,1000,1000);g.fillStyle='#29483a';g.font='bold 30px Georgia';g.fillText('BAGSEED / REVISED TENT SIZES',24,41);g.font='20px Georgia';g.fillText('Starter · 54 wide · One plant',34,80);g.fillText('2×2 · 86 wide · Two plants',430,80);
      g.save();g.translate(20,102);g.scale(6,6);RoomArt.draw(g,0);g.restore();g.fillStyle='#f8f2e5';g.fillRect(0,940,1000,60);g.fillStyle='#29483a';g.font='18px Georgia';g.fillText('Width swap · Original heights · Same designs · Clear of the computer desk',24,976);
      return {board:board.toDataURL(),comparison:comparison.toDataURL(),rooms,closedRooms,animation};
    },before);
    const save=(name,url)=>fs.writeFileSync(path.join(out,name),Buffer.from(url.split(',')[1],'base64'));save('approval-2x2.png',result.board);
    save('width-comparison.png',result.comparison);
    for(const[tier,url]of Object.entries(result.rooms))save('bedroom-'+tier+'.png',url);for(const[tier,url]of Object.entries(result.closedRooms))save('bedroom-'+tier+'-closed.png',url);
    for(const tier of ['standard','pro','premium'])assert.ok(new Set(result.animation.filter(f=>f.tier===tier).map(f=>f.image)).size>=7,'Missing zip frames');
    const layering=await page.evaluate(()=>{
      const push=Actors.pushPlayer,light=Gear.light,pot=Gear.pot,L=state.locations.tent2;let playerCases=0,internalCases=0;
      try{
        Actors.pushPlayer=function(items,c){const p=state.player;items.push({y:p.y,d:()=>{c.fillStyle='#00ff00';c.fillRect(p.x-5,p.y-22,10,22);}});};
        for(const tier of ['standard','pro','premium'])for(const door of ['open','closed'])for(const minute of [720,1380])for(const x of [74,107,140]){Shell.of('tent2').tier=tier;L.door=door;state.minute=minute;state.player.x=x;state.player.y=128;const cv=document.createElement('canvas');cv.width=480;cv.height=180;RoomArt.draw(cv.getContext('2d'),0);const a=cv.getContext('2d').getImageData(x,116,1,1).data;if(!(a[1]>80&&a[1]>a[0]+40&&a[1]>a[2]+40))throw Error('Tent draws over player');playerCases++;}
        L.door='open';state.minute=720;
        Gear.light=function(c,x,y,...r){light.call(this,c,x,y,...r);c.fillStyle='#ff00ff';c.fillRect(x,y-7,1,1);c.fillStyle='#00ffff';c.fillRect(x,y+2,1,1);};
        Gear.pot=function(c,x,y,...r){pot.call(this,c,x,y,...r);c.fillStyle='#ff0000';c.fillRect(x,y+10,1,1);c.fillStyle='#0000ff';c.fillRect(x,y+2,1,1);};
        const same=(c,x,y,r,g,b)=>{const p=c.getImageData(x,y,1,1).data;return p[0]===r&&p[1]===g&&p[2]===b;};
        for(const tier of ['standard','pro','premium'])for(const l of [1,2,3,4])for(const n of [1,2,3]){Shell.of('tent2').tier=tier;L.equip.light=l;L.equip.pot=n;const cv=document.createElement('canvas');cv.width=180;cv.height=150;const c=cv.getContext('2d');RoomArt.drawTent(c,0);if(same(c,107,32,255,0,255)||!same(c,107,41,0,255,255))throw Error('Light layering wrong');for(const x of [87,127])if(same(c,x,112,255,0,0)||!same(c,x,104,0,0,255))throw Error('Pot layering wrong');internalCases++;}
        return {playerCases,internalCases};
      }finally{Actors.pushPlayer=push;Gear.light=light;Gear.pot=pot;L.equip.light=1;L.equip.pot=2;Shell.of('tent2').tier='standard';L.door='open';}
    });
    await page.evaluate(()=>{state.minute=720;Panels.app('leafcart');});await page.locator('[data-act=shopCat][data-arg=spaces]').click();
    for(const[tier,id]of [['standard','tent2'],['pro','shell_tent2_pro'],['premium','shell_tent2_premium']]){const cv=page.locator('canvas[data-draw="x:'+id+'"]');await cv.scrollIntoViewIfNeeded();assert.deepEqual(await cv.evaluate(c=>[c.width,c.height]),[320,240]);await cv.locator('..').screenshot({path:path.join(out,'store-'+tier+'.png')});}
    await page.setViewportSize({width:390,height:844});const premium=page.locator('canvas[data-draw="x:shell_tent2_premium"]');await premium.scrollIntoViewIfNeeded();await premium.locator('..').screenshot({path:path.join(out,'store-premium-phone.png')});
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({proposalOnly:true,entryPoint:'public/index.html',tiers:3,storeItems:3,widthSwap:{starter:[2,8,54,90],tent2:[64,8,86,112]},growContentsPreserved:true,visualTargetsAligned:true,walkTargetsInFrontOfTent:true,...layering,zipFramesPerTier:9,storeAndPhoneArtwork:true,productionIntegrationPendingApproval:true,errors},null,2)+'\n');console.log('Three 2x2 tent proposals, revised widths, store pictures, layering and player-depth checks passed.');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
