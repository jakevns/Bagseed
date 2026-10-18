/* Approved component artwork in native PlantArt, including generated genetics.
   Recipes are visual save data; simulation genes and growth rules are untouched. */
(()=>{
 'use strict';
 const DATA=__BAGSEED_LIVE_PLANTS__,MUTATIONS=__BAGSEED_PLANT_MUTATIONS__,Model=window.BagseedPlantModel,images={},tiles=new Map(),liveFrames=new WeakMap();
 const baseBuild=PlantArt.build,baseGet=PlantArt.get,baseKey=PlantArt.key;let loaded=false;
 const copy=o=>JSON.parse(JSON.stringify(o)),limit=(n,a,b)=>Math.max(a,Math.min(b,n)),hash=s=>{let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
 const rgb=hex=>hexRGB(hex),mixRGB=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
 function traits(p){const g=PlantTraits115.for(p);return{leafShape:g.leafShape||'hybrid',leafKey:g.leafKey||'forest',colorName:g.colorName||'Forest green',branching:g.branching||1};}
 function valid(r){return r?.v===1&&Object.prototype.hasOwnProperty.call(DATA,r.leafKit)&&Object.prototype.hasOwnProperty.call(DATA,r.flowerKit)&&r.traits&&typeof r.seed==='string';}
 function recipe(p){
  if(valid(p.paintArt115))return p.paintArt115;if(valid(p.pheno?.paintArt115))return p.pheno.paintArt115;
  const g=traits(p),seed=String(p.genome115?.id||p.pheno?.genome115?.id||p.pheno?.pid||p.seed||p.id||p.lineId);
  const rank=(kind)=>Object.keys(DATA).sort((a,b)=>{
   const score=id=>{const k=DATA[id],t=k.traits;return(kind==='leaf'?(t.leafShape===g.leafShape?1000:0)+(t.leafKey===g.leafKey?100:0):(t.colorName===g.colorName?1000:0))+(k.lineId===p.lineId?20:0)+(id===p.lineId?2:0);};
   return score(b)-score(a)||hash(seed+':'+kind+':'+a)-hash(seed+':'+kind+':'+b);
  })[0];
  return{v:1,seed,leafKit:rank('leaf'),flowerKit:rank('flower'),traits:g};
 }
 function ensure(p){if(!p)return;const r=copy(recipe(p));p.paintArt115=r;if(p.pheno)p.pheno.paintArt115=copy(r);return r;}
 function all(){if(!state?.plants)return;for(const p of Object.values(state.plants))ensure(p);runtime.sprites.clear();}
 function descriptor(p){const r=recipe(p),arts=typeof Mut!=='undefined'?Mut.list(p).map(k=>MUTS[k]?.art).filter(Boolean):[];
  const view=Object.assign(Object.create(p),{artIdentity:{seed:r.seed,traits:r.traits},pheno:{...p.pheno,mut:arts.includes('ink')?'ink':p.pheno?.mut},visualState:{...p.visualState,mutationArts:arts}});
  // Shape and tissue pattern are independent. Retain single-blade precedence
  // for Monophylla; webbing wins over dissected foliage in a combined plant.
  const shape=arts.includes('mono')?'monophylla':arts.includes('duck')?'ducksfoot':arts.includes('freak')?'freakshow':null;
  const painted=MUTATIONS[shape||'']||(!arts.includes('fern')&&arts.includes('variegated')?MUTATIONS.moonmarble:null);
  const choices=painted?Object.keys(painted.variants):[],roll=hash(r.seed+':'+painted?.mutationKey+':form')%10;
  const variant=painted?choices[r.traits.leafShape==='broad'?(roll<8?1:0):r.traits.leafShape==='narrow'?(roll<8?0:1):roll%choices.length]:null;
  return{r,arts,view,mutation:painted?{key:painted.mutationKey,revision:painted.revision,variant}:null,material:arts.includes('variegated')?'moonmarble':null};
 }
 function patternVariant(d,id){
  const names=Object.keys(MUTATIONS.moonmarble.variants),main=d.mutation?.key==='moonmarble'?d.mutation.variant:names[hash(d.r.seed+':moonmarble:pattern-family')%names.length];
  // Keep one predominant pattern family while individual leaves vary. Organ IDs
  // are stable across age and wind, so tissue sectors never crawl or reroll.
  return hash(d.r.seed+':moonmarble:'+id)%5===0?names[(names.indexOf(main)+1)%names.length]:main;
 }
 function partData(d,role,organId=''){
  const m=d.mutation&&MUTATIONS[d.mutation.key],variant=m?.mutationKey==='moonmarble'&&organId?patternVariant(d,organId):d.mutation?.variant,part=m?.variants[variant].parts[role];
  if(part)return{...part,kit:'mutation:'+m.mutationKey+':'+part.atlas,leafKey:m.leafKey,mutation:m.mutationKey};
  const r=d.r,kit=role.startsWith('female')||role.startsWith('male')?r.flowerKit:r.leafKit;return{...DATA[kit].parts[role],kit};
 }
 const patterns=new Map();
 function creamCoverage(col){return limit((col[0]/Math.max(1,col[1])-.78)/.19,0,1)*limit((col[2]/Math.max(1,col[1])-.35)/.23,0,1)*limit((col[0]-115)/55,0,1);}
 function patternPixels(d,role,id,w,h){
  const m=MUTATIONS.moonmarble,part=m.variants[patternVariant(d,id)].parts[role];if(!part)return null;
  const key=[part.crop.join(','),w,h].join(':');if(patterns.has(key))return patterns.get(key);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.drawImage(images['mutation:moonmarble:'+part.atlas],...part.crop,0,0,w,h);
  const rgba=c.getImageData(0,0,w,h).data,mask=new Float32Array(w*h);for(let i=0;i<mask.length;i++)mask[i]=creamCoverage(rgba.subarray(i*4,i*4+3))*rgba[i*4+3]/255;
  if(patterns.size>=64)patterns.delete(patterns.keys().next().value);patterns.set(key,mask);return mask;
 }
 function tintPixel(color,target,t){const light=limit((color[0]*.2126+color[1]*.7152+color[2]*.0722)/112,.3,1.4);return color.map((v,k)=>v*(1-t)+Math.min(255,target[k]*light)*t);}
 function mutantMask(w,h,mode){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.scale(w,h);c.fillStyle='#fff';c.strokeStyle='#fff';c.lineCap='round';
  const fronds=7;c.lineWidth=.014;
  for(let j=0;j<fronds;j++){
   const angle=(j/(fronds-1)-.5)*2.1,len=.80*(1-.35*Math.abs(j/(fronds-1)-.5)),sx=.5,sy=.96,dx=Math.sin(angle),dy=-Math.cos(angle);
   c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+dx*len,sy+dy*len);c.stroke();
   for(let n=1;n<10;n++)for(const side of [-1,1]){
    const u=n/10,x=sx+dx*len*u,y=sy+dy*len*u,pl=.10*Math.sin(u*Math.PI)*.8,a=angle+side*.95;
    c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.sin(a)*pl*.8+side*.012,y-Math.cos(a)*pl*.8,x+Math.sin(a)*pl,y-Math.cos(a)*pl);c.quadraticCurveTo(x+Math.sin(a)*pl*.6-side*.015,y-Math.cos(a)*pl*.6,x,y);c.fill();
   }
  }return cv;
 }
 function tile(p,d,role,finish={}){
  const a=partData(d,role,finish.organId),leaf=role.endsWith('Leaf')||role==='cotyledon',flower=role.startsWith('female'),arts=d.arts;
  const amount=Math.round((finish.amount||0)*12)/12,brightness=finish.rear?.86:1;
  const disease=[Math.round((p.burn||0)*4),Math.round((p.pest?.lvl||0)*4),Math.round(Math.max(p.mold||0,p.dry?.mold||0,p.dry?.spoiled?1:0)*4)];
  const pigment=flower?BagseedNightColor.expression(d.view,d.r.traits):null;
  const pattern=d.material&&role.endsWith('Leaf')?patternVariant(d,finish.organId||''):'';
  const key=[a.kit,a.crop.join(','),role,pattern,amount,finish.rgb?.join(','),brightness,d.r.traits.leafKey,arts.join(','),p.stage,!!finish.young,...disease,hash(d.r.seed)%7,Math.round((pigment?.strength||0)*24),pigment?.hex||'',Math.round((p.dry?.prog||0)*6)].join(':');
  if(tiles.has(key))return tiles.get(key);
  const cv=document.createElement('canvas'),factor=Math.min(1,(a.mutation?256:112)/Math.max(a.crop[2],a.crop[3]));cv.width=Math.max(2,Math.round(a.crop[2]*factor));cv.height=Math.max(2,Math.round(a.crop[3]*factor));const c=cv.getContext('2d');
  c.save();if(a.clipHull){c.beginPath();a.outline.forEach(([x,y],i)=>c[i?'lineTo':'moveTo']((a.attach[0]+x*a.crop[3]+.5)*cv.width/a.crop[2],(a.attach[1]-y*a.crop[3]+.5)*cv.height/a.crop[3]));c.closePath();c.clip();}c.drawImage(images[a.kit],...a.crop,0,0,cv.width,cv.height);c.restore();
  const pixels=c.getImageData(0,0,cv.width,cv.height),v=pixels.data,targetLeaf=rgb((LEAF_PAL[d.r.traits.leafKey]||LEAF_PAL.forest).leaf),sourceLeaf=a.leafKey||DATA[d.r.leafKit].traits.leafKey,seed=hash(d.r.seed)%99;
  const patternMask=pattern&&a.mutation!=='moonmarble'?patternPixels(d,role,finish.organId||'',cv.width,cv.height):null;
  for(let i=0;i<v.length;i+=4){if(!v[i+3])continue;const y=Math.floor(i/4/cv.width)/cv.height,x=(i/4%cv.width)/cv.width;let col=[v[i],v[i+1],v[i+2]];
   if(leaf){
    const pale=a.mutation==='moonmarble'?creamCoverage(col):0,original=col.slice();
    if(sourceLeaf!==d.r.traits.leafKey)col=tintPixel(col,targetLeaf,.68);
    if(arts.includes('gold'))col=tintPixel(col,[216,218,74],.6);
    if(arts.includes('triploid'))col=tintPixel(col,[43,108,48],.26);
    if(arts.includes('ink'))col=tintPixel(col,[42,30,53],.35+limit((p.stage-2)/8,0,1)*.45);
    if(amount)col=tintPixel(col,finish.rgb,amount);
    if(pale)col=mixRGB(col,original,pale);
    if(patternMask)col=mixRGB(col,[237,229,194],patternMask[i/4]*.94);
    if(arts.includes('albino')&&finish.young)col=tintPixel(col,[239,243,220],.88);
    if(disease[0]&&y<.1+disease[0]*.03)col=tintPixel(col,[115,66,29],.8);
    if(disease[1]&&hash(seed+':'+Math.floor(x*35)+':'+Math.floor(y*35))%37<disease[1])col=[180,181,139];
   }
   if(flower){
    const pistil=col[0]>col[1]*1.15&&col[0]>col[2]*1.15,frost=Math.max(...col)-Math.min(...col)<45&&col.reduce((a,b)=>a+b)>495;
    if(pigment.strength&&!pistil&&!frost)col=tintPixel(col,pigment.rgb,pigment.strength*.5);
    if(arts.includes('pink')&&(pistil||(p.stage<=7&&frost)))col=tintPixel(col,[246,88,155],.9);
    if(arts.includes('ember')&&p.stage>=8&&!frost&&!pistil)col=tintPixel(col,[182,77,58],.22);
    if(p.stage>=11)col=tintPixel(col,[142,128,75],limit((p.dry?.prog||0)*.55,0,.65));
    if(disease[2]&&hash(seed+':m:'+Math.floor(x*29)+':'+Math.floor(y*29))%43<disease[2]*2)col=[147,147,131];
   }
   for(let k=0;k<3;k++)v[i+k]=col[k]*brightness;
  }c.putImageData(pixels,0,0);
  const mode=!a.mutation&&role.endsWith('Leaf')&&role!=='singleLeaf'&&(arts.includes('fern')?'fern':null);
  if(mode){const texture=document.createElement('canvas');texture.width=cv.width;texture.height=cv.height;const tc=texture.getContext('2d');tc.fillStyle='rgb('+targetLeaf.join(',')+')';tc.fillRect(0,0,cv.width,cv.height);tc.drawImage(cv,0,0);c.clearRect(0,0,cv.width,cv.height);c.drawImage(texture,0,0);c.globalCompositeOperation='destination-in';c.drawImage(mutantMask(cv.width,cv.height,mode),0,0);c.globalCompositeOperation='source-over';}
  if(tiles.size>=384)tiles.delete(tiles.keys().next().value);tiles.set(key,cv);return cv;
 }
 function stamp(c,p,d,role,x,y,length,angle=0,finish={},widthScale=1){
  if(!length)return;const a=partData(d,role,finish.organId),image=tile(p,d,role,finish),w=length*a.crop[2]/a.crop[3]*widthScale;
  c.save();c.translate(x,-y);c.rotate(angle);c.drawImage(image,-a.attach[0]/a.crop[2]*w,-a.attach[1]/a.crop[3]*length,w,length);c.restore();
 }
 function stroke(c,points,width,color){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();for(const [i,a]of points.entries())c[i?'lineTo':'moveTo'](a.x,-a.y);c.stroke();}
 function drawRig(c,p,d,m,t,wind){
  const pose=Model.pose(m,d.view,t,wind,settings.reduced),H=m.height,finish=Model.senescence(d.view,d.r.traits,BagseedNightColor),ember=d.arts.includes('ember');
  if(p.staked)for(const side of [-1,1])stamp(c,p,d,'bamboo',side*H*.12,0,H*.78,0,{},.35);
  const leaf=o=>{if(o.removed)return;const a=pose.organs.get(o.id),lower=a.y<H*.48;let amount=finish.amount*(.78+.35*(1-a.y/H)),color=finish.rgb;
   if((p.nutr<25&&lower)||p.health<50){amount=Math.max(amount,.65);color=[205,179,76];}
   stamp(c,p,d,o.role,a.x,a.y,o.length,a.angle,{amount:limit(amount,0,1),rgb:color,rear:o.z<0,young:a.y>H*.72,organId:o.id},d.arts.includes('triploid')?1.2:1);
  };
  for(const o of m.organs)if(o.kind==='leaf'&&o.z<0)leaf(o);
  for(const b of pose.branches.values())if(!b.cut){c.lineCap='round';c.beginPath();c.moveTo(b.start.x,-b.start.y);c.quadraticCurveTo(b.control.x,-b.control.y,b.end.x,-b.end.y);c.strokeStyle=ember?'#7d2731':'#394b24';c.lineWidth=b.width*1.6;c.stroke();c.strokeStyle=ember?'#b95046':'#81914b';c.lineWidth=b.width;c.stroke();}
  const trunk=m.joints.map(j=>pose.joints.get(j.id)),w=limit(H*.014,.18,1.2)*(d.arts.includes('crest')?1.6:1);stroke(c,trunk,w*1.5,ember?'#792c36':'#3b4b28');stroke(c,trunk,w,ember?'#b64742':'#738443');stroke(c,trunk,w*.26,ember?'#e27a61':'#b6b780');
  for(const o of m.organs)if(o.kind==='leaf'&&o.z>=0)leaf(o);
  for(const o of m.organs)if(o.kind==='flower'){const a=pose.organs.get(o.id);stamp(c,p,d,o.role,a.x,a.y,o.length,a.angle,{},o.widthScale||1);}
  if(p.staked){c.strokeStyle='#d7c395';c.lineWidth=.12;for(const side of [-1,1])for(const u of [.34,.57]){const a=pose.joints.get('node:'+Math.max(1,Math.round(m.nodes*u)));c.beginPath();c.moveTo(side*H*.12,-a.y);c.lineTo(a.x,-a.y);c.stroke();}}
  if(p.training==='scrog'){const y=H*.57,span=H*.5;c.strokeStyle='rgba(219,220,187,.72)';c.lineWidth=.12;for(let x=-span;x<=span;x+=3){c.beginPath();c.moveTo(x,-y-1.4);c.lineTo(x+2,-y+1.4);c.stroke();}for(const dy of [-1.4,0,1.4]){c.beginPath();c.moveTo(-span,-y+dy);c.lineTo(span,-y+dy);c.stroke();}}
  return pose;
 }
 function bounds(m,d){const pose=Model.pose(m,d.view,0,0,true);let lo=0,hi=0;for(const o of m.organs){if(o.removed)continue;const a=pose.organs.get(o.id),part=partData(d,o.role,o.id),ca=Math.cos(a.angle),sa=Math.sin(a.angle);for(const [x,y]of part.outline){const v=a.x+o.length*(x*ca+y*sa)*(o.widthScale||1);lo=Math.min(lo,v);hi=Math.max(hi,v);}}for(const b of pose.branches.values())if(!b.cut){lo=Math.min(lo,b.end.x);hi=Math.max(hi,b.end.x);}return{lo,hi};}
 function surface(w,h){const cv=document.createElement('canvas');cv.width=Math.ceil(w*3);cv.height=Math.ceil(h*3);return cv;}
 function paint(s,p,t=0,wind=0,target=s.cv){const c=target.getContext('2d');c.resetTransform();c.clearRect(0,0,target.width,target.height);c.scale(3,3);c.translate(s.ax,s.ay);
  if(p.stage<=1){const role=p.stage===0?'seed':'radicle';stamp(c,p,s.d,role,0,0,p.stage===0?3.5:5);}
  else if(s.hang){const n=3+(p.yieldPot>1?1:0);for(let i=0;i<n;i++){const x=-22+i*44/(n-1),off=settings.reduced?0:Math.sin(t*1.1+i)*wind*.6;c.strokeStyle='#b8a47b';c.lineWidth=.45;c.beginPath();c.moveTo(x,0);c.lineTo(x+off,5);c.stroke();stamp(c,p,s.d,'femaleLate',x+off,-5,18+(hash(s.d.r.seed+':dry:'+i)%8),Math.PI);}}
  else if(p.stage>=12){c.fillStyle='rgba(172,204,181,.34)';c.strokeStyle='#a7b9a1';c.lineWidth=.7;c.beginPath();c.roundRect(-7,-17,14,17,2);c.fill();c.stroke();stamp(c,p,s.d,'femaleLate',0,1,11);c.fillStyle='#796b4d';c.fillRect(-7,-19,14,3);}
  else{c.scale(2.1,2.1);drawRig(c,p,s.d,s.model,t,wind);}return target;
 }
 function build(p){
  if(!loaded)return baseBuild.call(PlantArt,p);const d=descriptor(p),parts={};for(const role of Object.keys(DATA[d.r.leafKit].parts))parts[role]=partData(d,role);
  const model=Model.build(d.view,d.r.traits,{parts,partFor:o=>partData(d,o.role,o.id)}),b=bounds(model,d),hang=p.stage===11||(p.stage===12&&!!p.dry);
  const w=hang?64:p.stage>=12?22:p.stage<2?18:Math.max(20,Math.ceil((b.hi-b.lo)*2.1)+14),h=hang?58:p.stage>=12?24:p.stage<2?14:Math.ceil(model.height*2.1)+8;
  const s={cv:surface(w,h),w,h,ax:hang?32:p.stage<2||p.stage>=12?w/2:7-b.lo*2.1,ay:hang?0:h-3,hang,illustrated:true,d,model,recipe:copy(d.r)};paint(s,p);return s;
 }
 PlantArt.key=function(p){const r=recipe(p);return baseKey.call(this,p)+'|painted-3|'+r.leafKit+'|'+r.flowerKit+'|'+r.seed+'|'+JSON.stringify(r.traits)+'|'+(typeof Mut!=='undefined'?Mut.list(p).join(','):'')+'|'+(p.pheno?.b||1);};
 PlantArt.build=build;
 PlantArt.get=function(p){if(!loaded)return baseGet.call(this,p);const k=this.key(p);let s=runtime.sprites.get(p.id);if(!s||s.k!==k||!s.illustrated){s=Object.assign({k},build(p));runtime.sprites.set(p.id,s);}return s;};
 // The same painted organs also supply the native mutation guide and plant-card
 // icons. A leaf icon shows a complete leaf instead of a cropped whole canopy.
 const prevMutationDraw=MutGen.draw;
 MutGen.draw=function(cv,key,mode){
  if(!loaded||!MUTATIONS[key]||mode==='none')return prevMutationDraw.apply(this,arguments);
  const p=demoPlant('porchlight',mode==='leaf'?5:6,77,{id:'mutdemo_'+key+'_'+mode,sex:'F',sexKnown:true,pheno:{h:1,b:1,y:1,a:1,deep:false,mut:key,muts:[key]}}),c=cv.getContext('2d'),W=cv.width,H=cv.height;
  c.clearRect(0,0,W,H);c.fillStyle='#1a2420';c.fillRect(0,0,W,H);c.imageSmoothingEnabled=true;
  if(mode==='leaf'){const image=tile(p,descriptor(p),'sevenLeaf',{organId:'guide:leaf'}),scale=Math.min((W-4)/image.width,(H-4)/image.height);c.drawImage(image,(W-image.width*scale)/2,(H-image.height*scale)/2,image.width*scale,image.height*scale);}
  else{const s=build(p),scale=Math.min((W-8)/s.w,(H-8)/s.h);c.drawImage(s.cv,W/2-s.ax*scale,H-4-s.ay*scale,s.w*scale,s.h*scale);c.fillStyle=MUTS[key].tint;c.fillRect(3,3,4,4);}
 };
 function frame(p,s,t,wind){if(settings.reduced||!wind||p.stage<2||p.stage>=12)return s.cv;const key=Math.floor(t*8)+':'+Math.round(wind*4);let f=liveFrames.get(s);if(!f||f.key!==key){f=f||{cv:surface(s.w,s.h)};f.key=key;paint(s,p,t,wind,f.cv);liveFrames.set(s,f);}return f.cv;}
 const prevCreate=createPlant;createPlant=function(){const p=prevCreate.apply(this,arguments);ensure(p);return p;};
 const prevSnap=snapPlant;snapPlant=function(p){if(state?.plants?.[p.id]===p)ensure(p);const s=prevSnap.apply(this,arguments);s.paintArt115=copy(recipe(p));return s;};
 if(typeof POSTLOAD115!=='undefined')POSTLOAD115.push(all);
 // Save recipes for existing plants at the same boundary as the normal save.
 const prevWrite=SaveSys.write;SaveSys.write=function(){if(state?.plants)for(const p of Object.values(state.plants))ensure(p);return prevWrite.apply(this,arguments);};
 const atlases={...DATA};for(const m of Object.values(MUTATIONS))for(const [name,a]of Object.entries(m.atlases))atlases['mutation:'+m.mutationKey+':'+name]=a;
 const ready=Promise.all(Object.entries(atlases).map(([id,a])=>new Promise((resolve,reject)=>{const im=new Image();images[id]=im;im.onload=resolve;im.onerror=()=>reject(Error('Plant artwork failed: '+id));im.src=a.runtime;}))).then(()=>{loaded=true;all();});
 window.BagseedPlants=Object.freeze({revision:'live-plants-3',ready,recipe,ensure,descriptor,frame,build,kits:DATA,mutations:MUTATIONS,atlasCount:Object.keys(atlases).length,Model,get loaded(){return loaded;},get tileCount(){return tiles.size;}});
})();
