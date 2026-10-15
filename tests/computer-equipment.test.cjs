const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');

test('computer purchases, job upgrades, all desktop style purchases, package art and saved options remain functional',async()=>{
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  const out=path.join(__dirname,'../artifacts/computer-equipment');fs.mkdirSync(out,{recursive:true});
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedEquipment.ready);
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Equipment Fixture');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    await page.evaluate(()=>{settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.money=2000;state.sale.day=-1;state.jobs.rep=0;Panels.app('leafcart');});
    assert.deepEqual(await page.evaluate(()=>[state.gear.computer,Jobs.pcPay(),Jobs.tierOK('skilled'),Jobs.tierOK('premium')]),[0,1,false,false]);
    await page.locator('[data-act=shopCat][data-arg=desk]').click();const store={};
    for(const tier of [1,2]){
      const cv=page.locator(`canvas[data-draw="gear:computer:${tier}"]`);assert.deepEqual(await cv.evaluate(c=>[c.width,c.height]),[320,240]);store['eq:computer:'+tier]=await cv.evaluate(c=>c.toDataURL());
      await page.locator(`[data-act=cartAdd115][data-arg="eq:computer:${tier}"]`).click();
    }
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    const styles=await page.evaluate(()=>['keyboard','mat','wallpaper'].flatMap(slot=>STYLES[slot].filter(s=>s[2]>0).map(([id,name,price])=>({slot,id,name,price,key:'s:'+slot+':'+id}))));
    assert.equal(styles.length,9);assert.equal(styles.reduce((n,s)=>n+s.price,0),157);
    for(const s of styles){
      const cv=page.locator(`canvas[data-draw="style:${s.slot}:${s.id}"]`);await cv.scrollIntoViewIfNeeded();assert.deepEqual(await cv.evaluate(c=>[c.width,c.height]),[320,200]);store[s.key]=await cv.evaluate(c=>c.toDataURL());
      await page.locator(`[data-act=cartAdd115][data-arg="${s.key}"]`).click();
    }
    await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();assert.equal(await page.evaluate(()=>state.money),1315);
    const orders=['eq:computer:1','eq:computer:2',...styles.map(s=>s.key)];
    for(const key of orders){
      await page.evaluate(key=>{const i=state.orders.findIndex(o=>o.key===key);if(i<0)throw Error('Missing order '+key);state.packages.push(state.orders.splice(i,1)[0]);Panels.pkg(state.packages.length-1);},key);
      await page.locator('[data-act=pkgOpen115]').click();
      const gear=key.startsWith('eq:'),icon=key.replace(gear?'eq:':'s:',gear?'gear:':'style:');assert.equal(await page.locator(`canvas[data-draw="${icon}"]`).evaluate(c=>c.toDataURL()),store[key]);
      if(gear){
        await page.locator('[data-act=gearInstallPkg]').click();const tier=Number(key.at(-1));
        assert.deepEqual(await page.evaluate(()=>[state.gear.computer,Jobs.pcPay(),Jobs.tierOK('skilled'),Jobs.tierOK('premium')]),[tier,tier===1?1.2:1.4,true,tier===2]);
      }
    }
    const saved=await page.evaluate(()=>{
      closePanel();for(const slot of ['keyboard','mat','wallpaper'])for(const [id]of STYLES[slot]){ACT.style(slot+':'+id);if(state.room[slot]!==id)throw Error('Cannot select '+slot+':'+id);}
      SaveSys.now('Computer equipment fixture');return {computer:state.gear.computer,keyboard:state.room.keyboard,mat:state.room.mat,wallpaper:state.room.wallpaper,money:state.money};
    });
    assert.deepEqual(saved,{computer:2,keyboard:'rgbkb',mat:'map',wallpaper:'stars',money:1315});
    await page.reload();await page.evaluate(()=>BagseedEquipment.ready);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(()=>({computer:state.gear.computer,keyboard:state.room.keyboard,mat:state.room.mat,wallpaper:state.room.wallpaper,money:state.money})),saved);
    assert.equal(await page.evaluate(styles=>styles.every(s=>styleOwned(s.slot,s.id)),styles),true);
    // Sample the actual game-loop calls at native resolution, independent of character and curtain movement.
    await page.evaluate(()=>{
      settings.speed=0;settings.reduced=false;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
      state.room.rgb={on:true,mode:'cycle',speed:1,bright:2,color:'#8bc58c'};
      const original=Gear.computer,cv=document.createElement('canvas');cv.width=64;cv.height=48;const g=cv.getContext('2d');let samples=[],last=0;
      Gear.computer=function(c,x,y,tier,t,on){const result=original.call(this,c,x,y,tier,t,on);if(c===View.wctx&&performance.now()-last>80){last=performance.now();g.clearRect(0,0,64,48);original.call(this,g,8,20,tier,t,on);samples.push({t,image:cv.toDataURL()});}return result;};
      window.equipmentMotionFixture={samples:()=>samples,start(reduced){settings.reduced=reduced;samples=[];last=0;},restore(){Gear.computer=original;}};
    });
    await page.waitForFunction(()=>{const a=equipmentMotionFixture.samples();return a.length>=12&&a.at(-1).t-a[0].t>2;});
    const moving=await page.evaluate(()=>equipmentMotionFixture.samples());assert.ok(new Set(moving.map(s=>s.image)).size>2);
    await page.evaluate(()=>equipmentMotionFixture.start(true));await page.waitForFunction(()=>equipmentMotionFixture.samples().length>=8);
    const still=await page.evaluate(()=>equipmentMotionFixture.samples());assert.equal(new Set(still.map(s=>s.image)).size,1);await page.evaluate(()=>equipmentMotionFixture.restore());
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{Panels.app('leafcart');runtime.shopQ='';});await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    const phone=page.locator('canvas[data-draw="style:keyboard:rgbkb"]');await phone.scrollIntoViewIfNeeded();assert.ok(Math.abs(await phone.evaluate(c=>{const r=c.getBoundingClientRect();return r.width/r.height;})-1.6)<.01);await phone.locator('..').screenshot({path:path.join(out,'store-keyboard-phone.png')});
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({computerPurchases:2,stylePurchases:styles.length,totalPaid:685,final:saved,packageMatchesStore:true,saveReload:true,nativeLoopMotion:true,reducedMotion:true,errors},null,2)+'\n');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
