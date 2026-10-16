/* Seed storage tiers and the fixed supply box beneath the seedling bench. */
(()=>{
  'use strict';
  const DATA=__BAGSEED_UNDER_DESK_STORAGE_DATA__,atlas=new Image();let loaded=false;
  const oldStorage=Gear.storage,oldBench=RoomArt.drawBench,oldIcon=drawGearIcon;
  function sprite(c,id,x,y,w,h){
    const a=DATA.assets[id],k=Math.min(w/a.rect[2],h/a.rect[3]),dw=a.rect[2]*k,dh=a.rect[3]*k;
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,...a.rect,x+(w-dw)/2,y+h-dh,dw,dh);c.restore();
  }
  Gear.storage=function(c,x,y,tier){
    const item=DATA.tiers[tier];if(!loaded||!item)return oldStorage.call(this,c,x,y,tier);
    const a=DATA.assets[item.id],left=x+(tier===2?-1:0);groundShadow(c,x+9,y+12,a.width);
    sprite(c,item.id,left,y+12-a.height,a.width,a.height);
  };
  function drawSupplyBox(c,x,y,t=0,guide=false){
    groundShadow(c,x+9,y+12,18);sprite(c,'box',x,y,18,12);
    if(guide)R(c,x+7,y-3+(settings.reduced?0:Math.round(Math.sin(t*4))),3,2,'#ffd257');
  }
  RoomArt.drawBench=function(c,t){
    if(!loaded)return oldBench.call(this,c,t);
    const tier=state.gear.workbench,x=224,y=80;
    Gear.bench(c,x,y,tier);Gear.benchSupplies(c,x,y);
    this.hit('bench',x,y-12,68,16,EQ.workbench[tier].name+' (mix nutrients)',null,'furniture');
    Gear.storage(c,x+4,y+9,state.gear.storage);this.hit('storage',x+3,y+3,20,18,EQ.storage[state.gear.storage].name+' (seeds)',null,'item');
    drawSupplyBox(c,x+44,y+9,t,!state.hints.box);
    this.hit('box',x+43,y+6,20,16,'Supply box',null,'item');
  };
  drawGearIcon=function(c,cv,slot,tier,museum){
    if(slot!=='storage'||!loaded||!DATA.tiers[tier])return oldIcon.call(this,c,cv,slot,tier,museum);
    cv.width=320;cv.height=240;c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle=museum?'#2a2016':'#1a2420';c.fillRect(0,0,320,240);sprite(c,DATA.tiers[tier].id,36,18,248,204);c.restore();
  };
  const ready=new Promise((resolve,reject)=>{atlas.onload=()=>{loaded=true;if(screen==='game'){hydrate(document);View.snap();}resolve({storageTiers:3,supplyBoxes:1});};atlas.onerror=()=>reject(Error('Under-desk storage artwork failed to load'));atlas.src=DATA.image;});
  window.BagseedUnderDeskStorage=Object.freeze({revision:DATA.revision,ready,drawSupplyBox,get loaded(){return loaded;}});ready.catch(e=>console.error(e));
})();
