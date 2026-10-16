/* Illustrated camera gear and the separate decorative vintage camera. */
(()=>{
  'use strict';
  const DATA=__BAGSEED_CAMERA_DATA__,atlas=new Image();let loaded=false;
  const oldCamera=Gear.camera,oldDesk=RoomArt.drawDesk,oldGearIcon=drawGearIcon,oldDecorIcon=drawDecorIcon,oldVintage=DECOR.camdisplay.d;
  const oldAssetDecor=Asset115.decor;
  function sprite(c,id,x,y,w,h){const a=DATA.assets[id];h=h??w*a.rect[3]/a.rect[2];c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,...a.rect,x,y,w,h);c.restore();}
  Gear.camera=function(c,x,y,tier){
    if(!loaded||![0,1,2].includes(tier))return oldCamera.call(this,c,x,y,tier);
    if(tier===0){const w=7,h=w*DATA.assets.phoneFlat.rect[3]/DATA.assets.phoneFlat.rect[2];sprite(c,'phoneFlat',x,y+.7-h,w,h);}
    else if(tier===1){const w=7,h=w*DATA.assets.compact.rect[3]/DATA.assets.compact.rect[2];sprite(c,'compact',x,y+.7-h,w,h);}
    else{groundShadow(c,x+3,y+18,10);sprite(c,'tripod',x-1.5,y-1.4,9,19.4);sprite(c,'dslrBody',x-2,y-9,10,7.7);}
  };
  RoomArt.drawDesk=function(c,t){
    const value=oldDesk.call(this,c,t);
    if(loaded&&state.gear.camera===0){
      // A flat phone occupies the compact camera's existing desk corner. Do not
      // paint it through an existing user-placed tabletop decoration.
      const blocked=state.room.placed.some(d=>{const D=decorDef(d.id);return D?.k==='desk'&&hitRect([199,71,7,3],[d.x,d.y,D.w,D.h]);});
      if(!blocked)Gear.camera(c,199,73,0);
    }
    return value;
  };
  DECOR.camdisplay.d=function(c,x,y,flip,t,V){
    if(!loaded)return oldVintage.call(this,c,x,y,flip,t,V);
    const w=8,h=w*DATA.assets.vintage.rect[3]/DATA.assets.vintage.rect[2];sprite(c,'vintage',x,y+8-h,w,h);
  };
  function icon(ctx,cv,id){
    cv.width=320;cv.height=240;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1a2420';ctx.fillRect(0,0,320,240);
    const a=DATA.assets[id],scale=Math.min(270/a.rect[2],196/a.rect[3]),w=a.rect[2]*scale,h=a.rect[3]*scale;
    sprite(ctx,id,(320-w)/2,(240-h)/2,w,h);ctx.restore();
  }
  drawGearIcon=function(ctx,cv,slot,tier,museum){
    if(slot!=='camera'||!loaded||![0,1,2].includes(tier))return oldGearIcon.call(this,ctx,cv,slot,tier,museum);
    icon(ctx,cv,['phone','compact','dslr'][tier]);
  };
  drawDecorIcon=function(ctx,cv,id){
    if(id!=='camdisplay'||!loaded)return oldDecorIcon.call(this,ctx,cv,id);icon(ctx,cv,'vintage');
  };
  Asset115.decor=function(cv,id){
    if(id!=='camdisplay'||!loaded)return oldAssetDecor.call(this,cv,id);
    icon(cv.getContext('2d'),cv,'vintage');this.coverage.add('decor:'+id);return true;
  };
  const ready=new Promise((resolve,reject)=>{atlas.onload=()=>{loaded=true;if(screen==='game'){hydrate(document);View.snap();}resolve({cameraTiers:3,decorativeCameras:1});};atlas.onerror=()=>reject(new Error('Camera artwork failed to load'));atlas.src=DATA.image;});
  window.BagseedCameras=Object.freeze({revision:DATA.revision,ready,get loaded(){return loaded;}});ready.catch(e=>console.error(e));
})();
