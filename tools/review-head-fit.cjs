// Reproduce the reported cuts in disposable browser storage, and inspect the
// same anatomical shapes at a readable scale. No live player save is accessed.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'review/customization-v7');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),app=createStaticServer();
 const server=http.createServer((req,res)=>{if(req.url==='/before'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(ROOT,'artifacts/custom-fix-v7/before.html')));}else app.emit('request',req,res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['before','']){
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+route);await page.evaluate(()=>BagseedArt.ready);
   const result=await page.evaluate(()=>{
    const images={},dirs=['down','right','up','left'],base=BagseedArt.normalize({hairC:'#c4c4c4',skin:'#cf9670',topS:'jacket',shirtC:'#20242a',topPat:'stripe',topC2:'#a9abb0',bottomS:'cargo',pantsC:'#436b9a',shoesS:'sneakers',shoesC:'#b19a6a',face:'soft'});
    const sheet=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#292230';g.fillRect(0,0,w,h);g.font='16px sans-serif';g.fillStyle='#e2e6ce';return[c,g];};
    const cuts=['flattop','slick','fade','sidepixie','short','quiff','pomp','crop'];
    const[c,g]=sheet(1040,cuts.length*200);cuts.forEach((hairS,row)=>{g.fillText(hairS,8,row*200+22);dirs.forEach((dir,j)=>drawPerson(g,145+j*245,row*200+190,{...base,hairS},4,{dir}));});images['reported-cuts']=c.toDataURL();
    const[f,fg]=sheet(650,4*165);cuts.slice(0,4).forEach((hairS,row)=>{fg.fillText(hairS,8,row*165+20);dirs.slice(0,3).forEach((dir,j)=>drawPerson(fg,150+j*220,row*165+157,{...base,hairS},3.3,{dir}));});images['reported-four']=f.toDataURL();
    const faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'];
    for(let part=0;part<3;part++){
     const[h,hg]=sheet(1600,5*180);faces.slice(part*5,part*5+5).forEach((face,row)=>{
      hg.fillText(face,5,row*180+18);['bald','flattop','sidepixie','fade'].forEach((hairS,k)=>{
       hg.fillText(hairS,60+k*380,row*180+18);dirs.forEach((dir,j)=>{const im=BagseedArt.head({...base,face,hairS},dir);hg.drawImage(im,0,35,192,220,45+k*380+j*90,row*180+25,90,103.125);});
      });
     });images['head-shapes-'+(part+1)]=h.toDataURL();
    }
    return images;
   });
   for(const[name,url]of Object.entries(result))fs.writeFileSync(path.join(OUT,name+'-'+(route?'before':'after')+'.png'),Buffer.from(url.split(',')[1],'base64'));
  }
  await page.locator('[data-act=newGame]').click();await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);$('#tip').hidden=true;closePanel();ACT.wardrobe();for(const arg of ['shirt:jacket','shirtC:#20242a','bottom:cargo','pantsC:#436b9a','shoes:sneakers','shoesC:#b19a6a','hairC:#c4c4c4','facial:none','hat:none','face:soft'])ACT.wear(arg);ACT.wear('topPat:stripe');ACT.wear('topC2:#a9abb0');ACT.wardTab('look');});
  for(const hairS of ['flattop','slick','fade','sidepixie','quiff']){
   await page.evaluate(h=>{ACT.wear('hairS:'+h);CharacterUI115.mirrorDraw();},hairS);
   await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-'+hairS+'.png')});
  }
  for(const face of ['wide','long','petite']){
   await page.evaluate(f=>{ACT.wear('face:'+f);ACT.wear('hairS:sidepixie');CharacterUI115.mirrorDraw();},face);
   await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-sidepixie-'+face+'.png')});
  }
  console.log(JSON.stringify({errors}));if(errors.length)throw Error('Browser errors');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
