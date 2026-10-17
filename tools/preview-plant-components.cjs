/* Review-only captures from the shared connected rig. Does not modify index.html. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const identityAPI=require('../graphics/plants/sources/phenotype-library.cjs');
(async()=>{
 const strain=process.argv[2]||'velvet';assert.equal(strain,'velvet','This review currently supports the Velvet kit.');
 const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
 const manifest=JSON.parse(read('graphics/plants/'+strain+'/sources/manifest.json'));
 const library=JSON.parse(read('graphics/plants/sources/library.json'));
 // Expressed values match the current native Velvet catalog; identity is pinned once.
 const traits={leafShape:'broad',leafKey:'forest',colorName:'Red accents',branching:1};
 const identity=identityAPI.createIdentity({id:'velvet-review',lineId:strain,genome115:{id:'velvet-phenotype-study'}},traits,library);
 const model=read('graphics/plants/porchlight/sources/model.cjs');
 const renderer=read('graphics/plants/porchlight/sources/renderer.js').replace('__PORCHLIGHT_COMPONENT_DATA__',()=>JSON.stringify(manifest));
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await require('../tests/helpers/art-page.cjs')(browser,{viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.addScriptTag({content:'(()=>{const module={exports:{}};'+model+';window.PorchlightModel=module.exports;})();\n'+renderer});
  await page.evaluate(name=>window[name].ready,manifest.apiName);
  const result=await page.evaluate(async({manifest,identity,makeFrames})=>{
   const api=window[manifest.apiName],files={},frames=[],measurements=[];
   const plant=(height,stage=5)=>({id:'velvet-review',lineId:'velvet',artIdentity:identity,height,nodes:Math.min(11,1+height*.24),stage,loc:height>50?'outdoor':'tent5',training:'natural',density:.82,water:60,nutr:60,health:92,stress:0,sex:'F',pheno:{b:1},...(stage>=9?{visualState:{senescence:stage===9?.82:1}}:{})});
   function board(w,h,title,sub){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.fillStyle='#f5efdf';c.fillRect(0,0,w,h);c.fillStyle='#29483a';c.font='bold 29px Georgia';c.fillText(title,28,45);c.font='19px Georgia';c.fillText(sub,28,80);return[cv,c];}
   function pot(c,x,y,ppi,front=false){c.save();c.translate(x,y);c.scale(ppi,ppi);BagseedWaterPots.potSprite(c,0,0,2,60,false,front);c.restore();}
   function ground(c,x,y,ppi){c.fillStyle='#807351';c.beginPath();c.ellipse(x,y+ppi*.6,ppi*15,ppi*1.5,0,0,Math.PI*2);c.fill();}
   function specimen(c,p,x,y,ppi,t=0,wind=0,outdoor=false,potScale=ppi){if(outdoor)ground(c,x,y,ppi);else pot(c,x,y,potScale);const result=api.draw(c,p,x,y,ppi,t,wind,{reduced:wind===0});if(!outdoor)pot(c,x,y,potScale,true);return result;}
   const [cycle,c]=board(1260,1560,'VELVET UNDERBRUSH / GROWTH & FLOWER','One connected phenotype · Forest-green broad leaves → wine-red autumn fade');
   const stages=[[0,1,'Seed'],[1,1,'Germination'],[2,3,'Seedling'],[3,12,'Early vegetation'],[5,35,'Mature vegetation'],[7,50,'Early flower'],[8,50,'Building buds'],[9,50,'Late flower / autumn fade'],[10,50,'Harvest ready']];
   for(const [i,[stage,height,label]]of stages.entries()){
    const x=20+(i%3)*415,y=110+Math.floor(i/3)*475;
    c.save();c.beginPath();c.rect(x,y,400,420);c.clip();c.fillStyle='#e0e5d2';c.fillRect(x,y,400,420);
    if(stage<2){c.save();c.translate(x+200,y+280);api.part(c,stage?'radicle':'seed',0,0,stage?170:130);c.restore();}
    else specimen(c,plant(height,stage),x+200,y+335,stage===2?48:stage===3?19:5.7,0,0,false,5.7);
    c.restore();
    c.fillStyle='#29483a';c.font='bold 22px Georgia';c.fillText(label,x+12,y+456);
   }
   files['velvet-growth-and-flower']=cycle.toDataURL();
   const [growth,gc]=board(1440,1100,'VELVET UNDERBRUSH / CONTINUOUS GROWTH','Same phenotype and physical scale · Connected branches, stable leaf identities');
   const ppi=8,base=880;
   for(const [i,height]of [50,90].entries()){
    const left=20+i*710,x=left+350;gc.fillStyle='#e0e5d2';gc.fillRect(left,110,690,855);
    gc.strokeStyle='#a4ae8d';gc.beginPath();gc.moveTo(left+55,base);gc.lineTo(left+55,base-90*ppi);gc.stroke();
    gc.font='16px Georgia';gc.fillStyle='#536348';for(let n=0;n<=90;n+=10){const yy=base-n*ppi;gc.fillText(n+'″',left+8,yy+4);gc.fillRect(left+50,yy,14,1);}
    const draw=specimen(gc,plant(height),x,base,ppi,0,0,i===1);
    measurements.push({heightInches:height,counts:draw.counts});
    gc.fillStyle='#29483a';gc.font='bold 25px Georgia';gc.fillText(height+' inches / '+(i?'outdoor giant':'potted Velvet'),left+25,1025);
   }
   files['velvet-50-and-90-inches']=growth.toDataURL();
   const [late,lc]=board(900,1200,'VELVET UNDERBRUSH / LATE FLOWER','Final-week color study · Red phenotype senescence');
   lc.fillStyle='#e0e5d2';lc.fillRect(20,110,860,1040);
   specimen(lc,plant(50,10),450,982,16);
   lc.fillStyle='#29483a';lc.font='19px Georgia';lc.fillText('Wine-red fan leaves · Copper pistils · Mature, frosty flowers',28,1176);
   files['velvet-late-flower-senescence']=late.toDataURL();
   // Physical-height labels must match actual painted-alpha bounds, not just trunk length.
   for(const height of [50,90]){
    const cv=document.createElement('canvas');cv.width=1400;cv.height=1100;const c=cv.getContext('2d');api.draw(c,plant(height),700,1000,8,0,0,{reduced:true});
    const d=c.getImageData(0,0,cv.width,cv.height).data;let top=cv.height;
    outer:for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(d[(y*cv.width+x)*4+3]>150){top=y;break outer;}
    const physical=(1000-top)/8;if(Math.abs(physical-height)>.6)throw Error('Painted height mismatch: '+physical+' / '+height);
    measurements.find(m=>m.heightInches===height).measuredHeightInches=physical;
   }
   const total=makeFrames?120:0;
   for(let i=0;i<total;i++){
    const [cv,c]=board(1200,1000,'VELVET UNDERBRUSH / GROWTH & WIND','Same connected rig · Fixed roots, flexible branches and gently fluttering leaves');
    c.fillStyle='#e0e5d2';c.fillRect(20,110,570,800);c.fillRect(610,110,570,800);
    const u=Math.min(1,i/100),height=3+87*u*u*(3-2*u);
    specimen(c,plant(height,height<5?2:height<14?3:5),305,825,7.5,i/12,1.15,true);
    specimen(c,plant(50,10),895,825,11.5,i/12,1.15);
    c.fillStyle='#29483a';c.font='23px Georgia';c.fillText(height.toFixed(1)+' inches / growing',45,955);c.fillText('Late flower / red autumn fade',635,955);
    frames.push(cv.toDataURL());
   }
   return{files,frames,measurements,finish:api.Model.senescence(plant(50,10))};
  },{manifest,identity,makeFrames:!process.argv.includes('--stills')});
  assert.deepEqual(errors,[]);assert.equal(result.finish.palette,'red');assert.ok(result.measurements[1].counts.leaves>result.measurements[0].counts.leaves);
  const out=path.join(root,'review/velvet-components');fs.mkdirSync(path.join(out,'frames'),{recursive:true});
  for(const [name,url]of Object.entries(result.files))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  for(const [i,url]of result.frames.entries())fs.writeFileSync(path.join(out,'frames',String(i).padStart(3,'0')+'.png'),Buffer.from(url.split(',')[1],'base64'));
  if(result.frames.length){const {spawnSync}=require('node:child_process');for(const [ext,args]of [['mp4',['-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart']],['gif',['-filter_complex','[0:v]split[a][b];[a]palettegen[p];[b][p]paletteuse=dither=sierra2_4a','-loop','0']]]){const r=spawnSync('ffmpeg',['-y','-v','error','-framerate','12','-i',path.join(out,'frames/%03d.png'),...args,path.join(out,'velvet-growth-and-wind.'+ext)],{encoding:'utf8'});assert.equal(r.status,0,r.stderr||r.error?.message);}}
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({status:'sample-awaiting-approval',identity,measurements:result.measurements,finish:result.finish,animationFrames:result.frames.length,errors,productionRendererUnchanged:true},null,2)+'\n');
  console.log('Captured Velvet growth, flower, red senescence and '+result.frames.length+' wind frames.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
