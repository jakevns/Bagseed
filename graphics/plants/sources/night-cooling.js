/* Room controller adapter. Color uses actual hourly climate, not requested targets. */
(()=>{
 'use strict';
 const Core=window.BagseedNightColor;
 const peers=room=>ownedLocs().filter(loc=>lungRoomOf(loc)===room);
 const active=room=>peers(room).filter(loc=>plantsIn(loc).some(p=>p.stage>=S.seedling&&p.stage<S.drying));
 const controllers=room=>peers(room).filter(loc=>state.locations[loc].equip.ctrl&&locOn(state.locations[loc],'ctrl'));
 const cooling=room=>peers(room).some(loc=>{const L=state.locations[loc];return L.equip.ac===2&&locOn(L,'ac')&&!state.fail.acIce||L.equip.hvac&&EQ.hvac[L.equip.hvac]?.thermo&&locOn(L,'hvac');});
 const config=room=>state?.nightCooling?.[room]||{enabled:false,drop:10};
 function reference(room){const samples=active(room).flatMap(loc=>plantsIn(loc).map(p=>p.nightColor).filter(s=>s?.loc===loc&&s.dayN>0&&Number.isFinite(s.dayTemp)&&state.day*1440+state.minute-s.lastLight<=1440));return samples.length?Math.max(...samples.map(s=>s.dayTemp)):null;}
 function targets(loc,minute=state.minute){
  const room=lungRoomOf(loc),L=state.locations[loc],normal={heat:L.heatTo,cool:L.coolTo,night:false};
  if(!room||!config(room).enabled||!controllers(room).length||!cooling(room)||state.fail.outage>0||roomTripped(room))return normal;
  const spaces=active(room),ref=reference(room);
  if(!spaces.length||spaces.some(l=>isLightOn(l,minute))||ref===null)return normal;
  const drop=[8,10,12].includes(config(room).drop)?config(room).drop:10,cool=Math.max(55,Math.round((ref-drop)*10)/10);
  return{heat:cool-3,cool,night:true};
 }
 function observe(p,env){
  if(p.stage>=S.drying)return;
  const g=PlantTraits115.for(p),stamp=state.day*1440+state.minute,before=Core.expression(p,g).strength;
  p.nightColor=Core.advance(p.nightColor,{loc:p.loc,stage:p.stage,temp:env.temp,lightOn:env.lightOn,stamp},g,p);
  if(Core.expression(p,g).strength!==before)invalidate(p);
 }
 const priorHourly=plantHourly;
 plantHourly=function(p,env){observe(p,env);return priorHourly(p,env);};
 const priorKey=PlantArt.key;
 PlantArt.key=function(p){const g=PlantTraits115.for(p),v=Core.expression(p,g);return priorKey.call(this,p)+'|night:'+v.palette+':'+v.strength.toFixed(3);};
 const priorSnap=snapPlant;
 snapPlant=function(p){const snap=priorSnap(p);if(p.nightColor)snap.nightColor=JSON.parse(JSON.stringify(p.nightColor));return snap;};
 function controls(loc){
  const room=lungRoomOf(loc);if(!room)return '';
  const c=config(room),ref=reference(room),target=targets(loc),spaces=active(room),ps=spaces.flatMap(plantsIn),sample=ps.find(p=>Core.capability(PlantTraits115.for(p),p));
  let status=!c.enabled?'Following normal stage temperatures.':!controllers(room).length?'Controller is off.':!cooling(room)?'Needs a powered digital AC or mini-split in this room.':ref===null?'Learning the lights-on tent temperature.':spaces.some(l=>isLightOn(l))?'Waiting for all growing tents in this room to go dark.':`Night cooling target: ${target.cool}°F. Actual conditions depend on the installed cooler.`;
  return `<div class="note" style="margin-top:12px"><h3>Cool nights · autumn colors</h3><p class="small">Let your plants show their night colors. This cools the whole ${esc(ROOM_NAME(room).toLowerCase())} once all growing tents are dark.</p><div class="ctl"><button class="chip ${c.enabled?'on':''}" data-act="nightCooling" data-arg="${loc}:toggle" aria-pressed="${!!c.enabled}">${c.enabled?'Night cooling ON':'Night cooling OFF'}</button>${[8,10,12].map(n=>`<button class="chip ${(c.drop||10)===n?'on':''}" data-act="nightCooling" data-arg="${loc}:${n}" aria-pressed="${(c.drop||10)===n}">${n}°F drop</button>`).join('')}</div><p class="small muted">${esc(status)}</p><p class="small">A measured drop of at least 10°F activates color in receptive flowering phenotypes. Color deepens over qualifying nights; green-only phenotypes keep their natural finish. Cooling uses the installed gear and electricity; room comfort rules still apply.</p>${ref===null?'':`<div class="small mono">Lights-on reference: ${ref.toFixed(1)}°F · Current tent: ${envFor(loc).temp.toFixed(1)}°F</div>`}${sample?`<div class="small">${esc(sample.name)}: ${esc(Core.expression(sample,PlantTraits115.for(sample)).palette)} · ${Math.round(Core.expression(sample,PlantTraits115.for(sample)).strength*100)}% expressed</div>`:''}</div>`;
 }
 const priorCtl=devCtl;
 devCtl=function(slot,loc){return priorCtl(slot,loc)+(slot==='ctrl'?controls(loc):'');};
 ACT.nightCooling=function(arg){
  const [loc,value]=String(arg).split(':'),L=state.locations[loc],room=lungRoomOf(loc);
  if(!L?.equip?.ctrl||!room||!Access.atLoc(loc)){if(L)Access.denyLoc(loc);return;}
  const old=config(room);let next;
  if(value==='toggle')next={enabled:!old.enabled,drop:old.drop||10};
  else if([8,10,12].includes(Number(value)))next={enabled:!!old.enabled,drop:Number(value)};else return;
  state.nightCooling=state.nightCooling||{};state.nightCooling[room]=next;
  if(next.enabled)for(const peer of peers(room)){const e=state.locations[peer].equip,on=state.locations[peer].on;if(e.ac===2)on.ac=true;if(e.hvac&&EQ.hvac[e.hvac]?.thermo)on.hvac=true;}
  autosave();renderPanel();
 };
 window.BagseedNightCooling=Object.freeze({targets,controls,observe,config,reference});
})();
