const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('all six window treatments visibly animate at native resolution in the real game loop, with stronger wind and still reduced motion',async()=>{
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.evaluate(()=>BagseedCurtains.ready);
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Curtain Motion');
    await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    await page.evaluate(()=>{
      settings.speed=0;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];
      if(runtime.curDialog)ACT.dlg(0);closePanel();state.minute=720;
      const original=RoomArt.drawCurtains,cv=document.createElement('canvas');cv.width=80;cv.height=68;
      const g=cv.getContext('2d');let samples=[],last=0;
      function centroid(y){const data=g.getImageData(0,y,40,1).data;let total=0,sum=0;for(let x=0;x<40;x++){total+=data[x*4+3];sum+=x*data[x*4+3];}if(!total)throw Error('No cloth at sampled row');return sum/total;}
      RoomArt.drawCurtains=function(c,x,y,w,h,t){
        const result=original.call(this,c,x,y,w,h,t);
        if(c===View.wctx&&performance.now()-last>=90){
          last=performance.now();g.clearRect(0,0,80,68);original.call(this,g,14,10,52,42,t);
          samples.push({t,upper:centroid(22),hem:centroid(59),rod:Array.from(g.getImageData(0,0,80,8).data).join(','),image:cv.toDataURL()});
        }
        return result;
      };
      window.curtainMotionFixture={start(id,weather,reduced){state.room.curtains=id;state.weather=weather;settings.reduced=reduced;
        runtime.t=(1.5*Math.PI-.225)/(weather==='Windy'?1.8:1.1);samples=[];last=0;},take(){return samples;},restore(){RoomArt.drawCurtains=original;}};
    });
    const results=[];
    for(const id of ['basic','blackout','floral','sheer','pattern']) {
      await page.evaluate(id=>curtainMotionFixture.start(id,'Sunny',false),id);
      await page.waitForFunction(()=>{const s=curtainMotionFixture.take();return s.length>=20&&s.at(-1).t-s[0].t>3;},null,{timeout:15000});
      const calm=await page.evaluate(()=>curtainMotionFixture.take());
      await page.evaluate(id=>curtainMotionFixture.start(id,'Windy',false),id);
      await page.waitForFunction(()=>{const s=curtainMotionFixture.take();return s.length>=15&&s.at(-1).t-s[0].t>2;},null,{timeout:15000});
      const wind=await page.evaluate(()=>curtainMotionFixture.take());
      await page.evaluate(id=>curtainMotionFixture.start(id,'Windy',true),id);
      await page.waitForFunction(()=>curtainMotionFixture.take().length>=3,null,{timeout:5000});
      const still=await page.evaluate(()=>curtainMotionFixture.take());
      const range=(frames,key)=>Math.max(...frames.map(f=>f[key]))-Math.min(...frames.map(f=>f[key]));
      const upper=range(calm,'upper'),hem=range(calm,'hem'),windUpper=range(wind,'upper'),windHem=range(wind,'hem');
      assert.ok(calm.length>=15&&calm.at(-1).t-calm[0].t>2.7,id+' real frame clock did not advance');
      assert.ok(wind.length>=10,id+' windy frames missing');
      assert.ok(upper>.65&&hem>1.1,id+' calm sway is not visible at native resolution: '+JSON.stringify({upper,hem}));
      assert.ok(windUpper>upper*1.65&&windHem>hem*1.65,id+' wind is not stronger');
      assert.equal(new Set([...calm,...wind].map(f=>f.rod)).size,1,id+' rod moves');
      assert.ok(still.length>=2);assert.equal(new Set(still.map(f=>f.image)).size,1,id+' reduced motion moves');
      results.push({id,realGameFrames:calm.length+wind.length,nativePixels:{calmUpper:upper,calmHem:hem,windUpper,windHem},fixedRod:true,reducedMotionStill:true});
    }
    await page.evaluate(()=>curtainMotionFixture.restore());
    const styles=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../graphics/curtains/batch-03/sources/manifest.json'))).styles;
    const blinds=await require('../tools/check-curtain-preview-motion.cjs')(page,{blinds:styles.blinds});
    assert.deepEqual(errors,[]);
    const out=path.resolve(__dirname,'../artifacts/curtain-live-motion');fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({nativeResolution:true,realFrameLoop:true,results,blinds,errors},null,2)+'\n');
  } finally {await browser?.close();await new Promise(r=>server.close(r));}
});
