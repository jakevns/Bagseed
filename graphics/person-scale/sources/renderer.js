/* Person scale: people in the illustrated home grow spaces stand at a
   believable height beside doors, beds and tents. Sprites grow upward from
   their feet, so walking, collision, depth sorting and interaction distances
   keep their world coordinates. */
(()=>{
 'use strict';
 const SCALE=__BAGSEED_PERSON_SCALE__,SCENES_SCALED=['bedroom','growroom'];
 let active=null;
 function scaled(draw){return function(c,...args){if(active)return draw.call(this,c,...args);active=c;try{return draw.call(this,c,...args);}finally{active=null;}};}
 for(const id of SCENES_SCALED)SCENES[id].draw=scaled(SCENES[id].draw);
 const on=c=>active&&c===active;
 const person=drawPerson;
 drawPerson=function(c,x,y,look,scale=1,anim={},face){
  if(!on(c)||scale!==1)return person.call(this,c,x,y,look,scale,anim,face);
  const k=SCALE;c.save();c.globalAlpha*=.6;groundShadow(c,Math.round(x),Math.round(y),Math.round(12*k));c.restore();
  // Drawing at the renderer's own scale keeps the sprite's drawImage bounds in
  // world units, which the grow-light and pot glow layers use as silhouettes.
  const result=person.call(this,c,x,y,look,k,anim,face);
  // The renderer only carries flashlights at scale 1; scale the carrier to match.
  if(NightLamps1151.drawing){if(typeof anim==='number')anim={frame:anim,dir:face<0?'left':face>0?'right':'down'};c.save();c.translate(x,y);c.scale(k,k);c.translate(-x,-y);try{NightLamps1151.carry(c,x,y,look,anim);}finally{c.restore();}}
  return result;
 };
 const emote=drawEmote;
 drawEmote=function(c,x,y,...args){return emote.call(this,c,x,on(c)?Math.round(y-46*(SCALE-1)):y,...args);};
 const hit=RoomArt.hit;
 RoomArt.hit=function(id,x,y,w,h,label,walk,layer){
  if(active&&(layer==='player'||layer==='npc')){const cx=x+w/2,bottom=y+h;w*=SCALE;h*=SCALE;x=cx-w/2;y=bottom-h;}
  return hit.call(this,id,x,y,w,h,label,walk,layer);
 };
 window.BagseedPersonScale=Object.freeze({scale:SCALE,scenes:Object.freeze([...SCENES_SCALED]),active:()=>!!active});
})();
