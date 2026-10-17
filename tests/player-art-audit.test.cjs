const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('adult player height and solid cel hair match the authored character scale',{timeout:180000},async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
  const r=await page.evaluate(()=>{
   const base=BagseedArt.normalize({hairS:'short',hairC:'#9959bd',topS:'hoodie',shirtC:'#5f9c33',pres:'neutral'}),heights=[],hair=[];
   for(const dir of ['down','right','up','left'])for(const [walk,nose]of [[false,false],[true,false],[false,true]]){
    const im=BagseedArt.sprite(base,dir,0,0,0,0,nose,3,walk),a=im.getContext('2d').getImageData(0,0,im.width,im.height).data;let top=im.height,bottom=-1;
    for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(a[(y*im.width+x)*4+3]>80){top=Math.min(top,y);bottom=Math.max(bottom,y);}heights.push({dir,walk,nose,height:(bottom-top+1)/9});
   }
   for(const hairS of ['short','afro','long','curly','bun'])for(const dir of ['down','right','up','left']){
    const im=BagseedArt.hairLayer({...base,hairS},dir),a=im.getContext('2d').getImageData(0,0,192,320).data,colors=new Map();
    for(let n=0;n<a.length;n+=4)if(a[n+3]>250){const color=[a[n],a[n+1],a[n+2]].join(',');colors.set(color,(colors.get(color)||0)+1);}
    hair.push({hairS,dir,colors:colors.size,substantial:[...colors.values()].filter(n=>n>100).length});
   }return {heights,hair};
  });
  for(const row of r.heights)assert.ok(Math.abs(row.height-33.3)<=1,JSON.stringify(row));
  for(const row of r.hair){assert.ok(row.colors<=4,JSON.stringify(row));assert.ok(row.substantial>=2,JSON.stringify(row));}
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
