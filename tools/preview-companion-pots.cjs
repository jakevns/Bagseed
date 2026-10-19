const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'review/companion-pots'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),data=JSON.parse(fs.readFileSync(path.join(dir,'sources/manifest.json'))),renderer=fs.readFileSync(path.join(dir,'sources/renderer.js'),'utf8').replace('__BAGSEED_COMPANION_POTS_DATA__',()=>JSON.stringify(data));
const nativeBody=fs.readFileSync(path.join(root,'src/game.html'),'utf8').match(/const Companion = \{[\s\S]*?draw\(c, loc, t\) \{([\s\S]*?)\n  \}\n\};/)[1],nativeDraw='function(c,loc,t){'+nativeBody+'}';
(async()=>{
 assert.equal(sha(fs.readFileSync(path.join(dir,'assets/pot.png'))),data.sourceSHA256);assert.equal(sha(fs.readFileSync(path.join(dir,'assets/pot.webp'))),data.runtimeSHA256);
 const htmlSHA=sha(fs.readFileSync(path.join(root,'public/index.html'))),{createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('../tests/helpers/art-page.cjs')(browser,{viewport:{width:1400,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/companion-pot-review/**',route=>route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(dir,'assets/pot.webp'))}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Companion pot review');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const before=await page.evaluate(nativeDraw=>{
   settings.speed=0;settings.reduced=true;state.minute=720;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();state.flags.growroom=true;
   window.oldCompanionDraw=(0,eval)('('+nativeDraw+')');window.companionLocs=['closet','tent2','tent4','tent5'];window.companionIds=['P058','P056','P055','P053','P052'];
   companionLocs.forEach((loc,l)=>{const L=state.locations[loc];L.owned=true;L.door='open';Object.assign(L.equip,{pot:2,light:2,fan:2,exhaust:1});L.slots.fill(null);GrowPotGarden.arr(loc).fill(null);GP.pots()[loc].forEach((_,i)=>{const p=GP.newPlant(companionIds[(i+l)%5],{kind:'pot',ref:loc});p.age=GP.sp(p.sp).days;p.water=65;GP.pots()[loc][i]=p.gid;});});
   const cv=document.createElement('canvas');cv.width=cv.height=300;const c=cv.getContext('2d');c.translate(150,100);c.scale(10,10);BagseedWaterPots.potSprite(c,0,0,2,60);window.originalMainPot=cv.toDataURL();state.mess=[];state.room.placed=[];state.scene='growroom';curScene().draw(c,0);curScene().draw(c,0);state.scene='bedroom';curScene().draw(c,0);
   return companionLocs.map(loc=>{RoomArt.hits=[];oldCompanionDraw.call(Companion,c,loc,0);return{loc,points:GP.pots()[loc].map((_,i)=>Companion.potXY(loc,i)),hits:RoomArt.hits.map(h=>JSON.parse(JSON.stringify(h)))};});
  },nativeDraw);
  await page.addScriptTag({content:renderer});await page.evaluate(()=>BagseedCompanionPots.ready);
  const result=await page.evaluate(before=>{
   const check=(v,m)=>{if(!v)throw Error(m);},api=BagseedCompanionPots,files={};
   
   function canvas(w,h){const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;}
   function board(w,h,title,sub){const cv=canvas(w,h),c=cv.getContext('2d');c.fillStyle='#f5efdf';c.fillRect(0,0,w,h);c.fillStyle='#294c3d';c.font='bold 30px Georgia';c.fillText(title,26,43);c.font='18px Georgia';c.fillText(sub,26,74);return{cv,c};}
   function side(c,loc,index,x,y,scale,t=0,old=false){const arr=GP.pots()[loc],keep=arr.slice(),gid=arr[index],[px,py]=Companion.potXY(loc,index);arr.fill(null);arr[index]=gid;c.save();c.translate(x,y);c.scale(scale,scale);c.translate(-px,-py+4);try{(old?oldCompanionDraw:Companion.draw).call(Companion,c,loc,t);}finally{c.restore();arr.splice(0,arr.length,...keep);}}
   const c=canvas(400,400).getContext('2d');let positions=0,targets=0;
   for(const b of before){RoomArt.hits=[];Companion.draw(c,b.loc,0);check(JSON.stringify(GP.pots()[b.loc].map((_,i)=>Companion.potXY(b.loc,i)))===JSON.stringify(b.points),'Pot positions moved');check(JSON.stringify(RoomArt.hits)===JSON.stringify(b.hits),'Care targets changed');positions+=b.points.length;targets+=RoomArt.hits.length;}
   // A real Companion.draw invocation must paint foliage above the opening,
   // and hide an intentionally overlong stem behind the near rim/body.
   const cv=canvas(400,400),ctx=cv.getContext('2d'),[px,py]=Companion.potXY('closet',0),original=GPArt.draw;
   GPArt.draw=function(c,id,stage,x,y){c.fillStyle='#ff00d4';c.fillRect(x-.25,y-4,.5,9);};
   try{ctx.translate(200,200);ctx.scale(30,30);ctx.translate(-px,-py+4);Companion.draw(ctx,'closet',0);}finally{GPArt.draw=original;}
   const above=ctx.getImageData(200,140,1,1).data,body=ctx.getImageData(200,275,1,1).data;
   check(above[0]>200&&above[2]>150&&above[1]<20,'Back pot hides foliage');check(!(body[0]>200&&body[2]>150&&body[1]<20),'Stem leaks through pot front');
   const main=canvas(300,300),mc=main.getContext('2d');mc.translate(150,100);mc.scale(10,10);BagseedWaterPots.potSprite(mc,0,0,2,60);check(main.toDataURL()===originalMainPot,'Main pots changed');
   const showcase=board(1800,850,'BAGSEED / companion pot refresh','Warm terracotta / rolled clay rim / tiny brass leaf tag / the same plants and pot positions');
   for(let i=0;i<6;i++){const x=i*300+150;showcase.c.fillStyle='#e2e7d2';showcase.c.fillRect(i*300+8,105,284,725);if(i===0){showcase.c.save();showcase.c.translate(x,495);showcase.c.scale(22,22);api.drawPot(showcase.c,0,0);showcase.c.restore();}else{const loc='closet',arr=GP.pots()[loc],old=arr[0],p=GP.newPlant(companionIds[i-1],{kind:'pot',ref:loc});p.age=GP.sp(p.sp).days;p.water=65;arr[0]=p.gid;side(showcase.c,loc,0,x,495,22);arr[0]=old;GP.remove(p.gid);}showcase.c.fillStyle='#294c3d';showcase.c.font='bold 22px Georgia';showcase.c.textAlign='center';showcase.c.fillText(i===0?'Empty companion pot':GP.sp(companionIds[i-1]).name,x,145);showcase.c.font='17px Georgia';showcase.c.fillText(i===0?'Same shared side-pot design':'Painted herb + layered rim',x,785);}
   files['approval.png']=showcase.cv.toDataURL();
   const compare=board(1000,620,'BAGSEED / companion pot before and after','The original small side-pot footprint, refreshed to match the illustrated plants');const a=GP.pots().closet,old=a[0];a[0]=null;side(compare.c,'closet',0,250,260,36,0,true);side(compare.c,'closet',0,750,260,36);a[0]=old;compare.c.textAlign='center';compare.c.font='bold 24px Georgia';compare.c.fillText('Current',250,535);compare.c.fillText('Proposed',750,535);files['before-after.png']=compare.cv.toDataURL();
   const empty=canvas(320,270);api.icon(empty);files['pot-icon.png']=empty.toDataURL();
   const scenes=board(1920,650,'BAGSEED / native tent placements','Starter / 2×2 / 4×4 / 5×5 — unchanged pot positions, capacities and care targets');
   for(const [i,room] of ['bedroom','growroom'].entries()){state.scene=room;const cv=canvas((room==='bedroom'?480:448)*4,(room==='bedroom'?180:200)*4),c=cv.getContext('2d');c.scale(4,4);RoomArt.hits=[];curScene().draw(c,0);scenes.c.drawImage(cv,20+i*950,125,920,room==='bedroom'?345:920*200/448);scenes.c.fillStyle='#294c3d';scenes.c.font='bold 22px Georgia';scenes.c.fillText(room==='bedroom'?'Bedroom / starter and 2×2':'Grow room / 4×4 and 5×5',45+i*950,605);}
   files['tent-placements.png']=scenes.cv.toDataURL();
   // Save data created for the showcase is deliberately cleaned up. Drawing
   // itself must remain read-only; compare the real fixtures in isolation.
   const stable=JSON.stringify([state.plants,state.locations,state.v115]);
   for(const loc of companionLocs)Companion.draw(c,loc,2);
   check(stable===JSON.stringify([state.plants,state.locations,state.v115]),'Drawing changed saved state');
   let stageRenders=0;GP.build();const eligible=Object.values(GP._sp).filter(sp=>GP.canPlant(sp,{kind:'pot',ref:'closet'}).ok),arr=GP.pots().closet,keep=arr[0];
   for(const sp of eligible){const p=GP.newPlant(sp.id,{kind:'pot',ref:'closet'});arr[0]=p.gid;for(const f of [0,.2,.65,1]){p.age=sp.days*f;Companion.draw(c,'closet',1);stageRenders++;}GP.remove(p.gid);}arr[0]=keep;
   window.companionWindFrame=function(frame){const b=board(1500,740,'BAGSEED / companion pots and gentle wind','Fixed soil attachments / existing herb animation / layered clay rims');settings.reduced=false;companionIds.forEach((id,i)=>{const arr=GP.pots().closet,old=arr[0],p=GP.newPlant(id,{kind:'pot',ref:'closet'});p.age=GP.sp(id).days;arr[0]=p.gid;side(b.c,'closet',0,i*300+150,460,22,frame/12);arr[0]=old;GP.remove(p.gid);b.c.fillStyle='#294c3d';b.c.font='bold 22px Georgia';b.c.textAlign='center';b.c.fillText(GP.sp(id).name,i*300+150,685);});return b.cv.toDataURL();};
   SaveSys.now('Companion pot draft review');return{files,positions,targets,layerOcclusion:true,mainPotsUnchanged:true,readOnly:true,eligibleSpecies:eligible.length,stageRenders};
  },before);
  for(const [name,url] of Object.entries(result.files))fs.writeFileSync(path.join(dir,name),Buffer.from(url.split(',')[1],'base64'));delete result.files;
  const frames=fs.mkdtempSync('/tmp/companion-wind-');try{for(let f=0;f<72;f++){const url=await page.evaluate(f=>companionWindFrame(f),f);fs.writeFileSync(path.join(frames,String(f).padStart(3,'0')+'.png'),Buffer.from(url.split(',')[1],'base64'));}execFileSync('ffmpeg',['-y','-loglevel','error','-framerate','12','-i',frames+'/%03d.png','-c:v','libx264','-pix_fmt','yuv420p','-crf','20',path.join(dir,'wind.mp4')]);}finally{fs.rmSync(frames,{recursive:true,force:true});}
  await page.reload();await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);await page.addScriptTag({content:renderer});await page.evaluate(()=>BagseedCompanionPots.ready);assert.equal(await page.evaluate(()=>['closet','tent2','tent4','tent5'].every(loc=>GP.pots()[loc].every(g=>g&&GP.plant(g)))),true);
  assert.deepEqual(errors,[]);assert.equal(sha(fs.readFileSync(path.join(root,'public/index.html'))),htmlSHA);assert.equal(result.positions,8);assert.equal(result.targets,8);fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify({...result,saveReload:true,publishedHTMLUnchanged:true,publishedHTMLSHA256:htmlSHA,productionRenderer:false,animation:{frames:72,fps:12,seconds:6},errors},null,2)+'\n');console.log('Companion pot native placement, layers, care targets, all crop stages and save checks passed.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
