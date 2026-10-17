const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8'),manifest=JSON.parse(read('graphics/plants/velvet/sources/manifest.json'));
 const model=read('graphics/plants/porchlight/sources/model.cjs'),renderer=read('graphics/plants/porchlight/sources/renderer.js').replace('__PORCHLIGHT_COMPONENT_DATA__',()=>JSON.stringify(manifest));
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('../tests/helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.addScriptTag({content:'(()=>{const module={exports:{}};'+model+';window.PorchlightModel=module.exports;})();\n'+renderer});await page.evaluate(()=>BagseedVelvetGrowth.ready);
  const png=await page.evaluate(()=>{
   const api=BagseedVelvetGrowth,core=BagseedNightColor,cv=document.createElement('canvas');cv.width=1400;cv.height=1100;const c=cv.getContext('2d');
   c.fillStyle='#f5efdf';c.fillRect(0,0,1400,1100);c.fillStyle='#29483a';c.font='bold 30px Georgia';c.fillText('VELVET UNDERBRUSH / COOL NIGHTS, DEEPER COLOR',28,46);c.font='20px Georgia';c.fillText('Same Red accents phenotype · Same late-flower plant · Two qualifying nights',28,82);
   const traits={leafShape:'broad',leafKey:'forest',colorName:'Red accents',branching:1};
   for(const [i,nightTemp]of [68.1,68].entries()){
    let exposure=null;
    for(let day=0;day<2;day++){
     for(let hour=8;hour<20;hour++)exposure=core.advance(exposure,{loc:'closet',stage:9,temp:78,lightOn:true,stamp:day*1440+hour*60},traits);
     for(let hour=20;hour<32;hour++)exposure=core.advance(exposure,{loc:'closet',stage:9,temp:nightTemp,lightOn:false,stamp:day*1440+hour*60},traits);
    }
    const left=20+i*690,x=left+335,base=830,ppi=13;
    const p={id:'velvet-review',lineId:'velvet',artIdentity:{seed:'velvet-phenotype-study',traits},height:50,nodes:11,stage:9,training:'natural',loc:'tent5',density:.82,water:60,nutr:60,health:92,stress:0,sex:'F',pheno:{b:1},visualState:{senescence:.82},nightColor:exposure};
    c.fillStyle='#e0e5d2';c.fillRect(left,110,670,860);
    c.save();c.translate(x,base);c.scale(ppi,ppi);BagseedWaterPots.potSprite(c,0,0,2,60);c.restore();api.draw(c,p,x,base,ppi,0,0,{reduced:true});c.save();c.translate(x,base);c.scale(ppi,ppi);BagseedWaterPots.potSprite(c,0,0,2,60,false,true);c.restore();
    c.fillStyle='#29483a';c.font='bold 25px Georgia';c.fillText(i?'10°F drop / wine-red expression':'9.9°F drop / natural autumn fade',left+20,1010);c.font='20px Georgia';c.fillText('78°F lights on → '+nightTemp+'°F lights off',left+20,1045);
   }
   return cv.toDataURL();
  });
  if(errors.length)throw Error(errors.join('\n'));const out=path.join(root,'review/night-colors');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'velvet-temperature-colors.png'),Buffer.from(png.split(',')[1],'base64'));console.log('Captured temperature-triggered phenotype comparison.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
