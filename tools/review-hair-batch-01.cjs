const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'review/hair-batch-01');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const{createStaticServer}=await import('./server.mjs'),app=createStaticServer(),server=http.createServer((req,res)=>{if(req.url==='/before'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(ROOT,'artifacts/hair-batch-01/before.html')));}else app.emit('request',req,res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of (process.argv.includes('--after')?['/']:['/before','/'])){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   const result=await page.evaluate(()=>{
    const out={},cuts=['short','buzz','crop','caesar','fade'],dirs=['down','right','up','left'],faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],base=BagseedArt.normalize({hairC:'#c4c4c4',skin:'#cf9670',hat:'none',facial:'none',face:'soft',topS:'jacket',shirtC:'#20242a'});
    const sheet=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,w,h);g.font='17px sans-serif';g.fillStyle='#e5e8d8';return[c,g];};
    const[c,g]=sheet(960,5*200);cuts.forEach((hairS,row)=>{g.fillText(hairS,8,row*200+20);dirs.forEach((dir,j)=>g.drawImage(BagseedArt.head({...base,hairS},dir),20,75,152,130,j*240+6,row*200+28,228,162.5));});out['five-cuts']=c.toDataURL();
    for(const hairS of cuts)for(let part=0;part<3;part++){
     const[c,g]=sheet(960,5*200);faces.slice(part*5,part*5+5).forEach((face,row)=>{g.fillText(hairS+' / '+face,8,row*200+20);dirs.forEach((dir,j)=>g.drawImage(BagseedArt.head({...base,hairS,face},dir),20,75,152,130,j*240+6,row*200+28,228,162.5));});out[hairS+'-shapes-'+(part+1)]=c.toDataURL();
    }
    const[f,fg]=sheet(1000,5*190);cuts.forEach((hairS,row)=>{fg.fillText(hairS,8,row*190+20);dirs.forEach((dir,j)=>drawPerson(fg,125+j*245,row*190+182,{...base,hairS,hairC:'#3e9f7a'},4,{dir}));});out['figures']=f.toDataURL();
    for(const hairS of cuts){const[c,g]=sheet(960,EARS115.length*160);EARS115.forEach(([ears],row)=>{g.fillText(hairS+' / '+ears,8,row*160+20);dirs.forEach((dir,j)=>g.drawImage(BagseedArt.head({...base,hairS,ears,pierce:['hoops'],glasses:'round'},dir),20,100,152,105,j*240+6,row*160+25,228,126));});out[hairS+'-ear-options']=c.toDataURL();}
    const[h,hg]=sheet(1000,5*170);cuts.forEach((hairS,row)=>{hg.fillText(hairS,8,row*170+20);['beanie','cap','bucket','straw'].forEach((hat,j)=>drawPerson(hg,125+j*245,row*170+162,{...base,hairS,hat,hairC:'#3e9f7a',ears:'large',pierce:['hoops']},4,{dir:j%2?'right':'down'}));});out['hats']=h.toDataURL();
    const[a,ag]=sheet(1000,5*170);cuts.forEach((hairS,row)=>{ag.fillText(hairS,8,row*170+20);for(let frame=0;frame<4;frame++)drawPerson(ag,125+frame*245,row*170+162,{...base,hairS,hairC:'#3e9f7a'},4,{dir:'right',frame,blink:frame===3});});out['walk-frames']=a.toDataURL();
    return out;
   });
   for(const[name,url]of Object.entries(result)){const target=path.join(OUT,name+'-'+(route==='/before'?'before':'after')+'.png');fs.writeFileSync(target+'.tmp',Buffer.from(url.split(',')[1],'base64'));fs.renameSync(target+'.tmp',target);}
  }
  await page.locator('[data-act=newGame]').click();await page.locator('[data-act=crWalk][data-arg="0"]').click();
  await page.evaluate(()=>{Object.assign(runtime.cr,{hairS:'crop',hairC:'#3e9f7a',face:'wide',ears:'normal',facial:'none',hat:'none',shirtC:'#20242a',topS:'jacket',bottomS:'shorts',pantsC:'#18151d',shoesS:'boots',shoesC:'#463023',acc:'bag',accC:'#854333'});drawCreatorPreview(0);});
  await page.locator('#creatorPreview').screenshot({path:path.join(OUT,'creator-crop.png')});
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);$('#tip').hidden=true;closePanel();ACT.wardrobe();ACT.wardTab('look');});
  for(const hairS of ['short','buzz','crop','caesar','fade']){
   await page.evaluate(hairS=>{ACT.wear('hairS:'+hairS);CharacterUI115.mirrorDraw();},hairS);
   await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-'+hairS+'.png')});
  }
  await page.evaluate(()=>{ACT.wear('hairS:crop');closePanel();View.ensureWorld();View.snap();});
  await page.screenshot({path:path.join(OUT,'bedroom-crop.png')});
  fs.writeFileSync(path.join(OUT,'browser-errors.json'),JSON.stringify(errors,null,2)+'\n');if(errors.length)throw Error(errors.join('\n'));console.log('Five-cut review saved: '+OUT);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
