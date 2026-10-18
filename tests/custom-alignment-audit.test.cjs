const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('uncropped custom alignment: every garment, build, presentation, direction and stride', {timeout:600000},async()=>{
 const{createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
 const result=await page.evaluate(()=>{let cases=0,maxRasterShoulderDelta=0;const failures=[],movingOrigins={};const tops=Object.values(__BAGSEED_ILLUSTRATED_DATA__.walk.items).filter(v=>v.kind==='top').map(v=>v.style);
 const shoulderWidth=im=>{const a=im.bagseedAlignment,g=im.getContext('2d',{willReadFrequently:true}),widths=[];
  for(let y=Math.ceil(a.shoulderBand[0]*3);y<=Math.floor(a.shoulderBand[1]*3);y++){
   const p=g.getImageData(0,y,288,1).data;let left=288,right=-1;for(let x=0;x<288;x++)if(p[x*4+3]>160){left=Math.min(left,x);right=Math.max(right,x);}if(right>=left)widths.push((right-left+1)/3);
  }widths.sort((a,b)=>a-b);return widths[Math.floor(widths.length/2)]||0;
 };
 for(const topS of tops)for(const body of ['slim','average','curvy','stocky','broad','tall'])for(const pres of ['masc','neutral','fem'])for(const dir of ['down','right','up','left']){
  const variant=['masc','neutral','fem'].indexOf(pres),L=BagseedArt.normalize({topS,body,pres,face:['wide','soft','petite'][variant],hairS:'bald',ears:'hidden',skin:['#f0c7a0','#cf9670','#5d3829'][variant],shirtC:'#263347',hat:'none',facial:'none',acc:'none'}),idle=BagseedArt.sprite(L,dir,0,0,0,0,false,3),rest=idle.bagseedAlignment;
  const restRasterWidth=shoulderWidth(idle);
  for(let frame=-1;frame<BagseedArt.customWalkFrameCount(L,dir);frame++){
   const im=frame<0?idle:BagseedArt.sprite(L,dir,frame,0,0,0,false,3,true),a=im.bagseedAlignment,id={topS,body,pres,dir,frame},fail=reason=>failures.push({...id,reason});cases++;
   if(!a){fail('alignment metadata missing');continue;}
   if(Math.abs(a.collar[1]-a.jaw[1]-rest.neckLength)>1)fail('jaw-to-collar differs from idle');
   if(Math.abs(a.shoulderWidth-rest.shoulderWidth)>1)fail('painted shoulder width differs from idle');
   const rasterDelta=Math.abs(shoulderWidth(im)-restRasterWidth);maxRasterShoulderDelta=Math.max(maxRasterShoulderDelta,rasterDelta);
   if(rasterDelta>1)fail(`composited shoulder width differs from idle by ${rasterDelta.toFixed(3)} px`);
   if(Math.abs(a.headScale-rest.headScale)>.001)fail('head changes size');
   if(a.bottom!==rest.bottom||a.garment!==rest.garment)fail('garment switches between idle and walk');
   if(dir==='up'&&!a.rear)fail('rear artwork missing');
   if(dir==='right'||dir==='left'){
    const ear=BagseedArt.landmarks({...L,ears:'normal'},dir).ears[0],hinge=a.origin[0]+ear.hinge[0]/3*a.headScale;
    if(dir==='right'?a.collar[0]>=hinge:a.collar[0]<=hinge)fail('neck lies ahead of the ear hinge');
   }
   // Check actual composited skin, not merely identical origin numbers or a
   // self-updated image hash. Black/white placeholder pixels are forbidden in
   // the exposed central neck band; garment collar trim below it is allowed.
   const g=im.getContext('2d',{willReadFrequently:true});let skin=0,stray=0;
   const edgeHit=x=>{const p=g.getImageData(x,0,2,im.height).data;for(let n=3;n<p.length;n+=4)if(p[n]>80)return true;return false;};
   if(edgeHit(0)||edgeHit(im.width-2))fail('figure clipped at canvas edge (invalid body width)');
   const floor=g.getImageData(0,423,288,9).data;let grounded=false;for(let n=3;n<floor.length;n+=4)if(floor[n]>100){grounded=true;break;}
   if(!grounded)fail('feet float above the ground band');
   for(const offset of [1.5,2.5,3.5]){
    const x=Math.round(a.collar[0]*3),y=Math.round((a.jaw[1]+offset)*3),p=g.getImageData(x-1,y,3,1).data;
    for(let n=0;n<p.length;n+=4){if(p[n+3]>180&&p[n]>p[n+1]*1.1&&p[n+1]>p[n+2]+5)skin++;if(p[n+3]>180&&(Math.max(p[n],p[n+1],p[n+2])<25||Math.min(p[n],p[n+1],p[n+2])>235))stray++;}
   }
   if(skin<6||stray)fail(`neck pixels: skin=${skin}/9, black/white=${stray}`);
   if(frame>=0&&(dir==='right'||dir==='left')){const k=topS+'|'+body+'|'+pres+'|'+dir;(movingOrigins[k]??=[]).push(a.origin[0]);}
  }
 }
 return{cases,maxRasterShoulderDelta,failures,profileSequences:Object.keys(movingOrigins).length,profileSequencesWithMotion:Object.values(movingOrigins).filter(v=>Math.max(...v)-Math.min(...v)>.01).length};});
 fs.mkdirSync(path.resolve('review/custom-alignment'),{recursive:true});fs.writeFileSync(path.resolve('review/custom-alignment/measured-checks.json'),JSON.stringify(result,null,2)+'\n');assert.equal(result.cases,7560);assert.equal(result.failures.length,0,JSON.stringify(result.failures.slice(0,20)));assert.ok(result.profileSequencesWithMotion>0,'profile heads must follow painted neck movement');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
