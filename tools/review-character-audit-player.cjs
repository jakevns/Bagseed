const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'docs/graphics/character-audit');
const write=(file,data)=>{if(fs.existsSync(file)&&fs.readFileSync(file).equals(Buffer.from(data)))return;fs.writeFileSync(file+'.tmp',data);fs.renameSync(file+'.tmp',file);};
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu']});const page=await require('../tests/helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
  const r=await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=1050;c.height=800;const g=c.getContext('2d');g.fillStyle='#e8dfce';g.fillRect(0,0,c.width,c.height);g.fillStyle='#38281c';g.font='18px sans-serif';const measurements=[];
   for(const[i,hairS]of ['short','afro','long','curly','bun'].entries()){
    const L=BagseedArt.normalize({hairS,hairC:hairS==='afro'?'#9959bd':'#4a2c1a',topS:'hoodie',shirtC:'#5f9c33',pres:'neutral'});g.fillText(hairS,10,i*160+20);
    for(const[j,dir]of ['down','right','up'].entries()){
     const im=BagseedArt.sprite(L,dir,0,0,0,0,false,3),walk=BagseedArt.sprite(L,dir,0,0,0,0,false,3,true);g.drawImage(im,80+j*130,i*160+6,96,144);g.drawImage(walk,490+j*130,i*160+6,96,144);
     const a=im.getContext('2d').getImageData(0,0,im.width,im.height).data;let lo=im.height,hi=0;for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(a[(y*im.width+x)*4+3]>80){lo=Math.min(lo,y);hi=Math.max(hi,y);}measurements.push({hairS,dir,height:(hi-lo+1)/9});
    }g.drawImage(BagseedArt.portrait(L),890,i*160+2,150,150);
   }
   const hashes={},selected=new Set(['bald','short','buzz','crop','caesar','fade']),sha=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',a))).map(v=>v.toString(16).padStart(2,'0')).join('');
   for(const[hairS]of HAIRS)if(selected.has(hairS)){let group='';for(const face of ['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'])for(const dir of ['down','right','up','left']){const h=BagseedArt.head(BagseedArt.normalize({hairS,face,hairC:'#c4c4c4'}),dir);group+=await sha(h.getContext('2d').getImageData(0,0,192,320).data);}hashes[hairS]=await sha(new TextEncoder().encode(group));}
   const reactions=document.createElement('canvas');reactions.width=960;reactions.height=540;const q=reactions.getContext('2d');q.fillStyle='#e8dfce';q.fillRect(0,0,960,540);q.font='16px sans-serif';q.fillStyle='#38281c';
   ['short','afro','long'].forEach((hairS,row)=>{q.fillText(hairS+' - idle / sniff',8,row*180+20);['down','right','up'].forEach((dir,col)=>{const L=BagseedArt.normalize({hairS,hairC:'#9959bd',topS:'hoodie',shirtC:'#5f9c33'});for(const[nose,offset]of [[false,0],[true,130]]){const im=BagseedArt.sprite(L,dir,0,0,0,0,nose,3);q.drawImage(im,10+col*320+offset,row*180+28,96,144);}});});
   return {sheet:c.toDataURL(),reactions:reactions.toDataURL(),measurements,hashes};
  });
  write(path.join(OUT,'player-cel-style.png'),Buffer.from(r.sheet.split(',')[1],'base64'));write(path.join(OUT,'player-cel-style.json'),JSON.stringify({measurements:r.measurements},null,2)+'\n');
  write(path.join(OUT,'player-reactions.png'),Buffer.from(r.reactions.split(',')[1],'base64'));
  if(process.argv.includes('--write-fixture'))fs.writeFileSync(path.join(ROOT,'tests/fixtures/hair-audit-cel-v1.json'),JSON.stringify({revision:'character-audit-cel-v1',hashes:r.hashes},null,2)+'\n');
  console.log(JSON.stringify(r.measurements));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
