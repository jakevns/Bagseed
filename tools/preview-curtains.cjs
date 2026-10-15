/* Proposal-only capture: load public/index.html, then inject the pending art in this browser. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const root=path.resolve(__dirname,'..'),out=path.join(root,'review/curtains-batch-01');
  fs.mkdirSync(out,{recursive:true});
  const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.evaluate(()=>Promise.all([BagseedArt.ready,BagseedBedroom.ready,BagseedBeds.ready,BagseedDesks.ready]));
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Curtain Review');
    await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    const before=await page.evaluate(()=>{
      settings.speed=0;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();
      runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();state.weather='Sunny';state.minute=720;
      settings.reduced=true;
      return STYLES.curtains.map(([id,name,price])=>{
        state.room.curtains=id;const cv=document.createElement('canvas');cv.width=400;cv.height=340;
        const g=cv.getContext('2d');g.scale(5,5);RoomArt.drawCurtains(g,14,10,52,42,.5);
        return {id,name,price,art:cv.toDataURL()};
      });
    });
    const tag=require('./compile-curtains.cjs')();
    await page.addScriptTag({content:tag.replace(/^<script[^>]*>\n/,'').replace(/<\/script>\n$/,'')});
    await page.evaluate(()=>BagseedCurtains.ready);
    const result=await page.evaluate(before=>{
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
          if(s.id==='basic'||s.id==='blackout')continue;
          if(cloth(s.id,.5,'Sunny',true).toDataURL()!==s.art)throw Error('Unbatched option changed: '+s.id);
        }
        for(const id of ['basic','blackout']) {
          const a=cloth(id,0),b=cloth(id,2),wind=cloth(id,2,'Windy');
          const stillA=cloth(id,0,'Windy',true),stillB=cloth(id,3,'Windy',true);
          if(a.toDataURL()===b.toDataURL())throw Error('Curtain does not animate: '+id);
          if(b.toDataURL()===wind.toDataURL())throw Error('Wind has no effect: '+id);
          if(stillA.toDataURL()!==stillB.toDataURL())throw Error('Reduced-motion curtain moves: '+id);
          const rod=cv=>Array.from(cv.getContext('2d').getImageData(0,0,400,40).data).join(',');
          if(rod(a)!==rod(wind))throw Error('Mounting hardware moves: '+id);
          const icon=document.createElement('canvas');drawStyleIcon(icon.getContext('2d'),icon,'curtains',id);
          if(icon.width!==320||icon.height!==272)throw Error('Store art dimensions wrong');
          checks.push({id,name:originals.get(id).name,price:originals.get(id).price,animated:true,wind:true,reducedMotion:true,fixedRod:true,store:true});
        }
        const board=document.createElement('canvas');board.width=1120;board.height=880;
        const g=board.getContext('2d');g.fillStyle='#fbf5e8';g.fillRect(0,0,1120,880);
        g.fillStyle='#30442f';g.font='bold 29px Georgia';g.fillText('Bagseed / Curtains / Batch 01',30,43);
        g.font='17px Georgia';g.fillText('Two sets for approval · Room artwork, store previews and cloth movement',30,75);
        ['basic','blackout'].forEach((id,i)=>{
          const x=30+i*560;g.fillStyle='#30442f';g.font='bold 25px Georgia';g.fillText(originals.get(id).name,x,122);
          g.font='17px Georgia';g.fillText(id==='basic'?'Included · warm terracotta cotton':'$20 · heavy midnight-blue fabric',x,149);
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
        g.font='17px Georgia';g.fillStyle='#526247';g.fillText('Gentle sway in calm weather · stronger in wind · still with reduced motion',30,831);
        g.font='15px Georgia';g.fillText('Preview proposal only. The remaining curtain choices keep their existing artwork.',30,857);
        const frames=[];
        for(let i=0;i<42;i++) {
          const cv=document.createElement('canvas');cv.width=760;cv.height=355;const c=cv.getContext('2d');
          c.fillStyle='#fbf5e8';c.fillRect(0,0,760,355);c.fillStyle='#30442f';c.font='bold 21px Georgia';
          c.fillText('Basic / windy cloth',20,34);c.fillText('Blackout / windy cloth',400,34);
          c.drawImage(windowArt('basic',i/12,'Windy',false),20,64,340,289);
          c.drawImage(windowArt('blackout',i/12,'Windy',false),400,64,340,289);
          frames.push(cv.toDataURL());
        }
        return {board:board.toDataURL(),frames,checks,untouched:before.filter(s=>!['basic','blackout'].includes(s.id)).map(s=>s.id)};
      } finally {Object.assign(state.room,JSON.parse(oldRoom));RoomArt.hits=oldHits;settings.reduced=oldReduced;state.weather='Sunny';}
    },before);
    const write=(name,data)=>fs.writeFileSync(path.join(out,name),Buffer.from(data.split(',')[1],'base64'));
    write('approval.png',result.board);
    const framesDir=path.join(root,'artifacts/curtains-batch-01/frames');fs.mkdirSync(framesDir,{recursive:true});
    result.frames.forEach((data,i)=>fs.writeFileSync(path.join(framesDir,String(i).padStart(3,'0')+'.png'),Buffer.from(data.split(',')[1],'base64')));
    await page.evaluate(()=>{state.room.curtains='blackout';Panels.app('leafcart');});
    await page.locator('[data-act=shopCat][data-arg=decor]').click();await page.locator('[data-act=decorCat][data-arg=styles]').click();
    const card=page.locator('canvas[data-draw="style:curtains:blackout"]');
    await card.waitFor();assert.deepEqual(await card.evaluate(cv=>[cv.width,cv.height]),[320,272]);
    const box=await card.boundingBox();assert.ok(Math.abs(box.width/box.height-320/272)<.01);
    await card.locator('..').screenshot({path:path.join(out,'store-blackout.png')});
    assert.deepEqual(errors,[]);
    const report={proposalOnly:true,entryPoint:'public/index.html',checks:result.checks,unchangedOptions:result.untouched,actualStoreCard:true,errors};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  } finally {await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
