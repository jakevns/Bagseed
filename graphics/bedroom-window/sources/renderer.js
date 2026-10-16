/* Approved outdoor paintings, native neighbor schedules and glass/sill effects. */
(()=>{
  'use strict';
  const previous=HouseWing115c.yard,walkers=Hood.drawWindowWalkers;
  let loaded=false;
  function yard(c,x,y,w,h,t){
    if(!loaded)return previous.call(this,c,x,y,w,h,t);
    const art=BagseedWindowScenery,n=art.timeOfDay(state.minute/60),dest=[x,y,w,h];
    const motion=settings.reduced?0:t,cloudSpeed=state.weather==='Windy'?.3:state.weather==='Storm'?.35:.15;
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.beginPath();c.rect(x,y,w,h);c.clip();art.drawBackground(c,dest,n,motion*cloudSpeed);
    // The watering neighbor and scheduled passers-by stand behind the near fence.
    if(Neighbor.inYard())drawTinyPerson(c,x+10+Math.round(Math.sin(motion*.4)*3),y+h*.76,lookFor('doug'),settings.reduced?0:Math.floor(t*2),'can');
    walkers.call(Hood,c,x,y,w,h*.87,t);
    art.drawForeground(c,dest,n);
    // Keep storm/cloud cover consistent across scenery and people. Native rain,
    // frost, fog, heat shimmer, frame, curtains, tomato gift and cat draw afterward.
    const cover={Cloudy:.18,Rain:.25,Storm:.4,Muggy:.12}[state.weather]||0;
    if(cover){c.fillStyle=`rgba(98,116,137,${cover})`;c.fillRect(x,y,w,h);}
    if(state.weather==='Heat Wave'||state.weather==='Dry Spell'){c.fillStyle=state.weather==='Heat Wave'?'rgba(221,151,65,.12)':'rgba(185,151,83,.12)';c.fillRect(x,y,w,h);}
    if(state.weather==='Cold Snap'){const snow=c.createLinearGradient(0,y+h*.65,0,y+h);snow.addColorStop(0,'#e8eff400');snow.addColorStop(1,'#e8eff466');c.fillStyle=snow;c.fillRect(x,y,w,h);}
    c.restore();
  }
  HouseWing115c.yard=yard;
  const ready=BagseedWindowScenery.ready.then(()=>{loaded=true;});ready.catch(error=>console.error(error));
  window.BagseedBedroomWindow=Object.freeze({revision:'bedroom-window-1',ready,get loaded(){return loaded;}});
})();
