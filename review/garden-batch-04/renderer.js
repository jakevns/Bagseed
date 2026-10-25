/* Shared four-stage painted garden artwork. Approved species retain native growth, care and pot layering. */
(()=>{
 'use strict';
 const DATA=__BAGSEED_GARDEN_DATA__,images={},draw=GPArt.draw,icon=GPArt.icon,slots=RoomArt.drawSlots,mainContexts=new Set();let loaded=false;
 function geometry(id,stage,scale=1){const sp=GP.sp(id),part=DATA[id].stages[Math.max(0,Math.min(3,Math.floor(stage)))],h=(stage<=0?3:sp.h*(stage===1?.55:1))*scale;return{part,h,w:h*part.crop[2]/part.crop[3],ax:part.attach[0]/part.crop[2],ay:part.attach[1]/part.crop[3]};}
 function offset(u,t,seed,stage){return settings.reduced?0:Math.sin(t*1.45+seed*.23+u*.9)*u*u*(stage<=0?.08:stage===1?.15:.26);}
 function paintDirect(c,id,stage,x,y,t=0,scale=1){
  const g=geometry(id,stage,scale),a=g.part,[sx,sy,sw,sh]=a.crop,seed=+id.slice(1),base=mainContexts.has(c)?y+(window.BagseedWaterPots?.gardenLift(id,stage)||0)-1:y;
  c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(x,base);
  const ox=-g.ax*g.w,oy=-g.ay*g.h;
  if(settings.reduced||stage<=0)c.drawImage(images[id],sx,sy,sw,sh,ox,oy,g.w,g.h);
  else{
   // Overlapping horizontal strips bend the upper foliage; displacement is
   // zero at the soil attachment and never separates stems from their leaves.
   const n=Math.min(80,Math.max(24,Math.ceil(g.h*5))),dh=g.h/n;
   for(let i=0;i<n;i++){const yy=oy+i*dh,u=Math.max(0,Math.min(1,-yy/Math.max(1,g.ay*g.h))),dx=offset(u,t,seed,stage)*scale;c.drawImage(images[id],sx,sy+sh*i/n,sw,Math.min(sh-sh*i/n,sh/n+.5),ox+dx,yy,g.w,dh+.035);}
  }c.restore();return g;
 }
 const frames=new Map();
 function painted(c,id,stage,x,y,t=0,scale=1){
  const m=c.getTransform(),density=Math.max(6,Math.min(24,Math.ceil(Math.max(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d))*Math.abs(scale)))),key=id+':'+stage+':'+density,phase=settings.reduced?'still':Math.floor(t*8);
  const g=geometry(id,stage),ax=2+g.ax*g.w,ay=2+g.ay*g.h;let f=frames.get(key);
  if(!f){const cv=document.createElement('canvas');cv.width=Math.ceil((g.w+4)*density);cv.height=Math.ceil((g.h+4)*density);f={cv,phase:null};if(frames.size>=64)frames.delete(frames.keys().next().value);frames.set(key,f);}
  if(f.phase!==phase){const ctx=f.cv.getContext('2d');ctx.resetTransform();ctx.clearRect(0,0,f.cv.width,f.cv.height);ctx.scale(density,density);paintDirect(ctx,id,stage,ax,ay,settings.reduced?0:phase/8,1);f.phase=phase;}
  const base=mainContexts.has(c)?y+(window.BagseedWaterPots?.gardenLift(id,stage)||0)-1:y;
  c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(f.cv,x-ax*scale,base-ay*scale,f.cv.width/density*scale,f.cv.height/density*scale);c.restore();return {...g,base};
 }
 GPArt.draw=function(c,id,stage,x,y,t=0,scale=1,opts={}){if(!loaded||!DATA[id])return draw.apply(this,arguments);return painted(c,id,stage,x,y,t,scale);};
 RoomArt.drawSlots=function(c){const active=mainContexts.has(c);mainContexts.add(c);try{return slots.apply(this,arguments);}finally{if(!active)mainContexts.delete(c);}};
 GPArt.icon=function(cv,id){if(!loaded||!DATA[id])return icon.apply(this,arguments);const aspect=cv.height/cv.width;cv.width=Math.max(384,cv.width);cv.height=Math.round(cv.width*aspect);const c=cv.getContext('2d'),W=cv.width,H=cv.height;if(GP.sp(id).form==='starter'){c.fillStyle='#e7ead7';c.fillRect(0,0,W,H);const g=geometry(id,3),scale=Math.min(W*.7/Math.max(18,g.w),H*.75/(g.h+11));c.save();c.translate(W/2,H*.10+g.h*scale);c.scale(scale,scale);BagseedWaterPots.potSprite(c,0,0,1,70);painted(c,id,3,0,0,0,1);BagseedWaterPots.potSprite(c,0,0,1,70,false,true);c.restore();c.fillStyle='#426047';c.font=Math.max(10,W*.04)+'px Georgia';c.textAlign='center';c.fillText(DATA[id].name,W/2,H*.95,W*.9);return;}c.fillStyle='#e7ead7';c.fillRect(0,0,W,H);const x=W*.25,y=H*.055,w=W*.5,h=H*.89;c.fillStyle='#8e7750';c.beginPath();c.roundRect(x-2,y-2,w+4,h+4,8);c.fill();c.fillStyle='#faf1d8';c.beginPath();c.roundRect(x,y,w,h,7);c.fill();c.fillStyle=GP.catCol(GP.sp(id));c.fillRect(x,y,w,H*.09);const g=geometry(id,3),sc=Math.min(w*.86/g.w,h*.69/g.h);painted(c,id,3,W/2,y+h*.85,0,sc);c.fillStyle='#426047';c.font=Math.max(10,W*.032)+'px Georgia';c.textAlign='center';c.fillText(DATA[id].name,W/2,y+h*.965,w*.94);};
 const ready=Promise.all(Object.entries(DATA).map(([id,a])=>new Promise((resolve,reject)=>{const im=images[id]=new Image();im.onload=resolve;im.onerror=()=>reject(Error('Garden art failed: '+id));im.src=a.runtime;}))).then(()=>{loaded=true;});
 window.BagseedGardenPlants=Object.freeze({revision:'garden-batch-04-review',ready,geometry,offset,kits:DATA,get loaded(){return loaded;}});
})();
