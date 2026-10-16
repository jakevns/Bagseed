/* Installed before the game or artwork scripts; never opens a partial release. */
(()=>{
  'use strict';
  const root=document.documentElement,overlay=document.getElementById('bagseed-loading');
  const statusText=document.getElementById('bagseed-loading-status'),detail=document.getElementById('bagseed-loading-detail'),reload=document.getElementById('bagseed-loading-reload');
  let savedReduced=false;try{savedReduced=!!JSON.parse(localStorage.getItem('bagseed.settings.v1'))?.reduced;}catch{}
  overlay.dataset.reduced=String(matchMedia('(prefers-reduced-motion: reduce)').matches||savedReduced);
  const required=['BagseedLoadingScene','BagseedMenu','BagseedArt','BagseedBedroom','BagseedBeds','BagseedDesks','BagseedCurtains','BagseedComputerDesks','BagseedEquipment','BagseedCameras','BagseedChairs','BagseedCoffee','BagseedUnderDeskStorage','BagseedStarterTent','BagseedTent2','BagseedTent4'];
  let phase='loading',resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});ready.catch(()=>{});
  const guarded=['click','pointerdown','touchstart','keydown','wheel'];
  function guard(event){if(root.hasAttribute('data-bagseed-loading')&&!overlay.contains(event.target)){if(event.cancelable)event.preventDefault();if(event.type==='keydown'&&event.key==='Tab'&&!reload.hidden)reload.focus({preventScroll:true});event.stopImmediatePropagation();}}
  guarded.forEach(type=>document.addEventListener(type,guard,{capture:true,passive:false}));
  overlay.addEventListener('click',e=>e.stopPropagation());overlay.addEventListener('keydown',e=>e.stopPropagation());
  reload.addEventListener('click',()=>location.reload());
  const slowTimer=setTimeout(()=>{if(phase!=='loading')return;statusText.textContent='Still getting your room ready…';detail.textContent='Your first visit can take a little longer.';reload.hidden=false;},20000);
  function fail(error){
    if(phase==='ready'||phase==='error')return;phase='error';clearTimeout(slowTimer);overlay.dataset.state='error';overlay.setAttribute('aria-busy','false');
    statusText.textContent='We couldn’t finish loading.';detail.textContent='Please reload to try again.';reload.hidden=false;reload.focus({preventScroll:true});rejectReady(error);
  }
  window.addEventListener('error',event=>{if(event.error)fail(event.error);});
  async function finish(){
    const blocked=Array.from(document.body.children).filter(el=>el!==overlay&&!['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName));
    const previous=blocked.map(el=>[el,el.inert]);blocked.forEach(el=>{el.inert=true;});
    if(phase==='error')return;
    overlay.dataset.reduced=String(matchMedia('(prefers-reduced-motion: reduce)').matches||(typeof settings!=='undefined'&&settings.reduced));
    const names=Array.from(new Set([...required,...Object.keys(window).filter(k=>k.startsWith('Bagseed')&&k!=='BagseedStartup'&&window[k]?.ready)]));
    for(const name of names)if(!window[name]?.ready||typeof window[name].ready.then!=='function')throw Error('Missing startup artwork: '+name);
    await Promise.all(names.map(name=>window[name].ready));
    await Promise.all(Array.from(document.images).map(im=>im.decode()));
    await document.fonts.ready;
    if(phase==='error')return;
    statusText.textContent='Finishing touches…';detail.textContent='';
    // Allow a complete frame behind the cover before making anything visible.
    root.setAttribute('data-bagseed-loading','painting');
    phase='painting';hydrate(document);if(screen==='game'&&state){View.resize();View.snap();}
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(phase==='error')return;
    phase='ready';clearTimeout(slowTimer);previous.forEach(([el,inert])=>{el.inert=inert;});
    root.removeAttribute('data-bagseed-loading');overlay.setAttribute('aria-busy','false');overlay.hidden=true;
    guarded.forEach(type=>document.removeEventListener(type,guard,true));resolveReady({artworkGroups:names.length});
  }
  window.BagseedStartup=Object.freeze({revision:'loading-bedroom-3',ready,get status(){return phase;},get canRender(){return phase==='painting'||phase==='ready';}});
  document.addEventListener('DOMContentLoaded',()=>{finish().catch(fail);},{once:true});
})();
