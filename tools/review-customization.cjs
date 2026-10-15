const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const out=path.resolve('review/customization-v3');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const {createStaticServer}=await import('./server.mjs');const server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(()=>BagseedArt.ready);
  const pictures=await page.evaluate(()=>{
   const base=BagseedArt.normalize({skin:'#cf9670',hairC:'#4a2c1a',hairS:'short',shirtC:'#5f9c33',topS:'hoodie',pantsC:'#36405a',bottomS:'jeans',shoesS:'sneakers',shoesC:'#2b1d14'});
   const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#e4ece0';g.fillRect(0,0,w,h);g.fillStyle='#26372c';g.font='15px sans-serif';return[c,g];};
   const [hair,hg]=make(1200,1560);HAIRS.forEach(([hairS,label],i)=>{const x=i%10*120,y=Math.floor(i/10)*260;hg.fillText(label.slice(0,17),x+4,y+18);hg.drawImage(BagseedArt.portrait({...base,hairS}),x+6,y+25,108,108);hg.drawImage(charSprite({...base,hairS},'down'),x+10,y+140,48,54);hg.drawImage(charSprite({...base,hairS},'right'),x+62,y+140,48,54);hg.drawImage(charSprite({...base,hairS},'up'),x+10,y+202,32,36);hg.drawImage(charSprite({...base,hairS},'left',1),x+60,y+202,32,36);});
   const rows=[['Short hair, hoodie',base],['Green hair, boots, bag',{...base,hairC:'#3e9f7a',topS:'tee',shirtC:'#1d1f22',shoesS:'boots',acc:'bag'}],['Long hair, cardigan, skirt',{...base,hairS:'long',topS:'cardigan',bottomS:'skirt',pres:'fem'}],['Ponytail, crop top, shorts',{...base,hairS:'ponytail',topS:'crop',bottomS:'shorts',pres:'fem'}],['Broad, curly hair, cargo',{...base,hairS:'curly',body:'broad',bottomS:'cargo'}],['Finished cast reference',BagseedArt.cast.find(p=>p.id==='cast-28-dev').look]];
   const [comparison,g]=make(1200,rows.length*230);rows.forEach(([label,look],i)=>{const y=i*230;g.fillStyle='#26372c';g.fillText(label,5,y+20);['down','right','up','left'].forEach((d,j)=>{g.drawImage(charSprite(look,d),160+j*175,y+15,144,162);g.drawImage(charSprite(look,d,1),170+j*175,y+182,32,36);g.drawImage(charSprite(look,d,3),215+j*175,y+182,32,36);});g.drawImage(BagseedArt.portrait(look),940,y+12,192,192);});
   const [options,og]=make(1200,760),variants=[...['round','square','long','petite','strong','wide'].map(face=>[face,{...base,face}]),...['none','stubble','mustache','beard','goatee','handlebar'].map(facial=>[facial,{...base,facial}]),...['none','cap','bucket','beanie','wizard','straw'].map(hat=>[hat,{...base,hat}]),...['none','round','square','shades','headphones','earring'].map(value=>[value,{...base,...(['headphones','earring'].includes(value)?{acc:value}:{glasses:value})}])];variants.forEach(([label,look],i)=>{const x=i%8*150,y=Math.floor(i/8)*250;og.fillText(label,x+5,y+18);og.drawImage(BagseedArt.portrait(look),x+5,y+25,140,140);og.drawImage(charSprite(look,'down'),x+25,y+175,48,54);});
   return {hairstyles:hair.toDataURL(),characters:comparison.toDataURL(),options:options.toDataURL()};
  });
  for(const [name,url]of Object.entries(pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
