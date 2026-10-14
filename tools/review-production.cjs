const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createHash}=require('node:crypto');
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'review/final');
const fixtures=JSON.parse(fs.readFileSync(path.join(ROOT,'review/characters-v2/sources/baseline-assets.json')));
fixtures.sourceRoster=JSON.parse(fs.readFileSync(path.join(ROOT,'graphics/production/sources/roster-input.json')));
const save=(name,url)=>fs.writeFileSync(path.join(OUT,name),Buffer.from(url.split(',')[1],'base64'));
(async()=>{
 const buildSHA=hash(path.join(ROOT,'public/index.html'));
 fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(path.join(OUT,'frames'),{recursive:true});
 const {createStaticServer}=await import('./server.mjs');const app=createStaticServer();
 const server=http.createServer((req,res)=>{if(req.url==='/baseline.html'){res.writeHead(200,{'Content-Type':'text/html'});res.end(fs.readFileSync(path.join(ROOT,'baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html')));}else app.emit('request',req,res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'}),errors=[];
 async function start(page,route=''){
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base+route);if(!route)await page.evaluate(()=>BagseedArt.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Sam');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2200);
  await page.evaluate(()=>{settings.speed=0;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);state.tut.on=false;$('#tip').hidden=true;closePanel();document.activeElement?.blur();});
 }
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();await start(page);
  const result=await page.evaluate(async fixtures=>{
   const cv=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h}),load=src=>new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>{throw Error('Invalid review image')};im.src=typeof src==='string'?src:src.src;});
   const people=[...fixtures.people.map(p=>({id:p.id,name:p.name,look:p.look,aliases:[p.id]})),...BagseedArt.cast];
   const known=new Set(people.map(p=>BagseedArt.key({...p.look,expr:'neutral'})));
   const sourceLooks=[...fixtures.sourceRoster.map(p=>({source:p.source,look:{...p.look,...(p.kid?{short:true}:{})}})),...Object.entries(NPC_LOOK).map(([id,look])=>({source:'NPC_LOOK.'+id,look})),{source:'default player',look:fixtures.people[0].look}];
   const unmatched=sourceLooks.filter(p=>!known.has(BagseedArt.key({...p.look,expr:'neutral'}))).map(p=>p.source);
   if(unmatched.length)throw Error('Missing authored source appearances: '+unmatched.join(', '));
   const backgrounds=Object.fromEntries(await Promise.all(Object.entries(fixtures.backgrounds).map(async([id,b])=>[id,await load(b.src)])));
   const boards=[];
   for(const bg of ['grass','indoor','night']){
    Scene.place(fixtures.backgrounds[bg].sourceScene,'start');state.minute=fixtures.backgrounds[bg].minute;
    for(let offset=0;offset<people.length;offset+=12){
     const rows=people.slice(offset,offset+12),out=cv(760,60+rows.length*122),g=out.getContext('2d');g.fillStyle='#f4eddc';g.fillRect(0,0,out.width,out.height);g.fillStyle='#263b2e';g.font='bold 19px sans-serif';g.fillText('Bagseed • '+bg+' • authored appearances '+(offset+1)+'–'+(offset+rows.length),16,27);g.font='12px sans-serif';g.fillText('Native 32×36   |   four views at 3×   |   matching dialogue portrait',16,48);
     rows.forEach((p,index)=>{const y=60+index*122;g.fillStyle=index%2?'#e6dfcf':'#eee8d9';g.fillRect(0,y,760,122);g.fillStyle='#263b2e';g.font='bold 13px sans-serif';g.fillText(p.name,12,y+20);g.font='10px sans-serif';g.fillText(p.id,12,y+36);
      const scene=cv(128,76),s=scene.getContext('2d');s.drawImage(backgrounds[bg],0,0);drawPerson(s,64,66,p.look,1,{dir:'down'});if(bg==='night')lightTint(s,128,76,true);g.drawImage(scene,9,y+43,128,76);
      ['down','right','up','left'].forEach((dir,j)=>{const tile=cv(96,108),t=tile.getContext('2d');t.drawImage(charSprite(p.look,dir,0,0,0,0),0,0,96,108);if(bg==='night')lightTint(t,96,108,true);g.drawImage(tile,150+j*112,y+7,96,108);});g.drawImage(buildPortrait(p.look),624,y+7,108,108);
     });boards.push({name:`roster-${bg}-${1+offset/12}.png`,src:out.toDataURL()});
    }
   }
   const custom=cv(1000,760),cg=custom.getContext('2d');cg.fillStyle='#f4eddc';cg.fillRect(0,0,1000,760);cg.fillStyle='#263b2e';cg.font='bold 20px sans-serif';cg.fillText('Representative customization • all 16 skin palettes',18,28);
   const tops=['tee','tank','hoodie','flannel','sweater','cardigan','overalls','work','crop','jacket','garden','pjs','labcoat','suit','officer','tee'],bottoms=['jeans','shorts','joggers','skirt','cargo'];
   for(let n=0;n<16;n++){const L={...fixtures.people[0].look,skin:SKIN[n],hairS:HAIRS[(n*7)%60][0],hairC:HAIR_COLORS115[(n*3)%40][0],topS:tops[n],bottomS:bottoms[n%5],pres:['neutral','masc','fem'][n%3],body:['average','slim','broad','curvy','stocky','tall'][n%6],glasses:n%3===0?'round':'none',hat:n===14?'officer':'none'},x=n%4*250,y=48+Math.floor(n/4)*175;cg.drawImage(charSprite(L,'down'),x+15,y,96,108);cg.drawImage(buildPortrait(L),x+128,y+12,96,96);cg.font='12px sans-serif';cg.fillText(tops[n]+' / '+bottoms[n%5],x+15,y+131);cg.fillText(L.hairS+' • '+L.skin,x+15,y+149);}
   boards.push({name:'customization.png',src:custom.toDataURL()});
   const hair=cv(1000,1080),hg=hair.getContext('2d');hg.fillStyle='#f4eddc';hg.fillRect(0,0,1000,1080);hg.fillStyle='#263b2e';hg.font='bold 20px sans-serif';hg.fillText('All 60 authored hairstyles • integrated sprites',18,28);HAIRS.forEach(([hairS],n)=>{const x=n%10*100,y=44+Math.floor(n/10)*170;hg.drawImage(charSprite({...fixtures.people[0].look,hairS},'down'),x+2,y,96,108);hg.font='11px sans-serif';hg.fillText(hairS,x+5,y+127);});boards.push({name:'all-hairstyles.png',src:hair.toDataURL()});
   // Before/after uses the exact original exported sprite and the integrated renderer.
   const compare=cv(1000,720),g=compare.getContext('2d');g.fillStyle='#f4eddc';g.fillRect(0,0,1000,720);g.fillStyle='#263b2e';g.font='bold 24px sans-serif';g.fillText('Bagseed • original / integrated illustrated art',20,34);g.font='14px sans-serif';g.fillText('Same saved looks. Before is enlarged from the original native sprite; after uses the integrated renderer.',20,59);
   for(let i=0;i<fixtures.people.length;i++){const p=fixtures.people[i],x=i*200;g.fillStyle='#263b2e';g.font='bold 16px sans-serif';g.fillText(p.shortName,x+14,92);const old=await load(p.oldFrames.down[0]);g.imageSmoothingEnabled=false;g.drawImage(old,x+15,115,old.width*4,old.height*4);g.imageSmoothingEnabled=true;g.drawImage(charSprite(p.look,'down'),x+95,115,96,108);g.drawImage(await load(p.oldPortrait),x+10,270,80,80);g.drawImage(buildPortrait(p.look),x+102,270,90,90);g.font='12px sans-serif';g.fillText('before',x+20,250);g.fillText('after',x+120,250);['down','right','up','left'].forEach((dir,j)=>g.drawImage(charSprite(p.look,dir),x+10+j*45,391,44,50));
    const normal=charSprite(p.look,'down'),nose=buildNoseSprite1151(p.look,'down');g.drawImage(normal,x+8,490,96,108);g.drawImage(nose,x+100,490,96,108);g.fillText('standing / holding nose',x+20,622);
   }
   const frames=[];for(const motion of ['walk','idle'])for(let f=0;f<12;f++){const out=cv(900,180),g=out.getContext('2d');g.fillStyle='#e7ebd5';g.fillRect(0,0,900,180);g.fillStyle='#263b2e';g.font='16px sans-serif';g.fillText('Integrated '+motion+' • fixed feet and existing world scale',15,23);fixtures.people.forEach((p,j)=>{g.drawImage(charSprite(p.look,'down',motion==='walk'?f%4:0,motion==='idle'?Math.floor(f/3)%2:0,motion==='idle'&&f===8?1:0),j*180+40,44,96,108);g.fillText(p.shortName,j*180+40,174);});frames.push({name:'frames/'+motion+'-'+String(f).padStart(2,'0')+'.png',src:out.toDataURL()});}
   return {people,sourceCoverage:{sourceAppearances:sourceLooks.length,unmatched},boards,frames,comparison:compare.toDataURL()};
  },fixtures);
  for(const b of [...result.boards,...result.frames])save(b.name,b.src);save('before-after.png',result.comparison);fs.writeFileSync(path.join(OUT,'roster-coverage.json'),JSON.stringify(result.people,null,2)+'\n');
  const video=await page.evaluate(async()=>{
   const id=VIDEOS[0][0];Panels.trellisVideo(id);const s=Clip115.state(id);if(!s)throw Error('No playable Trellis media');Clip115.control(id,'play');const played=s.playing;Clip115.control(id,'loop');const loopDisabled=!s.loop;Clip115.control(id,'replay');const replay=s.time===0&&s.playing;
   const c=document.createElement('canvas');c.width=480;c.height=270;const ctx=c.getContext('2d');Clip115.draw(ctx,c,id,0);await new Promise(r=>setTimeout(r,150));Clip115.draw(ctx,c,id,0);const first=c.toDataURL();Clip115.draw(ctx,c,id,2.7);const second=c.toDataURL();closePanel();return {id,played,loopDisabled,replay,framesDiffer:first!==second,poster:second};
  });save('trellis-video.png',video.poster);delete video.poster;assert.ok(video.played&&video.loopDisabled&&video.replay&&video.framesDiffer);
  const scenes=[['bedroom','start',720],['park','start',720],['street','start',1260]];
  for(const [scene,spawn,minute]of scenes){
   for(const version of ['after','before']){const p=version==='after'?page:await context.newPage();if(version==='before')await start(p,'/baseline.html');await p.evaluate(({scene,spawn,minute,look})=>{Object.assign(state.player.look||state.player,look);Scene.place(scene,spawn);state.minute=minute;View.ensureWorld();RoomArt.hits=[];curScene().draw(View.wctx,runtime.t);View.snap();View.render();updateHUD();},{scene,spawn,minute,look:fixtures.people[0].look});await p.screenshot({path:path.join(OUT,scene+'-'+version+'.png')});if(version==='before')await p.close();}
  }
  const phone=[];for(const viewport of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await page.evaluate(()=>{Scene.place('bedroom','start');state.minute=720;View.ensureWorld();View.snap();View.render();updateHUD();});await page.screenshot({path:path.join(OUT,'phone-'+viewport.width+'x'+viewport.height+'.png')});phone.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:innerHeight})));}
  assert.ok(phone.every(p=>p.scrollWidth<=p.width));assert.deepEqual(errors,[]);
  assert.equal(hash(path.join(ROOT,'public/index.html')),buildSHA,'The game changed during capture');
  const report={buildSHA,capturedAt:new Date().toISOString(),appearanceVariants:result.people.length,sourceCoverage:result.sourceCoverage,rosterBoards:result.boards.map(b=>b.name),video,phone,browserErrors:errors,limitations:['Desktop Chromium and emulated viewport checks; no physical phone test.','Not a complete long-duration gameplay or plant-yield playtest.','Additional cast walking uses a limb rig on authored standing views; the five approved characters retain illustrated walk frames.']};fs.writeFileSync(path.join(OUT,'capture-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})();
