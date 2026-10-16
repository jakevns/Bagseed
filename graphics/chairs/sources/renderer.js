/* Bedroom desk chairs and both finishes of the placeable Office Chair. */
(()=>{
  'use strict';
  const DATA=__BAGSEED_CHAIR_DATA__,atlas=new Image();let loaded=false;
  const oldChair=RoomArt.drawChair,oldStyle=drawStyleIcon,oldOffice=DECOR.officechair.d,oldDecorIcon=drawDecorIcon,oldAssetDecor=Asset115.decor;
  function draw(c,id,x,y,w,h,t=0){
    const a=DATA.assets[id],scale=Math.min(w/a.rect[2],h/a.rect[3]);
    const dw=a.rect[2]*scale,dh=a.rect[3]*scale,dx=x+(w-dw)/2,dy=y+h-dh;
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,...a.rect,dx,dy,dw,dh);
    if(id==='gaming'){
      const rgb=rgbNow(t),color=rgb?rgb.col:'#b66b51';c.strokeStyle=color;c.globalAlpha=rgb?rgb.a*.85:.55;c.lineJoin='round';c.lineCap='round';c.lineWidth=Math.max(.13,dw*.014);
      for(const points of a.piping||[]){c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(dx+px*dw,dy+py*dh):c.moveTo(dx+px*dw,dy+py*dh));c.stroke();}
    }
    c.restore();
  }
  RoomArt.drawChair=function(c){
    const id=state.room.chair;if(!loaded||!['folding','office','gaming','wood'].includes(id))return oldChair.call(this,c);
    groundShadow(c,190,118,16);draw(c,id,182,88,16,30,runtime.t);
  };
  DECOR.officechair.d=function(c,x,y,flip,t,V){
    if(!loaded)return oldOffice.call(this,c,x,y,flip,t,V);
    const id=V?.n==='Teal'?'teal':'mesh';groundShadow(c,x+6,y+18,12);draw(c,id,x,y,12,18,t);
  };
  function card(c,cv,id){
    cv.width=320;cv.height=280;c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle='#1a2420';c.fillRect(0,0,320,280);
    draw(c,id,40,18,240,244,0);c.restore();
  }
  drawStyleIcon=function(c,cv,slot,id){
    if(slot!=='chair'||!loaded||!['folding','office','gaming','wood','none'].includes(id))return oldStyle.call(this,c,cv,slot,id);
    if(id==='none'){cv.width=320;cv.height=280;c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle='#1a2420';c.fillRect(0,0,320,280);c.strokeStyle='#80947d';c.lineWidth=3;c.strokeRect(96,76,128,128);c.beginPath();c.moveTo(109,190);c.lineTo(211,90);c.stroke();c.restore();return;}
    card(c,cv,id);
  };
  drawDecorIcon=function(c,cv,id,variant=0){
    if(id!=='officechair'||!loaded)return oldDecorIcon.call(this,c,cv,id,variant);card(c,cv,variant===1?'teal':'mesh');
  };
  Asset115.decor=function(cv,id){
    if(id!=='officechair'||!loaded)return oldAssetDecor.call(this,cv,id);card(cv.getContext('2d'),cv,'mesh');this.coverage.add('decor:'+id);return true;
  };
  const ready=new Promise((resolve,reject)=>{atlas.onload=()=>{loaded=true;if(screen==='game'){hydrate(document);View.snap();}resolve({deskChairs:4,officeFinishes:2});};atlas.onerror=()=>reject(new Error('Chair artwork failed to load'));atlas.src=DATA.image;});
  window.BagseedChairs=Object.freeze({revision:DATA.revision,ready,get loaded(){return loaded;}});ready.catch(e=>console.error(e));
})();
