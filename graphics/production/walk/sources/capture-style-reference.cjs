// Export existing standing artwork unchanged as the rendering/style authority.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../..'),w=path.join(root,'graphics/production/walk'),review=path.join(root,'review/custom-walk-v3');
(async()=>{
 const {createStaticServer}=await import('../../../../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('../../../../tests/helpers/art-page.cjs')(browser,{viewport:{width:1280,height:900}});await page.goto('http://127.0.0.1:'+server.address().port,{timeout:180000});await page.evaluate(()=>BagseedArt.ready);
  const inv=JSON.parse(fs.readFileSync(path.join(root,'review/custom-walk-v1/inventory.json'))),result=await page.evaluate(inv=>{
   const references={},base=BagseedArt.normalize({skin:'#cf9670',topS:'tee',shirtC:'#5086bf',bottomS:'jeans',pantsC:'#36405a',shoesS:'sneakers',shoesC:'#2b1d14',hairS:'bald',mouth:'cat',body:'average',pres:'neutral',acc:'none',topPat:'none',botPat:'none'});
   for(const kind of ['top','bottom','shoe'])for(const style of inv[kind]){
    const L={...base,[{top:'topS',bottom:'bottomS',shoe:'shoesS'}[kind]]:style},c=document.createElement('canvas');c.width=576;c.height=864;const g=c.getContext('2d');
    ['right','left','down','up'].forEach((dir,i)=>g.drawImage(BagseedArt.body(L,dir,false,3),i%2*288,Math.floor(i/2)*432+108));references[kind+'-'+style]=c.toDataURL();
   }
   const c=document.createElement('canvas');c.width=1440;c.height=864;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,c.width,c.height);const L={...base,topS:'hoodie',shirtC:'#588455',hairS:'short',hairC:'#49322a'};
   for(let row=0;row<2;row++)for(let col=0;col<5;col++){const dir=row?'left':'right',im=BagseedArt.sprite(L,dir,col?col-1:0,0,0,0,false,3,col>0);g.drawImage(im,col*288,row*432);g.fillStyle='#eee8dc';g.font='18px sans-serif';g.fillText(col?'Walk '+col:'Standing',col*288+10,row*432+24);}
   return {references,comparison:c.toDataURL()};
  },inv);fs.mkdirSync(review,{recursive:true});for(const[id,src]of Object.entries(result.references))fs.writeFileSync(path.join(w,'assets',id+'-standing-style-reference.png'),Buffer.from(src.split(',')[1],'base64'));fs.writeFileSync(path.join(review,'standing-vs-current-side.png'),Buffer.from(result.comparison.split(',')[1],'base64'));console.log('Exported 24 existing standing references and a same-resolution comparison.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
