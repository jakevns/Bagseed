const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
let server,browser,url;
before(async()=>{const{createStaticServer}=await import('../tools/server.mjs');server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function inspect(fn){const page=await require('./helpers/art-page.cjs')(browser);try{await page.goto(url,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);return await page.evaluate(fn);}finally{await page.close();}}

test('custom idle breath preserves the sharp rest raster instead of squashing it',{timeout:180000},async()=>{
 const r=await inspect(()=>{let views=0;const failures=[];
  for(const topS of Object.values(__BAGSEED_ILLUSTRATED_DATA__.walk.items).filter(v=>v.kind==='top').map(v=>v.style))for(const hairS of ['short','curly'])for(const dir of ['down','right','up','left']){
   const L=BagseedArt.normalize({topS,hairS,hairC:'#9959bd',shirtC:'#17181f',facial:'mustache',face:'soft'}),a=BagseedArt.sprite(L,dir,0,0,0,0,false,3),b=BagseedArt.sprite(L,dir,0,1,0,0,false,3),x=a.getContext('2d').getImageData(0,0,a.width,a.height).data,y=b.getContext('2d').getImageData(0,0,b.width,b.height).data;
   if(x.some((v,i)=>v!==y[i])||JSON.stringify(a.bagseedEyes)!==JSON.stringify(b.bagseedEyes))failures.push({topS,hairS,dir});views++;
  }return{views,failures};});assert.equal(r.views,120);assert.deepEqual(r.failures,[]);
});

test('every walking top has visible neck skin below the jaw across frames, faces and builds',{timeout:240000},async()=>{
 const r=await inspect(()=>{const tops=Object.values(__BAGSEED_ILLUSTRATED_DATA__.walk.items).filter(v=>v.kind==='top').map(v=>v.style),dirs=['down','right','up','left'],faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],failures=[];let views=0;
  function check(topS,dir,frame,face='soft',body='average'){
   const L=BagseedArt.normalize({topS,dir,face,body,skin:'#cf9670',shirtC:'#0033ff',hairS:'bald',facial:'none',ears:'hidden',hat:'none',acc:'none'}),im=BagseedArt.sprite(L,dir,frame,0,0,0,false,3,true),origin=im.bagseedHeadOrigin,f=BagseedArt.landmarks(L,'down'),sx=(f.eyes[1][0]-f.eyes[0][0])/37,sy=(199-f.chin[1])/16,sourceX=dir==='right'?90:dir==='left'?103:96,x=origin[0]+(96+(sourceX-96)*sx)/3*BagseedArt.playerFigureScale,px=Math.round(x*3);let skin=0;
   // A high collar covers the lower neck. Inspect the exposed band below the
   // jaw, rather than demanding skin at one point inside that collar.
   for(const sourceY of [184,186,188,190]){const y=origin[1]+(199+(sourceY-199)*sy)/3*BagseedArt.playerFigureScale,py=Math.round(y*3),a=im.getContext('2d').getImageData(px-1,py-1,3,3).data;for(let n=0;n<a.length;n+=4)if(a[n+3]>160&&a[n]>70&&a[n]>a[n+1]*1.15&&a[n+1]>a[n+2]+6)skin++;}
   if(skin<4)failures.push({topS,dir,frame,face,body,skin});views++;
  }
  for(const topS of tops){for(const dir of dirs)for(let frame=0;frame<BagseedArt.customWalkFrameCount({topS},dir);frame++)check(topS,dir,frame);for(const face of faces)for(const dir of dirs)check(topS,dir,1,face);for(const body of ['slim','average','broad','curvy','stocky','tall'])for(const dir of dirs)check(topS,dir,1,'soft',body);}
  return{views,failures};});assert.equal(r.views,1620);assert.deepEqual(r.failures,[]);
});
