/* Isolated approval preview only: swap the two tent widths without moving desks. */
(()=>{
  STARTER_BOX.splice(0,4,2,8,54,90);
  T2_BOX.splice(0,4,64,8,86,112);
  SLOT_POS.closet=[[29,92]];SLOT_POS.tent2=[[87,114],[127,114]];
  Object.assign(DEV_POS.closet,{light:[29,34],exhaust:[42,22],fan:[45,48],humid:[15,96],sensor:[35,62],ctrl:[7,46],dehum:[57,100],heater:[5,101]});
  Object.assign(DEV_POS.tent2,{light:[107,39],exhaust:[81,26],fan:[132,50],humid:[86,108],sensor:[122,66]});
  const solids=SCENES.bedroom.solids,statics=DecoZ.statics,access=DecoZ.access,can=Gear.can,hit=RoomArt.hit;
  SCENES.bedroom.solids=function(){return solids.call(this).map(r=>r[0]===90&&r[1]===104&&r[2]===64?[64,104,86,18]:r);};
  DecoZ.statics=function(zone){return statics.call(this,zone).map(r=>zone==='bedroom'&&r[4]==='the starter tent'?[2,r[1],54,r[3],r[4]]:zone==='bedroom'&&r[4]==='the tent'?[64,r[1],86,r[3],r[4]]:zone==='bedroom'&&r[4]==='the watering can'?[298,r[1],r[2],r[3],r[4]]:r);};
  // The can and purchased reservoir share this bedroom floor position.
  Gear.can=function(c,x,y,...args){if(x===62&&y===103)x=300;return can.call(this,c,x,y,...args);};
  RoomArt.hit=function(id,x,y,w,h,label,walk,layer){if(id==='can'){x+=238;if(walk)walk=[walk[0]+238,walk[1]];}return hit.call(this,id,x,y,w,h,label,walk,layer);};
  DecoZ.access=function(zone){return access.call(this,zone).map(r=>zone==='bedroom'&&r[2]==='the watering can'?[308,118,r[2],r[3],[300,112,16,10]]:r);};
  // Soft reflected light is part of each tent, behind its contents and fabric.
  window.tentProposalDiffusion=function(c,loc,t){
    const L=state.locations[loc],n=L.equip.light;
    if(!n||!isLightOn(loc)||(state.fail.flicker&&!settings.reduced&&Math.sin(t*23)>.6))return;
    const [x,y]=DEV_POS[loc].light,box=loc==='closet'?STARTER_BOX:T2_BOX,bottom=box[1]+box[3]*.9;
    const rgb=Gear.glowColor(n).slice(1).match(/../g).map(v=>parseInt(v,16)),a=n>=3?.11:.17;
    const cv=document.createElement('canvas');cv.width=box[2]*3;cv.height=box[3]*3;
    const g=cv.getContext('2d');g.scale(3,3);g.translate(-box[0],-box[1]);
    const top=y-6,glow=g.createLinearGradient(0,top,0,bottom);
    glow.addColorStop(0,`rgba(${rgb.join(',')},0)`);glow.addColorStop(.2,`rgba(${rgb.join(',')},${a})`);glow.addColorStop(.65,`rgba(${rgb.join(',')},${a*.55})`);glow.addColorStop(1,`rgba(${rgb.join(',')},0)`);
    g.fillStyle=glow;g.fillRect(box[0],top,box[2],bottom-top);
    g.globalCompositeOperation='destination-in';const sides=g.createLinearGradient(box[0],0,box[0]+box[2],0);
    sides.addColorStop(0,'transparent');sides.addColorStop(.5,'#fff');sides.addColorStop(1,'transparent');g.fillStyle=sides;g.fillRect(box[0],box[1],box[2],box[3]);
    c.drawImage(cv,box[0],box[1],box[2],box[3]);
  };
})();
