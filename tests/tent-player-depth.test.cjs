const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('players in front of every tent stay above its fabric in open, zipped and night views',async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/tent-player-depth');fs.mkdirSync(out,{recursive:true});
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Tent Depth');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
    const preview=await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;state.minute=720;state.weather='Sunny';state.room.placed=[];state.room.rgb.on=false;state.mess=[];state.hints.box=1;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
      state.gear.workbench=2;state.locations.closet.equip.light=1;state.locations.closet.equip.pot=1;state.locations.closet.door='open';state.player.x=56;state.player.y=106;state.player.dir='down';
      const cv=document.createElement('canvas');cv.width=600;cv.height=780;const c=cv.getContext('2d');c.scale(6,6);RoomArt.draw(c,0);return cv.toDataURL();
    });fs.writeFileSync(path.join(out,'player-front.png'),Buffer.from(preview.split(',')[1],'base64'));
    const report=await page.evaluate(()=>{
      const push=Actors.pushPlayer,cases=[];settings.reduced=true;state.flags.growroom=true;
      // An opaque probe at the player's torso makes a fabric-over-player bug
      // independent of clothing, skin tone, pose and sprite alpha.
      Actors.pushPlayer=function(items,c){const p=state.player;items.push({y:p.y,d:()=>{c.fillStyle='#00ff00';c.fillRect(p.x-5,p.y-22,10,22);}});};
      try{
        for(const loc of ['closet','tent2','tent4','tent5']){
          if(loc!=='closet')state.locations[loc].owned=true;state.scene=LOC_DEF[loc].room;state.locations[loc].equip.light=1;
          const r=locRect(loc),tiers=loc==='closet'?['budget','standard']:['standard','pro','premium'];
          for(const tier of tiers)for(const door of ['open','closed'])for(const minute of [720,1380])for(const offset of [-r[2]/2+9,0,r[2]/2-9]){
            Shell.of(loc).tier=tier;state.locations[loc].door=door;state.minute=minute;
            const x=Math.round(r[0]+r[2]/2+offset),y=r[1]+r[3]+8;state.player.x=x;state.player.y=y;
            const cv=document.createElement('canvas');cv.width=curScene().w;cv.height=curScene().h;curScene().draw(cv.getContext('2d'),0);
            const a=cv.getContext('2d').getImageData(x,r[1]+r[3]-4,1,1).data;
            if(!(a[1]>80&&a[1]>a[0]+40&&a[1]>a[2]+40))throw Error('Tent covers player: '+JSON.stringify({loc,tier,door,minute,x,y,pixel:Array.from(a)}));
            cases.push({loc,tier,door,minute,x,y});
          }
        }
        // Preserve the opposite depth relationship in the grow room: a player
        // standing behind a tent must still be hidden by its closed fabric.
        for(const loc of ['tent4','tent5']){
          state.scene='growroom';state.minute=720;state.locations[loc].door='closed';Shell.of(loc).tier='standard';
          const r=locRect(loc),x=Math.round(r[0]+r[2]/2),y=r[1]+r[3]-8;state.player.x=x;state.player.y=y;
          const cv=document.createElement('canvas');cv.width=448;cv.height=200;curScene().draw(cv.getContext('2d'),0);const a=cv.getContext('2d').getImageData(x,y-12,1,1).data;
          if(a[1]>80&&a[1]>a[0]+40&&a[1]>a[2]+40)throw Error('Player draws over a tent while standing behind it: '+loc);
        }
        return {cases:cases.length,tents:[...new Set(cases.map(c=>c.loc))],shellsOpenClosedDayNight:true,leftCenterRightApproaches:true,behindTentCases:2};
      }finally{Actors.pushPlayer=push;}
    });assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,entryPoint:'public/index.html',errors},null,2)+'\n');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
