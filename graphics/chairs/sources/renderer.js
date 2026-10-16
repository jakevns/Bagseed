/* Bedroom desk chairs and both finishes of the placeable Office Chair. */
(()=>{
  'use strict';
  const DATA=__BAGSEED_CHAIR_DATA__,atlas=new Image(),gamingImage=new Image();let loaded=false,gamingLayers;
  const oldChair=RoomArt.drawChair,oldStyle=drawStyleIcon,oldOffice=DECOR.officechair.d,oldDecorIcon=drawDecorIcon,oldAssetDecor=Asset115.decor;
  function registerGaming(){
    const a=DATA.assets.gaming,k=Math.min(1,512/a.rect[3]),w=Math.ceil(a.rect[2]*k),h=Math.ceil(a.rect[3]*k);
    const canvas=()=>Object.assign(document.createElement('canvas'),{width:w,height:h});
    const base=canvas(),mask=canvas(),tint=canvas(),g=base.getContext('2d');g.drawImage(gamingImage,...a.rect,0,0,w,h);
    const pixels=g.getImageData(0,0,w,h),light=mask.getContext('2d').createImageData(w,h);let maskPixels=0,outsideChairPixels=0;
    for(let i=0;i<pixels.data.length;i+=4){
      const p=pixels.data,cyan=Math.min(p[i+1],p[i+2])-p[i];
      if(p[i+3]&&cyan>DATA.gaming.cyanThreshold&&p[i+1]>65&&p[i+2]>75){
        const alpha=Math.round(p[i+3]*Math.min(1,(cyan-DATA.gaming.cyanThreshold)/55));
        if(alpha>p[i+3])outsideChairPixels++;
        light.data[i]=light.data[i+1]=light.data[i+2]=255;light.data[i+3]=alpha;
        const shade=.65+.35*Math.max(p[i+1],p[i+2])/255;p[i]=147*shade;p[i+1]=113*shade;p[i+2]=85*shade;
        if(alpha)maskPixels++;
      }
    }
    if(maskPixels<40||outsideChairPixels)throw Error('Gaming chair LED material was not registered inside the artwork');
    g.putImageData(pixels,0,0);mask.getContext('2d').putImageData(light,0,0);
    return {base,mask,tint,registration:Object.freeze({method:'source-pixel-mask',maskPixels,outsideChairPixels,width:w,height:h})};
  }
  function draw(c,id,x,y,w,h,t=0){
    const a=DATA.assets[id],scale=Math.min(w/a.rect[2],h/a.rect[3]);
    const dw=a.rect[2]*scale,dh=a.rect[3]*scale,dx=x+(w-dw)/2,dy=y+h-dh;
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    if(id==='gaming'){
      c.drawImage(gamingLayers.base,dx,dy,dw,dh);
      const rgb=rgbNow(t);
      if(rgb){const g=gamingLayers.tint.getContext('2d');g.clearRect(0,0,gamingLayers.tint.width,gamingLayers.tint.height);g.drawImage(gamingLayers.mask,0,0);g.globalCompositeOperation='source-in';g.fillStyle=rgb.col;g.fillRect(0,0,gamingLayers.tint.width,gamingLayers.tint.height);g.globalCompositeOperation='source-over';c.globalAlpha*=Math.min(1,rgb.a);c.drawImage(gamingLayers.tint,dx,dy,dw,dh);}
    }else c.drawImage(atlas,...a.rect,dx,dy,dw,dh);
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
  const ready=Promise.all([[atlas,DATA.image],[gamingImage,DATA.gaming.image]].map(([im,src])=>new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=()=>reject(new Error('Chair artwork failed to load'));im.src=src;}))).then(()=>{
    gamingLayers=registerGaming();loaded=true;if(screen==='game'){hydrate(document);View.snap();}return {deskChairs:4,officeFinishes:2};
  });
  window.BagseedChairs=Object.freeze({revision:DATA.revision,ready,get loaded(){return loaded;},get rgbRegistration(){return gamingLayers?.registration;}});ready.catch(e=>console.error(e));
})();
