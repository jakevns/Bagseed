const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
const {createHash}=require('node:crypto'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../../..'),OUT=path.resolve(__dirname,'..'),SHA='4889b1d5c14ee0b95085ed6ef208615e19598f2bf5a656604284f22085502164';
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pngURL=p=>'data:image/png;base64,'+fs.readFileSync(path.join(OUT,p)).toString('base64');
const saveURL=(file,src)=>fs.writeFileSync(file,Buffer.from(src.split(',')[1],'base64'));
const studies={
 'G03-P03':'Study the shape of the face and eyes, clean hair contours and separation between hair, neck and clothes. Use an individual Bagseed face rather than borrowing Celine’s identity.',
 'G03-P05':'Study expressive brows, a specific face silhouette and irregular curved hair sections. The character’s identity and costume are not imported.',
 'G03-P10':'Study a broad adult face, individual smile, facial-hair shapes and shoulders that support the character’s personality.',
 'G14-V01-F038':'Study the relaxed weight and bent limbs in a narrative pose. This is a timestamped publisher video frame, not a separate animation artist sheet.',
 'G15-S12':'Study an open, readable expression, changing cheeks and mouth shape, and a warm portrait that communicates personality at dialogue scale.',
 'G16-S19':'Study a broad natural smile, expressive eye shapes and a pose that feels like a particular person speaking.',
 'G23-D097':'Study organic flowing contours, grouped hair, well-observed hands and clothing folds. Retain Bagseed’s ordinary clothes, not the reference’s fantasy outfit.',
 'G23-D098':'Study a distinct broad silhouette, layered cloth, folds at joints, curved shapes and a pose supported by the whole body.',
 'G04-S15':'Study differences in age, facial structure and skin/clothing separation between residents rather than giving the cast one generic face.',
 'G24-S01':'Study how a compact character retains a readable silhouette, asymmetry and posture inside a detailed world.'
};
(async()=>{
  const workingSHA=hash(path.join(ROOT,'public/index.html'));assert.equal(hash(path.join(ROOT,'baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html')),SHA);
  const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline-assets.json'))),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'asset-manifest.json')));
  const people=baseline.people.map(person=>{
    const info=manifest.people[person.id];assert.equal(hash(path.join(OUT,info.source)),info.sourceSHA256,'Generated source changed');
    const art={walk:{},idle:{},portraits:{}};for(const dir of ['down','right','up','left']){art.walk[dir]=info.walk[dir].map(pngURL);art.idle[dir]=pngURL(info.idle[dir]);}for(const expression of ['neutral','friendly','concerned'])art.portraits[expression]=pngURL(info.portraits[expression]);return {...person,art};
  });
  const evidence=JSON.parse(fs.readFileSync(path.join(__dirname,'reference-selection.json'))).map(e=>({...e,study:studies[e.id],embedded:'data:image/jpeg;base64,'+fs.readFileSync(path.join(OUT,'assets',e.id+'.jpg')).toString('base64')}));
  const {createStaticServer}=await import(path.join(ROOT,'tools/server.mjs'));const game=createStaticServer();
  const server=http.createServer((req,res)=>{if(new URL(req.url,'http://localhost').pathname==='/__study2__'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(OUT,'index.html')));}else if(new URL(req.url,'http://localhost').pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(ROOT,'baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html')));}else game.emit('request',req,res);});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'}),errors=[];
  try{
    const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('[data-act="newGame"]').click();await p.locator('#crName').fill('Sam');await p.locator('[data-act="startGame"]').click();await p.waitForTimeout(2200);
    const night=await p.evaluate(()=>{
      settings.speed=0;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);state.tut.on=false;Scene.place('park','start');state.minute=1260;View.ensureWorld();
      const cv=document.createElement('canvas');cv.width=cv.height=1;const c=cv.getContext('2d',{willReadFrequently:true});
      const actual=rgb=>{c.clearRect(0,0,1,1);c.fillStyle='rgb('+rgb.join(',')+')';c.fillRect(0,0,1,1);lightTint(c,1,1,true);return [...c.getImageData(0,0,1,1).data].slice(0,3);};
      const table=Array.from({length:256},(_,i)=>actual([i,i,i]));const checks=[[50,160,220],[207,150,112],[63,127,191]].map(rgb=>({input:rgb,actual:actual(rgb),lookup:rgb.map((v,i)=>table[v][i])}));return {table,checks};
    });for(const check of night.checks)check.actual.forEach((v,i)=>assert.ok(Math.abs(v-check.lookup[i])<=1,'Night colors differ from the baseline shader'));await p.close();
    const data={people,evidence,backgrounds:baseline.backgrounds,displays:baseline.displays,nightChannels:night.table};
    const template=fs.readFileSync(path.join(__dirname,'template.html'),'utf8'),renderer=fs.readFileSync(path.join(__dirname,'asset-renderer.js'),'utf8'),preview=fs.readFileSync(path.join(__dirname,'preview.js'),'utf8');
    const html=template.replace('__ASSET_RENDERER__',()=>renderer).replace('__BUNDLE__',()=>JSON.stringify(data).replace(/</g,'\\u003c')).replace('__PREVIEW__',()=>preview);fs.writeFileSync(path.join(OUT,'index.html'),html);
    const review=await browser.newPage({viewport:{width:1280,height:1000}});review.on('pageerror',e=>errors.push(e.message));review.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await review.goto(base+'/__study2__?capture');const ready=await review.evaluate(()=>window.reviewReady);assert.deepEqual(ready,{people:5,directions:4,portraitExpressions:3,evidence:10});
    const frameStats=await review.evaluate(()=>{
      let walk=0,standing=0,portraits=0;const bounds=[];
      for(const person of STUDY.people){for(const dir of ['down','right','up','left']){
        const frames=[...person.frames[dir],person.standing[dir]];for(const [i,image]of frames.entries()){
          if(image.width!==96||image.height!==108)throw new Error('Unexpected sprite raster size');const cv=document.createElement('canvas');cv.width=96;cv.height=108;const c=cv.getContext('2d');c.drawImage(image,0,0);const d=c.getImageData(0,0,96,108).data;let minX=96,maxX=-1,minY=108,maxY=-1;
          for(let y=0;y<108;y++)for(let x=0;x<96;x++){if(d[(y*96+x)*4+3]>40){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
          if(minX<1||maxX>94||minY<1||maxY<100||maxY>107)throw new Error('Sprite anchor or crop failure: '+JSON.stringify({id:person.id,dir,i,minX,maxX,minY,maxY}));bounds.push({id:person.id,dir,frame:i,minX,maxX,minY,maxY});if(i<4)walk++;else standing++;
        }}for(const image of Object.values(person.portraits)){if(image.width!==192||image.height!==192)throw new Error('Portrait raster mismatch');portraits++;}}
      return {walk,standing,portraits,bounds};
    });assert.equal(frameStats.walk,80);assert.equal(frameStats.standing,20);assert.equal(frameStats.portraits,15);
    for(const bg of ['grass','indoor','night']){await review.evaluate(bg=>captureFrame(0,bg,'desktop','still'),bg);assert.ok(await review.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Desktop preview overflow');await review.screenshot({path:path.join(OUT,'comparison-'+bg+'.png'),fullPage:true});}
    await review.evaluate(()=>captureFrame(0,'grass','desktop','still'));await review.screenshot({path:path.join(OUT,'character-samples.png'),fullPage:true});
    await review.evaluate(()=>captureFrame(0,'grass','detail','still'));assert.ok(await review.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Enlarged preview overflow');await review.screenshot({path:path.join(OUT,'enlarged-inspection.png'),fullPage:true});
    await review.evaluate(()=>{captureFrame(0,'grass','desktop','still');document.body.classList.remove('capture');});await review.locator('#evidence').screenshot({path:path.join(OUT,'evidence-board.png')});
    fs.mkdirSync(path.join(OUT,'assets/animation-frames'),{recursive:true});
    for(const [motion,count]of [['walk',4],['idle',8]])for(let frame=0;frame<count;frame++){const src=await review.evaluate(({frame,motion})=>animationStrip(frame,motion,'grass'),{frame,motion});saveURL(path.join(OUT,`assets/animation-frames/${motion}-${String(frame).padStart(2,'0')}.png`),src);}
    assert.notDeepEqual(fs.readFileSync(path.join(OUT,'assets/animation-frames/walk-00.png')),fs.readFileSync(path.join(OUT,'assets/animation-frames/walk-01.png')),'Walk output is static');assert.notDeepEqual(fs.readFileSync(path.join(OUT,'assets/animation-frames/idle-00.png')),fs.readFileSync(path.join(OUT,'assets/animation-frames/idle-02.png')),'Breathing output is static');
    const layout=[];
    for(const [mode,viewport]of [['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
      const mobile=await browser.newPage({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:2});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base+'/__study2__?capture');await mobile.evaluate(()=>window.reviewReady);await mobile.evaluate(mode=>captureFrame(0,'grass',mode,'still'),mode);const fits=await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);assert.ok(fits,mode+' preview overflow');layout.push({mode,viewport,horizontalOverflow:false});await mobile.screenshot({path:path.join(OUT,'phone-'+mode+'.png'),fullPage:true,scale:'css'});
      if(mode==='portrait'){await mobile.selectOption('#display','detail');assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Phone enlarged layout overflow');await mobile.selectOption('#display','portrait');await mobile.selectOption('#background','night');await mobile.selectOption('#motion','walk');}
      await mobile.close();
    }
    assert.deepEqual(errors,[]);assert.equal(hash(path.join(ROOT,'public/index.html')),workingSHA);assert.equal(hash(path.join(ROOT,'baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html')),SHA);
    const result={status:'revised art samples awaiting user approval',baselineSHA256:SHA,baselineUnchanged:true,rejectedRendererUsed:false,preview:ready,walkFrames:frameStats.walk,standingViews:frameStats.standing,portraits:frameStats.portraits,layout,nightShaderChecks:night.checks,browserErrors:errors,limitations:['Original full-resolution reference hosts blocked; embedded DOCX images studied.','Illustrated asset prototype covers five identities only.','Idle is an upper-body breathing transform; blink variants and full production integration are not completed.','Generated walk cycles and asset crops were checked in preview, not a game integration or physical-device playtest.','Higher-density render target and wider transparent drawing canvas would be needed in the game; world feet/collision coordinates would be retained.']};fs.writeFileSync(path.join(OUT,'validation.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,nightShaderChecks:'3 mixed-color probes matched'},null,2));
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
