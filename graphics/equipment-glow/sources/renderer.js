/* Subtle local night lighting, in the normal object pass before occluders/tint. */
(()=>{
 'use strict';
 const contexts=new WeakMap();let disabled=false;const marks=[];
 function night(minute=state?.minute){if(!Number.isFinite(minute))return 0;const h=minute/60,s=x=>x*x*(3-2*x),rise=clamp((h-17.5)/3.5,0,1),fall=clamp((7-h)/2,0,1);return Math.max(s(rise),s(fall));}
 function withWorld(c,draw){contexts.set(c,(contexts.get(c)||0)+1);try{return draw();}finally{const n=contexts.get(c)-1;n?contexts.set(c,n):contexts.delete(c);}}
 function point(c,x,y,r,color='#bddd96',on=true,strength=1,tag='button'){const a=!disabled&&on&&contexts.has(c)?night()*strength:0;if(!a)return;const[rgbR,rgbG,rgbB]=hexRGB(color),rgb=[rgbR,rgbG,rgbB].join(',');c.save();c.globalCompositeOperation='screen';const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a*.48})`);g.addColorStop(.34,`rgba(${rgb},${a*.20})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();if(marks.length<512)marks.push({tag,x,y,r});}
 function display(c,x,y,w,h,color='#bddd96',on=true,strength=.55,tag='display'){const a=!disabled&&on&&contexts.has(c)?night()*strength:0;if(!a)return;point(c,x+w/2,y+h/2,Math.max(w,h)*.64,color,on,strength*.65,tag);c.save();c.strokeStyle=color;c.globalAlpha=a*.35;c.lineWidth=.13;c.beginPath();c.roundRect(x,y,w,h,Math.min(w,h)*.12);c.stroke();c.restore();}
 function wrap(draw){return function(c,...args){marks.length=0;return withWorld(c,()=>draw.call(this,c,...args));};}
 RoomArt.draw=wrap(RoomArt.draw);SCENES.growroom.draw=wrap(SCENES.growroom.draw);
 window.BagseedEquipmentGlow=Object.freeze({night,point,display,withWorld,marks,get disabled(){return disabled;},set disabled(v){disabled=!!v;}});
})();
