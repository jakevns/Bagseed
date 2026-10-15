// Disposable visual checks for mouth silhouettes and facial-hair transparency.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'review/customization-v9');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),app=createStaticServer(),server=http.createServer((req,res)=>{if(req.url==='/before'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(ROOT,'artifacts/custom-mouths-v9/before.html')));}else app.emit('request',req,res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/before','/']){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   const images=await page.evaluate(()=>{
    const out={},base=BagseedArt.normalize({hairS:'bald',hairC:'#c4c4c4',skin:'#cf9670',hat:'none',facial:'none',face:'soft',topS:'hoodie',shirtC:'#5f9c33'}),dirs=['down','right','left'];
    const sheet=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,w,h);g.fillStyle='#e5e8d8';g.font='16px sans-serif';return[c,g];};
    const[c,g]=sheet(900,Math.ceil(MOUTHS115.length/6)*150);
    MOUTHS115.forEach(([mouth,name],i)=>{const x=i%6*150,y=Math.floor(i/6)*150;g.fillText(name,x+8,y+20);g.drawImage(BagseedArt.head({...base,mouth},'down'),45,123,104,77,x+8,y+30,135,100);});out['mouth-menu']=c.toDataURL();
    const[s,sg]=sheet(900,Math.ceil(MOUTHS115.length/3)*175);
    MOUTHS115.forEach(([mouth,name],i)=>{const x=i%3*300,y=Math.floor(i/3)*175;sg.fillText(name,x+8,y+20);dirs.forEach((dir,j)=>drawPerson(sg,x+48+j*95,y+169,{...base,hairS:'short',mouth},3,{dir}));});out['mouth-sprites']=s.toDataURL();
    const facials=FACIAL.filter(([id])=>id!=='none');
    for(let part=0;part<2;part++){
     const[b,bg]=sheet(900,7*180);facials.slice(part*7,part*7+7).forEach(([facial,name],row)=>{bg.fillText(name,8,row*180+18);dirs.forEach((dir,j)=>bg.drawImage(BagseedArt.head({...base,facial},dir),35,128,125,87,j*300+30,row*180+26,230,160));});out['beards-silver-'+(part+1)]=b.toDataURL();
    }
    const[f,fg]=sheet(1000,5*180);['beard','shortbeard','goatee','mutton','handlebar'].forEach((facial,row)=>{fg.fillText(facial,5,row*180+18);['#4a2c1a','#ffffff','#7d5bd6'].forEach((hairC,j)=>{const h=BagseedArt.head({...base,facial,hairC,hairS:'short'},'down');fg.drawImage(h,35,88,125,123,j*330+40,row*180+20,160,157);});});out['beard-colors']=f.toDataURL();
    for(let part=0;part<3;part++){const[c,g]=sheet(900,5*180);['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'].slice(part*5,part*5+5).forEach((face,row)=>{g.fillText(face,8,row*180+18);dirs.forEach((dir,j)=>g.drawImage(BagseedArt.head({...base,face,facial:'beard'},dir),35,128,125,87,j*300+30,row*180+26,230,160));});out['beard-shapes-'+(part+1)]=c.toDataURL();}
    return out;
   });for(const[name,url]of Object.entries(images))fs.writeFileSync(path.join(OUT,name+'-'+(route==='/before'?'before':'after')+'.png'),Buffer.from(url.split(',')[1],'base64'));
  }
  await page.locator('[data-act=newGame]').click();await page.locator('[data-act=crWalk][data-arg="0"]').click();
  await page.evaluate(()=>{Object.assign(runtime.cr,{hairS:'short',hairC:'#c4c4c4',expr:'happy',mouth:'braces'});drawCreatorPreview(0);});await page.locator('#creatorPreview').screenshot({path:path.join(OUT,'creator-braces.png')});
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);$('#tip').hidden=true;closePanel();ACT.wardrobe();ACT.wardTab('look');});
  for(const facial of ['beard','mutton','goatee']){await page.evaluate(f=>{ACT.wear('expr:neutral');ACT.wear('mouth:default');ACT.wear('facial:'+f);CharacterUI115.mirrorDraw();},facial);await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-'+facial+'.png')});}
  console.log(JSON.stringify({errors}));if(errors.length)throw Error('Browser errors');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
