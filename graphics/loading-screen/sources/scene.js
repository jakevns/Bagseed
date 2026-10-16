/* A single registered painting keeps the room steady while its light changes. */
(()=>{
  'use strict';
  const DATA=__BAGSEED_LOADING_SCENE__,canvas=document.getElementById('bagseed-loading-room'),ctx=canvas.getContext('2d'),overlay=document.getElementById('bagseed-loading');
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let loaded=false,paused=false,lastFrame=-Infinity;
  function savedTier(){for(const key of ['bagseed.save.v1','bagseed.save.v1.backup'])try{const s=JSON.parse(localStorage.getItem(key));const t=s?.player?s.gear?.storage:null;if(Number.isInteger(t)&&t>=0&&t<=2)return t;}catch{}return 0;}
  const storageTier=savedTier();
  function load(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Loading room artwork could not be decoded'));im.src=url;});}
  __BAGSEED_WINDOW_SCENERY_FACTORY__
  let room,storage,painter;
  const glass=new Path2D();DATA.outside.glassPaths.forEach(p=>glass.addPath(new Path2D(p)));
  function outdoor(n,cloudTime){ctx.save();ctx.clip(glass);painter.drawBackground(ctx,DATA.outside.destination,n,cloudTime);ctx.restore();}
  function sprite(name,x,y,w,h){const a=DATA.storage.assets[name],[sx,sy,sw,sh]=a.rect,scale=Math.min(w/sw,h/sh),dw=sw*scale,dh=sh*scale;ctx.drawImage(storage,sx,sy,sw,sh,x+(w-dw)/2,y+h-dh,dw,dh);}
  function glow(x,y,rx,ry,color,opacity){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color+opacity+')');g.addColorStop(1,color+'0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  function patch(rect,alpha){const [x,y,w,h]=rect;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(room,x*room.width/2048,y*room.height/768,w*room.width/2048,h*room.height/768,x,y,w,h);ctx.restore();}
  function render(seconds=0,tier=storageTier,cloudSeconds=seconds){
    if(!loaded)return;
    const reduced=media.matches||overlay.dataset.reduced==='true',t=reduced?0:seconds,phase=((t%DATA.period)+DATA.period)%DATA.period/DATA.period,n=(1-Math.cos(phase*Math.PI*2))/2;
    ctx.setTransform(canvas.width/2048,0,0,canvas.height/768,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(room,0,0,2048,768);
    const a=DATA.storage.assets[['drawer','organizer','fridge'][tier]||'drawer'],scale=DATA.storage.scale,[ax,ay]=DATA.storage.anchor,x=ax-(tier===2?scale:0),w=a.width*scale,h=a.height*scale;
    ctx.fillStyle='#302b2044';ctx.beginPath();ctx.ellipse(x+w/2,ay+2,w*.55,6,0,0,Math.PI*2);ctx.fill();sprite(['drawer','organizer','fridge'][tier]||'drawer',x,ay-h,w,h);sprite('box',...DATA.storage.box);
    ctx.globalCompositeOperation='multiply';ctx.fillStyle=`rgb(${255-153*n},${255-139*n},${255-91*n})`;ctx.fillRect(0,0,2048,768);ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(255,128,65,${Math.sin(Math.PI*n)*.24})`;ctx.fillRect(0,0,2048,768);ctx.globalCompositeOperation='source-over';
    ctx.save();ctx.filter='blur(7px)';ctx.fillStyle=`rgba(255,228,156,${(1-n)*.22})`;for(let r=0;r<2;r++)for(let c=0;c<2;c++){const px=1030+c*120+r*60,py=450+r*100;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+100,py);ctx.lineTo(px+275,py+78);ctx.lineTo(px+175,py+78);ctx.closePath();ctx.fill();}ctx.restore();
    outdoor(n,reduced?0:cloudSeconds);
    glow(754,257,120,90,'rgba(142,216,158,',n*.19);patch(DATA.monitor,n*.9);glow(...DATA.growLight,160,200,'rgba(184,128,232,',n*.2);
    // Sweep the same wide room on portrait phones instead of shrinking it.
    if(matchMedia('(max-width:600px) and (orientation:portrait)').matches){const excess=Math.max(0,canvas.getBoundingClientRect().width-canvas.parentElement.clientWidth),pan=reduced?.5:(1-Math.cos(phase*2*Math.PI))/2;canvas.style.left=(-excess*pan)+'px';}else canvas.style.left='';
  }
  function tick(time){if(paused||['ready','error'].includes(window.BagseedStartup?.status))return;if(time-lastFrame>=1000/24){render(time/1000);lastFrame=time;}requestAnimationFrame(tick);}
  const ready=Promise.all([load(DATA.roomURL),load(DATA.storageURL),load(DATA.outsideURL),load(DATA.cloudURL)]).then(images=>{[room,storage]=images;painter=createWindowScenery(DATA.outside,images[2],images[3]);loaded=true;render(0);requestAnimationFrame(tick);});ready.catch(()=>{});
  // One decoded atlas/cloud pair serves both startup and live gameplay.
  window.BagseedWindowScenery=Object.freeze({ready,get loaded(){return loaded;},drawBackground(...args){return painter.drawBackground(...args);},drawForeground(...args){return painter.drawForeground(...args);},timeOfDay(hour){return painter.timeOfDay(hour);}});
  window.BagseedLoadingScene=Object.freeze({revision:DATA.revision,ready,render,storageTier,get loaded(){return loaded;},pause(){paused=true;},resume(){if(paused){paused=false;requestAnimationFrame(tick);}}});
})();
