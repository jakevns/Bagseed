const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');

test('camera upgrades retain photo unlocks, store/package artwork, vintage placement and saved equipment',async()=>{
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  const out=path.join(__dirname,'../artifacts/cameras');fs.mkdirSync(out,{recursive:true});
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedCameras.ready);
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Camera Fixture');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    await page.evaluate(()=>{
      settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.money=1000;state.sale.day=-1;state.room.placed=[];
      const p=demoPlant(LINES[0].id,9,145,{id:'camera_fixture',name:'Camera Test',loc:'closet',age:40});state.plants[p.id]=p;
    });
    async function photoUnlocks(tier){
      await page.evaluate(()=>{closePanel();Panels.sprout('new','camera_fixture');});
      const checks=[['angle:front',0],['angle:top',0],['angle:low',1],['angle:macro',2],['filter:none',0],['filter:warm',0],['filter:mono',0],['filter:vintage',1],['filter:neon',1],['filter:dreamy',2]];
      for(const [arg,minTier]of checks)assert.equal(await page.locator(`[data-act=ph][data-arg="${arg}"]`).isEnabled(),tier>=minTier,arg+' unlock');
      const angle=tier===0?'top':tier===1?'low':'macro',filter=tier===0?'warm':tier===1?'vintage':'dreamy';
      await page.locator(`[data-act=ph][data-arg="angle:${angle}"]`).click();await page.locator(`[data-act=ph][data-arg="filter:${filter}"]`).click();
      assert.deepEqual(await page.evaluate(()=>({camera:state.gear.camera,angle:runtime.photo.angle,filter:runtime.photo.filter,res:EQ.camera[state.gear.camera].res})),{camera:tier,angle,filter,res:[72,120,240][tier]});
      assert.ok(await page.locator('#photoCanvas').evaluate(c=>{drawPhotoPreview(c);return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0);}));
    }
    await photoUnlocks(0);
    await page.evaluate(()=>{closePanel();Panels.app('leafcart');});await page.locator('[data-act=shopCat][data-arg=desk]').click();const store={};
    for(const tier of [1,2]){
      const cv=page.locator(`canvas[data-draw="gear:camera:${tier}"]`);assert.deepEqual(await cv.evaluate(c=>[c.width,c.height]),[320,240]);store['eq:camera:'+tier]=await cv.evaluate(c=>c.toDataURL());
      await page.locator(`[data-act=cartAdd115][data-arg="eq:camera:${tier}"]`).click();
    }
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=desk]').click();
    const vintage=page.locator('canvas[data-draw="decor:camdisplay"]');store['d:camdisplay']=await vintage.evaluate(c=>c.toDataURL());
    assert.equal(await vintage.evaluate(c=>{const expected=document.createElement('canvas');drawDecorIcon(expected.getContext('2d'),expected,'camdisplay');return c.toDataURL()===expected.toDataURL();}),true,'Final store hydration must preserve the full-size decorative camera');
    await page.locator('[data-act=cartAdd115][data-arg="d:camdisplay"]').click();await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();assert.equal(await page.evaluate(()=>state.money),542);
    for(const key of ['eq:camera:1','eq:camera:2','d:camdisplay']){
      await page.evaluate(key=>{const i=state.orders.findIndex(o=>o.key===key);if(i<0)throw Error('Missing camera order');state.packages.push(state.orders.splice(i,1)[0]);Panels.pkg(state.packages.length-1);},key);
      await page.locator('[data-act=pkgOpen115]').click();const icon=key.startsWith('eq:')?key.replace('eq:','gear:'):'decor:camdisplay';assert.equal(await page.locator(`canvas[data-draw="${icon}"]`).evaluate(c=>c.toDataURL()),store[key]);
      if(key.startsWith('eq:')){await page.locator('[data-act=gearInstallPkg]').click();await photoUnlocks(Number(key.at(-1)));}
    }
    const saved=await page.evaluate(()=>{
      closePanel();Deco.open();Deco.pick('camdisplay');Deco.move(200,70);if(!Deco.place())throw Error('Cannot place vintage camera on desk');
      const d=state.room.placed.find(d=>d.id==='camdisplay');if(d.y+8!==74)throw Error('Vintage camera does not rest on desktop');
      Deco.pickPlaced(d);Deco.flip();Deco.move(200,70);if(!Deco.place())throw Error('Cannot flip decorative camera');Deco.close();
      const camera=state.room.placed.find(d=>d.id==='camdisplay');if(!camera.flip)throw Error('Flip was lost');
      delete state.plants.camera_fixture;SaveSys.now('Approved camera fixture');
      return {gear:state.gear.camera,money:state.money,placed:state.room.placed,owned:state.room.own.camdisplay};
    });
    assert.equal(saved.gear,2);assert.equal(saved.owned,1);
    await page.reload();await page.evaluate(()=>BagseedCameras.ready);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(()=>({gear:state.gear.camera,money:state.money,placed:state.room.placed,owned:state.room.own.camdisplay})),saved);
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{settings.speed=0;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();Panels.app('leafcart');});await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=desk]').click();
    const phone=page.locator('canvas[data-draw="decor:camdisplay"]');await phone.scrollIntoViewIfNeeded();assert.ok(Math.abs(await phone.evaluate(c=>{const r=c.getBoundingClientRect();return r.width/r.height;})-4/3)<.01);await phone.locator('..').screenshot({path:path.join(out,'store-vintage-phone.png')});
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({cameraPurchases:2,decorativeCameraPurchase:1,totalPaid:458,allTierUnlocks:true,renderedPhotoModes:3,packageMatchesStore:true,placementAndFlip:true,saveReload:true,phoneStore:true,final:saved,errors},null,2)+'\n');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
