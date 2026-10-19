/* Original paintings are read-only. Authored mask alpha defines ownership. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BagseedRasterSources=factory();})(globalThis,()=>{
 'use strict';
 async function load(registry,{baseURL=location.href}={}){
  const files=new Map();for(const asset of Object.values(registry.assets))for(const layer of asset.layers){const s=layer.geometry?.shape||layer.geometry;if(s?.type!=='raster')continue;for(const [url,sha]of [[s.image,s.imageSHA256],...(s.mask==='self'?[]:[[s.mask,s.maskSHA256]]),...(s.underpaint?[[s.underpaint.image,s.underpaint.sha256]]:[]),...(s.frameClip?[[s.frameClip.image,s.frameClip.sha256]]:[])]){if(!url||!/^[a-f0-9]{64}$/.test(sha||''))throw Error('Missing raster fingerprint: '+layer.id);if(files.has(url)&&files.get(url)!==sha)throw Error('Conflicting raster fingerprint: '+url);files.set(url,sha);}}
  const images=new Map(),cache=new Map(),svgTexts=new Map();await Promise.all([...files].map(async([url,sha])=>{const response=await fetch(new URL(url,baseURL));if(!response.ok)throw Error('Missing raster source: '+url);const bytes=await response.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==sha)throw Error('Raster source hash mismatch: '+url);const blob=new Blob([bytes],{type:response.headers.get('content-type')||'image/png'});let bitmap;if(blob.type.includes('svg')){svgTexts.set(url,new TextDecoder().decode(bytes));const objectURL=URL.createObjectURL(blob);try{bitmap=new Image();bitmap.src=objectURL;await bitmap.decode();}finally{URL.revokeObjectURL(objectURL);}}else bitmap=await createImageBitmap(blob);images.set(url,bitmap);}));
  const groupSources=new Map();for(const asset of Object.values(registry.assets))for(const layer of asset.layers){const s=layer.geometry?.shape||layer.geometry;if(s?.sourceGroup||s?.sourceGroups)groupSources.set(s.sourceKey,s);}
  await Promise.all([...groupSources].map(async([key,s])=>{
   const text=svgTexts.get(s.image);if(!text||!key)throw Error('Missing editable SVG group source');const doc=new DOMParser().parseFromString(text,'image/svg+xml'),ids=s.sourceGroups||[s.sourceGroup],selected=ids.map(id=>doc.getElementById(id));if(selected.some(g=>!g)||doc.querySelector('parsererror'))throw Error('Missing source group: '+ids.join(','));
   for(const g of doc.documentElement.querySelectorAll(':scope > g[data-material]'))g.style.display=selected.includes(g)?'inline':'none';
   for(const g of selected){if(s.includeUnderpaint)g.querySelectorAll('[data-authored-underpaint]').forEach(g=>g.style.display='inline');if(s.groupTransforms?.[g.id]||s.groupTransform)g.setAttribute('transform',s.groupTransforms?.[g.id]||s.groupTransform);if(s.sourceGroups)doc.documentElement.append(g);}
   if(s.clipOverrides)for(const [id,d]of Object.entries(s.clipOverrides)){const g=doc.getElementById(id),use=g.querySelector('use[clip-path]'),ref=use?.getAttribute('clip-path')?.match(/#([^)]*)/);if(!ref)throw Error('Source corrective clip is missing');doc.getElementById(ref[1]).querySelector('path').setAttribute('d',d);}
   if(s.sourceWindow){const ns='http://www.w3.org/2000/svg',clip=doc.createElementNS(ns,'clipPath'),rect=doc.createElementNS(ns,'rect');clip.id='review-source-window';['x','y','width','height'].forEach((k,i)=>rect.setAttribute(k,s.sourceWindow[i]));clip.append(rect);doc.querySelector('defs').append(clip);for(const g of selected)g.setAttribute('clip-path','url(#review-source-window)');}
   const blob=new Blob([new XMLSerializer().serializeToString(doc)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),img=new Image();try{img.src=url;await img.decode();}finally{URL.revokeObjectURL(url);}images.set(key,img);
  }));
  return {images,cache,groups:new Map(),dispose(){for(const image of images.values())image.close?.();images.clear();cache.clear();this.groups.clear();}};
 }
 function maskedLayer(layer,sources,makeCanvas){
  if(!sources)throw Error('Raster sources must be loaded before composition');const s=layer.geometry.shape,key=JSON.stringify([s.imageSHA256,s.maskSHA256,s.sourceKey,s.placements,s.sourceOffset,s.underpaint,layer.color,s.tint]);if(sources.cache.has(key))return sources.cache.get(key);
  const image=sources.images.get(s.sourceKey||s.image),mask=s.mask==='self'?null:sources.images.get(s.mask);if(!image||s.mask!=='self'&&!mask)throw Error('Unloaded raster source: '+layer.id);
  const [width,height]=s.sourceCanvas||[image.width,image.height];if(mask&&(width!==mask.width||height!==mask.height))throw Error('Raster/mask dimensions differ: '+layer.id);
  const cv=makeCanvas(width,height),c=cv.getContext('2d',{willReadFrequently:true});
  if(s.placements){for(const p of s.placements)c.drawImage(image,...p.rect,...p.destination,p.rect[2],p.rect[3]);}else c.drawImage(image,0,0);
  if(mask){c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);c.globalCompositeOperation='source-over';}
  if(s.underpaint){const image=sources.images.get(s.underpaint.image);if(!image)throw Error('Missing authored corrective surface');if(image.width!==width||image.height!==height)throw Error('Corrective surface dimensions differ');c.globalCompositeOperation='destination-over';c.drawImage(image,0,0);c.globalCompositeOperation='source-over';}
  const tint=s.tint||{mode:'preserve'};
  if(tint.mode!=='preserve'&&!(tint.mode==='preserve-canonical'&&layer.color===tint.canonical)){
   const rgba=c.getImageData(0,0,cv.width,cv.height),a=rgba.data,target=layer.color.slice(1).match(/../g).map(x=>parseInt(x,16)),reference=tint.referenceLuminance;if(!(reference>0&&reference<=255))throw Error('Explicit raster shading reference required');
   for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;const shade=(.2126*a[i]+.7152*a[i+1]+.0722*a[i+2])/reference;for(let ch=0;ch<3;ch++)a[i+ch]=Math.max(0,Math.min(255,Math.round(target[ch]*shade)));}c.putImageData(rgba,0,0);
  }
  cv.sourceOffset=s.sourceOffset||[0,0];let result=cv;
  if(s.trim){const a=c.getImageData(0,0,cv.width,cv.height).data;let l=cv.width,t=cv.height,r=-1,b=-1;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(a[(y*cv.width+x)*4+3]){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}if(r>=l){result=makeCanvas(r-l+1,b-t+1);result.getContext('2d').drawImage(cv,l,t,result.width,result.height,0,0,result.width,result.height);result.sourceOffset=[cv.sourceOffset[0]+l,cv.sourceOffset[1]+t];}}
  if(sources.cache.size>=128)sources.cache.delete(sources.cache.keys().next().value);sources.cache.set(key,result);return result;
 }
 return {load,maskedLayer};
});
