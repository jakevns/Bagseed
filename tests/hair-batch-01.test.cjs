const artPage=require('./helpers/art-page.cjs');
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/hair-batch-01');let browser,server,url;
before(async()=>{
 const{createStaticServer}=await import('../tools/server.mjs');server=createStaticServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function inspect(name,fn){const page=await artPage(browser,),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await page.goto(url);await page.evaluate(()=>BagseedArt.ready);const result=await page.evaluate(fn);fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(errors,[]);return result;}finally{await page.close();}}

test('five cuts preserve the selected ear artwork across all head and ear shapes',async()=>{
 const r=await inspect('ear-surfaces',()=>{
  const cuts=['short','buzz','crop','caesar','fade'],faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],failures=[];let views=0,earPixels=0;
  const read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  // The bald/hidden difference independently locates the actual selected ear
  // artwork, including the cartilage outline, rather than sampling its centre.
  for(const face of faces)for(const dir of ['down','right','up','left'])for(const[ears]of EARS115){
   if(ears==='hidden')continue;
   const look=BagseedArt.normalize({face,ears,hairS:'bald',hairC:'#7b32be',hat:'none',acc:'none',pierce:[]}),base=read(BagseedArt.head(look,dir)),hidden=read(BagseedArt.head({...look,ears:'hidden'},dir)),f=BagseedArt.landmarks(look,dir),mask=new Uint8Array(192*320),points=[];
   for(let y=110;y<195;y++)for(let x=20;x<173;x++){
    const n=(y*192+x)*4;
    if(base[n+3]>230&&Math.max(...[0,1,2,3].map(k=>Math.abs(base[n+k]-hidden[n+k])))>30&&f.ears.some(e=>Math.abs(x-e.center[0])<25&&Math.abs(y-e.center[1])<30))mask[y*192+x]=1;
   }
   // Exclude one antialiased boundary pixel; retain full interior/ink regions.
   for(let y=111;y<194;y++)for(let x=21;x<172;x++)if([-1,0,1].every(dy=>[-1,0,1].every(dx=>mask[(y+dy)*192+x+dx])))points.push((y*192+x)*4);
   // In profile a pointed ear's interior matches the underlying skin; its
   // thin ink outline, rather than a filled difference region, is the fixture.
   if(points.length<4)for(let y=110;y<195;y++)for(let x=20;x<173;x++)if(mask[y*192+x])points.push((y*192+x)*4);
   for(const hairS of cuts){const a=read(BagseedArt.head({...look,hairS},dir)),coordinates=[];let mismatches=0;
    for(const n of points)if(Math.max(...[0,1,2,3].map(k=>Math.abs(a[n+k]-base[n+k])))>20){mismatches++;if(coordinates.length<20)coordinates.push([n/4%192,Math.floor(n/4/192)]);}
    if(points.length<4||mismatches>Math.max(2,points.length*.035))failures.push({face,dir,ears,hairS,pixels:points.length,mismatches,coordinates});
    views++;earPixels+=points.length;
   }
  }return{views,earPixels,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,5)));assert.equal(r.views,2700);assert.ok(r.earPixels>20000);
});

test('rear hair covers the cranial surface down to the nape on every head shape',async()=>{
 const r=await inspect('rear-skull',()=>{
  const cuts=['short','buzz','crop','caesar','fade'],faces={soft:[1,1],round:[1.03,.98],angular:[.97,1.02],long:[.94,1.08],square:[1.06,.99],heart:[1.03,1],oval:[.97,1.03],diamond:[1.06,1.03],oblong:[.94,1.07],pear:[1.05,1.03],triangle:[1.06,1.02],wide:[1.12,.98],petite:[.92,.96],strong:[1.09,1.02],button:[.97,.94]},failures=[];let pixels=0,views=0;
  // Independent anatomical cross-sections; exclude ears, outline AA and neck.
  const rows=[[109,87,105],[115,75,118],[125,66,126],[137,63,130],[146,65,129],[157,70,124],[168,75,119],[177,82,112],[182,89,105]];
  for(const[face,[sx,sy]]of Object.entries(faces))for(const hairS of cuts){
   const look=BagseedArt.normalize({face,hairS,hairC:'#893bd0',skin:'#cf9670',ears:'normal',hat:'none'}),head=BagseedArt.head(look,'up').getContext('2d'),bare=BagseedArt.head({...look,hairS:'bald'},'up').getContext('2d');let exposed=0,samples=0;
   for(const[y,l,r]of rows)for(let x=l;x<=r;x+=2){const xx=Math.round(96+(x-96)*sx),yy=Math.round(199+(y-199)*sy),p=head.getImageData(xx,yy,1,1).data,b=bare.getImageData(xx,yy,1,1).data;if(b[3]<230)continue;
    if(p[3]<200||Math.max(...[0,1,2].map(k=>Math.abs(p[k]-b[k])))<25)exposed++;samples++;pixels++;
   }
   if(exposed)failures.push({face,hairS,exposed,samples});views++;
  }return{views,pixels,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,5)));assert.equal(r.views,75);
});

test('the fitted five-cut silhouettes retain the reviewed cel-shading appearance',async()=>{
 const page=await artPage(browser,);try{
  const fixture=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/hair-audit-cel-v1.json')));
  await page.goto(url);await page.evaluate(()=>BagseedArt.ready);const current=await page.evaluate(async()=>{
   const hashes={},selected=new Set(['bald','short','buzz','crop','caesar','fade']);let views=0;
   const sha=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',a))).map(v=>v.toString(16).padStart(2,'0')).join('');
   for(const[hairS]of HAIRS)if(selected.has(hairS)){let group='';for(const face of ['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'])for(const dir of ['down','right','up','left']){
    const c=BagseedArt.head(BagseedArt.normalize({hairS,face,hairC:'#c4c4c4'}),dir);group+=await sha(c.getContext('2d').getImageData(0,0,192,320).data);views++;
   }hashes[hairS]=await sha(new TextEncoder().encode(group));}return{views,hashes};
  });
  const failures=Object.keys(fixture.hashes).filter(k=>fixture.hashes[k]!==current.hashes[k]);fs.writeFileSync(path.join(OUT,'unchanged-styles.json'),JSON.stringify({views:current.views,failures},null,2)+'\n');assert.deepEqual(failures,[]);assert.equal(current.views,360);assert.deepEqual(Object.keys(current.hashes),Object.keys(fixture.hashes));
 }finally{await page.close();}
});

test('ear jewelry stays on the selected ears, and hidden ears have no floating jewelry',async()=>{
 const r=await inspect('ear-jewelry',()=>{
  const failures=[];let views=0;
  const read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  for(const hairS of ['short','buzz','crop','caesar','fade'])for(const face of ['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'])for(const ears of ['normal','small','large','elf','hidden'])for(const dir of ['down','right','up','left']){
   const look=BagseedArt.normalize({hairS,face,ears,hat:'none',pierce:[],acc:'none'}),base=read(BagseedArt.head(look,dir)),head=BagseedArt.head({...look,pierce:['hoops','industrial'],acc:'moon'},dir),a=read(head),f=head.bagseedFeatures;let changed=0,far=0;
    for(let n=0;n<a.length;n+=4)if(Math.max(...[0,1,2,3].map(k=>Math.abs(a[n+k]-base[n+k])))>15){changed++;const x=n/4%192,y=Math.floor(n/4/192);if(!f.ears.some(e=>Math.hypot(x-e.lobe[0],y-e.lobe[1])<10||Math.hypot(x-e.center[0],y-e.center[1])<15))far++;}
   if(ears==='hidden'?changed!==0:changed<5||far>0)failures.push({hairS,face,ears,dir,changed,far});views++;
  }return{views,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,5)));assert.equal(r.views,1500);
});

test('the five styles work in the creator and mirror and survive save/reload',async()=>{
 const page=await artPage(browser,{viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url);await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=newGame]').click();
  const creator=await page.evaluate(()=>{
   const cases=[['short','small','wide'],['buzz','large','long'],['crop','elf','petite'],['caesar','flat','strong'],['fade','normal','button']],frames=[];
   for(const[hairS,ears,face]of cases){Object.assign(runtime.cr,{hairS,ears,face,hairC:'#3e9f7a',glasses:'round',pierce:['hoops'],hat:'none'});drawCreatorPreview(0);frames.push(document.querySelector('#creatorPreview').toDataURL());}
   return frames;
  });assert.equal(new Set(creator).size,5);
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();ACT.wardrobe();ACT.wardTab('look');});
  const mirrored=await page.evaluate(()=>{const frames=[];for(const hairS of ['short','buzz','crop','caesar','fade']){ACT.wear('hairS:'+hairS);CharacterUI115.mirrorDraw();frames.push(document.querySelector('#panelBody canvas[data-draw="person"]').toDataURL());}return frames;});assert.equal(new Set(mirrored).size,5);
  const saved=await page.evaluate(()=>{const look=playerLook();if(!SaveSys.now('Five-cut ear-layer fixture'))throw Error('Save failed');return{look,heads:['down','right','up','left'].map(d=>BagseedArt.head(BagseedArt.normalize(look),d).toDataURL())};});
  await page.reload();await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game');
  const loaded=await page.evaluate(()=>{const look=playerLook();return{look,heads:['down','right','up','left'].map(d=>BagseedArt.head(BagseedArt.normalize(look),d).toDataURL())};});
  assert.deepEqual(loaded,saved);assert.equal(loaded.look.hairS,'fade');assert.deepEqual(errors,[]);
 }finally{await page.close();}
});
