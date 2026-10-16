// Hair fit contact sheets from the real renderer in disposable browser storage.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'review/customization-v10');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),app=createStaticServer();
 const server=http.createServer((req,res)=>{if(req.url==='/before'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(ROOT,'artifacts/hair-fit-v10/before.html')));}else app.emit('request',req,res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[],comparisons=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of (process.argv.includes('--before')?['/before']:process.argv.includes('--after')?['/']:['/before','/'])){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   const images=await page.evaluate(()=>{
    const images={},dirs=['down','right','up','left'],base=BagseedArt.normalize({hairC:'#c4c4c4',skin:'#cf9670',hat:'none',facial:'none',face:'soft',topS:'jacket',shirtC:'#20242a',topPat:'stripe',topC2:'#a9abb0',bottomS:'shorts',pantsC:'#202026',shoesS:'boots'});
    const sheet=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,w,h);g.font='16px sans-serif';g.fillStyle='#e5e8d8';return[c,g];};
    for(let part=0;part<Math.ceil(HAIRS.length/6);part++){
     const rows=HAIRS.slice(part*6,part*6+6),[c,g]=sheet(920,rows.length*220);
     rows.forEach(([hairS,name],row)=>{g.fillText(name,8,row*220+19);dirs.forEach((dir,j)=>g.drawImage(BagseedArt.head({...base,hairS},dir),8,65,176,153,j*230+5,row*220+25,220,191.25));});images['cuts-'+String(part+1).padStart(2,'0')]=c.toDataURL();
    }
    for(let part=0;part<Math.ceil(HAIRS.length/12);part++){
     const rows=HAIRS.slice(part*12,part*12+12),[c,g]=sheet(960,Math.ceil(rows.length/2)*210);
     rows.forEach(([hairS,name],i)=>{const x=i%2*480,y=Math.floor(i/2)*210;g.fillText(name,x+8,y+19);dirs.forEach((dir,j)=>g.drawImage(BagseedArt.head({...base,hairS},dir),x+5+j*118,y+25,110,183.3));});images['full-styles-'+(part+1)]=c.toDataURL();
    }
    const reported=['crop','caesar','fade','buzz','flattop','bowl','short','slick'],[r,rg]=sheet(1020,reported.length*190);
    reported.forEach((hairS,row)=>{rg.fillText(hairS,8,row*190+18);dirs.forEach((dir,j)=>drawPerson(rg,110+j*245,row*190+184,{...base,hairS,hairC:'#3e9f7a'},4,{dir}));});images['short-cut-figures']=r.toDataURL();
    const faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'];
    for(let part=0;part<3;part++){
     const[c,g]=sheet(1200,5*185);faces.slice(part*5,part*5+5).forEach((face,row)=>{g.fillText(face,8,row*185+18);['crop','flattop','sidepixie'].forEach((hairS,k)=>dirs.forEach((dir,j)=>g.drawImage(BagseedArt.head({...base,face,hairS},dir),20,70,152,140,8+k*400+j*98,row*185+25,96,88.4)));});images['shapes-'+(part+1)]=c.toDataURL();
    }
    const[p,pg]=sheet(720,280);['Front','Side','Back'].forEach((name,j)=>pg.fillText(name,j*240+90,20));
    dirs.slice(0,3).forEach((dir,j)=>drawPerson(pg,120+j*240,274,{...base,hairS:'crop',hairC:'#3e9f7a',acc:'bag',accC:'#854333'},6,{dir}));images['reported-crop']=p.toDataURL();
    return images;
   });
   for(const[name,url]of Object.entries(images))fs.writeFileSync(path.join(OUT,name+'-'+(route==='/before'?'before':'after')+'.png'),Buffer.from(url.split(',')[1],'base64'));
   comparisons.push(images['reported-crop']);
   await page.locator('[data-act=newGame]').click();await page.locator('[data-act=crWalk][data-arg="0"]').click();
   await page.evaluate(()=>{Object.assign(runtime.cr,{hairS:'crop',hairC:'#3e9f7a',face:'soft',facial:'none',hat:'none',shirtC:'#20242a',topS:'jacket',topPat:'stripe',topC2:'#a9abb0',bottomS:'shorts',pantsC:'#18151d',botPat:'stripe',botC2:'#8b1c59',shoesS:'boots',shoesC:'#463023',acc:'bag',accC:'#854333'});drawCreatorPreview(0);});
   const suffix=route==='/before'?'before':'after';await page.locator('#creatorPreview').screenshot({path:path.join(OUT,'creator-crop-'+suffix+'.png')});
   await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
   await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);$('#tip').hidden=true;closePanel();ACT.wardrobe();ACT.wardTab('look');CharacterUI115.mirrorDraw();});
   await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-crop-'+suffix+'.png')});
   await page.evaluate(()=>{closePanel();View.ensureWorld();View.snap();});await page.screenshot({path:path.join(OUT,'bedroom-crop-'+suffix+'.png')});
  }
  if(comparisons.length===2){
   const combined=await page.evaluate(async urls=>{const c=document.createElement('canvas');c.width=720;c.height=620;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,720,620);g.font='18px sans-serif';g.fillStyle='#e5e8d8';for(let i=0;i<2;i++){const im=new Image();im.src=urls[i];await im.decode();g.fillText(i?'Updated — fitted at scalp and temples':'Before',15,i*310+24);g.drawImage(im,0,i*310+30);}return c.toDataURL();},comparisons);
   fs.writeFileSync(path.join(OUT,'hair-root-comparison.png'),Buffer.from(combined.split(',')[1],'base64'));
  }
  if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({errors,output:OUT}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
