const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const OUT=path.resolve(__dirname,'../review/neck-v14');
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  fs.mkdirSync(OUT,{recursive:true});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(()=>BagseedArt.ready);
  const faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'];
  const child=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../review/characters-v2/sources/baseline-assets.json'))).people.find(p=>p.id==='poppy').look;
  const sheets={
   'reaction-garments':['tee','tank','hoodie','flannel','sweater','cardigan','overalls','work','crop','jacket','garden','pjs','labcoat','suit','officer'].map(topS=>({label:topS,look:{topS}})),
   'reaction-shapes':faces.map((face,i)=>({label:face,look:{face,topS:'tank',hairS:['bald','long','short','afro','halfup'][i%5],body:['slim','stocky','average','tall','curvy'][i%5],short:i===1,skin:['#cf9670','#5d3829','#f0c7a0'][i%3]}})),
   'reaction-sizes':[{label:'child',look:{...child,topS:'tank'}},...['slim','average','broad','curvy','stocky','tall'].flatMap(body=>[{label:body,look:{body,topS:'tank'}},{label:'short '+body,look:{body,short:true,topS:'tank'}}])]
  };
  for(const [name,rows]of Object.entries(sheets)){
   const data=await page.evaluate(rows=>{
    const c=document.createElement('canvas');c.width=1200;c.height=rows.length*230;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,c.width,c.height);g.fillStyle='white';g.font='16px sans-serif';
    rows.forEach(({label,look},row)=>['down','right','up','left'].forEach((dir,col)=>{
     const L=BagseedArt.normalize({hairS:'short',hairC:'#c4c4c4',topS:'tank',shirtC:'#0066ff',skin:'#cf9670',...look}),F=BagseedArt.sprite(L,dir,0,0,0,0,true,3);
     g.fillText(label+' '+dir,col*300+8,row*230+20);g.drawImage(F,col*300,row*230+26,96,144);
     // Include the actual jaw and collar in the enlargement, even for shorter figures.
     const eyes=F.bagseedEyes,eyeY=eyes.length?eyes[0][1]:L.short?80:70,cy=Math.max(0,eyeY*3-15);
     g.drawImage(F,65,cy,165,125,col*300+80,row*230+28,215,163);
    }));
    const detail=document.createElement('canvas');detail.width=1200;detail.height=230;detail.getContext('2d').drawImage(c,0,230,1200,230,0,0,1200,230);
    return {sheet:c.toDataURL(),detail:detail.toDataURL()};
   },rows);
   fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(data.sheet.split(',')[1],'base64'));
   if(name==='reaction-garments')fs.writeFileSync(path.join(OUT,'reaction-detail.png'),Buffer.from(data.detail.split(',')[1],'base64'));
  }
  fs.writeFileSync(path.join(OUT,'reaction-browser-errors.json'),JSON.stringify(errors,null,2)+'\n');if(errors.length)throw Error(errors.join('\n'));
  console.log('Reaction garment, face and size review saved to '+OUT);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
