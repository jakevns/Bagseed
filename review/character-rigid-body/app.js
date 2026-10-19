'use strict';
const $=id=>document.getElementById(id),make=()=>document.createElement('canvas');
let contract,registry,manifest,engine,sources,images={},frames=[],playing=true,frame=0;
const state=()=>({anatomy:$('anatomy').value,body:'average',skin:$('skin').value});
function plan(f){return engine.plan(state(),{direction:$('direction').value,mode:f===null?'idle':'walk',frame:f??0});}
function original(doc){const cv=make();cv.width=288;cv.height=432;const c=cv.getContext('2d');c.scale(3,3);c.transform(...doc.standingMatrix);c.drawImage(images[doc.source],...doc.crop,...doc.crop);return cv;}
function render(f){return BagseedLayeredCanvas.render(plan(f),{rasterSources:sources,soloSlot:'body',anchors:$('anchors').checked});}
function redraw(){
 const doc=manifest.documents.find(d=>d.id===`body/${$('anatomy').value}/${$('direction').value}`);
 $('reference').replaceChildren(original(doc));$('standing').replaceChildren(render(null));frames=Array.from({length:8},(_,i)=>render(i));
 $('strip').replaceChildren(...frames.map((cv,i)=>{const fig=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent='Walk '+i;fig.append(caption,cv);return fig;}));
 const onion=make();onion.width=288;onion.height=432;const c=onion.getContext('2d');c.globalAlpha=.16;frames.forEach(cv=>c.drawImage(cv,0,0));$('onion').replaceChildren(onion);
 $('measurements').textContent=JSON.stringify({source:doc.source,uniformScale:manifest.uniformScale,bones:doc.bones,parts:doc.parts},null,2);
 $('caution').textContent='Completed source parts: painted texture patches and rotated thigh caps; pelvis owns the hip outline. Far limbs preserve shading at 80% brightness. Calves project to 0.85, forearms to 0.9; outer outlines are restored after assembly. Body approval is pending; clothing and mesh skinning are deferred.';
 $('status').textContent=`${doc.id} · 15 completed art parts · Standing + Walk 0–7 · source scale ${manifest.uniformScale} · builds excluded`;
 showFrame();window.reviewReady=true;
}
function showFrame(){const cv=make();cv.width=288;cv.height=432;cv.getContext('2d').drawImage(frames[frame],0,0);$('animation').replaceChildren(cv);}
async function tintChange(){const r=structuredClone(registry);for(const asset of Object.values(r.assets))for(const layer of asset.layers)layer.geometry.tint=$('tint').checked?{mode:'shade',referenceLuminance:160}:{mode:'preserve'};engine=BagseedLayered.createEngine(contract,r);redraw();}
async function start(){
 [contract,registry,manifest]=await Promise.all(['contract','registry','manifest'].map(n=>fetch('/generated/'+n+'.json').then(r=>r.json())));
 engine=BagseedLayered.createEngine(contract,registry);sources=await BagseedRasterSources.load(registry);
 for(const doc of manifest.documents)if(!images[doc.source]){const img=new Image();img.src='/source/'+doc.source;await img.decode();images[doc.source]=img;}
 for(const id of ['anatomy','direction','anchors'])$(id).addEventListener('change',redraw);
 $('magenta').onchange=()=>document.body.classList.toggle('magenta',$('magenta').checked);
 $('tint').addEventListener('change',tintChange);$('skin').addEventListener('change',tintChange);
 $('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Pause':'Play';};redraw();setInterval(()=>{if(playing&&frames.length){frame=(frame+1)%8;showFrame();}},160);
 window.bodyReview={plan,render,original,get manifest(){return manifest},get engine(){return engine},get sources(){return sources}};
}
start().catch(e=>{$('status').textContent='Review failed: '+e.message;console.error(e);});
