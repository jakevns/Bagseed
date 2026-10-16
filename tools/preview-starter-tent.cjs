// Approval samples only: inject into public/index.html in an isolated browser.
// This tool never rebuilds or changes the production game.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/starter-tent');
  fs.mkdirSync(out,{recursive:true});
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'graphics/tents/starter/sources/manifest.json')));
  const art={};for(const [tier,entry] of Object.entries(manifest.tiers))art[tier]={...entry,image:'data:image/png;base64,'+fs.readFileSync(path.join(root,'graphics/tents/starter',entry.path)).toString('base64')};
  const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedStartup.ready);
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Tent Samples');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
    const before=await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;state.minute=720;state.weather='Sunny';state.room.placed=[];state.room.rgb.on=false;state.mess=[];state.hints.box=1;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
      state.gear.workbench=2;state.locations.closet.equip.light=1;state.locations.closet.equip.pot=1;
      const p=demoPlant(state.bagLine,5,123,{id:'tent_sample',loc:'closet'});state.plants[p.id]=p;state.locations.closet.slots[0]=p.id;
      const hits={};for(const door of ['open','closed']){state.locations.closet.door=door;RoomArt.hits=[];RoomArt.drawCloset(document.createElement('canvas').getContext('2d'),0);hits[door]=JSON.stringify(RoomArt.hits);}
      return {hits,catalog:JSON.stringify(Shop.items('spaces')),footprint:JSON.stringify(DecoZ.statics('bedroom')),source:RoomArt.drawCloset.toString()};
    });
    await page.evaluate(async art=>{
      const images={};await Promise.all(Object.entries(art).map(async([tier,a])=>{const im=new Image();im.src=a.image;await im.decode();images[tier]=im;}));
      window.drawStarterSample=(c,closed,x,y,w,h,tier=Shell.of('closet').tier)=>{const a=art[tier]||art.budget;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(images[tier]||images.budget,...a[closed?'closed':'open'],x,y,w,h);c.restore();};
      let source=RoomArt.drawCloset.toString();
      source=source.replace(/  \/\/ a wide, shallow[\s\S]*?(?=  this\.plate)/,"  drawStarterSample(c,false,X,Y,W,H);\n");
      source=source.replace(/  const fh = Math\.round\(lerp\(5,[\s\S]*?  ShellArt\.trim\(c, 'closet', X, Y, W, H, dp\);/,"  if(dp>=1) drawStarterSample(c,true,X,Y,W,H);\n");
      if(source===RoomArt.drawCloset.toString()||source.includes('ShellArt.trim(c, \'closet\''))throw Error('Starter preview patch did not match');
      RoomArt.drawCloset=eval('('+source+')');
      const original=ShellArt.icon;ShellArt.icon=function(c,cv,size,tier){if(size!=='closet'||!['budget','standard'].includes(tier))return original.call(this,c,cv,size,tier);cv.width=320;cv.height=240;c.fillStyle='#1a2420';c.fillRect(0,0,320,240);drawStarterSample(c,true,66,16,188,208,tier);};
    },art);
    const result=await page.evaluate(before=>{
      const tierBefore=Shell.of('closet').tier;
      const hits={};for(const door of ['open','closed']){state.locations.closet.door=door;RoomArt.hits=[];RoomArt.drawCloset(document.createElement('canvas').getContext('2d'),0);hits[door]=JSON.stringify(RoomArt.hits);}
      function room(tier,door){Shell.of('closet').tier=tier;state.locations.closet.door=door;const cv=document.createElement('canvas');cv.width=1440;cv.height=540;const c=cv.getContext('2d');c.scale(3,3);RoomArt.draw(c,0);return cv;}
      const board=document.createElement('canvas');board.width=1400;board.height=1110;const c=board.getContext('2d');c.fillStyle='#f8f2e5';c.fillRect(0,0,1400,1110);c.fillStyle='#29483a';c.font='bold 34px Georgia';c.fillText('BAGSEED / STARTER TENT',30,49);c.font='20px Georgia';c.fillText('Artwork samples · Existing Budget and Standard shells',30,82);
      const scenes={};for(const [i,tier] of ['budget','standard'].entries()){
        const x=24+i*688,y=112;c.fillStyle='#e7e9db';c.fillRect(x,y,664,910);c.fillStyle='#29483a';c.font='bold 28px Georgia';c.fillText(tier==='budget'?'Budget · Included':'Standard · $35 shell upgrade',x+20,y+40);
        for(const [j,closed] of [false,true].entries()){drawStarterSample(c,closed,x+25+j*320,y+65,290,320,tier);c.fillStyle='#29483a';c.font='18px Georgia';c.fillText(closed?'Zipped closed':'Open · Empty shell',x+27+j*320,y+414);}
        const icon=document.createElement('canvas');ShellArt.icon(icon.getContext('2d'),icon,'closet',tier);c.drawImage(icon,x+20,y+455,280,210);
        c.fillStyle='#29483a';c.font='18px Georgia';c.fillText('Matching catalog artwork',x+20,y+695);c.font='16px Georgia';c.fillText(tier==='budget'?'Included with your first grow space':'LeafCart / Grow Spaces',x+20,y+720);
        const r=room(tier,'open');scenes[tier]=r.toDataURL();c.drawImage(r,0,0,285,360,x+330,y+455,304,384);c.fillStyle='#29483a';c.font='18px Georgia';c.fillText('Actual bedroom placement',x+330,y+865);
      }
      c.font='18px Georgia';c.fillText('Same starter frame · Live plants and equipment remain separate · Larger tents come next',30,1065);
      Shell.of('closet').tier=tierBefore;
      return {board:board.toDataURL(),scenes,hits,catalogUnchanged:before.catalog===JSON.stringify(Shop.items('spaces')),footprintUnchanged:before.footprint===JSON.stringify(DecoZ.statics('bedroom'))};
    },before);
    assert.deepEqual(result.hits,before.hits);assert.ok(result.catalogUnchanged);assert.ok(result.footprintUnchanged);
    fs.writeFileSync(path.join(out,'approval-starter-tent.png'),Buffer.from(result.board.split(',')[1],'base64'));
    for(const [tier,url] of Object.entries(result.scenes))fs.writeFileSync(path.join(out,'bedroom-'+tier+'.png'),Buffer.from(url.split(',')[1],'base64'));
    await page.evaluate(()=>{Shell.of('closet').tier='budget';state.locations.closet.door='open';state.money=1000;Panels.app('leafcart');});await page.locator('[data-act=shopCat][data-arg=spaces]').click();
    const store=page.locator('canvas[data-draw="x:shell_closet_standard"]');await store.scrollIntoViewIfNeeded();assert.deepEqual(await store.evaluate(c=>[c.width,c.height]),[320,240]);await store.locator('..').screenshot({path:path.join(out,'store-standard.png')});
    await page.setViewportSize({width:390,height:844});await store.scrollIntoViewIfNeeded();await store.locator('..').screenshot({path:path.join(out,'store-standard-phone.png')});
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({proposalOnly:true,entryPoint:'public/index.html',starterShells:['budget','standard'],purchasableStarterShell:{tier:'standard',price:35},unchangedHitboxes:true,unchangedCatalog:true,unchangedFootprints:true,storeArtwork:true,phoneStore:true,animationNotFinalized:true,errors},null,2)+'\n');
    console.log('Starter tent samples saved; catalog, hitboxes, footprints and desktop/mobile store checked.');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
