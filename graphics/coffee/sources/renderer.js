/* Bedroom coffee mug and seamless rising steam. */
(()=>{
  'use strict';
  const DATA=__BAGSEED_COFFEE_DATA__,mug=new Image(),original=RoomArt.drawCoffee;let loaded=false;
  function drawSteam(c,t){
    if(settings.reduced)return;
    const phase=((t%DATA.steam.period)+DATA.steam.period)%DATA.steam.period/DATA.steam.period;
    const [cx,cy]=DATA.world.surface;
    c.save();c.lineCap='round';c.lineJoin='round';
    for(let i=0;i<DATA.steam.wisps;i++){
      const p=(phase+i/DATA.steam.wisps)%1,high=p*DATA.steam.height,low=Math.max(0,high-2.8),opacity=Math.pow(Math.sin(Math.PI*p),.7)*.72;
      const xAt=h=>cx+(i-1)*.58+Math.sin(h*1.8+i*1.9+p*2)*(.15+h*.095);
      c.beginPath();for(let j=0;j<=12;j++){const h=low+(high-low)*j/12,x=xAt(h),y=cy-h;j?c.lineTo(x,y):c.moveTo(x,y);}
      c.strokeStyle='rgba(247,244,228,'+(opacity*.16)+')';c.lineWidth=.95;c.stroke();
      c.strokeStyle='rgba(255,251,238,'+opacity+')';c.lineWidth=.37;c.stroke();
    }
    c.restore();
  }
  RoomArt.drawCoffee=function(c,t=0){
    if(!loaded)return original?.call(this,c,t);
    if(state.coffeeDay===state.day)return;
    const w=DATA.world.width,h=w*DATA.rect[3]/DATA.rect[2];
    c.save();c.fillStyle='rgba(40,25,15,.19)';c.beginPath();c.ellipse(DATA.world.x+2.8,DATA.world.bottom-.1,3,.42,0,0,Math.PI*2);c.fill();
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(mug,...DATA.rect,DATA.world.x,DATA.world.bottom-h,w,h);c.restore();
    drawSteam(c,t);this.hit('coffee',206,64,10,11,'Coffee mug',null,'item');
  };
  const ready=new Promise((resolve,reject)=>{mug.onload=()=>{loaded=true;if(screen==='game')View.snap();resolve({mugs:1,steamPeriod:DATA.steam.period});};mug.onerror=()=>reject(Error('Coffee artwork failed to load'));mug.src=DATA.image;});
  window.BagseedCoffee=Object.freeze({revision:DATA.revision,ready,drawSteam,get loaded(){return loaded;}});ready.catch(e=>console.error(e));
})();
