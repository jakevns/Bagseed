// Renders every mutation from the live game renderer: veg, flower and leaf close-up.
// Usage: node tools/preview-mutations.cjs [outDir]
const path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const out=path.resolve(process.argv[2]||'review/mutations');fs.mkdirSync(out,{recursive:true});
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
 try{
  const page=await require('../tests/helpers/art-page.cjs')(browser,{viewport:{width:1400,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  const sheet=await page.evaluate(()=>{
   const keys=['none',...Object.keys(MUTS)],cols=4,cw=480,ch=330,z=3,cv=document.createElement('canvas'),c=cv.getContext('2d');
   cv.width=cols*cw;cv.height=Math.ceil(keys.length/cols)*ch;c.imageSmoothingEnabled=false;c.fillStyle='#10171a';c.fillRect(0,0,cv.width,cv.height);
   keys.forEach((k,i)=>{
    const ox=(i%cols)*cw,oy=Math.floor(i/cols)*ch;c.fillStyle='#1a2420';c.fillRect(ox+4,oy+4,cw-8,ch-8);
    c.fillStyle='#e8eedf';c.font='bold 15px monospace';c.fillText(k==='none'?'Normal (no mutation)':MUTS[k].name+' · '+MUTS[k].gene,ox+12,oy+24);
    [[3,0],[5,1],[8,2]].forEach(([stage,j])=>{
     const p=demoPlant('porchlight',stage,77,{id:'prev_'+k+stage,sex:'F',sexKnown:true,pheno:{h:1,b:1,y:1,a:1,deep:false,mut:k==='none'?null:k,muts:k==='none'?[]:[k]}});
     const s=PlantArt.build(p);c.drawImage(s.cv,ox+cw*[.16,.45,.8][j]-s.ax*z,oy+ch-12-s.ay*z,s.w*z,s.h*z);
    });
   });
   return cv.toDataURL();
  });
  const close=await page.evaluate(()=>{
   const keys=['none',...Object.keys(MUTS)],cols=8,cw=230,ch=250,z=5,cv=document.createElement('canvas'),c=cv.getContext('2d');
   cv.width=cols*cw;cv.height=Math.ceil(keys.length/cols)*ch;c.imageSmoothingEnabled=false;c.fillStyle='#10171a';c.fillRect(0,0,cv.width,cv.height);
   keys.forEach((k,i)=>{
    const ox=(i%cols)*cw,oy=Math.floor(i/cols)*ch;c.fillStyle='#1a2420';c.fillRect(ox+3,oy+3,cw-6,ch-6);
    c.fillStyle='#e8eedf';c.font='bold 13px monospace';c.fillText(k==='none'?'Normal':MUTS[k].name,ox+8,oy+18);
    const p=demoPlant('porchlight',4,77,{id:'close_'+k,sex:'F',sexKnown:true,height:8,nodes:4,pheno:{h:1,b:1,y:1,a:1,deep:false,mut:k==='none'?null:k,muts:k==='none'?[]:[k]}});
    const s=PlantArt.build(p);c.drawImage(s.cv,ox+cw/2-s.ax*z,oy+ch-8-s.ay*z,s.w*z,s.h*z);
   });
   return cv.toDataURL();
  });
  fs.writeFileSync(path.join(out,'mutation-leaves.png'),Buffer.from(close.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'mutation-sheet.png'),Buffer.from(sheet.split(',')[1],'base64'));
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Wrote',path.join(out,'mutation-sheet.png'));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1);});
