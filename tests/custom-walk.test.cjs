// Add-only wardrobe walk checks. Every browser context and save is disposable.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),review=path.join(root,'review/custom-walk-v5');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'review/custom-walk-v1/inventory.json')));
function writeReport(coverage){const target=path.join(review,'live-wardrobe-validation.json'),staging=target+'.tmp';fs.writeFileSync(staging,JSON.stringify(coverage,null,2)+'\n');fs.renameSync(staging,target);}
const fixture=JSON.parse(fs.readFileSync(path.join(root,'review/characters-v2/sources/baseline-assets.json'))).people.find(p=>p.id==='player').look;

test('all custom wardrobe walk combinations render grounded frames with connected hands and a following flashlight',{timeout:900000},async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});
  const page=await require('./helpers/art-page.cjs')(browser,{viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{timeout:180000});await page.evaluate(()=>BagseedArt.ready);
  const coverage={outfits:0,frames:0,failures:[],perTop:{},landmarkScope:'Visible hand neighborhoods and alpha connection to shoulder; rig-driven flashlight attachment. Hidden anatomical joints are not independently detected.'};
  for(const topS of inventory.top){
   const result=await page.evaluate(({topS,inventory,fixture})=>{
    const records=[],failures=[],items=BagseedArt.walkReview.items,rig=BagseedArt.walkReview.rig,dirs=['down','right','up','left'];
    for(const id of ['top-'+topS,...inventory.bottom.map(v=>'bottom-'+v),...inventory.shoe.map(v=>'shoe-'+v)])if(!items[id]?.accepted)throw Error('Unaccepted or missing garment '+id);
    const look={...fixture,hairS:'bald',mouth:'cat',body:'average',pres:'neutral',topS};
    function nearest(data,w,h,x,y,radius){let best=null,d=Infinity;for(let yy=Math.max(0,Math.floor(y-radius));yy<=Math.min(h-1,Math.ceil(y+radius));yy++)for(let xx=Math.max(0,Math.floor(x-radius));xx<=Math.min(w-1,Math.ceil(x+radius));xx++){const dd=Math.hypot(xx-x,yy-y);if(dd<=radius&&dd<d&&data[(yy*w+xx)*4+3]>40){d=dd;best=yy*w+xx;}}return best;}
    function connected(data,w,h,start,end){if(start===null||end===null)return false;const seen=new Uint8Array(w*h),queue=[start];seen[start]=1;for(let i=0;i<queue.length;i++){const p=queue[i];if(p===end)return true;const x=p%w,y=Math.floor(p/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const n=yy*w+xx;if(!seen[n]&&data[n*4+3]>40){seen[n]=1;queue.push(n);}}}return false;}
    for(const bottomS of inventory.bottom)for(const shoesS of inventory.shoe){
     const L={...look,bottomS,shoesS},sideImages={right:new Set(),left:new Set()},record={topS,bottomS,shoesS,frames:0,minBaseline:Infinity,maxBaseline:-Infinity,maxFlashlightError:0,handChecks:0};
     for(const dir of dirs)for(let frame=0;frame<BagseedArt.customWalkFrameCount(L,dir);frame++){
      const im=BagseedArt.sprite(L,dir,frame,0,0,0,false,1,true),expected=dir+'/'+frame,data=im.getContext('2d',{willReadFrequently:true}).getImageData(0,0,im.width,im.height).data;
      const key=[topS,bottomS,shoesS,expected].join('/');let opaque=0,bottom=-1;
      for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(data[(y*im.width+x)*4+3]>100){opaque++;bottom=y;}
      if(sideImages[dir])sideImages[dir].add(im.toDataURL());
      if(im.bagseedAuthoredWalk!==expected)failures.push(key+': legacy/fallback frame');
      if(opaque<600)failures.push(key+': empty or incomplete figure');
      if(bottom<141||bottom>143)failures.push(key+': painted ground '+bottom);
      const p=(im.bagseedWalkProfile==='stride/'?window.__BAGSEED_ILLUSTRATED_DATA__.walk.stride.rig:rig).frames[expected],hand=im.bagseedHand,project=([x,y])=>[48+(x-48)*im.bagseedBodyTransform.width*BagseedArt.playerFigureScale,143+(y-143)*im.bagseedBodyTransform.sy*BagseedArt.playerFigureScale],handPoint=project(p.keypoints['hand'+p.nearArm]),shoulder=project(p.keypoints['shoulder'+p.nearArm]);
      if(!hand||Math.hypot(hand.x-handPoint[0],hand.y-handPoint[1])>.001)failures.push(key+': wrong hand attachment');
      const palm=nearest(data,im.width,im.height,handPoint[0],handPoint[1],4),arm=nearest(data,im.width,im.height,shoulder[0],shoulder[1],3);
      if(!connected(data,im.width,im.height,palm,arm))failures.push(key+': hand is not alpha-connected to shoulder');
      const lamp=NightLamps1151.hand(300,180,L,{dir,frame,walk:true}),error=Math.hypot(lamp.x-(300+(handPoint[0]-48)/3),lamp.y-(180+(handPoint[1]-144)/3));
      if(error>.001)failures.push(key+': flashlight drift '+error);
      record.frames++;record.handChecks++;record.minBaseline=Math.min(record.minBaseline,bottom);record.maxBaseline=Math.max(record.maxBaseline,bottom);record.maxFlashlightError=Math.max(record.maxFlashlightError,error);
     }
     for(const dir of ['right','left'])if(sideImages[dir].size!==8)failures.push([topS,bottomS,shoesS,dir].join('/')+': repeated side poses');
     records.push(record);
    }
    return {records,failures};
   },{topS,inventory,fixture});
   coverage.perTop[topS]=result.records;coverage.outfits+=result.records.length;coverage.frames+=result.records.reduce((n,v)=>n+v.frames,0);coverage.failures.push(...result.failures);
   fs.mkdirSync(review,{recursive:true});writeReport(coverage);
  }
  assert.equal(coverage.outfits,15*5*4);assert.equal(coverage.frames,15*5*4*24);assert.deepEqual(coverage.failures,[]);
  const extra=await page.evaluate(fixture=>{
   const failures=[],footColors=new Set(),variants=[];
   for(const body of ['slim','average','broad','curvy','stocky','tall'])for(const pres of ['fem','masc','neutral'])for(const dir of ['down','right','up','left'])for(let frame=0;frame<4;frame++){
    const look={...fixture,topS:'pjs',body,pres},im=BagseedArt.sprite(look,dir,frame,0,0,0,false,1,true),hand=im.bagseedHand,lamp=NightLamps1151.hand(300,180,look,{dir,frame,walk:true});
    if(!im.bagseedAuthoredWalk||Math.hypot(lamp.x-(300+(hand.x-48)/3),lamp.y-(180+(hand.y-144)/3))>.001)failures.push([body,pres,dir,frame]);variants.push([body,pres,dir,frame]);
   }
   for(const skin of SKIN){const im=BagseedArt.sprite({...fixture,skin,shoesS:'sandals'},'down',0,0,0,0,false,3,true);footColors.add(Array.from(im.getContext('2d').getImageData(0,408,288,21).data).join(','));}
   return {buildPresentationFrames:variants.length,skinTones:SKIN.length,sandalToeVariants:footColors.size,failures};
  },fixture);assert.deepEqual(extra.failures,[]);assert.equal(extra.sandalToeVariants,16);coverage.variants=extra;
  await page.locator('[data-act=newGame]').click();
  const creator=await page.evaluate(()=>{Object.assign(runtime.cr,{topS:'pjs',shirtC:'#7283a4',hairS:'ponytail'});runtime.crWalk=true;drawCreatorPreview(0);const a=$('#creatorPreview').toDataURL();drawCreatorPreview(1/6);const b=$('#creatorPreview').toDataURL();runtime.crWalk=false;drawCreatorPreview(.25);const c=$('#creatorPreview').toDataURL();drawCreatorPreview(.5);return {animated:a!==b,idleStopped:c===$('#creatorPreview').toDataURL()};});
  assert.equal(creator.animated,true,'creator walk animates');assert.equal(creator.idleStopped,true,'creator idle keeps its pose between blinks');
  await page.locator('#crName').fill('Disposable walk validation');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state?.player);
  const saved=await page.evaluate(()=>{
   settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();Object.assign(state.player,{topS:'pjs',shirtC:'#7283a4',bottomS:'shorts',shoesS:'rainboots',hairS:'long',hairC:'#dbd6ce',body:'broad'});
   Panels.wardrobe('look');runtime.mirrorWalk=true;runtime.t=0;CharacterUI115.mirrorDraw();const canvas=$('#panelBody canvas[data-draw="person"]'),a=canvas.toDataURL();runtime.t=1/6;CharacterUI115.mirrorDraw();const animated=a!==canvas.toDataURL();$('#panelBody [data-walk-preview] button:last-child').click();const idle=canvas.toDataURL();runtime.t=2/6;CharacterUI115.mirrorDraw();const stopped=idle===canvas.toDataURL();closePanel();
   settings.reduced=true;runtime.walking=true;const reduced=[0,.25,.5,.75].map(t=>playerAnim(t));runtime.walking=false;
   if(!SaveSys.now('disposable custom walk validation'))throw Error('Disposable save failed');return {look:playerLook(),mirror:{animated,stopped},reduced};
  });assert.deepEqual(saved.mirror,{animated:true,stopped:true});assert.ok(saved.reduced.every(v=>v.walk&&[1,3].includes(v.frame)));
  await page.reload({timeout:180000});await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state?.player);assert.deepEqual(await page.evaluate(()=>playerLook()),saved.look);
  assert.deepEqual(errors,[]);Object.assign(coverage,{creator,mirror:saved.mirror,reducedMotion:true,saveReload:'passed in disposable browser storage',browserErrors:errors});writeReport(coverage);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
