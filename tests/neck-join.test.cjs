const artPage=require('./helpers/art-page.cjs');
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/neck-v14');let browser,server,url;
before(async()=>{fs.mkdirSync(OUT,{recursive:true});const{createStaticServer}=await import('../tools/server.mjs');server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function inspect(name,fn,arg){const page=await artPage(browser,),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await page.goto(url);await page.evaluate(()=>BagseedArt.ready);const r=await page.evaluate(fn,arg);fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(r,null,2)+'\n');assert.deepEqual(errors,[]);return r;}finally{await page.close();}}

test('attached heads omit their painted neck while preserving the face, jaw and hair',async()=>{
 const r=await inspect('head-neck-ownership',()=>{
  const failures=[],faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'];let views=0,neckPixels=0,facePixels=0;
  const read=c=>c.getContext('2d').getImageData(0,0,192,320).data;
  for(const face of faces)for(const dir of ['down','right','up','left']){
   const L=BagseedArt.normalize({face,hairS:'bald',hat:'none',facial:'none',acc:'none',ears:'hidden'}),base=read(BagseedArt.head(L,dir)),joined=read(BagseedArt.head(L,dir,false,true)),shapeY=(199-BagseedArt.landmarks(L,'down').chin[1])/16,shapeX=face==='soft'?1:({round:1.03,angular:.97,long:.94,square:1.06,heart:1.03,oval:.97,diamond:1.06,oblong:.94,pear:1.05,triangle:1.06,wide:1.12,petite:.92,strong:1.09,button:.97}[face]);
   for(let y=192;y<=197;y++)for(let x=dir==='right'?87:dir==='left'?98:88;x<=(dir==='right'?95:dir==='left'?106:104);x++){
    const xx=Math.round(96+(x-96)*shapeX),yy=Math.round(199+(y-199)*shapeY),n=(yy*192+xx)*4;if(base[n+3]>230){neckPixels++;if(joined[n+3]>5)failures.push({face,dir,x,y,alpha:joined[n+3],reason:'second head neck'});}
   }
   const box=dir==='down'?[78,148,116,182]:dir==='right'?[107,148,132,182]:dir==='left'?[61,148,86,182]:[70,130,124,174];
   for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){
    const xx=Math.round(96+(x-96)*shapeX),yy=Math.round(199+(y-199)*shapeY),n=(yy*192+xx)*4;
    if(Math.max(...[0,1,2,3].map(k=>Math.abs(base[n+k]-joined[n+k])))>1)failures.push({face,dir,x,y,reason:'face or jaw changed'});facePixels++;
   }
   views++;
  }
  for(const hairS of ['short','long','halfup','afro','boxbraids'])for(const dir of ['down','right','up','left']){
   const L=BagseedArt.normalize({hairS,hairC:'#b64fd2',facial:'none',hat:'none'}),normal=read(BagseedArt.head(L,dir)),joined=read(BagseedArt.head(L,dir,false,true)),hair=read(BagseedArt.hairLayer(L,dir));
   for(let y=180;y<310;y++)for(let x=0;x<192;x++){const n=(y*192+x)*4;if(hair[n+3]>250&&Math.max(...[0,1,2].map(k=>Math.abs(normal[n+k]-joined[n+k])))>4)failures.push({hairS,dir,x,y,reason:'neck removal cut hair'});}views++;
  }
  return{views,neckPixels,facePixels,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,10)));assert.equal(r.views,80);assert.ok(r.neckPixels>2000);
});

test('standing garments and head/body shapes share one body neck and one jaw attachment',async()=>{
 const r=await inspect('figure-neck-ownership',()=>{
  const failures=[],tops=['tee','tank','hoodie','flannel','sweater','cardigan','overalls','work','crop','jacket','garden','pjs','labcoat','suit','officer'],faces=['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'],bodies=['slim','average','broad','curvy','stocky','tall'];let views=0,neckPixels=0,eyes=0;
  const cv=()=>{const c=document.createElement('canvas');c.width=288;c.height=432;return c;},read=c=>c.getContext('2d').getImageData(0,0,288,432).data;
  for(const topS of tops)for(const face of faces)for(const[bi,body]of bodies.entries())for(const dir of ['down','right','up','left']){
   const L=BagseedArt.normalize({topS,face,body,pres:['neutral','masc','fem'][bi%3],skin:['#f0c7a0','#cf9670','#5d3829'][bi%3],hairS:'bald',facial:'none',ears:'hidden',hat:'none',acc:'none'}),sy=body==='tall'?1.07:1,width=({slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[body])*(L.pres==='masc'?1.045:L.pres==='fem'?.955:1),shapeY=(199-BagseedArt.landmarks(L,'down').chin[1])/16,neck=143-65*sy,headY=neck-(199-15*shapeY)/3;
   for(const nose of [false]){
    const projected=cv(),g=projected.getContext('2d'),B=BagseedArt.body(L,dir,nose,3);g.scale(3,3);g.translate(48,143);g.scale(width,sy);g.drawImage(B,-48,-107,96,108);const registered=cv(),r=registered.getContext('2d'),factor=BagseedArt.playerFigureScale;r.imageSmoothingQuality='high';r.setTransform(factor,0,0,factor,144*(1-factor),429*(1-factor));r.drawImage(projected,0,0);const expected=read(registered),sprite=BagseedArt.sprite(L,dir,0,0,0,0,nose,3),a=read(sprite);
    // This band lies below the jaw and within the removed head-neck material.
    // Its skin and collar must come directly from the selected garment body.
    for(let y=neck+3;y<neck+5;y+=.5)for(let x=46;x<=49;x+=.5){const xx=Math.round((48+(x-48)*factor)*3),yy=Math.round((143+(y-143)*factor)*3),n=(yy*288+xx)*4;if(expected[n+3]>250){neckPixels++;if(Math.max(...[0,1,2,3].map(k=>Math.abs(expected[n+k]-a[n+k])))>6)failures.push({topS,face,body,dir,nose,x,y,reason:'head repainted body neck'});}}
    const features=BagseedArt.landmarks(L,dir).eyes;for(let i=0;i<features.length;i++){const[x,y]=features[i],actual=sprite.bagseedEyes[i],target=[48+(x-96)/3*factor,143+(headY+y/3-143)*factor];if(actual.some((v,k)=>Math.abs(v-target[k])>.001))failures.push({topS,face,body,dir,nose,reason:'jaw attached at old neck root'});eyes++;}
    views++;
   }
  }return{views,neckPixels,eyes,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,10)));assert.equal(r.views,5400);assert.ok(r.neckPixels>50000);
});

test('reaction fingers actually meet the nose instead of the throat for every garment',async()=>{
 const r=await inspect('reaction-contact',()=>{
  const failures=[];let views=0,handPixels=0;
  for(const topS of ['tee','tank','hoodie','flannel','sweater','cardigan','overalls','work','crop','jacket','garden','pjs','labcoat','suit','officer'])for(const face of ['soft','wide','petite','long','button'])for(const body of ['slim','average','broad','curvy','stocky','tall'])for(const dir of ['down','right','left']){
   const L=BagseedArt.normalize({topS,face,body,short:body==='stocky',hairS:'bald',skin:'#cf9670',shirtC:'#0066ff',facial:'none',hat:'none',acc:'none'}),B=BagseedArt.body(L,dir,true,3),raw=B.getContext('2d').getImageData(0,0,288,324).data;
   // Find the fingers from the rendered body pixels, independently of the
   // attachment metadata. The previous renderer misses this by 9–15 pixels.
   const skin=(x,y)=>{const n=(y*288+x)*4;return raw[n+3]>160&&raw[n]>raw[n+1]*1.15&&raw[n+1]>raw[n+2]+6;};let first=-1,total=0,count=0;
   for(let y=90;y<170&&first<0;y++)for(let x=80;x<220;x++)if(skin(x,y)){first=y;break;}
   for(let y=first;y<=first+5;y++)for(let x=80;x<220;x++)if(skin(x,y)){total+=x;count++;}
   if(!count){failures.push({topS,dir,reason:'no fingers'});continue;}
   const hand=[total/count/3,first/3+1.5],sy=L.short?.9:body==='tall'?1.07:1,width=({slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[body]),sprite=BagseedArt.sprite(L,dir,0,0,0,0,true,3),f=BagseedArt.landmarks(L,'down'),origin=sprite.bagseedEyes[0].map((v,i)=>v-f.eyes[0][i]/3),nose=f.nose.map((v,i)=>origin[i]+v/3),target=[48+(hand[0]-48)*width,143+(hand[1]-107)*sy];
   const error=Math.hypot(nose[0]-target[0],nose[1]-target[1]);if(error>.7)failures.push({topS,face,body,dir,error,nose,target,reason:'hand at throat instead of nose'});
   const projected=document.createElement('canvas');projected.width=288;projected.height=432;const g=projected.getContext('2d');g.scale(3,3);g.translate(48,143);g.scale(width,sy);g.drawImage(B,-48,-107,96,108);
   const p=projected.getContext('2d').getImageData(0,0,288,432).data,a=sprite.getContext('2d').getImageData(0,0,288,432).data;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=Math.round(target[0]*3)+dx,y=Math.round(target[1]*3)+dy,n=(y*288+x)*4;if(p[n+3]>250){handPixels++;if(Math.max(...[0,1,2,3].map(k=>Math.abs(p[n+k]-a[n+k])))>8)failures.push({topS,face,body,dir,reason:'fingers hidden behind face'});}}
   views++;
  }return{views,handPixels,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,10)));assert.equal(r.views,1350);assert.ok(r.handPixels>8000);
});

test('portraits also use the body neck rather than a second head neck',async()=>{
 const r=await inspect('portrait-neck-ownership',()=>{
  const failures=[];let views=0,neckPixels=0;
  for(const topS of ['tee','tank','hoodie','flannel','sweater','cardigan','overalls','work','crop','jacket','garden','pjs','labcoat','suit','officer'])for(const face of ['soft','wide','petite','long','heart']){
   const L=BagseedArt.normalize({topS,face,hairS:'bald',facial:'none',hat:'none',acc:'none',shirtC:'#263347'}),h=BagseedArt.head(L,'down',false,true),p=h.getContext('2d').getImageData(0,0,192,320).data;let top=320;
   for(let y=0;y<320&&top===320;y++)for(let x=0;x<192;x++)if(p[(y*192+x)*4+3]>100){top=y;break;}
   const shapeY=(199-BagseedArt.landmarks(L,'down').chin[1])/16,anchor=199-15*shapeY+5,fit=Math.min(1,116/(anchor-top)),c=document.createElement('canvas');c.width=c.height=192;const g=c.getContext('2d');g.translate(96,148);g.scale(fit,fit);const B=BagseedArt.body(L,'down',false,3);g.drawImage(B,0,120,288,120,-144,-11,288,120);
   const expected=g.getImageData(0,0,192,192).data,a=BagseedArt.portrait(L).getContext('2d').getImageData(0,0,192,192).data;
   for(let dy=5;dy<12;dy++)for(let dx=-4;dx<=4;dx++){const x=Math.round(96+dx*fit),y=Math.round(148+dy*fit),n=(y*192+x)*4;if(expected[n+3]>250){neckPixels++;if(Math.max(...[0,1,2,3].map(k=>Math.abs(expected[n+k]-a[n+k])))>5)failures.push({topS,face,x,y,reason:'portrait has two neck layers'});}}
   views++;
  }return{views,neckPixels,failures};
 });assert.equal(r.failures.length,0,JSON.stringify(r.failures.slice(0,10)));assert.equal(r.views,75);assert.ok(r.neckPixels>3000);
});

test('short and child figures keep the neck connected during movement and reactions',async()=>{
 const child=JSON.parse(fs.readFileSync(path.join(ROOT,'review/characters-v2/sources/baseline-assets.json'))).people.find(p=>p.id==='poppy').look;
 const r=await inspect('short-child-joins',child=>{
  const failures=[];let views=0;
  // A different garment forces the child through customization while retaining
  // its authored child identity; the original full NPC drawing is untouched.
  const options=[{look:{short:true,body:'stocky',topS:'tank',hairS:'short'},sy:.9},{look:{...child,topS:'hoodie'},sy:.74}];
  for(const{look,sy}of options)for(const dir of ['down','right','up','left'])for(const pose of [{},{frame:1},{frame:3},{breath:1},{nose:true}]){
   const c=BagseedArt.sprite(look,dir,pose.frame||0,pose.breath||0,0,0,!!pose.nose,3),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,w=c.width,h=c.height,seen=new Uint8Array(w*h),seed=Math.round((143-57*sy)*3)*w+144,todo=[seed];seen[seed]=1;
   while(todo.length){const at=todo.pop(),x=at%w,y=Math.floor(at/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,n=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&!seen[n]&&a[n*4+3]>80){seen[n]=1;todo.push(n);}}}
   const point=c.bagseedEyes[0]||[48,143-65*sy-9],x=Math.round(point[0]*3),y=Math.round(point[1]*3);if(!seen[y*w+x])failures.push({look,dir,pose,seedAlpha:a[seed*4+3],headAlpha:a[(y*w+x)*4+3],component:seen.reduce((s,v)=>s+v,0),reason:'head disconnected from chest'});views++;
  }return{views,failures};
 },child);assert.deepEqual(r.failures,[]);assert.equal(r.views,40);
});
