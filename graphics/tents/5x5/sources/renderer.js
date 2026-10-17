/* Approved 5×5 shells: six live plants, twin lights and independent foreground fabric. */
(()=>{
 'use strict';
 const DATA=__BAGSEED_TENT5_DATA__,image=new Image(),original=TentArt.draw,icon=ShellArt.icon,extra=drawExtraIcon,locIcon=drawLocIcon;
 const [X,Y,W,H]=DATA.bounds,fronts=new Map(),glows=new Map();let loaded=false;
 const supported=()=>loaded&&!!DATA.tiers[Shell.of('tent5')?.tier];
 function opening(p,x=0,y=0,w=W,h=H){p.moveTo(x+w*.105,y+h*BagseedTentPlacement.roof('tent5'));p.lineTo(x+w*.895,y+h*BagseedTentPlacement.roof('tent5'));p.lineTo(x+w*.895,y+h*.81);p.quadraticCurveTo(x+w*.895,y+h*.90,x+w*.81,y+h*.90);p.lineTo(x+w*.19,y+h*.90);p.quadraticCurveTo(x+w*.105,y+h*.90,x+w*.105,y+h*.81);p.closePath();return p;}
 function sprite(c,tier,closed,x,y,w,h){c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,...DATA.tiers[tier][closed?'closed':'open'],x,y,w,h);c.restore();}
 function foreground(c,tier,dp){
  const step=Math.round(dp*8),key=tier+':'+step;
  if(!fronts.has(key)){const cv=document.createElement('canvas');cv.width=W*3;cv.height=H*3;const g=cv.getContext('2d');g.scale(3,3);
   if(step===8)sprite(g,tier,true,0,0,W,H);
   else{sprite(g,tier,false,0,0,W,H);g.save();g.globalCompositeOperation='destination-out';g.fill(opening(new Path2D()));g.restore();if(step){g.save();g.beginPath();g.rect(0,H*.1,W,H*.85*step/8);g.clip();sprite(g,tier,true,0,0,W,H);g.restore();}}
   fronts.set(key,cv);
  }
  c.save();c.imageSmoothingEnabled=true;c.drawImage(fronts.get(key),X,Y,W,H);c.restore();
 }
 function diffusion(c,n,on,t){
  if(window.BagseedGrowLights?.loaded){BagseedGrowLights.field(c,'tent5',n,on,t);return;}
  if(!n||!on||(state.fail.flicker&&!settings.reduced&&Math.sin(t*23)>.6))return;
  if(!glows.has(n)){const cv=document.createElement('canvas');cv.width=W*3;cv.height=H*3;const g=cv.getContext('2d');g.scale(3,3);const rgb=hexRGB(Gear.glowColor(n)).join(','),a=n>=3?.11:.17,grad=g.createLinearGradient(0,32,0,H*.91);grad.addColorStop(0,`rgba(${rgb},0)`);grad.addColorStop(.2,`rgba(${rgb},${a})`);grad.addColorStop(.65,`rgba(${rgb},${a*.55})`);grad.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=grad;g.fillRect(0,0,W,H);g.globalCompositeOperation='destination-in';const side=g.createLinearGradient(0,0,W,0);side.addColorStop(0,'transparent');side.addColorStop(.28,'#fff');side.addColorStop(.5,'rgba(255,255,255,.65)');side.addColorStop(.72,'#fff');side.addColorStop(1,'transparent');g.fillStyle=side;g.fillRect(0,0,W,H);glows.set(n,cv);}
  c.drawImage(glows.get(n),X,Y,W,H);
 }
 function slots(c,t){
  const positions=SLOT_POS.tent5,hit=RoomArt.hit;SLOT_POS.tent5=positions.map(([x,y],i)=>[x+DATA.slotVisualOffsetsX[i],y+DATA.slotVisualOffsetY]);
  RoomArt.hit=function(id,x,y,w,h,label,walk,layer){if(/^(plant|slot|gslot):tent5:/.test(id)&&!walk)walk=[x+w/2,Y+H+12];return hit.call(this,id,x,y,w,h,label,walk,layer);};
  try{RoomArt.drawSlots(c,'tent5',t);}finally{SLOT_POS.tent5=positions;RoomArt.hit=hit;}
 }
 TentArt.draw=function(c,loc,x,y,w,h,t){
  if(loc!=='tent5'||!supported())return original.call(this,c,loc,x,y,w,h,t);
  const L=state.locations.tent5,e=L.equip,dp=doorProg(loc),tier=Shell.of(loc).tier,cx=X+W/2,base=Y+H,env=envFor(loc),on=isLightOn(loc);
  const P={light:[cx,45],exhaust:[X+27,40],fan:[X+W-28,62],humid:[X+23,123],sensor:[X+W-31,74],dehum:[X+W+2,base-16],heater:[X-14,base-12],ctrl:[X+W+2,Y+18]};
  this.geo[loc]={x:X,y:Y,w:W,h:H,cx};runtime.drawLoc=loc;groundShadow(c,cx,base+1,W+6);sprite(c,tier,false,X,Y,W,H);RoomArt.plate(c,cx-15,Y,loc,t);
  if(e.dehum&&!window.BagseedDehumidifiers?.handles(loc)){groundShadow(c,P.dehum[0]+6,P.dehum[1]+16,14);Gear.dehum(c,...P.dehum,e.dehum,L.dehumOn||e.dehum===2,t);RoomArt.hit('dehum:'+loc,P.dehum[0]-1,P.dehum[1]-1,14,18,EQ.dehum[e.dehum].name,null,'equip');}
  if(e.heater){Gear.heater(c,...P.heater,e.heater,env.hvac.units.some(u=>u.dir>0),t);RoomArt.hit('heater:'+loc,P.heater[0]-1,P.heater[1]-3,14,16,EQ.heater[e.heater].name,null,'equip');}
  if(e.ctrl){Gear.ctrl(c,...P.ctrl,e.ctrl,true,t,false);RoomArt.hit('ctrl:'+loc,P.ctrl[0]-1,P.ctrl[1]-1,11,13,EQ.ctrl[e.ctrl].name,null,'equip');}
  if(dp<1){c.save();c.clip(opening(new Path2D(),X,Y,W,H));try{
   diffusion(c,e.light,on,t);Gear.filter(c,...P.exhaust,e.exhaust,exMul(L)>0,t);for(const lx of [cx-40,cx+40])Gear.light(c,lx,P.light[1],e.light,on,t);
   runtime.fanSpdHint=e.fan>=2?[.6,1,1.4][L.fanSpeed-1]:1;try{Gear.fan(c,...P.fan,e.fan,t,fanMul(L)>0);}finally{runtime.fanSpdHint=1;}
   Gear.humid(c,...P.humid,e.humid,e.humid&&locOn(L,'humid')&&(L.humidMode||e.humid===3)&&(!L.humidTimer||on),t,loc);if(window.BagseedDehumidifiers?.handles(loc))BagseedDehumidifiers.drawInside(c,loc,t);else Gear.sensor(c,...P.sensor,e.sensor,env,loc);slots(c,t);
  }finally{c.restore();}}
  foreground(c,tier,dp);
  if(dp>.9){if(Shell.of(loc).zip<35)R(c,X+W*.15,Y+H*.22,1,3,'#ffd257');const dry=plantsIn(loc).find(p=>p.stage===S.drying);if(dry)RoomArt.dryTag(c,cx+6,Y+40,dry,loc);}
  RoomArt.hit('space:'+loc,dp>=1?X+2:X,dp>=1?Y+2:Y,dp>=1?W-4:W,dp>=1?H-4:H,locName(loc)+(dp>=1?' (zipped)':'')+' · Grow space controls',[cx,base+8],dp>=1?'furniture':'structure');
  if(dp<1)for(const k of ['light','exhaust','fan','humid','sensor']){if(k==='sensor'&&window.BagseedDehumidifiers?.handles('tent5'))continue;const n=e[k];if(!n&&k!=='sensor')continue;const[px,py]=P[k],b={light:[-66,-7,132,12],exhaust:[-7,-12,14,30],fan:[-6,-6,12,14],humid:[-7,-14,14,15],sensor:[-1,-1,14,12]}[k];RoomArt.hit(k+':'+loc,px+b[0],py+b[1],b[2],b[3],k==='sensor'&&!n?'Climate check (hand)':EQ[k][n].name,[cx,base+8],'equip');}
    window.BagseedDehumidifiers?.drawSensor(c,'tent5');
 };
 // The older late glow must not draw over actors or the new front fabric.
 RoomArt.growEffectMasks.tent5=function(c){if(!supported())return;c.beginPath();c.rect(0,0,0,0);c.clip();};
 ShellArt.icon=function(c,cv,size,tier){if(size!=='tent5'||!loaded||!DATA.tiers[tier])return icon.call(this,c,cv,size,tier);cv.width=320;cv.height=240;c.fillStyle='#1a2420';c.fillRect(0,0,320,240);const h=216,w=h*W/H;sprite(c,tier,true,(320-w)/2,12,w,h);};
 drawExtraIcon=function(c,cv,id){if(id==='tent5'&&loaded)return ShellArt.icon(c,cv,'tent5','standard');return extra.call(this,c,cv,id);};
 drawLocIcon=function(c,cv,id,locked){if(id!=='tent5'||!supported())return locIcon.call(this,c,cv,id,locked);c.fillStyle='#1f2a24';c.fillRect(0,0,cv.width,cv.height);const h=cv.height-8,w=h*W/H;sprite(c,Shell.of('tent5').tier,true,(cv.width-w)/2,4,w,h);};
 const ready=new Promise((resolve,reject)=>{image.onload=()=>{loaded=true;resolve();};image.onerror=()=>reject(Error('5×5 tent artwork failed'));image.src=DATA.image;});
 window.BagseedTent5=Object.freeze({ready,sprite,foreground,opening,get loaded(){return loaded;}});
})();
