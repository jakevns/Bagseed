/* Shared deterministic game rule, not a cultivation model. No save mutation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BagseedNightColor=api;})(globalThis,()=>{
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const palettes={
  'Lavender':{name:'lavender',hex:'#8262ac',rgb:[130,98,172]},
  'Purple':{name:'purple',hex:'#622a8f',rgb:[98,42,143]},
  'Dark purple':{name:'near-black purple',hex:'#201a30',rgb:[32,26,48]},
  'Pink accents':{name:'rose',hex:'#ae476f',rgb:[174,71,111]},
  'Red accents':{name:'wine red',hex:'#792c45',rgb:[121,44,69]},
  'Blue-green':{name:'blue violet',hex:'#425b8b',rgb:[66,91,139]}
 };
 function capability(traits={},plant={}){return plant.pheno?.mut==='ink'?{name:'near-black purple',hex:'#1c172a',rgb:[28,23,42]}:palettes[traits.colorName]||null;}
 function advance(previous,input,traits={},plant={}){
  const old=previous||{};
  if(!Number.isFinite(input.stamp)||!Number.isFinite(input.temp))return{...old};
  if(old.lastStamp===input.stamp)return{...old};
  const sameSpace=old.loc===input.loc,lit=!!input.lightOn;
  const next={...old,loc:input.loc,lastStamp:input.stamp,wasLight:lit,daySum:sameSpace?(Number(old.daySum)||0):0,dayN:sameSpace?(Number(old.dayN)||0):0,hours:clamp(Number(old.hours)||0,0,72),drop:0,qualifying:false};
  if(lit){
   if(!sameSpace||!old.wasLight){next.daySum=0;next.dayN=0;}
   next.daySum+=input.temp;next.dayN++;next.dayTemp=next.daySum/next.dayN;next.lastLight=input.stamp;
  }else if(sameSpace&&next.dayN>0&&Number.isFinite(old.lastLight)&&input.stamp-old.lastLight<=1440&&input.stamp>old.lastLight){
   next.drop=Math.max(0,next.dayTemp-input.temp);
   next.qualifying=input.stage>=8&&input.stage<=10&&next.drop+1e-8>=10&&!!capability(traits,plant);
   if(next.qualifying)next.hours=Math.min(72,next.hours+1);
  }
  return next;
 }
 function expression(plant,traits={}){
  const palette=capability(traits,plant),hours=clamp(Number(plant.nightColor?.hours)||0,0,72),stage=plant.stage;
  const strength=palette&&stage>=8&&stage<=12?Math.min(1,hours/24)*(stage===8?.45:stage===9?.85:1):0;
  return{capable:!!palette,strength,palette:palette?.name||null,hex:palette?.hex||null,rgb:palette?.rgb.slice()||null};
 }
 function socialBonus(snapshot,traits={},options={}){return options.filter==='mono'?0:expression(snapshot,traits).strength*.08;}
 return Object.freeze({thresholdF:10,fullExposureHours:24,capability,advance,expression,socialBonus});
});
