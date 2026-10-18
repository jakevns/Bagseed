const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('hair preserves pale material, clips mohawk sides to the scalp and leaves no cream cheek strips',{timeout:180000},async()=>{
 const{createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
 const result=await page.evaluate(()=>{const failures=[];let views=0;
  const read=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  for(const dir of ['down','right','up','left']){
   const L=BagseedArt.normalize({hairS:'mohawk',hairC:'#9959bd',hat:'none'}),hair=read(BagseedArt.hairLayer(L,dir)),scalp=read(BagseedArt.baldBase(L,dir));let outside=0;
   for(let y=126;y<320;y++)for(let x=0;x<192;x++){const n=(y*192+x)*4;if(hair[n+3]>5&&scalp[n+3]===0)outside++;}
   if(outside)failures.push({dir,outside,reason:'mohawk outside skull'});
  }
  for(const[hairS]of HAIRS){
   const L=BagseedArt.normalize({hairS,hairC:'#9959bd',hairHi:'none',hat:'none',glasses:'none',facial:'none',acc:'none'}),face=read(BagseedArt.head(L,'down',false,true)),eyes=BagseedArt.landmarks(L,'down').eyes;let stray=0;
   for(let y=155;y<181;y++)for(let x=50;x<143;x++){
    if(x>76&&x<118||eyes.some(([ex,ey])=>((x-ex)/15)**2+((y-ey)/14)**2<1))continue;
    const n=(y*192+x)*4;if(face[n+3]>230&&Math.min(face[n],face[n+1],face[n+2])>235)stray++;
   }
   if(stray)failures.push({hairS,stray,reason:'cream strips beside cheeks'});
   for(const dir of ['down','right','up','left']){
    const a=read(BagseedArt.hairLayer({...L,hairC:'#eeeeee'},dir));let colored=0,dark=0;
    for(let n=0;n<a.length;n+=4)if(a[n+3]>230){const ink=Math.abs(a[n]-58)<3&&Math.abs(a[n+1]-38)<3&&Math.abs(a[n+2]-28)<3;if(!ink){colored++;if(Math.min(a[n],a[n+1],a[n+2])<195)dark++;}}
    if(dark)failures.push({hairS,dir,dark,colored,reason:'white hair has dirty gray material'});views++;
   }
  }return{views,failures};});assert.equal(result.views,244);assert.deepEqual(result.failures,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
