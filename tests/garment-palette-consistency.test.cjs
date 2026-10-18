const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('suit cloth values match idle and lab coats stay white in every walking phase',{timeout:180000},async()=>{
 const{createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
 const result=await page.evaluate(()=>{let views=0;const failures=[],values=[];
  function sample(im,white=false){const p=im.getContext('2d').getImageData(0,0,288,432).data,a=im.bagseedAlignment,v=[];
   for(let y=Math.ceil((a.collar[1]+7)*3);y<(a.collar[1]+22)*3;y++)for(let x=Math.floor((a.collar[0]-12)*3);x<(a.collar[0]+12)*3;x++){
    const n=(y*288+x)*4;if(p[n+3]<240)continue;
    // The approved standing coat uses warm ivory, not neutral RGB white.
    if(white?Math.min(p[n],p[n+1],p[n+2])>175&&Math.max(p[n],p[n+1],p[n+2])-Math.min(p[n],p[n+1],p[n+2])<50:p[n+2]>p[n]*1.8&&p[n+2]>p[n+1]*1.4)v.push(p[n+2]);
   }v.sort((a,b)=>a-b);return{pixels:v.length,median:v[Math.floor(v.length/2)]||0};
  }
  for(const topS of ['suit','labcoat'])for(const dir of ['down','right','up','left']){
   const L=BagseedArt.normalize({topS,shirtC:'#2244ee',pantsC:'#222222',hairS:'bald',ears:'hidden',facial:'none',acc:'none',hat:'none'}),white=topS==='labcoat',idle=sample(BagseedArt.sprite(L,dir,0,0,0,0,false,3),white);
   for(let frame=0;frame<BagseedArt.customWalkFrameCount(L,dir);frame++){
    const moving=sample(BagseedArt.sprite(L,dir,frame,0,0,0,false,3,true),white),row={topS,dir,frame,idle,moving};values.push(row);views++;
    if(moving.pixels<50||idle.pixels<50||Math.abs(moving.median-idle.median)>48)failures.push(row);
   }
  }return{views,values,failures};});fs.mkdirSync(path.resolve('review/custom-alignment'),{recursive:true});fs.writeFileSync(path.resolve('review/custom-alignment/garment-color-checks.json'),JSON.stringify(result,null,2)+'\n');assert.equal(result.views,48);assert.deepEqual(result.failures,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
