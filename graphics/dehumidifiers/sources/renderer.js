/* Dehumidifier samples: local climate stays unchanged; render before plants/fabric. */
(()=>{
 'use strict';
 const DATA=__BAGSEED_DEHUMIDIFIERS_DATA__,image=new Image(),original=Gear.dehum,icon=drawGearIcon,fixtures=new Map(),sensors=new Map();let loaded=false;
 const handles=loc=>loaded&&!!DATA.placements[loc];
 function sprite(c,x,y,n,on=true,t=0,target=55){const a=DATA.tiers[n];if(!loaded||!a)return;const k=on?'on':'off',r=a[k];c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,...r,x-a.width/2,y-a.height,a.width,a.height);
  if(n===2&&on){const d=a.display[k],dx=x-a.width/2+(d[0]-r[0])*a.width/r[2],dy=y-a.height+(d[1]-r[1])*a.height/r[3],dw=d[2]*a.width/r[2],dh=d[3]*a.height/r[3];c.fillStyle='#c5e6ab';c.font=dh*.87+'px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(String(target),dx+dw/2,dy+dh/2,dw*.92);}
  c.restore();
 }
 function drawInside(c,loc,t){if(!handles(loc))return;const L=state.locations[loc],n=L.equip.dehum,a=DATA.tiers[n];fixtures.delete(loc);if(!a)return;const[x,y]=DATA.placements[loc],on=!!(L.dehumOn||n===2);groundShadow(c,x,y,a.width);sprite(c,x,y,n,on,t,L.dehumTarget);fixtures.set(loc,{x,y,tier:n,on});const b=BagseedTentPlacement.bounds(loc);RoomArt.hit('dehum:'+loc,x-a.width/2-1,y-a.height-1,a.width+2,a.height+2,EQ.dehum[n].name,[b[0]+b[2]/2,b[1]+b[3]+14],'equip');}
 // These stay on the exterior header, outside the zipped flap and contents mask.
 function drawSensor(c,loc){if(!handles(loc))return;const L=state.locations[loc],n=L.equip.sensor,b=BagseedTentPlacement.bounds(loc),w=n===3?18:n===2?14:9,h=n===3?14:n===2?10:n===1?9:8,scale=loc==='closet'?.55:.72,x=b[0]+b[2]*(loc==='closet'?.81:loc==='tent2'?.875:.89)-w*scale/2,y=b[1]+b[3]*.078; c.save();c.translate(x,y);c.scale(scale,scale);Gear.sensor(c,0,0,n,envFor(loc),loc);c.restore();const f={x,y,w:w*scale,h:h*scale,tier:n};sensors.set(loc,f);RoomArt.hit('sensor:'+loc,x-1,y-1,f.w+2,f.h+2,n?EQ.sensor[n].name:'Climate check (hand)',[b[0]+b[2]/2,b[1]+b[3]+14],'equip');}
 Gear.dehum=function(c,x,y,n,on,t){if(!loaded||!DATA.tiers[n])return original.apply(this,arguments);sprite(c,x+6,y+16,n,on,t);};
 drawGearIcon=function(c,cv,slot,n,museum){if(slot!=='dehum'||!loaded||!DATA.tiers[n])return icon.apply(this,arguments);cv.width=320;cv.height=240;c.fillStyle=museum?'#2a2016':'#1a2420';c.fillRect(0,0,320,240);const a=DATA.tiers[n],scale=Math.min(184/a.height,235/a.width);c.save();c.translate(160,120);c.scale(scale,scale);sprite(c,0,a.height/2,n,true,0,55);c.restore();};
 const ready=new Promise((resolve,reject)=>{image.onload=()=>{loaded=true;resolve();};image.onerror=()=>reject(Error('Dehumidifier artwork failed'));image.src=DATA.image;});window.BagseedDehumidifiers=Object.freeze({ready,handles,sprite,drawInside,drawSensor,fixtures,sensors,placements:DATA.placements,get loaded(){return loaded;}});
})();
