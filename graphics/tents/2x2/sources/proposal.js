/* Approval prototype. Injected only into an isolated public/index.html browser. */
(()=>{
  'use strict';
  const DATA=__TENT2_PROPOSAL__,image=new Image(),original=RoomArt.drawTent,icon=ShellArt.icon,extra=drawExtraIcon,locIcon=drawLocIcon;
  const [X,Y,W,H]=T2_BOX,fronts=new Map();let loaded=false;
  const supported=()=>loaded&&!!DATA.tiers[Shell.of('tent2')?.tier];
  function opening(p,x=0,y=0,w=W,h=H){p.moveTo(x+w*.125,y+h*.26);p.lineTo(x+w*.875,y+h*.26);p.lineTo(x+w*.875,y+h*.81);p.quadraticCurveTo(x+w*.875,y+h*.89,x+w*.8,y+h*.89);p.lineTo(x+w*.2,y+h*.89);p.quadraticCurveTo(x+w*.125,y+h*.89,x+w*.125,y+h*.81);p.closePath();return p;}
  function sprite(c,tier,closed,x,y,w,h){c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,...DATA.tiers[tier][closed?'closed':'open'],x,y,w,h);c.restore();}
  function foreground(c,tier,dp){
    const step=Math.round(dp*8),key=tier+':'+step;
    if(!fronts.has(key)){
      const cv=document.createElement('canvas');cv.width=W*3;cv.height=H*3;const g=cv.getContext('2d');g.scale(3,3);
      if(step===8)sprite(g,tier,true,0,0,W,H);
      else{sprite(g,tier,false,0,0,W,H);g.save();g.globalCompositeOperation='destination-out';g.fill(opening(new Path2D()));g.restore();if(step){g.save();g.beginPath();g.rect(0,H*.10,W,H*.85*step/8);g.clip();sprite(g,tier,true,0,0,W,H);g.restore();}}
      fronts.set(key,cv);
    }
    c.save();c.imageSmoothingEnabled=true;c.drawImage(fronts.get(key),X,Y,W,H);c.restore();
  }
  function slots(c,t){
    // Render-only anchors; always restore the logical geometry before returning.
    const positions=SLOT_POS.tent2,hit=RoomArt.hit;SLOT_POS.tent2=positions.map(([x,y],i)=>[x+DATA.slotVisualOffsetsX[i],y+DATA.slotVisualOffsetY]);
    RoomArt.hit=function(id,x,y,w,h,label,walk,layer){
      if(/^(plant|slot|gslot):tent2:/.test(id)&&!walk){const a=curScene().walk;walk=[clamp(x+w/2,a[0]+4,a[2]-4),clamp(Math.max(y-DATA.slotVisualOffsetY+h+6,a[1]+6),a[1],a[3])];}
      return hit.call(this,id,x,y,w,h,label,walk,layer);
    };
    try{RoomArt.drawSlots(c,'tent2',t);}finally{SLOT_POS.tent2=positions;RoomArt.hit=hit;}
  }
  RoomArt.drawTent=function(c,t){
    if(!supported())return original.call(this,c,t);
    const L=state.locations.tent2,P=DEV_POS.tent2,e=L.equip,dp=doorProg('tent2'),tier=Shell.of('tent2').tier;runtime.drawLoc='tent2';
    groundShadow(c,X+W/2,Y+H+1,W+6);sprite(c,tier,false,X,Y,W,H);this.plate(c,Math.round(X+W/2-15),0,'tent2',t);
    const env=envFor('tent2'),on=isLightOn('tent2');Gear.ctrl(c,P.ctrl[0],P.ctrl[1],e.ctrl,true,t,false);
    if(e.ctrl)this.hit('ctrl:tent2',P.ctrl[0]-1,P.ctrl[1]-1,11,13,EQ.ctrl[e.ctrl].name,null,'equip');
    if(dp<1){
      c.save();c.clip(opening(new Path2D(),X,Y,W,H));
      try{
        tentProposalDiffusion(c,'tent2',t);
        Gear.light(c,P.light[0],P.light[1]+DATA.lightVisualOffsetY,e.light,on,t);
        Gear.filter(c,P.exhaust[0],P.exhaust[1],e.exhaust,exMul(L)>0,t);
        runtime.fanSpdHint=e.fan>=2?[.6,1,1.4][L.fanSpeed-1]:1;try{Gear.fan(c,P.fan[0],P.fan[1],e.fan,t,fanMul(L)>0);}finally{runtime.fanSpdHint=1;}
        Gear.humid(c,P.humid[0],P.humid[1]+DATA.humidVisualOffsetY,e.humid,e.humid&&locOn(L,'humid')&&(L.humidMode||e.humid===3)&&(!L.humidTimer||on),t,'tent2');
        Gear.sensor(c,P.sensor[0],P.sensor[1],e.sensor,env,'tent2');slots(c,t);
      }finally{c.restore();}
    }
    foreground(c,tier,dp);
    if(dp>.9){if(Shell.of('tent2').zip<35)R(c,X+W*.15,Y+H*.22,1,3,'#ffd257');const dry=plantsIn('tent2').find(p=>p.stage===S.drying);if(dry)this.dryTag(c,X+W/2+4,50,dry,'tent2');}
    if(dp>=1)this.hit('space:tent2',X+2,Y+2,W-4,H-4,'2x2 tent (zipped) · Grow space controls',null,'furniture');
    else{
      this.hit('space:tent2',X,Y,W,H,'2x2 tent · Grow space controls',null,'structure');
      for(const k of ['light','exhaust','fan','humid','sensor']){const n=e[k];if(!n&&k!=='sensor')continue;const[x,py]=P[k],y=py+(k==='light'?DATA.lightVisualOffsetY:k==='humid'?DATA.humidVisualOffsetY:0),b={light:[-22,-7,44,12],exhaust:[-7,-12,14,30],fan:[-6,-6,12,14],humid:[-7,-14,14,15],sensor:[-1,-1,14,12]}[k];this.hit(k+':tent2',x+b[0],y+b[1],b[2],b[3],k==='sensor'&&!n?'Climate check (hand)':EQ[k][n].name,null,'equip');}
    }
  };
  // The legacy room beam uses fixed old bounds. Local diffusion above replaces it.
  RoomArt.growEffectMasks.tent2=function(c){if(!supported())return;c.beginPath();c.rect(0,0,0,0);c.clip();};
  ShellArt.icon=function(c,cv,size,tier){if(size!=='tent2'||!loaded||!DATA.tiers[tier])return icon.call(this,c,cv,size,tier);cv.width=320;cv.height=240;c.fillStyle='#1a2420';c.fillRect(0,0,320,240);const h=216,w=h*W/H;sprite(c,tier,true,(320-w)/2,12,w,h);};
  drawExtraIcon=function(c,cv,id){if(id==='tent2'&&loaded)return ShellArt.icon(c,cv,'tent2','standard');return extra.call(this,c,cv,id);};
  drawLocIcon=function(c,cv,id,locked){if(id!=='tent2'||!supported())return locIcon.call(this,c,cv,id,locked);c.fillStyle='#1f2a24';c.fillRect(0,0,cv.width,cv.height);const h=cv.height-8,w=h*W/H;sprite(c,Shell.of('tent2').tier,true,(cv.width-w)/2,4,w,h);};
  const ready=new Promise((resolve,reject)=>{image.onload=()=>{loaded=true;resolve();};image.onerror=()=>reject(Error('2x2 proposal image failed'));image.src=DATA.image;});
  window.BagseedTent2Proposal=Object.freeze({ready,sprite,foreground,opening,get loaded(){return loaded;}});
})();
