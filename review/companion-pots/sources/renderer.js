/* Painted companion pots: soil/back -> native plant -> near rim. Review only until approved. */
(()=>{
 'use strict';
 const DATA=__BAGSEED_COMPANION_POTS_DATA__,oldDraw=Companion.draw,pot=new Image(),layers=[];
 let loaded=false,front;
 const [sx,sy,sw,sh]=DATA.crop,[cx,cy,rx,ry]=DATA.soil,scale=DATA.height/sh;
 const geo={left:-(cx-sx)*scale,top:-(cy-sy)*scale,w:sw*scale,h:DATA.height,soilRX:rx*scale,soilRY:ry*scale};
 function frontImage(){
  if(front)return front;
  front=document.createElement('canvas');front.width=sw;front.height=sh;
  const c=front.getContext('2d');c.drawImage(pot,sx,sy,sw,sh,0,0,sw,sh);
  c.globalCompositeOperation='destination-out';c.fillStyle='#000';c.fillRect(0,0,sw,cy-sy);
  c.beginPath();c.ellipse(cx-sx,cy-sy,rx,ry,0,0,Math.PI*2);c.fill();return front;
 }
 function drawPot(c,x,y,near=false){
  if(!loaded)return;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  if(near)c.drawImage(frontImage(),x+geo.left,y+geo.top,geo.w,geo.h);
  else c.drawImage(pot,sx,sy,sw,sh,x+geo.left,y+geo.top,geo.w,geo.h);
  c.restore();
 }
 function hit(c,loc,x,y,p){RoomArt.hit('gpot:'+loc,x-6,y-16,13,18,p?`${GP.sp(p.sp).name} (companion pot)`:'Companion pot (empty)',[x,y+8],'item');}
 Companion.draw=function(c,loc,t){
  if(!loaded)return oldDraw.apply(this,arguments);
  const pots=GP.pots()[loc];if(!pots||!locOwned(loc))return;
  pots.forEach((gid,i)=>{const xy=this.potXY(loc,i);if(!xy)return;const [x,y]=xy,root=y-4,p=gid&&GP.plant(gid);
   drawPot(c,x,root);if(p)GPArt.draw(c,p.sp,GP.stageOf(p),x,root,t,.8);drawPot(c,x,root,true);hit(c,loc,x,y,p);
   if(layers.length>=32)layers.shift();layers.push({loc,index:i,x,y,rootY:root,phase:'back-plant-front',species:p?.sp||null});
  });
 };
 function icon(cv){cv.width=320;cv.height=270;const c=cv.getContext('2d');const s=Math.min(280/geo.w,224/geo.h);c.save();c.translate(160-(geo.left+geo.w/2)*s,126-(geo.top+geo.h/2)*s);c.scale(s,s);drawPot(c,0,0);c.restore();return cv;}
 const ready=new Promise((resolve,reject)=>{pot.onload=()=>{loaded=true;resolve();};pot.onerror=()=>reject(Error('Companion pot artwork failed to load'));pot.src=DATA.runtime;});
 window.BagseedCompanionPots={revision:DATA.revision,ready,get loaded(){return loaded;},geometry:geo,data:DATA,layers,drawPot,icon};
})();
