const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(ROOT,process.argv[2]||'review/customization-v5');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1350,height:1000}});page.on('pageerror',error=>{throw error;});await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(()=>BagseedArt.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('[data-act=cr][data-arg="hairC:#e9e2d4"]').click();await page.locator('[data-act=crWalk][data-arg="0"]').click();
  for(const [name,options]of [['bald-base',{hairS:'bald',hat:'none',facial:'none'}],['silver-short',{hairS:'short'}],['silver-cap',{hat:'cap'}],['silver-long',{hairS:'bluntlong',hat:'none'}],['silver-bun',{hairS:'bun'}],['silver-beard',{hairS:'short',facial:'beard'}]]){
   for(const [field,value]of Object.entries(options)){
    if(field==='hairS'){const group=await page.evaluate(v=>HAIR115.group(v),value);await page.locator(`[data-act=hairGrp][data-arg="${group}"]`).click();}
    await page.locator(`[data-act=cr][data-arg="${field}:${value}"]`).click();
   }
   await page.evaluate(()=>drawCreatorPreview(0));await page.locator('#creatorPreview').screenshot({path:path.join(OUT,'preview-'+name+'.png')});
  }
  const result=await page.evaluate(()=>{
   const images={},issues=[],dirs=['down','right','up','left'],base=BagseedArt.normalize({skin:'#cf9670',hairS:'short',hairC:'#ffffff',shirtC:'#5f9c33',topS:'hoodie',pantsC:'#36405a'});
   const sheet=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#e4eadd';g.fillRect(0,0,w,h);g.font='15px sans-serif';return[c,g];};
   const label=(g,text,x,y)=>{g.fillStyle='#26392e';g.fillText(text,x,y);};
   const head=(g,image,x,y,w=102)=>g.drawImage(image,x,y,w,w*image.height/image.width);
   const figure=(g,look,dir,x,foot,frame=0,blink=false)=>drawPerson(g,x,foot,look,3,{dir,frame,blink});
   for(let group=0;group<Math.ceil(HAIRS.length/10);group++){
    const rows=HAIRS.slice(group*10,group*10+10),[c,g]=sheet(1440,rows.length*210);
    rows.forEach(([hairS,name],row)=>{const y=row*210;label(g,name,5,y+17);['#ffffff','#3e9f7a','#e48ab8'].forEach((hairC,k)=>dirs.forEach((dir,j)=>{const x=k*480+j*120;g.fillStyle=k===0?'#24202a':k===1?'#f7f5e9':'#7f8e80';g.fillRect(x,y+22,120,187);head(g,BagseedArt.head({...base,hairS,hairC},dir),x+9,y+23);}));});images['hair-colors-'+(group+1)]=c.toDataURL();
   }
   const [layers,lg]=sheet(1100,4*230);['Bald anatomy','Transparent hair','Composed head','Composed cap'].forEach((s,i)=>label(lg,s,i*275+25,18));
   dirs.forEach((dir,row)=>{const y=row*230;const look={...base,hairS:'short'};[BagseedArt.baldBase(look,dir),BagseedArt.hairLayer(look,dir),BagseedArt.head(look,dir),BagseedArt.head({...look,hat:'cap'},dir)].forEach((im,j)=>{const x=j*275+60;for(let yy=0;yy<190;yy+=10)for(let xx=0;xx<114;xx+=10){lg.fillStyle=(xx/10+yy/10)%2?'#777':'#aaa';lg.fillRect(x+xx,y+25+yy,10,10);}head(lg,im,x,y+25,114);});});images['bald-hair-hat-layers']=layers.toDataURL();
   const hats=['cap','beanie','bucket','straw','sunhat','officer','wizard','beret'],[hc,hg]=sheet(1440,hats.length*210);
   hats.forEach((hat,row)=>{const y=row*210;label(hg,hat,5,y+17);['bald','short','afro'].forEach((hairS,k)=>dirs.forEach((dir,j)=>head(hg,BagseedArt.head({...base,hairS,hat},dir),k*480+j*120+9,y+24)));});images.hats=hc.toDataURL();
   const [ac,ag]=sheet(1280,3*190);[base,{...base,hat:'cap'},{...base,hairS:'bun',hairC:'#e48ab8'}].forEach((look,row)=>{const y=row*190;label(ag,['Silver','Cap','Bun'][row],3,y+18);dirs.forEach((dir,j)=>[0,1,2,3].forEach((frame,k)=>figure(ag,look,dir,50+j*320+k*75,y+180,frame,k===2)));});images['animation-frames']=ac.toDataURL();
   const tops=['tee','tank','hoodie','flannel','sweater','cardigan','overalls','work','crop','jacket','garden','pjs','labcoat','suit','officer'],[oc,og]=sheet(1200,Math.ceil(tops.length/3)*190);
   tops.forEach((topS,i)=>{const x=i%3*400,y=Math.floor(i/3)*190;label(og,topS,x+5,y+18);dirs.forEach((dir,j)=>figure(og,{...base,topS},dir,x+55+j*95,y+182));});images.outfits=oc.toDataURL();
   const [fc,fg]=sheet(1200,Math.ceil(FACIAL.length/4)*220);FACIAL.forEach(([facial,name],i)=>{const x=i%4*300,y=Math.floor(i/4)*220;label(fg,name,x+4,y+18);dirs.slice(0,2).forEach((dir,j)=>head(fg,BagseedArt.head({...base,facial,hairC:'#4a2c1a'},dir),x+12+j*140,y+22,110));});images['facial-hair']=fc.toDataURL();
   for(const [hairS]of HAIRS)for(const dir of dirs){const c=BagseedArt.head({...base,hairS},dir),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let edge=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if((x<2||x>c.width-3||y<2||y>c.height-3)&&a[(y*c.width+x)*4+3]>100)edge++;if(edge)issues.push({hairS,dir,edge});}
   return {images,issues};
  });
  for(const [name,url]of Object.entries(result.images))fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  fs.writeFileSync(path.join(OUT,'audit.json'),JSON.stringify(result.issues,null,2)+'\n');console.log(JSON.stringify({boundaryIssues:result.issues}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
