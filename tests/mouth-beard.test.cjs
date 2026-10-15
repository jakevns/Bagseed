const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/custom-beards-v9');let browser,server,url;
before(async()=>{fs.mkdirSync(OUT,{recursive:true});const{createStaticServer}=await import('../tools/server.mjs');server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function inspect(name,fn){const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await page.goto(url);await page.evaluate(()=>BagseedArt.ready);const report=await page.evaluate(fn);fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(report,null,2)+'\n');assert.deepEqual(report.failures,[]);assert.deepEqual(errors,[]);return report;}finally{await page.close();}}

test('all selected mouth silhouettes remain distinct at creator size with expressions enabled',async()=>{
 const r=await inspect('mouth-readability',()=>{const failures=[];let views=0;const counts=[];
  for(const expr of ['neutral','happy','sad'])for(const dir of ['down','right','left']){const seen=new Map();
   for(const [mouth]of MOUTHS115.filter(([id])=>id!=='default')){const c=document.createElement('canvas');c.width=38;c.height=64;c.getContext('2d').drawImage(BagseedArt.head(BagseedArt.normalize({hairS:'bald',mouth,expr}),dir),0,0,38,64);const fingerprint=c.toDataURL();if(seen.has(fingerprint))failures.push({expr,dir,mouth,sameAs:seen.get(fingerprint)});seen.set(fingerprint,mouth);views++;}counts.push({expr,dir,distinct:seen.size});
  }return{views,counts,failures};
 });assert.equal(r.views,153);assert.ok(r.counts.every(c=>c.distinct===17));
});

test('expressions preserve an explicitly selected mouth and Classic still responds',async()=>{
 const r=await inspect('mouth-expression-selection',()=>{const failures=[];let views=0;
  for(const [mouth]of MOUTHS115)for(const dir of ['down','right','left']){const look=BagseedArt.normalize({hairS:'bald',mouth}),read=h=>{const[x,y]=h.bagseedFeatures.mouth,w=dir==='down'?34:16;return [...h.getContext('2d').getImageData(Math.floor(x-w/2),Math.floor(y-5),w,15).data].join(',');},base=read(BagseedArt.head(look,dir));
   for(const expr of ['happy','grin','sad','angry','silly']){const current=read(BagseedArt.head({...look,expr},dir));if(mouth==='default'?current===base:current!==base)failures.push({mouth,dir,expr});views++;}
  }return{views,failures};
 });assert.equal(r.views,270);
});

test('moustaches leave ear cartilage intact and all beard styles leave the neck root intact',async()=>{
 const r=await inspect('beard-anatomy',()=>{const failures=[];let views=0;const faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  for(const face of faces)for(const dir of ['down','right','left']){const look=BagseedArt.normalize({hairS:'bald',hairC:'#ffffff',face}),head=BagseedArt.head(look,dir),base=read(head);
   for(const [facial]of FACIAL.filter(([id])=>id!=='none')){const a=read(BagseedArt.head({...look,facial},dir));let neck=0,ear=0;
    for(let y=198;y<205;y++)for(let x=75;x<117;x++){const n=(y*192+x)*4;if([0,1,2,3].some(k=>a[n+k]!==base[n+k]))neck++;}
    if(['mustache','pencil','handlebar'].includes(facial))for(const e of head.bagseedFeatures.ears)for(let y=Math.round(e.center[1]-4);y<=Math.round(e.center[1]+4);y++)for(let x=Math.round(e.center[0]-3);x<=Math.round(e.center[0]+3);x++){const n=(y*192+x)*4;if([0,1,2,3].some(k=>a[n+k]!==base[n+k]))ear++;}
    if(neck||ear)failures.push({face,dir,facial,neck,ear});views++;
   }
  }return{views,failures};
 });assert.equal(r.views,630);
});

test('new mouth styles and cleaned beards work through creator, wardrobe and save/reload',async()=>{
 const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url);await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=newGame]').click();
  for(const arg of ['mouth:braces','expr:happy','facial:beard'])await page.locator('[data-act=cr][data-arg="'+arg+'"]').click();
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  const before=await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);$('#tip').hidden=true;closePanel();const look=playerLook();if(!SaveSys.now('Mouth/beard fixture'))throw Error('Save failed');return{mouth:look.mouth,expr:look.expr,facial:look.facial};});assert.deepEqual(before,{mouth:'braces',expr:'happy',facial:'beard'});
  await page.reload();await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game');
  assert.deepEqual(await page.evaluate(()=>{const L=playerLook();return{mouth:L.mouth,expr:L.expr,facial:L.facial};}),before);
  await page.evaluate(()=>{closePanel();ACT.wardrobe();ACT.wardTab('look');});
  for(const arg of ['mouth:fangs','facial:mutton'])await page.locator('[data-act=wear][data-arg="'+arg+'"]').click();
  const expected=await page.evaluate(()=>{const L=playerLook();if(!SaveSys.now('Wardrobe mouth/beard fixture'))throw Error('Save failed');return{mouth:L.mouth,facial:L.facial,head:BagseedArt.head(BagseedArt.normalize(L),'down').toDataURL()};});assert.equal(expected.mouth,'fangs');assert.equal(expected.facial,'mutton');
  await page.reload();await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game');
  assert.deepEqual(await page.evaluate(()=>{const L=playerLook();return{mouth:L.mouth,facial:L.facial,head:BagseedArt.head(BagseedArt.normalize(L),'down').toDataURL()};}),expected);assert.deepEqual(errors,[]);
 }finally{await page.close();}
});
