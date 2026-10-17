/* Starter tent only. Contents, fabric foreground and door remain independent. */
(() => {
  'use strict';
  const DATA=__BAGSEED_STARTER_TENT_DATA__, images={},fronts=new Map();
  const originalCloset=RoomArt.drawCloset,originalIcon=ShellArt.icon,originalLocIcon=drawLocIcon;
  const [X,Y,W,H]=STARTER_BOX,SCALE=3;
  let loaded=false;
  const supported=()=>loaded&&!!DATA.tiers[Shell.of('closet')?.tier];
  function opening(p,x=0,y=0,w=W,h=H){
    p.moveTo(x+w*.15,y+h*BagseedTentPlacement.roof('closet'));p.lineTo(x+w*.85,y+h*BagseedTentPlacement.roof('closet'));p.lineTo(x+w*.85,y+h*.815);
    p.quadraticCurveTo(x+w*.85,y+h*.902,x+w*.79,y+h*.902);p.lineTo(x+w*.21,y+h*.902);
    p.quadraticCurveTo(x+w*.15,y+h*.902,x+w*.15,y+h*.815);p.closePath();return p;
  }
  function sprite(c,tier,closed,x,y,w,h){
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.drawImage(images[tier],...DATA.tiers[tier][closed?'closed':'open'],x,y,w,h);c.restore();
  }
  function front(tier,dp){
    const step=Math.round(dp*8),key=tier+':'+step;if(fronts.has(key))return fronts.get(key);
    const cv=document.createElement('canvas');cv.width=W*SCALE;cv.height=H*SCALE;const c=cv.getContext('2d');c.scale(SCALE,SCALE);
    if(step===8)sprite(c,tier,true,0,0,W,H);
    else{
      sprite(c,tier,false,0,0,W,H);c.save();c.globalCompositeOperation='destination-out';c.fill(opening(new Path2D()));c.restore();
      if(step){c.save();c.beginPath();c.rect(0,H*.125,W,H*.795*step/8);c.clip();sprite(c,tier,true,0,0,W,H);c.restore();}
    }
    fronts.set(key,cv);return cv;
  }
  function facade(c,tier,dp){
    c.save();c.imageSmoothingEnabled=true;c.drawImage(front(tier,dp),X,Y,W,H);c.restore();
  }
  function indicators(c,dp){
    const shell=Shell.of('closet');if(dp>.9){
      if(isLightOn('closet'))R(c,X+W/2-1,Y+H*.9,2,1,mix('#24272b',Gear.glowColor(state.locations.closet.equip.light),.5));
      if(shell.zip<35)R(c,X+W*.095,Y+H*.22,1,3,'#ffd257');
    }
    if(dp>=1){const dry=plantsIn('closet').find(p=>p.stage===S.drying);if(dry)RoomArt.dryTag(c,X+W/2-8,38,dry,'closet');}
  }
  function slots(c,t){
    // Seat the pot on the rear half of the liner, leaving visible floor in front.
    const hit=this.hit,scale=DATA.slotVisualScale,cx=SLOT_POS.closet[0][0],anchor=SLOT_POS.closet[0][1],base=DATA.slotVisualBaseY;
    c.save();c.translate(cx,base);c.scale(scale,scale);c.translate(-cx,-anchor);
    this.hit=function(id,x,y,w,h,label,walk,layer){
      if(!walk){const a=curScene().walk;walk=[cx,clamp(STARTER_BOX[1]+STARTER_BOX[3]+14,a[1],a[3])];}
      return hit.call(this,id,cx+(x-cx)*scale,base+(y-anchor)*scale,w*scale,h*scale,label,walk,layer);
    };
    try{this.drawSlots(c,'closet',t);}finally{this.hit=hit;c.restore();}
  }
  RoomArt.drawCloset=function(c,t){
    if(!supported())return originalCloset.call(this,c,t);
    const L=state.locations.closet,dp=doorProg('closet'),P=DEV_POS.closet,tier=Shell.of('closet').tier;runtime.drawLoc='closet';
    groundShadow(c,X+W/2,Y+H+1,W+4);sprite(c,tier,false,X,Y,W,H);this.plate(c,Math.round(X+W/2-15),0,'closet',t);
    if(dp<1){
      c.save();c.clip(opening(new Path2D(),X,Y,W,H));
      try{
        const env=envFor('closet'),on=isLightOn('closet'),e=L.equip;
        RoomArt.diffuseTentLight(c,'closet',t);Gear.filter(c,P.exhaust[0],P.exhaust[1],e.exhaust,exMul(L)>0,t);
        Gear.light(c,P.light[0],P.light[1],e.light,on,t);

        Gear.ctrl(c,P.ctrl[0],P.ctrl[1],e.ctrl,true,t,false);
        Gear.humid(c,P.humid[0],P.humid[1],e.humid,e.humid&&locOn(L,'humid')&&(L.humidMode||e.humid===3)&&(!L.humidTimer||on),t,'closet');
        if(window.BagseedDehumidifiers?.handles('closet'))BagseedDehumidifiers.drawInside(c,'closet',t);else Gear.sensor(c,P.sensor[0],P.sensor[1],e.sensor,env,'closet');slots.call(this,c,t);
        // Side-mounted fans sit in front of the canopy, behind the tent fabric.
        runtime.fanSpdHint=e.fan>=2?[.6,1,1.4][L.fanSpeed-1]:1;
        try{Gear.fan(c,P.fan[0],P.fan[1],e.fan,t,fanMul(L)>0);}finally{runtime.fanSpdHint=1;}
      }finally{c.restore();}
    }
    facade(c,tier,dp);indicators(c,dp);
    if(dp>=1)this.hit('space:closet',X+2,Y+2,W-4,H-3,'Starter tent (zipped) · Grow space controls',null,'furniture');
    else{
      this.hit('space:closet',X,Y,W,H,'Starter tent · Grow space controls',null,'structure');
      for(const k of ['light','exhaust','fan','humid','sensor','ctrl']){
        if(k==='sensor'&&window.BagseedDehumidifiers?.handles('closet'))continue;const n=L.equip[k];if(!n&&k!=='sensor')continue;const[x,y]=P[k];
        const box={light:[-14,-7,28,12],exhaust:[-8,-12,16,30],fan:[-6,-6,12,14],humid:[-7,-14,14,15],sensor:[-1,-1,L.equip.sensor===3?20:14,14],ctrl:[-1,-1,11,13]}[k];
        this.hit(k+':closet',x+box[0],y+box[1],box[2],box[3],k==='sensor'&&!n?'Climate check (hand)':EQ[k][n].name,null,'equip');
      }
    }
    window.BagseedDehumidifiers?.drawSensor(c,'closet');
  };
  // Keep lighting inside the current opening. Fabric is drawn only in its normal
  // scene position, before players/NPCs, never as a final room-wide repaint.
  RoomArt.growEffectMasks.closet=function(c){if(!supported())return;c.beginPath();c.rect(0,0,0,0);c.clip();};
  ShellArt.icon=function(c,cv,size,tier){
    if(size!=='closet'||!loaded||!DATA.tiers[tier])return originalIcon.call(this,c,cv,size,tier);
    cv.width=320;cv.height=240;c.fillStyle='#1a2420';c.fillRect(0,0,320,240);sprite(c,tier,true,98,16,125,208);
  };
  drawLocIcon=function(c,cv,id,locked){
    if(id!=='closet'||!supported())return originalLocIcon.call(this,c,cv,id,locked);
    c.fillStyle='#1f2a24';c.fillRect(0,0,cv.width,cv.height);const h=cv.height-8,w=h*W/H;
    sprite(c,Shell.of('closet').tier,true,(cv.width-w)/2,4,w,h);
  };
  const ready=Promise.all(Object.entries(DATA.tiers).map(([tier,a])=>new Promise((resolve,reject)=>{
    const im=images[tier]=new Image();im.onload=resolve;im.onerror=()=>reject(new Error('Starter tent '+tier+' artwork failed to load'));im.src=a.image;
  }))).then(()=>{loaded=true;if(state){hydrate(document);if(screen==='game')View.snap();}return {shells:Object.keys(DATA.tiers)};});
  window.BagseedStarterTent=Object.freeze({revision:DATA.revision,ready,get loaded(){return loaded;}});
  ready.catch(error=>console.error(error));
})();
