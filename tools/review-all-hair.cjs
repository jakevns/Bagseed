const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'review/hair-all-v12');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const{createStaticServer}=await import('./server.mjs'),app=createStaticServer(),server=http.createServer((req,res)=>{
  if(req.url==='/before'||req.url==='/current'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(path.join(ROOT,req.url==='/before'?'artifacts/hair-all-v12/before.html':process.argv.includes('--candidate')?'public/index.html.tmp':'public/index.html')));}else app.emit('request',req,res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[],comparisons=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of (process.argv.includes('--after')?['/current']:['/before','/current'])){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   const result=await page.evaluate(()=>{
    const out={},dirs=['down','right','up','left'],first=new Set(['short','buzz','crop','caesar','fade']),cuts=HAIRS.filter(([id])=>id!=='bald'&&!first.has(id)),base=BagseedArt.normalize({hairC:'#c4c4c4',skin:'#cf9670',hat:'none',facial:'none',face:'soft',topS:'jacket',shirtC:'#20242a',topPat:'stripe',topC2:'#a9abb0'});
    const sheet=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,w,h);g.font='17px sans-serif';g.fillStyle='#e5e8d8';return[c,g];};
    for(let part=0;part<Math.ceil(cuts.length/5);part++){
     const rows=cuts.slice(part*5,part*5+5),[c,g]=sheet(960,rows.length*245),[f,fg]=sheet(1000,rows.length*220);
     rows.forEach(([hairS,name],row)=>{g.fillText(name+' / '+hairS,8,row*245+20);fg.fillText(name,8,row*220+20);dirs.forEach((dir,j)=>{
      g.drawImage(BagseedArt.head({...base,hairS},dir),0,35,192,270,j*240+24,row*245+23,153.6,216);
      drawPerson(fg,125+j*245,row*220+210,{...base,hairS,hairC:'#3e9f7a'},4,{dir});
     });});out['heads-'+String(part+1).padStart(2,'0')]=c.toDataURL();out['figures-'+String(part+1).padStart(2,'0')]=f.toDataURL();
    }
    for(const hairS of ['long','bob','wavy','bun','braids','lob','halfup','layered','bluntlong','longcurls','boxbraids']){
     const faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'];
     const[c,g]=sheet(960,15*190);faces.forEach((face,row)=>{g.fillText(hairS+' / '+face,8,row*190+20);dirs.forEach((dir,j)=>drawPerson(g,125+j*235,row*190+182,{...base,hairS,face,hairC:'#3e9f7a'},3.4,{dir}));});out['shapes-'+hairS]=c.toDataURL();
    }
    const options=[['bob','normal'],['long','small'],['wavy','large'],['bun','elf'],['halfup','flat'],['boxbraids','hidden'],['balding','pointed'],['cornrows','round']], [e,eg]=sheet(1000,options.length*210);
    options.forEach(([hairS,ears],row)=>{eg.fillText(hairS+' / '+ears,8,row*210+20);dirs.forEach((dir,j)=>drawPerson(eg,125+j*245,row*210+200,{...base,hairS,ears,hairC:'#c4c4c4',glasses:'round',pierce:['hoops']},4,{dir}));});out['ears-and-glasses']=e.toDataURL();
    const[h,hg]=sheet(1000,6*210);['long','bun','braids','lob','halfup','bluntlong'].forEach((hairS,row)=>{hg.fillText(hairS,8,row*210+20);['beanie','cap','bucket','straw'].forEach((hat,j)=>drawPerson(hg,125+j*245,row*210+200,{...base,hairS,hat,hairC:'#3e9f7a',ears:'large',pierce:['hoops']},4,{dir:j%2?'right':'down'}));});out.hats=h.toDataURL();
    const[s,sg]=sheet(510,4*200);['long','bob','bun','halfup'].forEach((hairS,row)=>{sg.fillText(hairS,8,row*200+20);['down','right','up'].forEach((dir,j)=>drawPerson(sg,85+j*170,row*200+190,{...base,hairS,hairC:'#c4c4c4'},3.6,{dir}));});out['long-styles']=s.toDataURL();
    return out;
   });
   comparisons.push(result['long-styles']);
   for(const[name,url]of Object.entries(result)){const target=path.join(OUT,name+'-'+(route==='/before'?'before':'after')+'.png');fs.writeFileSync(target+'.tmp',Buffer.from(url.split(',')[1],'base64'));fs.renameSync(target+'.tmp',target);}
  }
  if(comparisons.length===2){
   const combined=await page.evaluate(async urls=>{const c=document.createElement('canvas');c.width=1020;c.height=840;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,c.width,c.height);g.fillStyle='#e5e8d8';g.font='19px sans-serif';for(let i=0;i<2;i++){const im=new Image();im.src=urls[i];await im.decode();g.fillText(i?'Updated — fitted crown and foreground ears':'Before',i*510+12,25);g.drawImage(im,i*510,40);}return c.toDataURL();},comparisons);
   const target=path.join(OUT,'long-before-after.png');fs.writeFileSync(target+'.tmp',Buffer.from(combined.split(',')[1],'base64'));fs.renameSync(target+'.tmp',target);
  }
  await page.locator('[data-act=newGame]').click();await page.locator('[data-act=crWalk][data-arg="0"]').click();
  await page.evaluate(()=>{Object.assign(runtime.cr,{hairS:'long',hairC:'#c4c4c4',face:'soft',ears:'normal',facial:'none',hat:'none',shirtC:'#20242a',topS:'jacket'});drawCreatorPreview(0);});
  await page.locator('#creatorPreview').screenshot({path:path.join(OUT,'creator-long.png')});
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2300);
  await page.evaluate(()=>{settings.speed=0;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);$('#tip').hidden=true;closePanel();ACT.wardrobe();ACT.wardTab('look');});
  for(const hairS of ['long','bob','wavy','bun','braids','halfup','bluntlong','boxbraids']){
   await page.evaluate(hairS=>{ACT.wear('hairS:'+hairS);CharacterUI115.mirrorDraw();},hairS);
   await page.locator('#panelBody canvas[data-draw="person"]').screenshot({path:path.join(OUT,'mirror-'+hairS+'.png')});
  }
  fs.writeFileSync(path.join(OUT,'browser-errors.json'),JSON.stringify(errors,null,2)+'\n');if(errors.length)throw Error(errors.join('\n'));console.log('All hairstyle review saved: '+OUT);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
