(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./raster-sources.js'));else root.BagseedLayeredCanvas=factory(root.BagseedRasterSources);})(globalThis,(raster)=>{
 'use strict';
 function pathFor(c,g){const s=g.shape;c.transform(...g.matrix);c.beginPath();if(s.type==='ellipse')c.ellipse(...s.center,s.rx,s.ry,0,0,Math.PI*2);else if(s.type==='polygon'){s.points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}else if(s.type==='capsule'){const r=s.radius,l=s.length;c.moveTo(-r,0);c.arc(0,0,r,Math.PI,0);c.lineTo(r,l);c.arc(0,l,r,0,Math.PI);c.closePath();}else throw Error('Unsupported mask geometry: '+s.type);}
 function paintGeometry(c,g,color){c.save();pathFor(c,g);c.fillStyle=color;c.fill();c.restore();}
 function surface(width,height,createCanvas){const cv=createCanvas?createCanvas():document.createElement('canvas');cv.width=width;cv.height=height;return cv;}
 function finishBody(cv,far,finish,density){
  const c=cv.getContext('2d',{willReadFrequently:true}),pixels=c.getImageData(0,0,cv.width,cv.height),a=pixels.data,w=cv.width,h=cv.height,n=w*h;
  const opaque=new Uint8Array(n),outside=new Uint8Array(n),distance=new Int16Array(n).fill(-1),queue=new Int32Array(n);let head=0,tail=0;
  for(let i=0;i<n;i++)opaque[i]=a[i*4+3]>=128;
  const seed=i=>{if(!opaque[i]&&!outside[i]){outside[i]=1;queue[tail++]=i;}};
  for(let x=0;x<w;x++){seed(x);seed((h-1)*w+x);}for(let y=0;y<h;y++){seed(y*w);seed(y*w+w-1);}
  while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);if(x)seed(i-1);if(x<w-1)seed(i+1);if(y)seed(i-w);if(y<h-1)seed(i+w);}
  head=tail=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(opaque[i]&&(x===0||y===0||x===w-1||y===h-1||outside[i-1]||outside[i+1]||outside[i-w]||outside[i+w])){distance[i]=0;queue[tail++]=i;}}
  const width=Math.max(1,Math.round(finish.widthAtDensity3*density/3));
  while(head<tail){const i=queue[head++],d=distance[i],x=i%w;if(d>=width)continue;for(const j of [x?i-1:-1,x<w-1?i+1:-1,i-w,i+w])if(j>=0&&j<n&&opaque[j]&&distance[j]<0){distance[j]=d+1;queue[tail++]=j;}}
  const f=far?.getContext('2d').getImageData(0,0,w,h).data,color=finish.color;
  for(let i=0;i<n;i++)if(opaque[i]){
   // Only the antialiased exterior may remain partially transparent.
   let interior=true;const x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1&&interior;dy++)for(let dx=-1;dx<=1;dx++){const j=(y+dy)*w+x+dx;if(x+dx<0||x+dx>=w||y+dy<0||y+dy>=h||!opaque[j]){interior=false;break;}}
   if(interior)a[i*4+3]=255;
   if(distance[i]>=0&&distance[i]<width){const strength=f&&f[i*4+3]>127?.6:1;for(let ch=0;ch<3;ch++)a[i*4+ch]=Math.round(color[ch]*strength+a[i*4+ch]*(1-strength));a[i*4+3]=255;}
  }
  c.putImageData(pixels,0,0);
 }
 function layerCanvas(layer,density=3,createCanvas,rasterSources){
  const cv=surface(96*density,144*density,createCanvas),c=cv.getContext('2d');c.scale(density,density);if(layer.empty)return cv;
  if(layer.geometry.shape.type==='raster'){
   const s=layer.geometry.shape;
   if(s.frameClip&&s.frameFill){
    const m=s.frameFit||[1,1],rgb=layer.color.slice(1).match(/../g).map(v=>parseInt(v,16)),shade=k=>'rgb('+rgb.map(v=>Math.min(255,Math.round(v*k))).join(',')+')';
    c.save();c.translate(48*(1-m[0]),143*(1-m[1]));c.scale(...m);const gradient=c.createLinearGradient(32,0,64,0);gradient.addColorStop(0,shade(.78));gradient.addColorStop(.48,shade(1.08));gradient.addColorStop(1,shade(.88));c.fillStyle=gradient;c.fillRect(0,0,96,144);c.restore();
   }
   if(!raster)throw Error('Raster source adapter not loaded');const image=raster.maskedLayer(layer,rasterSources,(w,h)=>surface(w,h,createCanvas));c.save();c.globalAlpha=s.frameImageOpacity??1;c.transform(...layer.geometry.matrix);c.drawImage(image,...(image.sourceOffset||[0,0]));c.restore();
   if(s.frameClip){const image=rasterSources.images.get(s.frameClip.image);if(!image)throw Error('Missing per-frame silhouette mask');const m=s.frameFit||[1,1];c.save();c.globalCompositeOperation='destination-in';c.translate(48*(1-m[0]),143*(1-m[1]));c.scale(...m);c.drawImage(image,0,0,96,144);c.restore();}
   if(s.frameStrokes?.length){const m=s.frameFit||[1,1],rgb=layer.color.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*.57));c.save();c.translate(48*(1-m[0]),143*(1-m[1]));c.scale(m[0]/3,m[1]/3);c.globalCompositeOperation='source-atop';c.strokeStyle='rgb('+rgb.join(',')+')';c.lineWidth=1.5;c.lineCap='round';for(const d of s.frameStrokes)c.stroke(new Path2D(d));c.restore();}
  }else paintGeometry(c,layer.geometry,layer.color);
  if(layer.pattern){c.save();c.globalCompositeOperation='source-atop';const {origin,fit,color}=layer.pattern;c.translate(...origin);c.scale(fit.width,fit.height);c.fillStyle=color;for(let y=-150;y<150;y+=8)c.fillRect(-100,y,200,2);c.restore();}
  for(const mask of layer.coverageMasks||[]){c.save();c.globalCompositeOperation='destination-out';paintGeometry(c,mask.geometry,'#000000');c.restore();}
  return cv;
 }
 function render(plan,options={}){
  if(!plan.complete)throw Error('Incomplete character attachments: '+plan.trace.missing.map(v=>v.key).join(', '));
  const density=options.density??3;if(!Number.isInteger(density)||density<1||density>6)throw Error('Density must be an integer from 1 to 6');
  const native=surface(96*density,144*density,options.createCanvas),c=native.getContext('2d');
  // Assemble at native density before ONE final resample. Scaling every cut
  // separately creates antialias cracks between adjacent hair/skin surfaces.
  const scale=plan.finalFigureScale;
  const solo=options.soloSlot;
  const far=plan.bodyFinish?surface(native.width,native.height,options.createCanvas):null,fc=far?.getContext('2d');
  for(const layer of plan.trace.layers)if(!solo||layer.slot===solo){const image=layerCanvas(layer,density,options.createCanvas,options.rasterSources);c.drawImage(image,0,0);if(fc){const isFar=layer.geometry?.shape?.appearance?.outlineStrength===.6;fc.globalCompositeOperation=isFar?'source-over':'destination-out';fc.drawImage(image,0,0);}}
  if(plan.bodyFinish&&(!solo||solo==='body'))finishBody(native,far,plan.bodyFinish,density);
  if(plan.overlay&&!solo){c.save();c.scale(density,density);const [x,y]=plan.overlay.nose;c.strokeStyle='#62432d';c.lineWidth=.7;for(let i=0;i<2;i++){c.beginPath();c.moveTo(x+3+i*2,y-1);c.quadraticCurveTo(x+6+i*2,y-3,x+4+i*2,y-5);c.stroke();}c.restore();}
  if(options.anchors){c.save();c.scale(density,density);const a=plan.trace.anchors;c.lineWidth=.35;c.strokeStyle='#1859b7';for(const side of ['L','R'])for(const chain of [['shoulder','elbow','wrist','palm'],['hip','knee','ankle','heel','toe']]){c.beginPath();chain.forEach((part,i)=>i?c.lineTo(...a[part+side]):c.moveTo(...a[part+side]));c.stroke();}c.strokeStyle='#d52d64';c.beginPath();c.moveTo(0,143);c.lineTo(96,143);c.stroke();for(const [key,[x,y]]of Object.entries(a)){c.beginPath();c.arc(x,y,key==='root'?1.1:.65,0,Math.PI*2);c.fillStyle=key==='root'?'#ed3372':'#00dfe8';c.fill();c.strokeStyle='#123c72';c.stroke();}c.restore();}
  const cv=surface(native.width,native.height,options.createCanvas),out=cv.getContext('2d');out.setTransform(scale,0,0,scale,48*density*(1-scale),143*density*(1-scale));out.drawImage(native,0,0);
  if(options.seatClip){const [x,y,w,h]=options.seatClip;if(![x,y,w,h].every(Number.isFinite)||w<0||h<0)throw Error('Invalid seat clip');const clipped=surface(cv.width,cv.height,options.createCanvas),g=clipped.getContext('2d');g.beginPath();g.rect(x*density,y*density,w*density,h*density);g.clip();g.drawImage(cv,0,0);return clipped;}
  return cv;
 }
 return {render,layerCanvas};
});
