/* Approval-only light mounting alignment; artwork and simulation unchanged. */
(()=>{
 'use strict';
 const DATA=__BAGSEED_GROW_LIGHTS_DATA__,image=new Image(),original=Gear.light,oldIcon=drawGearIcon,hit=RoomArt.hit,fields=new Map(),fixtures=new Map();let loaded=false,activeLoc=null,bound=false;
 const smooth=(a,b,x)=>{const k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k);};
 function fixtureY(loc,n){const a=DATA.tiers[n];return BagseedTentPlacement.roofY(loc)-.75-a.top-a.height*({1:93/227,2:90/225,3:84/239,4:88/277}[n]);}
 function layout(loc){
  const box=BagseedTentPlacement.bounds(loc);if(!box)return null;const n=state?.locations?.[loc]?.equip.light||1,y=fixtureY(loc,n),xs=loc==='closet'||loc==='tent2'?[DEV_POS[loc].light[0]]:loc==='tent4'?[88]:[229,309];return {box:box.slice(),sources:xs.map(x=>[x,y])};
 }
 function lit(on,t){return !!on&&!(state?.fail.flicker&&!settings.reduced&&Math.sin(t*23)>.6);}
 function sprite(c,x,y,tier,on,scale=1){const a=DATA.tiers[tier];if(!a)return;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,...a[on?'on':'off'],x-a.width*scale/2,y+a.top*scale,a.width*scale,a.height*scale);c.restore();}
 Gear.light=function(c,x,y,tier,on,t){
  if(!loaded||!DATA.tiers[tier])return original.call(this,c,x,y,tier,on,t);
  if(activeLoc)y=fixtureY(activeLoc,tier);sprite(c,x,y,tier,lit(on,t));if(activeLoc){const list=fixtures.get(activeLoc)||[];list.push([x,y,tier]);fixtures.set(activeLoc,list);}
 };
 function fieldImage(loc,n){
  const geo=layout(loc),a=DATA.tiers[n],key=JSON.stringify([loc,n,geo]);if(fields.has(key))return fields.get(key);
  const [X,Y,W,H]=geo.box,cv=document.createElement('canvas');cv.width=W*3;cv.height=H*3;const g=cv.getContext('2d'),pixels=g.createImageData(cv.width,cv.height),rgb=a.color,floor=Y+H*.9;
  for(let py=0;py<cv.height;py++)for(let px=0;px<cv.width;px++){
   const x=X+(px+.5)/3,y=Y+(py+.5)/3;let strength=0;
   for(const [sx,sy]of geo.sources){const dy=y-(sy+a.emitterY),range=floor-sy-a.emitterY,k=clamp(dy/range,0,1),sigma=lerp(Math.max(4,a.width*.3),W*a.spread,Math.pow(k,.65)),q=(x-sx)/sigma;
    strength+=Math.exp(-.5*q*q)*Math.pow(1-k,.65)*smooth(-2,7,dy)*(1-smooth(floor-8,floor,y));
   }
   const i=(py*cv.width+px)*4;pixels.data[i]=rgb[0];pixels.data[i+1]=rgb[1];pixels.data[i+2]=rgb[2];pixels.data[i+3]=Math.round(255*Math.min(.23,strength*a.alpha));
  }
  g.putImageData(pixels,0,0);fields.set(key,cv);return cv;
 }
 function particles(loc,n,t){
  const geo=layout(loc),a=DATA.tiers[n],out=[];if(!geo||!a||settings.reduced)return out;
  const [X,Y,W,H]=geo.box,floor=Y+H*.87,count=6+n;
  geo.sources.forEach(([sx,sy],lamp)=>{for(let i=0;i<count;i++){
   const seed=i+lamp*19+loc.length*7,life=(t*(.015+(i%3)*.002)+seed*.137)%1,top=sy+a.emitterY+4,depth=Math.max(1,floor-top),y=top+life*depth,k=(y-top)/depth;
   const radius=lerp(Math.max(3,a.width*.28),W*a.spread*.78,k),x=sx+Math.sin(seed*2.399)*radius+Math.sin(t*.18+seed)*1.1;
   out.push({x,y,r:.35+(i%3)*.12,a:Math.sin(Math.PI*life)**2*(.14+(i%4)*.035),lamp});
  }});return out;
 }
 function paintField(c,loc,n,on,t){
  if(!loaded||!DATA.tiers[n]||!layout(loc)||!lit(on,t))return;
  const [X,Y,W,H]=layout(loc).box;c.save();c.beginPath();c.rect(X,Y,W,H);c.clip();c.globalCompositeOperation='screen';c.drawImage(fieldImage(loc,n),X,Y,W,H);
  c.globalCompositeOperation='source-over';for(const p of particles(loc,n,t)){c.fillStyle=`rgba(255,246,226,${p.a})`;c.beginPath();c.arc(p.x,p.y,p.r,0,Math.PI*2);c.fill();}c.restore();
 }
 // Room tint belongs to the room; emitting LEDs and airborne light remain visible
 // afterward. This pass contains light only, clipped to the opening and cut out
 // by actual foreground character alpha. It never repaints tent fabric.
 const emissions=new Map(),surfaces=new Map();let worldFrame=null,lastActors=[];
 function emissionImage(n){
  if(emissions.has(n))return emissions.get(n);const a=DATA.tiers[n],[sx,sy,w,h]=a.on,cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');g.drawImage(image,sx,sy,w,h,0,0,w,h);const pixels=g.getImageData(0,0,w,h),d=pixels.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,r=d[i],green=d[i+1],b=d[i+2],v=y/h,bright=n<=2?Math.max((r-green*1.2)/150,(b-green*1.15)/130):Math.min((r-190)/60,(green-150)/90),start=n===4?.43:n===3?.62:.69;d[i+3]=Math.round(d[i+3]*clamp(bright,0,.84)*smooth(start,start+.05,v)*(1-smooth(.96,1,v)));}
  g.putImageData(pixels,0,0);emissions.set(n,cv);return cv;
 }
 function clipOpening(c,loc){
  const [x,y,w,h]=layout(loc).box,p=new Path2D();
  if(loc==='closet'){p.moveTo(x+w*.15,y+h*BagseedTentPlacement.roof('closet'));p.lineTo(x+w*.85,y+h*BagseedTentPlacement.roof('closet'));p.lineTo(x+w*.85,y+h*.815);p.quadraticCurveTo(x+w*.85,y+h*.902,x+w*.79,y+h*.902);p.lineTo(x+w*.21,y+h*.902);p.quadraticCurveTo(x+w*.15,y+h*.902,x+w*.15,y+h*.815);p.closePath();}
  else if(loc==='tent2')BagseedTent2.opening(p,x,y,w,h);
  else (loc==='tent4'?BagseedTent4:BagseedTent5).opening(p,x,y,w,h);
  c.clip(p);const dp=doorProg(loc);if(dp>0){const top=y+h*((loc==='closet'?.125:.1)+(loc==='closet'?.845:.85)*Math.round(dp*8)/8);c.beginPath();c.rect(x,top,w,Math.max(0,y+h-top));c.clip();}
 }
 function lateFrame(c,frame){
  lastActors=frame.actors;
  for(const [loc,draw]of frame.lights){const {n,on,t}=draw;if(!DATA.tiers[n]||!lit(on,t)||doorProg(loc)>=1)continue;const [X,Y,W,H]=layout(loc).box,a=DATA.tiers[n];
   if(!surfaces.has(loc)){const cv=document.createElement('canvas');cv.width=W*3;cv.height=H*3;surfaces.set(loc,cv);}const cv=surfaces.get(loc),g=cv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);g.save();g.scale(3,3);g.translate(-X,-Y);clipOpening(g,loc);paintField(g,loc,n,on,t);
   g.globalCompositeOperation='source-over';for(const [x,y]of layout(loc).sources)g.drawImage(emissionImage(n),x-a.width/2,y+a.top,a.width,a.height);
   g.globalCompositeOperation='destination-out';for(const actor of frame.actors)if(loc==='closet'||loc==='tent2'||actor.feet>=Y+H)g.drawImage(actor.image,...actor.args);g.restore();
   c.save();c.globalCompositeOperation='screen';c.drawImage(cv,X,Y,W,H);c.restore();
  }
 }
 function world(draw){return function(c,...args){if(worldFrame)return draw.call(this,c,...args);const frame=worldFrame={lights:new Map(),actors:[]};let complete=false;try{const result=draw.call(this,c,...args);complete=true;return result;}finally{worldFrame=null;if(complete)lateFrame(c,frame);}};}
 const personDraw=drawPerson;
 drawPerson=function(c,x,y,...args){if(!worldFrame)return personDraw.call(this,c,x,y,...args);const frame=worldFrame,own=Object.prototype.hasOwnProperty.call(c,'drawImage'),draw=c.drawImage;
  c.drawImage=function(image,...positions){if(positions.length===4)frame.actors.push({image,args:positions,feet:y});return draw.call(this,image,...positions);};
  try{return personDraw.call(this,c,x,y,...args);}finally{if(own)c.drawImage=draw;else delete c.drawImage;}
 };

 function field(c,loc,n,on,t){if(worldFrame){worldFrame.lights.set(loc,{n,on,t});return;}paintField(c,loc,n,on,t);}
 RoomArt.diffuseTentLight=function(c,loc,t){const L=state.locations[loc];field(c,loc,L.equip.light,isLightOn(loc),t);};
 RoomArt.hit=function(id,x,y,w,h,label,walk,layer){
  const match=/^light:(closet|tent2|tent4|tent5)$/.exec(id),list=match&&fixtures.get(match[1]);
  if(loaded&&list?.length){const geo=layout(match[1]),boxes=list.map(([px,py,tier])=>{const a=DATA.tiers[tier];return [px-a.width/2,Math.max(py+a.top,BagseedTentPlacement.roofY(match[1])),px+a.width/2,py+a.top+a.height];});x=Math.min(...boxes.map(b=>b[0]));y=Math.min(...boxes.map(b=>b[1]));w=Math.max(...boxes.map(b=>b[2]))-x;h=Math.max(8,Math.max(...boxes.map(b=>b[3]))-y);if(!walk)walk=[geo.box[0]+geo.box[2]/2,Math.max(geo.box[1]+geo.box[3]+12,curScene().walk[1]+6)];}
  return hit.call(this,id,x,y,w,h,label,walk,layer);
 };
 drawGearIcon=function(c,cv,slot,tier,museum){
  if(slot!=='light'||!loaded||!DATA.tiers[tier])return oldIcon.call(this,c,cv,slot,tier,museum);
  cv.width=320;cv.height=240;c.fillStyle=museum?'#2a2016':'#1a2420';c.fillRect(0,0,320,240);const a=DATA.tiers[tier],scale=Math.min(244/a.width,166/a.height);sprite(c,160,120-(a.top+a.height/2)*scale,tier,true,scale);
 };
 function bind(){
  if(bound)return;bound=true;
  for(const [name,loc]of [['drawCloset','closet'],['drawTent','tent2']]){const draw=RoomArt[name];RoomArt[name]=function(...args){const previous=activeLoc;activeLoc=loc;fixtures.set(loc,[]);try{return draw.apply(this,args);}finally{activeLoc=previous;}};}
  RoomArt.draw=world(RoomArt.draw);SCENES.growroom.draw=world(SCENES.growroom.draw);
  const draw=TentArt.draw;TentArt.draw=function(c,loc,...args){const previous=activeLoc;activeLoc=layout(loc)?loc:null;if(activeLoc)fixtures.set(loc,[]);try{return draw.call(this,c,loc,...args);}finally{activeLoc=previous;}};
 }
 const ready=new Promise((resolve,reject)=>{image.onload=()=>{loaded=true;bind();resolve();};image.onerror=()=>reject(Error('Grow-light artwork failed'));image.src=DATA.image;});
 window.BagseedGrowLights=Object.freeze({ready,bind,field,particles,layout,fixtureY,sprite,fieldImage,fixtures,effectSurfaces:surfaces,get lastActors(){return lastActors;},get loaded(){return loaded;}});
})();
