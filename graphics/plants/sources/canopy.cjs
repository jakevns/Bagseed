/* Shared game balance for canopy cleanup. Pure reads; only care() returns new save state. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BagseedCanopy=api;})(globalThis,()=>{
 'use strict';
 const clamp=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
 function read(p){
  const c=p.canopyHarvest||p.canopy;
  // Old pruned saves retain cleanup without inventing a precise care date.
  return c?.v===1?{v:1,cleaned:clamp(c.cleaned),credit:clamp(c.credit)}:{v:1,cleaned:p.pruned?1:0,credit:p.pruned?.6:0};
 }
 function care(p,stage=p.stage){
  const old=read(p);if(stage<3||stage>8)return old;
  // Credit is earned once. A later repeat cannot improve an earlier cleanup.
  if(old.cleaned===1)return old;
  return {v:1,cleaned:1,credit:stage<=7?1:.55};
 }
 function topScale(p){const c=read(p);return .88+.30*c.cleaned*c.credit;}
 function yieldFactor(p){if(p.stage>=11&&!p.canopyHarvest)return 1;const c=read(p);return .90+.18*c.cleaned*c.credit;}
 function removed(p,heightFraction,branchFraction=1){return read(p).cleaned>0&&(heightFraction<.38||branchFraction<.34);}
 function budScale(heightFraction,branchFraction=1){return .22+.55*clamp(heightFraction)+.23*clamp(branchFraction);}
 return Object.freeze({read,care,topScale,yieldFactor,removed,budScale});
});
