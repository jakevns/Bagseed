const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
test('garden crops share rear/plant/front pot layers in every tent and pot tier',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await require('./helpers/art-page.cjs')(browser,{viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});
  await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Garden pot layers');await page.locator('[data-act=startGame]').click();
  await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const result=await page.evaluate(()=>{
   const check=(v,m)=>{if(!v)throw Error(m);},api=BagseedWaterPots,locs=['closet','tent2','tent4','tent5'],species=['P001','P010','P018','P051','P151','P032'];
   settings.speed=0;settings.reduced=true;state.tut.on=false;state.flags.growroom=true;state.weather='Sunny';state.minute=720;state.player.x=465;state.player.y=175;state.mess=[];state.room.placed=[];state.room.rgb.on=false;runtime.hover=null;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();
   for(const loc of locs){const L=state.locations[loc];L.owned=true;L.door='open';Object.assign(L.equip,{pot:2,light:2,fan:1,exhaust:1,sensor:2,humid:0,dehum:0,ctrl:0,heater:0,ac:0,hvac:0});const arr=GrowPotGarden.arr(loc);for(let i=0;i<slotCount(loc);i++){L.slots[i]=null;const p=GP.newPlant(species[i%species.length],{kind:'slot',ref:loc});p.age=GP.sp(p.sp).days;p.water=i%2?20:60;arr[i]=p.gid;}if(loc!=='closet'){const i=slotCount(loc)-1;GP.remove(arr[i]);arr[i]=null;const p=createPlant('porchlight',loc,i);Object.assign(p,{stage:4,height:8,nodes:5,water:60,health:92,moves:[],repStress:0});}}
   function world(room){state.scene=room;const cv=document.createElement('canvas');cv.width=(room==='bedroom'?480:448)*4;cv.height=(room==='bedroom'?180:200)*4;const c=cv.getContext('2d');c.scale(4,4);RoomArt.hits=[];curScene().draw(c,2);return cv;}
   const draw=GPArt.draw;let samples=[],cases=0,protectedPixels=0;
   GPArt.draw=function(c,id,stage,x,y,...args){const m=c.getTransform();draw.call(this,c,id,stage,x,y,...args);c.fillStyle='#ff00d4';c.fillRect(x-.5,y-7,1,12);samples.push({x:m.a*x+m.c*(y-3)+m.e,y:m.b*x+m.d*(y-3)+m.f,bx:m.a*x+m.c*(y+3)+m.e,by:m.b*x+m.d*(y+3)+m.f});};
   try{for(const tier of [1,2,3])for(const minute of [720,0])for(const room of ['bedroom','growroom']){
    for(const loc of locs)state.locations[loc].equip.pot=tier;state.minute=minute;samples=[];const before=JSON.stringify([state.plants,state.locations,state.v115.gp,state.v115.mpots]),cv=world(room),c=cv.getContext('2d');check(before===JSON.stringify([state.plants,state.locations,state.v115.gp,state.v115.mpots]),'Drawing changed saved crops');check(samples.length>0,'No garden plants drawn');
    for(const p of samples){const top=c.getImageData(Math.round(p.x),Math.round(p.y),1,1).data,body=c.getImageData(Math.round(p.bx),Math.round(p.by),1,1).data;check(top[0]>top[1]*1.6&&top[2]>top[1]*1.6,'Rear pot painted over garden crop');check(!(body[0]>body[1]*1.6&&body[2]>body[1]*1.6),'Stem leaks through pot front');protectedPixels++;}check(RoomArt.hits.some(h=>h.id.startsWith('gslot:')),'Garden care target lost');cases++;
   }}finally{GPArt.draw=draw;}
   // Render every species allowed in a grow pot at all four garden stages.
   GP.build();const eligible=Object.values(GP._sp).filter(sp=>GP.canPlant(sp,{kind:'slot',ref:'closet'}).ok),cv=document.createElement('canvas');cv.width=240;cv.height=300;const c=cv.getContext('2d');c.translate(120,170);c.scale(8,8);for(const sp of eligible)for(const age of [0,.2,.6,1])for(const tier of [1,2,3]){c.clearRect(-15,-25,30,40);api.gardenPot(c,{sp:sp.id,age:sp.days*age,water:60},0,0,tier,2);}
   state.minute=720;for(const loc of locs)state.locations[loc].equip.pot=2;
   const board=document.createElement('canvas');board.width=1500;board.height=1050;const b=board.getContext('2d');b.fillStyle='#f8f2e5';b.fillRect(0,0,1500,1050);b.fillStyle='#29483a';b.font='bold 30px Georgia';b.fillText('GARDEN CROPS / THE SAME LAYERED POTS',24,45);b.font='20px Georgia';b.fillText('Actual index.html · Greens, herbs, vegetables and flowers · Cannabis can share the tent',24,80);
   b.drawImage(world('growroom'),0,0,448*4,200*4,20,110,980,437.5);b.drawImage(world('bedroom'),0,0,150*4,120*4,1010,110,470,376);
   const demo={sp:'P001',age:GP.sp('P001').days,water:60};for(let i=0;i<6;i++){const id=species[i],x=24+i*245;demo.sp=id;demo.age=GP.sp(id).days;b.fillStyle='#e1e4d3';b.fillRect(x,625,228,300);b.save();b.translate(x+112,775);b.scale(10,10);api.gardenPot(b,demo,0,0,i%3+1,2);b.restore();b.fillStyle='#29483a';b.font='20px Georgia';b.fillText(GP.sp(id).name,x+8,966);}
   return{cases,protectedPixels,eligibleSpecies:eligible.length,speciesStagePotRenders:eligible.length*12,png:board.toDataURL()};
  });
  assert.equal(result.cases,12);assert.ok(result.eligibleSpecies>100);assert.deepEqual(errors,[]);
  const out=path.resolve(__dirname,'../review/water-and-pots');fs.writeFileSync(path.join(out,'approval-garden-pot-layers.png'),Buffer.from(result.png.split(',')[1],'base64'));delete result.png;fs.writeFileSync(path.join(out,'garden-layering.json'),JSON.stringify({...result,entryPoint:'public/index.html',savedCropsUnchanged:true,gardenCareTargetsPreserved:true,errors},null,2)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
