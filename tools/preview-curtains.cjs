/* Capture the full game, injecting pending curtain art only before approval/integration. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createHash}=require('node:crypto');
(async()=>{
  const root=path.resolve(__dirname,'..'),batch=process.argv[2]||'01';
  assert.ok(['01','02','03'].includes(batch),'Unknown curtain preview batch');
  const manifest=JSON.parse(fs.readFileSync(path.join(root,`graphics/curtains/batch-${batch}/sources/manifest.json`)));
  const ids=Object.keys(manifest.styles),out=path.join(root,'review/curtains-batch-'+batch);
  fs.mkdirSync(out,{recursive:true});
  const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.evaluate(()=>Promise.all([BagseedArt.ready,BagseedBedroom.ready,BagseedBeds.ready,BagseedDesks.ready,window.BagseedCurtains?.ready]));
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Curtain Review');
    await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    const before=await page.evaluate(()=>{
      settings.speed=0;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();
      runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.weather='Sunny';state.minute=720;
      settings.reduced=true;
      return STYLES.curtains.map(([id,name,price])=>{
        state.room.curtains=id;const cv=document.createElement('canvas');cv.width=400;cv.height=340;
        const g=cv.getContext('2d');g.scale(5,5);RoomArt.drawCurtains(g,14,10,52,42,.5);
        const art=cv.toDataURL(),variants={};settings.reduced=false;
        for(const weather of ['Sunny','Windy']) {
          state.weather=weather;g.clearRect(0,0,80,68);RoomArt.drawCurtains(g,14,10,52,42,.5);variants[weather]=cv.toDataURL();
        }
        settings.reduced=true;state.weather='Sunny';return {id,name,price,art,variants};
      });
    });
    const integrated=await page.evaluate(ids=>ids.every(id=>window.BagseedCurtains?.styles.includes(id)),ids);
    if(!integrated) {
      const hash=data=>createHash('sha256').update(data).digest('hex');
      const styles=Object.fromEntries(before.filter(s=>!ids.includes(s.id)).map(s=>[s.id,
        {still:hash(s.art),Sunny:hash(s.variants.Sunny),Windy:hash(s.variants.Windy)}]));
      fs.writeFileSync(path.join(out,'prior-render-hashes.json'),JSON.stringify({encoding:'PNG data URI SHA-256',time:.5,canvas:[400,340],scale:5,window:[14,10,52,42],styles},null,2)+'\n');
    }
    if(manifest.status==='approved')assert.ok(integrated,'Approved curtains missing from production build');
    if(!integrated) {
      const tag=require('./compile-curtains.cjs')(batch);
      await page.addScriptTag({content:tag.replace(/^<script[^>]*>\n/,'').replace(/<\/script>\n$/,'')});
    }
    await page.evaluate(()=>BagseedCurtains.ready);
    const result=await page.evaluate(({before,integrated,ids,batch,styles})=>{
      const originals=new Map(before.map(s=>[s.id,s])),checks=[];
      const oldRoom=JSON.stringify(state.room),oldHits=RoomArt.hits,oldReduced=settings.reduced;
      function cloth(id,t,weather='Sunny',reduced=false) {
        state.room.curtains=id;state.weather=weather;settings.reduced=reduced;
        const cv=document.createElement('canvas');cv.width=400;cv.height=340;
        const g=cv.getContext('2d');g.scale(5,5);RoomArt.drawCurtains(g,14,10,52,42,t);return cv;
      }
      function windowArt(id,t,weather='Sunny',reduced=true) {
        state.room.curtains=id;state.weather=weather;settings.reduced=reduced;
        const cv=document.createElement('canvas');cv.width=400;cv.height=340;
        const g=cv.getContext('2d');g.scale(5,5);g.translate(-212,-4);drawBackground(g);RoomArt.drawWindow(g,t);return cv;
      }
      try {
        for(const s of before) {
          if(ids.includes(s.id))continue;
          if(cloth(s.id,.5,'Sunny',true).toDataURL()!==s.art)throw Error('Unbatched option changed: '+s.id);
          for(const weather of ['Sunny','Windy']) {
            if(cloth(s.id,.5,weather,false).toDataURL()!==s.variants[weather])throw Error('Unbatched animation changed: '+s.id);
          }
        }
        for(const id of ids) {
          const a=cloth(id,0),b=cloth(id,2),wind=cloth(id,2,'Windy');
          const stillA=cloth(id,0,'Windy',true),stillB=cloth(id,3,'Windy',true);
          if(a.toDataURL()===b.toDataURL())throw Error('Curtain does not animate: '+id);
          if(b.toDataURL()===wind.toDataURL())throw Error('Wind has no effect: '+id);
          if(stillA.toDataURL()!==stillB.toDataURL())throw Error('Reduced-motion curtain moves: '+id);
          const rod=cv=>Array.from(cv.getContext('2d').getImageData(0,0,400,id==='blinds'?Math.floor((4+54*styles[id].rect[3]/styles[id].rect[2])*5):40).data).join(',');
          if(rod(a)!==rod(wind))throw Error('Mounting hardware moves: '+id);
          let transmission;
          if(id==='sheer') {
            const data=stillA.getContext('2d').getImageData(0,40,400,300).data;let cloth=0,translucent=0;
            for(let i=3;i<data.length;i+=4)if(data[i]>15){cloth++;if(data[i]<235)translucent++;}
            transmission=translucent/cloth;
            if(cloth<500||transmission<.9)throw Error('Sheer fabric is opaque');
          }
          const icon=document.createElement('canvas');drawStyleIcon(icon.getContext('2d'),icon,'curtains',id);
          if(icon.width!==320||icon.height!==272)throw Error('Store art dimensions wrong');
          checks.push({id,name:originals.get(id).name,price:originals.get(id).price,animated:true,wind:true,reducedMotion:true,fixedRod:true,store:true,...(transmission!==undefined?{translucentFraction:transmission}:{})});
        }
        const board=document.createElement('canvas');board.width=1120;board.height=880;
        const g=board.getContext('2d');g.fillStyle='#fbf5e8';g.fillRect(0,0,1120,880);
        g.fillStyle='#30442f';g.font='bold 29px Georgia';g.fillText('Bagseed / Curtains / Batch '+batch,30,43);
        g.font='17px Georgia';g.fillText(integrated?'Approved sets · Integrated room artwork, store previews and cloth movement':'Two sets for approval · Room artwork, store previews and cloth movement',30,75);
        ids.forEach((id,i)=>{
          const x=30+i*560;g.fillStyle='#30442f';g.font='bold 25px Georgia';g.fillText(originals.get(id).name,x,122);
          g.font='17px Georgia';g.fillText(styles[id].caption || (id==='basic'?'Included · warm terracotta cotton':'$20 · heavy midnight-blue fabric'),x,149);
          g.drawImage(windowArt(id,0),x,169,500,425);
          g.fillStyle='#30442f';g.font='18px Georgia';g.fillText('Store artwork',x,629);
          const icon=document.createElement('canvas');drawStyleIcon(icon.getContext('2d'),icon,'curtains',id);
          g.drawImage(icon,x,644,160,136);
          g.fillStyle='#30442f';g.font='18px Georgia';g.fillText('Wind animation poses',x+182,629);
          [0,1.2,2.4].forEach((t,j)=>{
            g.drawImage(windowArt(id,t,'Windy',false),x+178+j*112,650,108,92);
            g.font='14px Georgia';g.fillStyle='#526247';g.fillText(['0.0s','1.2s','2.4s'][j],x+212+j*112,764);
          });
        });
        g.font='17px Georgia';g.fillStyle='#526247';g.fillText(batch==='03'?'Cloth sway and a moving blind cord · stronger in wind · reduced motion stays still':'Gentle sway in calm weather · stronger in wind · still with reduced motion',30,831);
        g.font='15px Georgia';g.fillText(integrated?'Actual integrated game. The remaining curtain choices keep their existing artwork.':'Preview proposal only. The remaining curtain choices keep their existing artwork.',30,857);
        const frames=[];
        for(let i=0;i<42;i++) {
          const cv=document.createElement('canvas');cv.width=760;cv.height=355;const c=cv.getContext('2d');
          c.fillStyle='#fbf5e8';c.fillRect(0,0,760,355);c.fillStyle='#30442f';c.font='bold 21px Georgia';
          c.fillText(originals.get(ids[0]).name+' / windy',20,34);c.fillText(originals.get(ids[1]).name+' / windy',400,34);
          c.drawImage(windowArt(ids[0],i/12,'Windy',false),20,64,340,289);
          c.drawImage(windowArt(ids[1],i/12,'Windy',false),400,64,340,289);
          frames.push(cv.toDataURL());
        }
        return {board:board.toDataURL(),frames,checks,untouched:before.filter(s=>!ids.includes(s.id)).map(s=>s.id)};
      } finally {Object.assign(state.room,JSON.parse(oldRoom));RoomArt.hits=oldHits;settings.reduced=oldReduced;state.weather='Sunny';}
    },{before,integrated,ids,batch,styles:manifest.styles});
    const write=(name,data)=>fs.writeFileSync(path.join(out,name),Buffer.from(data.split(',')[1],'base64'));
    write('approval.png',result.board);
    const framesDir=path.join(root,'artifacts/curtains-batch-'+batch+'/frames');fs.mkdirSync(framesDir,{recursive:true});
    result.frames.forEach((data,i)=>fs.writeFileSync(path.join(framesDir,String(i).padStart(3,'0')+'.png'),Buffer.from(data.split(',')[1],'base64')));
    let liveMotion;
    if(batch==='03') {
      liveMotion=await require('./check-curtain-preview-motion.cjs')(page,manifest.styles);
      fs.writeFileSync(path.join(out,'live-motion.json'),JSON.stringify(liveMotion,null,2)+'\n');
    }
    await page.evaluate(()=>Panels.app('leafcart'));
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    const actualStoreCards=[];
    for(const id of ids.filter(id=>manifest.styles[id].price>0)) {
      const card=page.locator(`canvas[data-draw="style:curtains:${id}"]`);
      await card.waitFor();assert.deepEqual(await card.evaluate(cv=>[cv.width,cv.height]),[320,272]);
      const box=await card.boundingBox();assert.ok(Math.abs(box.width/box.height-320/272)<.01);
      await card.locator('..').screenshot({path:path.join(out,`store-${id}.png`)});
      await page.setViewportSize({width:390,height:844});await card.scrollIntoViewIfNeeded();
      const phoneBox=await card.boundingBox();assert.ok(Math.abs(phoneBox.width/phoneBox.height-320/272)<.01);
      await card.locator('..').screenshot({path:path.join(out,`store-${id}-phone.png`)});
      await page.setViewportSize({width:1440,height:1000});actualStoreCards.push(id);
    }
    assert.deepEqual(errors,[]);
    const report={proposalOnly:!integrated,entryPoint:'public/index.html',checks:result.checks,unchangedOptions:result.untouched,actualStoreCard:true,actualStoreCards,...(liveMotion?{liveMotion}:{}),errors};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  } finally {await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
