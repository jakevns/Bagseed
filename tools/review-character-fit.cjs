const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'review/customization-v6');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),app=createStaticServer();
 const server=http.createServer((req,res)=>{if(req.url==='/before'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(ROOT,'artifacts/custom-fix-v6/before.html')));}else app.emit('request',req,res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['before','']){
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+route);await page.evaluate(()=>BagseedArt.ready);
   const result=await page.evaluate(()=>{
    const images={},dirs=['down','right','up','left'],base=BagseedArt.normalize({hairS:'quiff',hairC:'#e9e2d4',skin:'#cf9670',topS:'jacket',shirtC:'#20242a',topPat:'stripe',topC2:'#a9abb0',bottomS:'cargo',pantsC:'#736348',shoesS:'boots',shoesC:'#463023',acc:'bag',accC:'#854333'});
    const sheet=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#2a2230';g.fillRect(0,0,w,h);g.font='16px sans-serif';g.fillStyle='#d8dbc6';return[c,g];};
    const cases=[['Purple spikes / shorts',{hairS:'spikes',hairC:'#742eb0',bottomS:'shorts',pantsC:'#18151d',botPat:'stripe',botC2:'#8b1c59'}],['Silver quiff',{}],...['beanie','cap','bucket','straw'].map(hat=>[hat,{hat}])];
    const[c,g]=sheet(1120,cases.length*230);cases.forEach(([name,options],row)=>{g.fillText(name,10,row*230+20);dirs.forEach((dir,j)=>drawPerson(g,140+j*270,row*230+220,{...base,...options},4,{dir}));});images['reported-outfit']=c.toDataURL();
    const[h,hg]=sheet(1440,3*270);['quiff','spikes','short'].forEach((hairS,row)=>{hg.fillText(hairS,10,row*270+20);dirs.forEach((dir,j)=>{hg.drawImage(BagseedArt.hairLayer({...base,hairS},dir),j*360,row*270,144,240);hg.drawImage(BagseedArt.head({...base,hairS},dir),j*360+160,row*270,144,240);});});images['natural-fringe']=h.toDataURL();
    const[f,fg]=sheet(1440,4*190);let measures=[];['sneakers','boots','sandals','rainboots'].forEach((shoesS,row)=>{fg.fillText(shoesS,10,row*190+18);['jeans','shorts','skirt'].forEach((bottomS,k)=>dirs.forEach((dir,j)=>{const look={...base,shoesS,bottomS,hat:'none',hairS:'short'};drawPerson(fg,k*480+45+j*115,row*190+182,look,3,{dir});const b=BagseedArt.body(look,dir),a=b.getContext('2d').getImageData(0,94,96,14).data;const xs=[];for(let y=5;y<14;y++)for(let x=0;x<96;x++)if(a[(y*96+x)*4+3]>100)xs.push(x);if(k===0)measures.push({shoesS,dir,width:Math.max(...xs)-Math.min(...xs)+1});}));});images.footwear=f.toDataURL();
    return {images,measures};
   });
   const suffix=route?'before':'after';for(const[n,url]of Object.entries(result.images))fs.writeFileSync(path.join(OUT,n+'-'+suffix+'.png'),Buffer.from(url.split(',')[1],'base64'));
   fs.writeFileSync(path.join(OUT,'footwear-'+suffix+'.json'),JSON.stringify(result.measures,null,2)+'\n');
  }
  // Capture the same outfit in the real mirror and bedroom, in disposable
  // browser storage. This never reads the user's open browser or live save.
  await page.locator('[data-act=newGame]').click();await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);$('#tip').hidden=true;closePanel();ACT.wardrobe();for(const arg of ['shirt:jacket','shirtC:#20242a','topPat:stripe','topC2:#a9abb0','bottom:cargo','pantsC:#736348','shoes:boots','shoesC:#463023','acc:bag','accC:#854333','hairS:quiff','hairC:#e9e2d4','facial:none','hat:none'])ACT.wear(arg);ACT.wardTab('look');CharacterUI115.mirrorDraw();});
  for(const hat of ['none','beanie','cap','bucket','straw']){await page.evaluate(h=>{ACT.wear('hat:'+h);ACT.wear('topPat:stripe');ACT.wear('topC2:#a9abb0');ACT.wardTab('look');CharacterUI115.mirrorDraw();},hat);await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-'+hat+'.png')});}
  await page.evaluate(()=>{ACT.wear('hat:none');ACT.wear('hairS:spikes');ACT.wear('hairC:#742eb0');ACT.wear('bottom:shorts');ACT.wear('pantsC:#18151d');ACT.wear('botPat:stripe');ACT.wear('botC2:#8b1c59');ACT.wear('topPat:stripe');ACT.wear('topC2:#a9abb0');ACT.wardTab('look');CharacterUI115.mirrorDraw();});
  await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-purple-shorts.png')});
  fs.writeFileSync(path.join(OUT,'reconstructed-appearance.json'),JSON.stringify(await page.evaluate(()=>playerLook()),null,2)+'\n');
  await page.evaluate(()=>{closePanel();View.ensureWorld();View.snap();});await page.screenshot({path:path.join(OUT,'gameplay.png')});
  console.log(JSON.stringify({errors}));if(errors.length)throw Error('Browser errors');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
