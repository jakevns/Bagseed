const artPage=require('./helpers/art-page.cjs');
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/hair-all-v12');let browser,server,url;
before(async()=>{fs.mkdirSync(OUT,{recursive:true});const{createStaticServer}=await import('../tools/server.mjs');server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function inspect(name,fn,arg){const page=await artPage(browser,),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await page.goto(url);await page.evaluate(()=>BagseedArt.ready);const result=await page.evaluate(fn,arg);fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(errors,[]);return result;}finally{await page.close();}}

test('remaining exposed-ear hairstyles preserve selected ears across every head and ear shape',async()=>{
 const r=await inspect('ear-surfaces',()=>{
  const accepted=new Set(['bald','short','buzz','crop','caesar','fade','medium','long','bob','curly','wavy','locs','afro','curtains','angledbob','asymbob','braidbob','lob','shag','wolf','curlybob','twistout','halfup','layered','bluntlong','beachwaves','longcurls','boxbraids','longtwists','bigafro']),cuts=HAIRS.filter(([id])=>!accepted.has(id)).map(([id])=>id),faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],failures=[];let views=0,earPixels=0;
  const read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  for(const face of faces)for(const dir of ['down','right','up','left'])for(const[ears]of EARS115){
   if(ears==='hidden')continue;
   const look=BagseedArt.normalize({face,ears,hairS:'bald',hairC:'#7b32be',hat:'none',acc:'none',pierce:[]}),base=read(BagseedArt.head(look,dir)),hidden=read(BagseedArt.head({...look,ears:'hidden'},dir)),f=BagseedArt.landmarks(look,dir),mask=new Uint8Array(192*320),points=[];
   for(let y=110;y<195;y++)for(let x=20;x<173;x++){const n=(y*192+x)*4;if(base[n+3]>230&&Math.max(...[0,1,2,3].map(k=>Math.abs(base[n+k]-hidden[n+k])))>30&&f.ears.some(e=>Math.abs(x-e.center[0])<25&&Math.abs(y-e.center[1])<30))mask[y*192+x]=1;}
   for(let y=111;y<194;y++)for(let x=21;x<172;x++)if([-1,0,1].every(dy=>[-1,0,1].every(dx=>mask[(y+dy)*192+x+dx])))points.push((y*192+x)*4);
   if(points.length<4)for(let y=110;y<195;y++)for(let x=20;x<173;x++)if(mask[y*192+x])points.push((y*192+x)*4);
   for(const hairS of cuts){const a=read(BagseedArt.head({...look,hairS},dir));let mismatches=0;for(const n of points)if(Math.max(...[0,1,2,3].map(k=>Math.abs(a[n+k]-base[n+k])))>20)mismatches++;
    if(points.length<4||mismatches>Math.max(2,points.length*.035))failures.push({face,dir,ears,hairS,pixels:points.length,mismatches});views++;earPixels+=points.length;
   }
  }return{views,earPixels,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,5)));assert.equal(r.views,16740);
});

test('long and tied hair has a smaller crown while keeping complete loose ends',async()=>{
 const baseline=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/hair-all-v11.json'))).measurements;
 const r=await inspect('size-and-length',baseline=>{
  const cuts=['long','bob','curly','wavy','bun','ponytail','braids','locs','angledbob','asymbob','braidbob','lob','curlybob','halfup','ponyhi','sidepony','spacebuns','topknot','puff','puffs','crownbraid','lowbun','layered','bluntlong','beachwaves','longcurls','twinbraids','boxbraids','longtwists','loosebraid'],failures=[],measurements=[];
  for(const hairS of cuts)for(const dir of ['down','right','up','left']){
   const a=BagseedArt.hairLayer(BagseedArt.normalize({hairS,hairC:'#ffffff',hat:'none'}),dir).getContext('2d').getImageData(0,0,192,320).data;let left=192,right=-1,top=320,bottom=-1,crown=0;
   for(let y=0;y<320;y++)for(let x=0;x<192;x++)if(a[(y*192+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);if(y<143)crown++;}
   const old=baseline[hairS+'/'+dir],row={hairS,dir,width:right-left+1,crown,oldWidth:old.width,oldCrown:old.crown,bottom,oldBottom:old.bottom};measurements.push(row);
   if(dir!=='up'&&crown>old.crown*.98)failures.push({...row,reason:'crown not reduced'});
   if(bottom<old.bottom-2)failures.push({...row,reason:'loose ends were shortened'});
   if(left<2||right>189||top<2||bottom>315)failures.push({...row,reason:'canvas crop'});
  }return{views:measurements.length,measurements,failures};
 },baseline);assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,10)));assert.equal(r.views,120);
});

test('full rear caps cover the skull and preserve narrow natural partings',async()=>{
 const r=await inspect('rear-coverage',()=>{
  const faded=new Set(['fade','hightop','flattop','quiff','pomp','fauxhawk','curlytop']),bare=new Set(['bald','balding','mohawk','sidecut','cornrows']),cuts=HAIRS.filter(([id])=>!bare.has(id)).map(([id])=>id),failures=[],measurements=[];
  const read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  const base=read(BagseedArt.head(BagseedArt.normalize({hairS:'bald',ears:'hidden'}),'up'));
  for(const hairS of cuts){const hair=read(BagseedArt.hairLayer(BagseedArt.normalize({hairS,ears:'hidden',hairC:'#ffffff',hat:'none'}),'up'));let samples=0,exposed=0;const coordinates=[];
   for(let y=106;y<=180;y++)for(let x=40;x<153;x++){
    if(base[(y*192+x)*4+3]<240||[-2,2].some(dx=>base[(y*192+x+dx)*4+3]<240))continue;
    let covered=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(hair[((y+dy)*192+x+dx)*4+3]>(hairS==='buzz'?8:faded.has(hairS)&&y>=133?5:170))covered=true;
    samples++;if(!covered){exposed++;if(coordinates.length<15)coordinates.push([x,y]);}
   }
   measurements.push({hairS,samples,exposed});if(exposed>samples*.015)failures.push({hairS,samples,exposed,coordinates});
  }return{views:cuts.length,measurements,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,10)));assert.equal(r.views,56);
});

test('all remaining cuts work through creator and mirror controls, with a saved long-haired character',async()=>{
 const page=await artPage(browser,{viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url);await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=newGame]').click();
  const creator=await page.evaluate(()=>{
   const accepted=new Set(['bald','short','buzz','crop','caesar','fade']),cuts=HAIRS.filter(([id])=>!accepted.has(id)).map(([id])=>id),failures=[],frames=[];
   Object.assign(runtime.cr,{pres:'fem',face:'heart',ears:'small',hairC:'#a7c7d7',facial:'none',hat:'none',glasses:'round',pierce:['hoops']});
   for(const hairS of cuts){ACT.cr('hairS:'+hairS);drawCreatorPreview(0);if(creatorLook(runtime.cr).hairS!==hairS)failures.push(hairS);frames.push(document.querySelector('#creatorPreview').toDataURL());}
   ACT.cr('hairS:long');return{views:cuts.length,unique:new Set(frames).size,failures};
  });assert.deepEqual(creator.failures,[]);assert.equal(creator.views,55);assert.equal(creator.unique,55);
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();ACT.wardrobe();ACT.wardTab('look');});
  const mirrored=await page.evaluate(()=>{
   const accepted=new Set(['bald','short','buzz','crop','caesar','fade']),cuts=HAIRS.filter(([id])=>!accepted.has(id)).map(([id])=>id),failures=[],frames=[];
   for(const hairS of cuts){ACT.wear('hairS:'+hairS);CharacterUI115.mirrorDraw();if(playerLook().hairS!==hairS)failures.push(hairS);frames.push(document.querySelector('#panelBody canvas[data-draw="person"]').toDataURL());}
   ACT.wear('hairS:long');return{views:cuts.length,unique:new Set(frames).size,failures};
  });assert.deepEqual(mirrored.failures,[]);assert.equal(mirrored.unique,55);
  const saved=await page.evaluate(()=>{ACT.wear('hat:beanie');const look=playerLook();if(!SaveSys.now('Long hairstyle and foreground ears fixture'))throw Error('Save failed');return{look,heads:['down','right','up','left'].map(d=>BagseedArt.head(BagseedArt.normalize(look),d).toDataURL())};});
  await page.reload();await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game');
  const loaded=await page.evaluate(()=>{const look=playerLook();return{look,heads:['down','right','up','left'].map(d=>BagseedArt.head(BagseedArt.normalize(look),d).toDataURL())};});
  assert.deepEqual(loaded,saved);assert.equal(loaded.look.hairS,'long');assert.equal(loaded.look.hat,'beanie');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'creator-mirror-save.json'),JSON.stringify({creator,mirrored,saveReloadIdentical:true,browserErrors:errors},null,2)+'\n');
 }finally{await page.close();}
});
