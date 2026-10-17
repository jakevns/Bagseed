// Review-only payload injection. Does not write public/index.html or game saves.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../..'),w=path.join(root,'graphics/production/walk'),review=path.join(root,'review/custom-walk-v3');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8'),{data,start,end}=require('../../../../tools/read-character-data.cjs')(html,root);
const candidate=JSON.parse(fs.readFileSync(path.join(w,'profile-v3/candidate-manifest.json')));data.walk={...candidate,rig:candidate.candidateRig};delete data.walk.candidateRig;
for(const[id,item]of Object.entries(candidate.items))if(item.profileRevision==='standing-style-profiles-v3')data.images['walk/'+id]='data:image/png;base64,'+fs.readFileSync(path.join(w,item.atlas)).toString('base64');
const trial=html.slice(0,start)+JSON.stringify(data).replace(/</g,'\\u003c')+html.slice(end);
(async()=>{
 const server=http.createServer((req,res)=>{if(req.url==='/character-data.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(fs.readFileSync(path.join(root,'public/character-data.js')));return;}if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.url.startsWith('/trial')?trial:html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const errors=[],page=await require('../../../../tests/helpers/art-page.cjs')(browser,{viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/trial',{timeout:180000});await page.evaluate(()=>BagseedArt.ready);
  const output=await page.evaluate(()=>{
   const L=BagseedArt.normalize({skin:'#cf9670',topS:'hoodie',shirtC:'#588455',bottomS:'jeans',pantsC:'#36405a',shoesS:'sneakers',shoesC:'#2b1d14',hairS:'short',hairC:'#49322a',mouth:'cat',body:'average',pres:'neutral',acc:'none',topPat:'none',botPat:'none'}),frames=[],measurements=[];
   for(let frame=0;frame<4;frame++){
    const c=document.createElement('canvas');c.width=1152;c.height=432;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,c.width,c.height);
    for(let col=0;col<4;col++){
     const dir=col<2?'right':'left',walking=col%2===1,im=BagseedArt.sprite(L,dir,walking?frame:0,0,0,0,false,3,walking);g.drawImage(im,col*288,0);g.fillStyle='#eee8dc';g.font='18px sans-serif';g.fillText(dir+' '+(walking?'new walk '+(frame+1):'standing'),col*288+10,25);
     if(walking)measurements.push({dir,frame,hand:im.bagseedHand,authored:im.bagseedAuthoredWalk,width:im.width,height:im.height});
    }frames.push(c.toDataURL());
   }
   const contact=document.createElement('canvas');contact.width=1440;contact.height=864;const g=contact.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,1440,864);
   for(let row=0;row<2;row++)for(let col=0;col<5;col++){const dir=row?'left':'right',im=BagseedArt.sprite(L,dir,col?col-1:0,0,0,0,false,3,col>0);g.drawImage(im,col*288,row*432);g.fillStyle='#eee8dc';g.font='18px sans-serif';g.fillText(col?'New walk '+col:'Standing',col*288+10,row*432+25);}
   return {frames,contact:contact.toDataURL(),measurements};
  });for(let f=0;f<4;f++)fs.writeFileSync(path.join(review,'hoodie-standing-walk-'+f+'.png'),Buffer.from(output.frames[f].split(',')[1],'base64'));fs.writeFileSync(path.join(review,'hoodie-standing-vs-new-side.png'),Buffer.from(output.contact.split(',')[1],'base64'));fs.writeFileSync(path.join(review,'hoodie-runtime-comparison.json'),JSON.stringify({status:'candidate; visual comparison required',measurements:output.measurements,browserErrors:errors},null,2)+'\n');console.log('Captured the candidate through the actual compositor, same resolution as standing, no enlarged thumbnails.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
