/* Capture the existing component rig in flower; never installs it in the game. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'graphics/plants/porchlight/sources/manifest.json')));
 const model=fs.readFileSync(path.join(root,'graphics/plants/porchlight/sources/model.cjs'),'utf8');
 const renderer=fs.readFileSync(path.join(root,'graphics/plants/porchlight/sources/renderer.js'),'utf8').replace('__PORCHLIGHT_COMPONENT_DATA__',()=>JSON.stringify(manifest));
 const {createStaticServer}=await import('./server.mjs');
 const server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await require('../tests/helpers/art-page.cjs')(browser,{viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});
  await page.evaluate(()=>BagseedStartup.ready);
  await page.addScriptTag({content:'(()=>{const module={exports:{}};'+model+';window.PorchlightModel=module.exports;})();\n'+renderer});
  await page.evaluate(()=>BagseedPorchlightGrowth.ready);
  const result=await page.evaluate(()=>{
   const api=BagseedPorchlightGrowth,files={},counts=[];
   function board(w,h,title,subtitle){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.fillStyle='#f5efdf';c.fillRect(0,0,w,h);c.fillStyle='#29483a';c.font='bold 30px Georgia';c.fillText(title,28,46);c.font='19px Georgia';c.fillText(subtitle,28,81);return[cv,c];}
   const [cv,c]=board(1440,1000,'PORCHLIGHT / IN FLOWER','One female phenotype · Early flower → building buds → mature flower');
   for(const [i,stage]of [7,8,10].entries()){
    const left=20+i*475,x=left+225,base=780,ppi=10.5;
    const p={id:'porchlight-growth-study',lineId:'porchlight',artIdentity:{seed:'porchlight-phenotype-study'},height:50,nodes:11,stage,loc:'tent5',training:'natural',density:.82,water:60,nutr:60,health:92,stress:0,sex:'F',pheno:{b:1}};
    c.fillStyle='#e1e6d3';c.fillRect(left,110,460,740);
    c.fillStyle='#c4c7a6';c.beginPath();c.ellipse(x,base+57,130,13,0,0,Math.PI*2);c.fill();
    c.save();c.translate(x,base);c.scale(ppi,ppi);BagseedWaterPots.potSprite(c,0,0,2,60);c.restore();
    const result=api.draw(c,p,x,base,ppi,0,0,{reduced:true});counts.push(result.counts);
    c.save();c.translate(x,base);c.scale(ppi,ppi);BagseedWaterPots.potSprite(c,0,0,2,60,false,true);c.restore();
    c.fillStyle='#29483a';c.font='bold 25px Georgia';c.fillText(['Early flower','Building buds','Mature flower'][i],left+20,896);
    c.font='19px Georgia';c.fillText(['Fresh white pistils','Flowers filling out','Fuller buds and orange pistils'][i],left+20,932);
   }
   files['porchlight-flowering-reference']=cv.toDataURL();
   const [detail,dc]=board(1200,570,'PORCHLIGHT / FLOWER DETAIL','The painted flower components used on the attached growth rig');
   for(const [i,role]of ['femaleEarly','femaleMid','femaleLate'].entries()){
    const x=200+i*400;dc.fillStyle='#e1e6d3';dc.fillRect(20+i*400,110,360,365);
    dc.save();dc.translate(x,445);api.part(dc,role,0,0,295);dc.restore();
    dc.fillStyle='#29483a';dc.font='22px Georgia';dc.fillText(['Early flower','Mid flower','Late flower'][i],60+i*400,524);
   }
   files['porchlight-flower-detail']=detail.toDataURL();
   const [late,lc]=board(900,1200,'PORCHLIGHT / LATE FLOWER','Final-week color study · Golden senescence');
   lc.fillStyle='#e1e6d3';lc.fillRect(20,110,860,1040);
   const p={id:'porchlight-growth-study',lineId:'porchlight',artIdentity:{seed:'porchlight-phenotype-study',traits:{colorName:'Forest green'}},height:50,nodes:11,stage:9,loc:'tent5',training:'natural',density:.82,water:60,nutr:60,health:92,stress:0,sex:'F',pheno:{b:1},visualState:{senescence:1}};
   const x=450,base=982,ppi=16;
   lc.fillStyle='#c4c7a6';lc.beginPath();lc.ellipse(x,base+85,205,20,0,0,Math.PI*2);lc.fill();
   lc.save();lc.translate(x,base);lc.scale(ppi,ppi);BagseedWaterPots.potSprite(lc,0,0,2,60);lc.restore();
   api.draw(lc,p,x,base,ppi,0,0,{reduced:true});
   lc.save();lc.translate(x,base);lc.scale(ppi,ppi);BagseedWaterPots.potSprite(lc,0,0,2,60,false,true);lc.restore();
   lc.fillStyle='#29483a';lc.font='20px Georgia';lc.fillText('Mature flowers · Golden fan leaves · Healthy stems',40,1176);
   files['porchlight-late-flower-senescence']=late.toDataURL();
   return{files,counts};
  });
  assert.deepEqual(errors,[]);assert.ok(result.counts.every(c=>c.flowers===19));
  const out=path.join(root,'review/porchlight-flower');fs.mkdirSync(out,{recursive:true});
  for(const [name,url]of Object.entries(result.files))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({status:'sample-awaiting-approval',stages:[7,8,10],lateFlowerPortrait:{stage:9,senescence:1,colorName:'Forest green',palette:'gold'},heightInches:50,counts:result.counts,errors,productionRendererUnchanged:true},null,2)+'\n');
  console.log('Captured Porchlight early, mid and late flowering reference and flower detail.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
