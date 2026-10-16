/* Approval-only fan artwork; injected into a disposable index.html browser. */
(()=>{
 'use strict';
 const DATA=__BAGSEED_FANS_DATA__,image=new Image(),original=Gear.fan,oldIcon=drawGearIcon,oldHit=RoomArt.hit,fixtures=new Map();let loaded=false,activeLoc=null;
 function part(c,rect,x,y,w,h){c.drawImage(image,...rect,x,y,w,h);}
 function centered(c,rect,anchor,unit){part(c,rect,(rect[0]-anchor[0])*unit,(rect[1]-anchor[1])*unit,rect[2]*unit,rect[3]*unit);}
 function pose(tier,t,on,speed=1,rattle=false,reduced=settings.reduced){const moving=on&&!reduced;return {angle:moving?t*(rattle?7:14*speed):0,sway:moving&&tier===2?Math.sin(t*.7)*.95:0,squash:moving&&tier===2?1-Math.abs(Math.sin(t*.7))*.13:1,jitter:moving&&rattle?Math.sin(t*40)*.2:0};}
 function head(c,x,y,tier,t,on,speed,rattle){const a=DATA.tiers[tier],p=pose(tier,t,on,speed,rattle),unit=a.width/a.head[2],radius=a.width*.335;
  c.save();c.translate(x+p.sway+p.jitter,y);c.scale(p.squash,1);centered(c,a.head,a.headCenter,unit);
  c.save();c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.clip();c.rotate(p.angle);const r=a.rotor,anchor=a.rotorCenter,maxR=Math.max(anchor[0]-r[0],r[0]+r[2]-anchor[0],anchor[1]-r[1],r[1]+r[3]-anchor[1]);centered(c,r,anchor,radius*.98/maxR);c.restore();
  // Fixed protective cage over the spinning rotor. Fine bars share the rim palette.
  c.strokeStyle=tier===3?'rgba(156,169,142,.66)':'rgba(227,223,196,.72)';c.lineWidth=.13;
  for(const r of [.36,.69,1]){c.beginPath();c.arc(0,0,radius*r,0,Math.PI*2);c.stroke();}
  for(let i=0;i<10;i++){const q=i*Math.PI/5;c.beginPath();c.moveTo(Math.cos(q)*radius*.15,Math.sin(q)*radius*.15);c.lineTo(Math.cos(q)*radius,Math.sin(q)*radius);c.stroke();}
  c.fillStyle=tier===3?'#515d46':'#83916e';c.beginPath();c.arc(0,0,radius*.17,0,Math.PI*2);c.fill();c.strokeStyle='#d2b671';c.lineWidth=.14;c.stroke();c.restore();
 }
 function sprite(c,x,y,tier,t=0,on=true,speed=1,rattle=false,standHeight=15.5){const a=DATA.tiers[tier];if(!a||!loaded)return;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  if(tier===2){const [mx,my,mw,mh]=a.mount;part(c,[mx,my,mw,176],x-4.3,y+2.7,8.6,6.8);part(c,[mx,my+176,mw,171],x-4.3,y+9.5,8.6,standHeight-10);part(c,[mx,my+347,mw,mh-347],x-4.3,y+2.7+standHeight-3.2,8.6,3.2);head(c,x,y,tier,t,on,speed,rattle);}
  else for(const dy of tier===3?[0,26]:[0]){const w=tier===1?5.2:5.6,h=w*a.mount[3]/a.mount[2];c.strokeStyle=tier===1?'#777d56':'#42473a';c.lineWidth=1;c.lineCap='round';c.beginPath();c.moveTo(x+3.6,y+dy+.7);c.lineTo(x+5.2,y+dy+2.2);c.stroke();part(c,a.mount,x+2.6,y+dy+1.6,w,h);head(c,x,y+dy,tier,t,on,speed,rattle);}
  c.restore();
 }
 function box(loc){if(loc==='closet')return STARTER_BOX;if(loc==='tent2')return T2_BOX;if(loc==='tent4')return [22,6,132,128];if(loc==='tent5')return [178,2,182,142];return null;}
 function placement(loc,x,y,tier){const b=box(loc),a=DATA.tiers[tier];return [b?Math.min(x,b[0]+b[2]*.875-(tier===2?a.width*.6:8.7)):x,y];}
 Gear.fan=function(c,x,y,tier,t,on=true){if(!loaded||!DATA.tiers[tier])return original.call(this,c,x,y,tier,t,on);const loc=activeLoc;[x,y]=placement(loc,x,y,tier);const b=box(loc),standHeight=tier===2&&b?Math.max(15.5,b[1]+b[3]*.89-y-2.7):15.5;sprite(c,x,y,tier,t,on,runtime.fanSpdHint||1,!!state?.fail.rattle,standHeight);if(loc)fixtures.set(loc,{x,y,tier});};
 RoomArt.hit=function(id,x,y,w,h,label,walk,layer){const m=/^fan:(closet|tent2|tent4|tent5)$/.exec(id),f=m&&fixtures.get(m[1]);if(f){const a=DATA.tiers[f.tier],b=box(m[1]);x=f.x-a.width*.63;y=f.y-a.width*.6;w=a.width*.63+Math.max(a.width*.63,8.3);h=(f.tier===3?26+a.width*.6:f.tier===2?18.4:a.width*.6)-(-a.width*.6);walk=walk||[b[0]+b[2]/2,b[1]+b[3]+(m[1]==='tent2'?12:14)];}return oldHit.call(this,id,x,y,w,h,label,walk,layer);};
 drawGearIcon=function(c,cv,slot,tier,museum){if(slot!=='fan'||!loaded||!DATA.tiers[tier])return oldIcon.call(this,c,cv,slot,tier,museum);cv.width=320;cv.height=240;c.fillStyle=museum?'#2a2016':'#1a2420';c.fillRect(0,0,320,240);const a=DATA.tiers[tier],height=tier===3?26+a.width*1.2:tier===2?18.2+a.width*.6:a.width*1.2,scale=Math.min(166/height,210/(a.width*1.2+8));c.save();c.translate(154,120);c.scale(scale,scale);sprite(c,0,(a.width*.6-(height-a.width*.6))/2,tier,0,false);c.restore();};
 function bind(){for(const [name,loc]of [['drawCloset','closet'],['drawTent','tent2']]){const draw=RoomArt[name];RoomArt[name]=function(...args){const prior=activeLoc;activeLoc=loc;fixtures.delete(loc);try{return draw.apply(this,args);}finally{activeLoc=prior;}};}const draw=TentArt.draw;TentArt.draw=function(c,loc,...args){const prior=activeLoc;activeLoc=box(loc)?loc:null;if(activeLoc)fixtures.delete(loc);try{return draw.call(this,c,loc,...args);}finally{activeLoc=prior;}};}
 const ready=new Promise((resolve,reject)=>{image.onload=()=>{loaded=true;bind();resolve();};image.onerror=()=>reject(Error('Fan proposal artwork failed'));image.src=DATA.image;});window.BagseedFanProposal=Object.freeze({ready,sprite,pose,placement,fixtures,get loaded(){return loaded;}});
})();
