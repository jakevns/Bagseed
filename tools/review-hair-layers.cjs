const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'review/hair-layer-v13');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const{createStaticServer}=await import('./server.mjs'),app=createStaticServer(),server=http.createServer((req,res)=>{
  if(req.url==='/before'||req.url==='/current'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(ROOT,req.url==='/before'?'artifacts/hair-layer-v13/before.html':'public/index.html')));}else app.emit('request',req,res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[],compare=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/before','/current']){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   const results=await page.evaluate(()=>{
    const out={},dirs=['down','right','up','left'],base=BagseedArt.normalize({hairC:'#c4c4c4',skin:'#cf9670',hat:'none',facial:'none',face:'soft',topS:'jacket',shirtC:'#20242a',topPat:'stripe',topC2:'#a9abb0'});
    const sheet=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,w,h);g.font='17px sans-serif';g.fillStyle='#e5e8d8';return[c,g];};
    const cuts=['long','bob','bun','halfup','afro','bigafro','boxbraids','longcurls'],[s,sg]=sheet(540,cuts.length*210);
    cuts.forEach((hairS,row)=>{sg.fillText(hairS,8,row*210+20);['down','right','up'].forEach((dir,j)=>drawPerson(sg,90+j*180,row*210+200,{...base,hairS},4,{dir}));});out.comparison=s.toDataURL();
    if(BagseedArt.renderingRevision==='customization-13'){
     const all=HAIRS.map(([id])=>id);
     for(let group=0;group<Math.ceil(all.length/8);group++){
      const rows=all.slice(group*8,group*8+8),[c,g]=sheet(1000,rows.length*210);
      rows.forEach((hairS,row)=>{g.fillText(hairS,8,row*210+20);dirs.forEach((dir,j)=>drawPerson(g,125+j*245,row*210+200,{...base,hairS,ears:'large',pierce:['hoops']},4,{dir}));});out['all-styles-'+(group+1)]=c.toDataURL();
     }
     const[c,g]=sheet(1000,6*230);['long','halfup','bob','afro','bun','short'].forEach((hairS,row)=>{g.fillText(hairS+' / idle, walk, cover nose, back',8,row*230+20);[{}, {frame:1},{nose:true},{dir:'up'}].forEach((anim,j)=>{
      const im=BagseedArt.sprite({...base,hairS,face:['wide','petite','long','round','heart','soft'][row],topS:'hoodie',shirtC:'#e93755'},anim.dir||'right',anim.frame||0,0,1,0,!!anim.nose,3);g.drawImage(im,j*245+60,row*230+25,128,192);
     });});out.animation=c.toDataURL();
     const[p,pg]=sheet(1000,220);['long','halfup','boxbraids','afro','bun'].forEach((hairS,j)=>{pg.fillText(hairS,j*200+5,20);pg.drawImage(BagseedArt.portrait({...base,hairS}),j*200,25,192,192);});out.portraits=p.toDataURL();
     for(const hairS of ['long','halfup','afro']){
      const[c,g]=sheet(1000,15*200);['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'].forEach((face,row)=>{g.fillText(hairS+' / '+face,8,row*200+20);dirs.forEach((dir,j)=>drawPerson(g,125+j*245,row*200+190,{...base,hairS,face,ears:'elf',acc:'moon'},3.6,{dir}));});out['shapes-'+hairS]=c.toDataURL();
     }
    }return out;
   });compare.push(results.comparison);
   for(const[name,url]of Object.entries(results)){const target=path.join(OUT,name+(route==='/before'?'-before':'-after')+'.png');fs.writeFileSync(target+'.tmp',Buffer.from(url.split(',')[1],'base64'));fs.renameSync(target+'.tmp',target);}
  }
  const comparison=await page.evaluate(async urls=>{const c=document.createElement('canvas');c.width=1080;c.height=1720;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,c.width,c.height);g.fillStyle='#e5e8d8';g.font='19px sans-serif';for(let i=0;i<2;i++){const im=new Image();im.src=urls[i];await im.decode();g.fillText(i?'Updated — hair above clothes, covered ears':'Before',i*540+12,25);g.drawImage(im,i*540,40);}return c.toDataURL();},compare);
  fs.writeFileSync(path.join(OUT,'before-after.png'),Buffer.from(comparison.split(',')[1],'base64'));
  await page.locator('[data-act=newGame]').click();await page.locator('[data-act=crWalk][data-arg="0"]').click();
  await page.evaluate(()=>{Object.assign(runtime.cr,{hairS:'long',hairC:'#c4c4c4',face:'soft',ears:'large',pierce:['hoops'],facial:'none',hat:'none',shirtC:'#20242a',topS:'jacket'});drawCreatorPreview(0);});
  await page.locator('#creatorPreview').screenshot({path:path.join(OUT,'creator-long.png')});
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);$('#tip').hidden=true;closePanel();ACT.wardrobe();ACT.wardTab('look');});
  for(const hairS of ['long','bob','bun','halfup','afro','bigafro']){
   await page.evaluate(hairS=>{ACT.wear('hairS:'+hairS);CharacterUI115.mirrorDraw();},hairS);
   await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-'+hairS+'.png')});
  }
  fs.writeFileSync(path.join(OUT,'browser-errors.json'),JSON.stringify(errors,null,2)+'\n');if(errors.length)throw Error(errors.join('\n'));console.log('Hair layer review saved: '+OUT);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
