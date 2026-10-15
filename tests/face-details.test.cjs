const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/custom-details-v8');let browser,server,url;
before(async()=>{fs.mkdirSync(OUT,{recursive:true});const{createStaticServer}=await import('../tools/server.mjs'),app=createStaticServer();server=process.env.BAGSEED_DETAIL_TEST_HTML?http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.resolve(ROOT,process.env.BAGSEED_DETAIL_TEST_HTML)));}else app.emit('request',req,res);}):app;await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function inspect(name,fn){const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await page.goto(url);await page.evaluate(()=>BagseedArt.ready);const report=await page.evaluate(fn);fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(report,null,2)+'\n');assert.deepEqual(errors,[]);assert.deepEqual(report.failures,[]);return report;}finally{await page.close();}}

test('all mouth choices replace the native lips on every head shape and never mark the back',async()=>{
 const r=await inspect('mouth-placement',()=>{
  const faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],failures=[];let views=0;
  const read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  for(const face of faces)for(const dir of ['down','right','up','left']){
   const look=BagseedArt.normalize({face,hairS:'bald',hairC:'#4a2c1a',mouth:'default'}),base=read(BagseedArt.head(look,dir)),target={down:[96.5,173.5],right:[130,173.5],left:[61,173.5]}[dir];
   for(const[mouth]of MOUTHS115){const a=read(BagseedArt.head({...look,mouth},dir));let changed=0,sx=0,sy=0,outside=0;
    for(let at=0;at<a.length;at+=4)if([0,1,2,3].some(k=>a[at+k]!==base[at+k])){const x=at/4%192,y=Math.floor(at/4/192);changed++;sx+=x;sy+=y;if(target&&(Math.abs(x-target[0])>22||Math.abs(y-target[1])>13))outside++;}
    if(dir==='up'||mouth==='default'){if(changed)failures.push({face,dir,mouth,changed});}
    else if(!changed||outside||Math.abs(sx/changed-target[0])>7||Math.abs(sy/changed-target[1])>6)failures.push({face,dir,mouth,changed,outside,center:[sx/changed,sy/changed]});views++;
   }
  }return{views,failures};
 });assert.equal(r.views,1080);
});

test('individual ear studs follow the visible lobe for every ear option and head shape',async()=>{
 const r=await inspect('ear-jewelry-placement',()=>{
  const faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],failures=[];let views=0,visible=0,hidden=0;
  const read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  for(const face of faces)for(const[ears]of EARS115)for(const dir of ['down','right','up','left']){
   const look=BagseedArt.normalize({face,ears,hairS:'bald',pierce:[]}),baseHead=BagseedArt.head(look,dir),base=read(baseHead);
   for(const id of ['earL','earR']){const head=BagseedArt.head({...look,pierce:[id]},dir),a=read(head),ear=head.bagseedFeatures.ears.find(e=>e.id===id);let changed=0,far=0;
    for(let at=0;at<a.length;at+=4)if([0,1,2,3].some(k=>a[at+k]!==base[at+k])){changed++;const x=at/4%192,y=Math.floor(at/4/192);if(ear&&Math.hypot(x-ear.lobe[0],y-ear.lobe[1])>4)far++;}
    if(ear){visible++;if(!changed||far)failures.push({face,ears,dir,id,changed,far});}else {hidden++;if(changed)failures.push({face,ears,dir,id,changed,reason:'far/hidden ear has floating stud'});}views++;
   }
  }return{views,visible,hidden,failures};
 });assert.equal(r.views,1200);assert.ok(r.hidden>300);
});

test('hidden ears suppress all ear jewelry and facial details stay off the rear skull',async()=>{
 const r=await inspect('detail-visibility',()=>{
  const failures=[];let views=0;
  const read=c=>c.toDataURL();
  for(const face of ['soft','wide','long','petite'])for(const dir of ['down','right','up','left']){
   const look=BagseedArt.normalize({face,hairS:'bald',ears:'hidden',pierce:[],acc:'none'}),base=read(BagseedArt.head(look,dir));
   for(const pierce of [['earL'],['earR'],['hoops'],['double'],['industrial'],['tragus']]){if(read(BagseedArt.head({...look,pierce},dir))!==base)failures.push({face,dir,pierce});views++;}
   for(const acc of ['earring','moon']){if(read(BagseedArt.head({...look,acc},dir))!==base)failures.push({face,dir,acc});views++;}
  }
  const look=BagseedArt.normalize({hairS:'bald'}),back=read(BagseedArt.head(look,'up'));
  for(const patch of [...MOUTHS115.map(([mouth])=>({mouth})),...NOSES115.map(([nose])=>({nose})),...MARKS115.map(([id])=>({marks:[id]})),...['nose','nosering','septum','browL','browR','lip','labret','dimple','bridge'].map(id=>({pierce:[id]})),...['round','square','shades'].map(glasses=>({glasses}))]){if(read(BagseedArt.head({...look,...patch},'up'))!==back)failures.push({patch,reason:'face detail on rear'});views++;}
  return{views,failures};
 });assert.ok(r.views>180);
});

test('eye colors stay inside the native irises and removing brows leaves clean skin',async()=>{
 const r=await inspect('eye-brow-placement',()=>{
  const failures=[];let views=0;const read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  for(const skin of ['#5a3624','#cf9670','#f6d3b3'])for(const dir of ['down','right','left']){
   const look=BagseedArt.normalize({hairS:'bald',hairC:'#ffffff',skin}),h=BagseedArt.head(look,dir),base=read(h),f=h.bagseedFeatures;
   for(const eyeC of ['#348ac6','#3e9f7a']){const a=read(BagseedArt.head({...look,eyeC},dir));let changed=0,far=0;
    for(let at=0;at<a.length;at+=4)if([0,1,2,3].some(k=>a[at+k]!==base[at+k])){changed++;const x=at/4%192,y=Math.floor(at/4/192);if(!f.irises.some(([ix,iy])=>Math.abs(x-ix)<7&&Math.abs(y-iy)<8))far++;}
    if(changed<5||far)failures.push({skin,dir,eyeC,changed,far});views++;
   }
   const noBrow=read(BagseedArt.head({...look,brows:'none'},dir));for(const[x,y]of f.brows){let neutral=0;for(let yy=y-6;yy<y+8;yy++)for(let xx=x-12;xx<x+12;xx++){const n=(Math.round(yy)*192+Math.round(xx))*4;if(noBrow[n+3]>200&&noBrow[n]>100&&Math.abs(noBrow[n]-noBrow[n+1])<7&&Math.abs(noBrow[n+1]-noBrow[n+2])<7)neutral++;}if(neutral)failures.push({skin,dir,neutral,reason:'old silver brow fragments'});views++;}
  }return{views,failures};
 });assert.ok(r.views>=27);
});

test('iris color follows each eye opening when its height changes',async()=>{
 const r=await inspect('eye-style-colors',()=>{
  const failures=[];let views=0;
  const compact=new Set(['sleepy','hooded','monolid','narrow','heavy']),read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  for(const [eyes]of EYES)for(const dir of ['down','right','left']){
   const look=BagseedArt.normalize({hairS:'bald',eyes}),head=BagseedArt.head(look,dir),base=read(head),a=read(BagseedArt.head({...look,eyeC:'#348ac6'},dir));let changed=0,far=0;
   for(let at=0;at<a.length;at+=4)if([0,1,2].some(k=>a[at+k]!==base[at+k])){changed++;const x=at/4%192,y=Math.floor(at/4/192);if(!head.bagseedFeatures.irises.some(([ix,iy])=>Math.abs(x-ix)<7&&Math.abs(y-iy)<=(compact.has(eyes)?5:8)))far++;}
   if(changed<5||far)failures.push({eyes,dir,changed,far});views++;
  }return{views,failures};
 });assert.equal(r.views,45);
});

test('headphone cups follow the near ears in profile and both ears in front and back',async()=>{
 const r=await inspect('headphone-placement',()=>{
  const failures=[];let views=0;
  for(const face of ['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'])for(const ears of ['normal','large','hidden'])for(const dir of ['down','right','up','left']){
   const look=BagseedArt.normalize({face,ears,hairS:'bald',acc:'headphones',accC:'#c810c8'}),head=BagseedArt.head(look,dir),a=head.getContext('2d').getImageData(0,0,192,320).data,f=BagseedArt.landmarks({...look,ears:ears==='hidden'?'normal':ears},dir);let painted=0,far=0;
   for(let y=0;y<320;y++)for(let x=0;x<192;x++){const n=(y*192+x)*4;if(a[n+3]>180&&a[n]>150&&a[n+1]<70&&a[n+2]>150){painted++;if(!f.ears.some(e=>Math.abs(x-e.center[0])<8&&Math.abs(y-e.center[1])<14))far++;}}
   if(painted<70||far)failures.push({face,ears,dir,painted,far});views++;
  }return{views,failures};
 });assert.equal(r.views,180);
});

test('detail controls create a character and preserve its rendered face through save and reload',async()=>{
 const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url);await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=newGame]').click();
  for(const arg of ['mouth:teeth','ears:large','acc:earring'])await page.locator('[data-act=cr][data-arg="'+arg+'"]').click();
  for(const arg of ['pierce:nosering','marks:moleLip'])await page.locator('[data-act=crMulti][data-arg="'+arg+'"]').click();
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  const before=await page.evaluate(()=>{settings.speed=0;const look=playerLook();if(!SaveSys.now('face detail fixture'))throw Error('Save failed');return{mouth:look.mouth,ears:look.ears,acc:look.acc,pierce:look.pierce,marks:look.marks,heads:['down','right','up','left'].map(dir=>BagseedArt.head(BagseedArt.normalize(look),dir).toDataURL())};});
  await page.reload();await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game');
  const after=await page.evaluate(()=>{const look=playerLook();return{mouth:look.mouth,ears:look.ears,acc:look.acc,pierce:look.pierce,marks:look.marks,heads:['down','right','up','left'].map(dir=>BagseedArt.head(BagseedArt.normalize(look),dir).toDataURL())};});
  assert.equal(before.mouth,'teeth');assert.equal(before.ears,'large');assert.equal(before.acc,'earring');assert.ok(before.pierce.includes('nosering'));assert.ok(before.marks.includes('moleLip'));assert.deepEqual(after,before);assert.deepEqual(errors,[]);
 }finally{await page.close();}
});
