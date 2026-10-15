const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'review/customization-v8');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),app=createStaticServer();
 const server=http.createServer((req,res)=>{if(req.url==='/before'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(ROOT,'artifacts/custom-details-v8/before.html')));}else if(req.url==='/'&&process.env.BAGSEED_DETAIL_TEST_HTML){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.resolve(ROOT,process.env.BAGSEED_DETAIL_TEST_HTML)));}else app.emit('request',req,res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/before','/']){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   const images=await page.evaluate(()=>{
    const out={},dirs=['down','right','up','left'],base=BagseedArt.normalize({hairS:'bald',hairC:'#c4c4c4',skin:'#cf9670',hat:'none',facial:'none',face:'soft',topS:'hoodie',shirtC:'#5f9c33'});
    const sheet=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,w,h);g.fillStyle='#e5e8d8';g.font='15px sans-serif';return[c,g];};
    const board=(name,cases)=>{const[c,g]=sheet(1000,cases.length*155);cases.forEach(([title,look],row)=>{g.fillText(title,5,row*155+18);dirs.forEach((dir,j)=>{const h=BagseedArt.head({...base,...look},dir);g.drawImage(h,30,120,135,85,j*245+40,row*155+26,216,136);});});out[name]=c.toDataURL();};
    board('mouths',MOUTHS115.map(([mouth,name])=>[name,{mouth}]));
    board('ears',EARS115.map(([ears,name])=>[name,{ears,pierce:['earL','earR'],acc:'earring'}]));
    board('piercings',PIERCE115.map(([id,name])=>[name,{pierce:[id]}]));
    board('marks',MARKS115.map(([id,name])=>[name,{marks:[id]}]));
    board('eyes-and-glasses',[['Classic',{}],['Round frames',{glasses:'round'}],['Square frames',{glasses:'square'}],['Sleepy',{eyes:'sleepy'}],['Blue eyes',{eyeC:'#348ac6'}],['Sleepy + blue eyes',{eyes:'sleepy',eyeC:'#348ac6'}],['Narrow + blue eyes',{eyes:'narrow',eyeC:'#348ac6'}],['Brows thick',{brows:'thick'}],['Brows high',{brows:'high'}],['Brow slit',{brows:'slit'}],['No brows',{brows:'none'}],['Wink',{expr:'wink'}],['Happy',{expr:'happy'}],['Headphones',{acc:'headphones',accC:'#794b90'}]]);
    board('hair-and-jewelry',[['Short + earrings',{hairS:'short',acc:'earring',mouth:'smile'}],['Pixie + hoops',{hairS:'sidepixie',pierce:['hoops'],mouth:'teeth'}],['Elf + jewelry',{ears:'elf',acc:'earring',mouth:'smile'}],['Small + nose ring',{ears:'small',pierce:['earL','earR','nosering'],mouth:'full'}],['Hidden + earrings selected',{ears:'hidden',acc:'earring',pierce:['earL','earR']}],['Short + glasses',{hairS:'short',glasses:'round',mouth:'smirk'}],['Long + earrings',{hairS:'long',acc:'earring',mouth:'smile'}]]);
    const faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'];
    for(let part=0;part<3;part++)board('shapes-'+(part+1),faces.slice(part*5,part*5+5).map(face=>[face,{face,ears:'large',pierce:['hoops','nose'],mouth:'teeth',glasses:'round'}]));
    return out;
   });for(const[name,url]of Object.entries(images))fs.writeFileSync(path.join(OUT,name+'-'+(route==='/before'?'before':'after')+'.png'),Buffer.from(url.split(',')[1],'base64'));
  }
  await page.locator('[data-act=newGame]').click();await page.locator('[data-act=crWalk][data-arg="0"]').click();
  await page.evaluate(()=>{Object.assign(runtime.cr,{hairS:'sidepixie',hairC:'#c4c4c4',mouth:'teeth',ears:'normal',acc:'earring',accC:'#e8bd57',glasses:'none',pierce:['nosering'],marks:['moleLip']});drawCreatorPreview(0);});
  await page.locator('#creatorPreview').screenshot({path:path.join(OUT,'creator-details.png')});
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);$('#tip').hidden=true;closePanel();ACT.wardrobe();ACT.wardTab('look');});
  for(const ears of ['normal','large','hidden']){
   await page.evaluate(ears=>{ACT.wear('ears:'+ears);CharacterUI115.mirrorDraw();},ears);
   await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-'+ears+'-ears.png')});
  }
  console.log(JSON.stringify({errors}));if(errors.length)throw Error('Browser errors');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
