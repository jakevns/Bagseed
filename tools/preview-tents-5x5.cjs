const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),dir=path.join(root,'graphics/tents/5x5'),out=path.join(root,'review/tents-5x5'),data=JSON.parse(fs.readFileSync(path.join(dir,'sources/manifest.json'))),bytes=fs.readFileSync(path.join(dir,data.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),data.sha256);
 assert.ok(fs.readFileSync(path.join(root,'public/index.html'),'utf8').includes('id="bagseed-tent5-production-code"'),'Build the approved tents first');
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('../tests/helpers/art-page.cjs')(browser,{viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Five by Five');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const before=await page.evaluate(()=>{
   settings.speed=0;settings.reduced=true;state.tut.on=false;state.scene='growroom';state.flags.growroom=true;state.stats.harvests=4;state.minute=720;state.weather='Sunny';state.mess=[];state.hints.box=1;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
   state.locations.tent4.owned=true;const L=state.locations.tent5;L.owned=true;L.door='open';Object.assign(L.equip,{light:3,pot:2,fan:1,sensor:1});state.player.x=269;state.player.y=156;
   for(let i=0;i<6;i++){const p=createPlant('porchlight','tent5',i);Object.assign(p,{stage:4,height:6+i*1.5,nodes:4,water:60,health:92});}
   RoomArt.hits=[];TentArt.draw(document.createElement('canvas').getContext('2d'),'tent5',178,2,182,142,0);
   return {contents:JSON.stringify(L),geometry:JSON.stringify([SLOT_POS.tent5,locRect('tent5'),SCENES.growroom.solids()]),hits:RoomArt.hits,catalog:JSON.stringify(Shop.items('spaces'))};
  });
  await page.evaluate(()=>{window.BagseedTent5Proposal=BagseedTent5;return BagseedTent5.ready;});
  const result=await page.evaluate(before=>{
   const L=state.locations.tent5,check=(ok,m)=>{if(!ok)throw Error(m);};RoomArt.hits=[];TentArt.draw(document.createElement('canvas').getContext('2d'),'tent5',178,2,182,142,0);
   const hits=RoomArt.hits,plants=hits.filter(h=>/^(plant|slot|gslot):tent5:/.test(h.id));check(plants.length===6,'Six plant targets required');check(plants.every(h=>h.walk[1]>144),'Plant approach must remain outside');check(before.hits.every(h=>hits.some(n=>n.id===h.id&&n.label===h.label)),'Existing interaction missing');
   check(JSON.stringify([SLOT_POS.tent5,locRect('tent5'),SCENES.growroom.solids()])===before.geometry,'Proposal changed logical geometry');check(JSON.stringify(L)===before.contents,'Proposal changed grow contents');check(JSON.stringify(Shop.items('spaces'))===before.catalog,'Proposal changed catalog');
   const board=document.createElement('canvas');board.width=1500;board.height=1100;const c=board.getContext('2d');c.fillStyle='#f8f2e5';c.fillRect(0,0,1500,1100);c.fillStyle='#29483a';c.font='bold 35px Georgia';c.fillText('BAGSEED / 5×5 TENTS · SIX-PLANT FRAME',28,46);c.font='20px Georgia';c.fillText('Standard, Pro & Premium · Artwork samples for approval',28,80);
   const rooms={},animation=[];
   function scene(){const cv=document.createElement('canvas');cv.width=1344;cv.height=600;const g=cv.getContext('2d');g.scale(3,3);SCENES.growroom.draw(g,0);return cv;}
   for(const[i,tier]of ['standard','pro','premium'].entries()){
    const x=24+i*492,y=106;c.fillStyle='#e7e9db';c.fillRect(x,y,476,940);c.fillStyle='#29483a';c.font='bold 28px Georgia';c.fillText({standard:'Standard',pro:'Pro',premium:'Premium'}[tier],x+18,y+38);c.font='18px Georgia';c.fillText(tier==='standard'?'$489 tent · Standard shell included':tier==='pro'?'$189 replacement shell':'$339 replacement shell',x+18,y+68);
    for(const[j,closed]of [false,true].entries()){BagseedTent5Proposal.sprite(c,tier,closed,x+18+j*231,y+98,208,162);c.fillStyle='#29483a';c.font='18px Georgia';c.fillText(closed?'Zipped closed':'Open shell',x+22+j*231,y+330);}
    Shell.of('tent5').tier=tier;L.door='open';const room=scene();rooms[tier]=room.toDataURL();c.drawImage(room,516,0,582,552,x+18,y+380,274,260);c.fillStyle='#29483a';c.font='17px Georgia';c.fillText('Grow room · Six live plants',x+18,y+721);
    const icon=document.createElement('canvas');ShellArt.icon(icon.getContext('2d'),icon,'tent5',tier);c.drawImage(icon,x+309,y+400,150,112.5);c.fillText('Matching store art',x+304,y+541);c.font='16px Georgia';const lines=tier==='standard'?['Sage binding','Silver lining','Deep floor tray']:tier==='pro'?['Moss reinforcement','Double zip channel','Corner rivets']:['Brass binding','Padded corner caps','Diamond lining'];lines.forEach((line,n)=>c.fillText(line,x+304,y+588+n*28));
    for(let step=0;step<9;step++){settings.reduced=false;L.door='closed';const dp=step/8,k=dp<.5?Math.sqrt(dp/2):1-Math.sqrt((1-dp)/2);runtime.doorAnim={tent5:{from:0,t0:performance.now()-380*k}};const cv=document.createElement('canvas');cv.width=594;cv.height=570;const g=cv.getContext('2d');g.scale(3,3);g.translate(-172,0);SCENES.growroom.draw(g,0);animation.push({tier,step,image:cv.toDataURL()});}settings.reduced=true;runtime.doorAnim={};L.door='open';
   }
   c.fillStyle='#29483a';c.font='19px Georgia';c.fillText('Existing 182×142 frame · Six live slots · Separate equipment, plant and fabric layers',28,1080);
   Shell.of('tent5').tier='standard';
   return {board:board.toDataURL(),rooms,animation};
  },before);
  const save=(name,url)=>fs.writeFileSync(path.join(out,name),Buffer.from(url.split(',')[1],'base64'));save('approval-5x5.png',result.board);for(const[tier,url]of Object.entries(result.rooms))save('growroom-'+tier+'.png',url);
  for(const tier of ['standard','pro','premium']){const frames=result.animation.filter(f=>f.tier===tier);assert.ok(new Set(frames.map(f=>f.image)).size>=7);for(const f of frames)save('zip-'+tier+'-'+f.step+'.png',f.image);}
  const coverage=await page.evaluate(()=>{
   const L=state.locations.tent5,original=Actors.pushPlayer,pot=Gear.pot,light=Gear.light;let frontCases=0,behindCases=0,contentsCases=0;
   try{
    Actors.pushPlayer=function(items,c){const p=state.player;items.push({y:p.y,d:()=>{c.fillStyle='#00ff00';c.fillRect(p.x-5,p.y-22,10,22);}});};
    for(const tier of ['standard','pro','premium'])for(const door of ['open','closed'])for(const minute of [720,1380])for(const x of [190,269,348]){Shell.of('tent5').tier=tier;L.door=door;state.minute=minute;state.player.x=x;state.player.y=152;const cv=document.createElement('canvas');cv.width=448;cv.height=200;SCENES.growroom.draw(cv.getContext('2d'),0);const p=cv.getContext('2d').getImageData(x,140,1,1).data;check(p[1]>80&&p[1]>p[0]+40&&p[1]>p[2]+40,'Tent paints over player');frontCases++;}
    for(const tier of ['standard','pro','premium']){Shell.of('tent5').tier=tier;L.door='closed';state.minute=720;state.player.x=269;state.player.y=136;const cv=document.createElement('canvas');cv.width=448;cv.height=200;SCENES.growroom.draw(cv.getContext('2d'),0);const p=cv.getContext('2d').getImageData(269,124,1,1).data;check(!(p[1]>80&&p[1]>p[0]+40&&p[1]>p[2]+40),'Player behind tent paints over it');behindCases++;}
    Gear.light=function(c,x,y,...args){light.call(this,c,x,y,...args);c.fillStyle='#ff00ff';c.fillRect(x,y-9,1,1);c.fillStyle='#00ffff';c.fillRect(x,y+2,1,1);};
    Gear.pot=function(c,x,y,...args){pot.call(this,c,x,y,...args);c.fillStyle='#ff0000';c.fillRect(x,y+20,1,1);c.fillStyle='#0000ff';c.fillRect(x,y+2,1,1);};
    const same=(c,x,y,a,b,d)=>{const p=c.getImageData(x,y,1,1).data;return p[0]===a&&p[1]===b&&p[2]===d;};L.door='open';
    for(const tier of ['standard','pro','premium'])for(const l of [1,2,3,4])for(const n of [1,2,3]){Shell.of('tent5').tier=tier;L.equip.light=l;L.equip.pot=n;const cv=document.createElement('canvas');cv.width=400;cv.height=180;const c=cv.getContext('2d');TentArt.draw(c,'tent5',178,2,182,142,0);check([229,309].every(x=>!same(c,x,36,255,0,255)&&same(c,x,47,0,255,255)),'Light not inside roof');for(const x of [208,232,256,280,304,328])check(!same(c,x,134,255,0,0)&&same(c,x,116,0,0,255),'Pot does not sit inside tray');contentsCases++;}
    return {frontCases,behindCases,contentsCases};
   }finally{Actors.pushPlayer=original;Gear.pot=pot;Gear.light=light;L.equip.light=3;L.equip.pot=2;L.door='open';Shell.of('tent5').tier='standard';state.minute=720;}
   function check(ok,message){if(!ok)throw Error(message);}
  });
  await page.evaluate(()=>Panels.app('leafcart'));await page.locator('[data-act=shopCat][data-arg=spaces]').click();
  for(const [tier,id] of [['standard','tent5'],['pro','shell_tent5_pro'],['premium','shell_tent5_premium']]){const cv=page.locator('canvas[data-draw="x:'+id+'"]');await cv.scrollIntoViewIfNeeded();assert.deepEqual(await cv.evaluate(c=>[c.width,c.height]),[320,240]);await cv.locator('..').screenshot({path:path.join(out,'store-'+tier+'.png')});}
  await page.setViewportSize({width:390,height:844});const cv=page.locator('canvas[data-draw="x:shell_tent5_premium"]');await cv.scrollIntoViewIfNeeded();await cv.locator('..').screenshot({path:path.join(out,'store-premium-phone.png')});assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({proposalOnly:false,entryPoint:'public/index.html',tiers:3,plantSlots:6,storeItems:3,geometryAndCatalogPreserved:true,plantsAndEquipmentPreserved:true,plantTargetsOutsideTent:true,...coverage,zipFramesPerTier:9,storeAndPhoneArtwork:true,productionIntegrationPendingApproval:false,errors},null,2)+'\n');console.log('5×5 samples: three shells, six live plants, store art, animation and depth checks passed.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
