/* Shared bedroom heating/cooling lives beside the watering station/window. */
(()=>{
 'use strict';
 const layout=ACMount.layout,drawMount=ACMount.draw,addActors=Actors.addTo,statics=DecoZ.statics,solids=SCENES.bedroom.solids;
 function owners(){return ['closet','tent2'].filter(loc=>state?.locations?.[loc]&&locOwned(loc));}
 function floorUnits(){const units=[];for(const slot of ['heater','ac'])for(const loc of owners()){const e=state.locations[loc].equip;if(e[slot]&&(slot==='heater'||!e.hvac))units.push({loc,slot,tier:e[slot]});}return units.map((u,i)=>({...u,cx:323,foot:113+i*18,x:u.slot==='heater'?317:315,y:113+i*18-(u.slot==='heater'?12:u.tier===1?9:12),floor:true,win:false}));}
 function heaterPlacement(loc){const u=floorUnits().find(u=>u.loc===loc&&u.slot==='heater');return u?[u.x,u.y]:null;}
 function wallUnits(){return owners().filter(loc=>state.locations[loc].equip.hvac).map((loc,i)=>({loc,slot:'hvac',tier:state.locations[loc].equip.hvac,x:303,y:58+i*15,floor:false,win:false}));}
 ACMount.layout=function(room){return room==='bedroom'?[...floorUnits().filter(u=>u.slot==='ac'),...wallUnits()]:layout.call(this,room);};
 ACMount.draw=function(c,room,t){if(room!=='bedroom')return drawMount.call(this,c,room,t);for(const u of wallUnits()){runtime.drawLoc=u.loc;const on=envFor(u.loc).hvac.units.length>0;Gear.hvac(c,u.x,u.y,u.tier,on,t);RoomArt.hit('hvac:'+u.loc,u.x-2,u.y-2,30,13,EQ.hvac[u.tier].name+' · whole bedroom',[u.x+13,114],'equip');}};
 Actors.addTo=function(items,c,t,scene){addActors.call(this,items,c,t,scene);if(scene!=='bedroom')return;for(const u of floorUnits().filter(u=>u.slot==='ac'))items.push({y:u.foot,d:()=>{runtime.drawLoc=u.loc;groundShadow(c,u.cx,u.foot,17);Gear.ac(c,u.x,u.y,u.tier,envFor(u.loc).hvac.units.some(v=>v.dir<0),t);RoomArt.hit('ac:'+u.loc,u.x-1,u.foot-(u.tier===1?10:16),20,u.tier===1?12:18,EQ.ac[u.tier].name+' · whole bedroom',[u.cx,u.foot+7],'equip');}});};
 function footprint(u){return [u.cx-8,u.foot-4,17,5,u.slot==='heater'?'the room heater':'the room cooler'];}
 DecoZ.statics=function(zone){const original=statics.call(this,zone);return zone==='bedroom'?[...original.filter(r=>r[4]!=='a heater'),...floorUnits().map(footprint)]:original;};
 SCENES.bedroom.solids=function(){return [...solids.call(this),...floorUnits().map(u=>footprint(u).slice(0,4))];};
 function canControl(slot,loc){if(!state||state.scene!=='bedroom'||!['heater','ac','hvac'].includes(slot))return false;const u=[...floorUnits(),...wallUnits()].find(u=>u.loc===loc&&u.slot===slot);if(!u)return false;const x=u.floor?u.cx:u.x+13,y=u.floor?u.foot+7:114;return Math.hypot(state.player.x-x,(state.player.y-y)*.8)<=18;}
 function canAct(action,arg){const[loc,slot]=String(arg).split(':');return action==='heatMode'?canControl('heater',loc):action==='acMode'?canControl('ac',loc):['pwr','pwrSet','pwrB'].includes(action)&&canControl(slot,loc);}
 function canInput(key,loc){return key==='heatTo'&&(canControl('heater',loc)||canControl('hvac',loc))||key==='coolTo'&&(canControl('ac',loc)||canControl('hvac',loc));}
 window.BagseedRoomClimate=Object.freeze({floorUnits,wallUnits,heaterPlacement,canControl,canAct,canInput});
})();
