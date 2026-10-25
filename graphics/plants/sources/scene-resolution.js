/* Preserve painted plant detail through the room and camera passes. */
(()=>{
 'use strict';
 const scenes=new Set(['bedroom','growroom']),MAX_PIXELS=4_000_000;
 const originalEnsure=View.ensureWorld,originalRender=View.render;
 function density(){const S=curScene();return scenes.has(state.scene)?Math.max(3,Math.min(6,Math.ceil(View.zoom),Math.floor(Math.sqrt(MAX_PIXELS/(S.w*S.h))))):3;}
 View.ensureWorld=function(){
  if(!scenes.has(state.scene))return originalEnsure.call(this);
  const S=curScene(),d=density(),w=S.w*d,h=S.h*d;
  if(this.world.width!==w||this.world.height!==h){this.world.width=w;this.world.height=h;this.wctx=this.world.getContext('2d');}
  this.wctx.setTransform(d,0,0,d,0,0);this.wctx.imageSmoothingEnabled=false;
  if(this.sceneId!==state.scene){this.sceneId=state.scene;this.computeZoom();this.update(0,true);}
 };
 View.render=function(){
  if(!scenes.has(state.scene))return originalRender.call(this);
  const c=this.ctx,draw=c.drawImage,world=this.world;
  c.drawImage=function(image,...args){
   if(image!==world||args.length!==8)return draw.call(this,image,...args);
   // The character renderer's older source rectangle assumes 3x. Use the
   // actual backing size, retaining its camera, borders and destination rect.
   args[2]=world.width;args[3]=world.height;
   this.save();this.imageSmoothingEnabled=true;this.imageSmoothingQuality='high';
   try{return draw.call(this,image,...args);}finally{this.restore();}
  };
  try{return originalRender.call(this);}finally{c.drawImage=draw;}
 };
 const plantDraw=PlantArt.draw;
 PlantArt.draw=function(c,p,x,y,scale=1){
  const s=this.get(p);
  if(s.illustrated){const m=c.getTransform();s.drawDensity=Math.max(3,Math.min(6,Math.ceil(Math.max(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d))*Math.abs(scale))));}
  return plantDraw.apply(this,arguments);
 };
 window.BagseedPlantResolution=Object.freeze({revision:'plant-resolution-1',density,maxDensity:6,maxWorldPixels:MAX_PIXELS});
})();
