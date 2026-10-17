/* Three catalog strains. Paint changes only: genetics and growth remain native. */
(()=>{
 'use strict';
 const DATA=__BAGSEED_STRAINS_DATA__,images=new Map(),build=PlantArt.build,key=PlantArt.key;
 const isolated=new Map();let loaded=false;
 function handles(p){
  if(!loaded||!DATA.strains[p?.lineId])return false;
  // Structural training, mutations and diagnostic overlays keep their native
  // silhouettes until their own painted variants are reviewed.
  return (!p.training||p.training==='natural')&&!p.pruned&&!p.staked&&!p.pheno?.mut&&!p._w&&!p._bm&&
   !(p.mold>.05||p.burn>.05||p.pest?.lvl>.05||p.health<45||p.dry?.spoiled||p.dry?.mold>.3);
 }
 function frameIndex(p){if(p.stage===S.finished&&p.dry)return 11;if(p.sex==='M'&&p.stage>=S.transition&&p.stage<=S.ready)return p.stage>=S.lateflower?14:13;return p.stage;}
 // Extract the connected plant from tightly packed atlas cells. The source
 // PNG is unchanged; unrelated neighboring leaf-tip islands are not sprites.
 function frameImage(id,index){const cacheKey=id+':'+index;if(isolated.has(cacheKey))return isolated.get(cacheKey);const f=DATA.strains[id].frames[index],cv=document.createElement('canvas');cv.width=f.crop[2];cv.height=f.crop[3];const c=cv.getContext('2d');c.drawImage(images.get(id),...f.crop,0,0,cv.width,cv.height);if(index>=2&&index!==11&&index!==12){const pixels=c.getImageData(0,0,cv.width,cv.height),d=pixels.data,w=cv.width,h=cv.height,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[];for(let start=0;start<seen.length;start++){if(seen[start]||d[start*4+3]<24)continue;let head=0,tail=1;queue[0]=start;seen[start]=1;while(head<tail){const at=queue[head++],x=at%w,y=Math.floor(at/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,j=ny*w+nx;if(nx<0||nx>=w||ny<0||ny>=h||seen[j]||d[j*4+3]<24)continue;seen[j]=1;queue[tail++]=j;}}if(tail>largest.length)largest=queue.slice(0,tail);}const keep=new Uint8Array(w*h);for(const at of largest){const x=at%w,y=Math.floor(at/w);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h)keep[(y+dy)*w+x+dx]=1;}for(let i=0;i<keep.length;i++)if(!keep[i])d[i*4+3]=0;c.putImageData(pixels,0,0);}isolated.set(cacheKey,cv);return cv;}
 function dimensions(p,f){
  const h=f.hang?48:p.stage===S.finished?18:p.stage===S.seed?1.8:p.stage===S.germ?3:Math.max(4,p.height*2.1)+(p.stage===S.seedling?2:7);
  return {h,w:h*f.crop[2]/f.crop[3]};
 }
 PlantArt.key=function(p){return key.call(this,p)+(DATA.strains[p.lineId]?'|'+DATA.revision+':'+loaded:'');};
 PlantArt.build=function(p){
  if(!handles(p))return build.call(this,p);
  const entry=DATA.strains[p.lineId],index=frameIndex(p),f=entry.frames[index];if(!f)return build.call(this,p);
  const {w,h}=dimensions(p,f),s=h/f.crop[3],pad=2,ax=f.anchor[0]*s+pad,ay=f.anchor[1]*s+pad;
  const cw=Math.ceil(w+pad*2),ch=Math.ceil(h+pad*2),resolution=Math.max(4,Math.min(32,Math.ceil(160/h))),image=document.createElement('canvas');image.width=cw*resolution;image.height=ch*resolution;
  const c=image.getContext('2d');c.scale(resolution,resolution);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(frameImage(p.lineId,index),pad,pad,w,h);
  // Compatibility canvas for integrations which read PlantArt.get().cv directly.
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const small=cv.getContext('2d');small.imageSmoothingEnabled=true;small.imageSmoothingQuality='high';small.drawImage(image,0,0,cw,ch);
  return {cv,image,w:cw,h:ch,ax,ay,hang:f.hang,illustrated:true,strain:p.lineId,frame:index};
 };
 function offset(p,s,row,t,amp){
  if(settings.reduced||amp<=0||p.stage<=S.germ||p.stage===S.finished&&!s.hang)return 0;
  const u=s.hang?clamp((row-2)/(s.h-4),0,1):clamp((s.ay-row)/Math.max(1,s.ay-2),0,1),phase=(p.seed%997)*.017;
  const reach=Math.pow(u,s.hang?1.3:1.8),strength=Math.min(2.2,amp)*Math.min(1.65,Math.max(.25,s.h/48));
  return reach*strength*(Math.sin(t*1.25+phase)*1.1+Math.sin(t*2.5+phase+u*2.1)*.19);
 }
 function draw(c,p,s,x,y,scale=1,t=runtime.t,swayAmp=1){
  c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const top=s.hang?y-2*scale:y-s.ay*scale,left=x-s.ax*scale;
  if(settings.reduced||swayAmp<=0||p.stage<=S.germ||p.stage===S.finished&&!s.hang)c.drawImage(s.image,left,top,s.w*scale,s.h*scale);
  else {const count=Math.min(48,Math.max(8,Math.ceil(s.h))),step=s.h/count;for(let i=0;i<count;i++){const row=i*step,height=Math.min(s.h-row,step+.12),off=offset(p,s,row+step/2,t,swayAmp);c.drawImage(s.image,0,row*s.image.height/s.h,s.image.width,height*s.image.height/s.h,left+off*scale,top+row*scale,s.w*scale,height*scale);}}
  c.restore();return s;
 }
 const ready=Promise.all(Object.entries(DATA.strains).map(([id,a])=>new Promise((resolve,reject)=>{const im=new Image();images.set(id,im);im.onload=resolve;im.onerror=()=>reject(Error('Strain artwork failed: '+id));im.src=a.runtime;}))).then(()=>{loaded=true;});
 window.BagseedStrains=Object.freeze({ready,handles,draw,offset,frameIndex,dimensions,strains:Object.keys(DATA.strains),get loaded(){return loaded;}});
})();
