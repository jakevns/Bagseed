/* Shared review-only component renderer, first developed for Porchlight. No simulation or save writes. */
(()=>{
 'use strict';
 const DATA=__PORCHLIGHT_COMPONENT_DATA__,Model=window.PorchlightModel,image=new Image();let loaded=false;
 const finishCache=new Map();
 function tintedPart(role,finish){
  const amount=Math.round(finish.amount*12)/12,key=role+':'+finish.palette+':'+finish.rgb.join(',')+':'+amount+':'+!!finish.flower;
  if(finishCache.has(key))return finishCache.get(key);
  const a=DATA.parts[role],cv=document.createElement('canvas');cv.width=a.crop[2];cv.height=a.crop[3];
  const c=cv.getContext('2d');c.drawImage(image,...a.crop,0,0,cv.width,cv.height);
  const pixels=c.getImageData(0,0,cv.width,cv.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;if(finish.flower&&((Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])<45&&d[i]+d[i+1]+d[i+2]>495)||(d[i]>d[i+1]*1.15&&d[i]>d[i+2]*1.15)))continue;const light=Math.min(1.4,(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/112);for(let k=0;k<3;k++)d[i+k]=d[i+k]*(1-amount)+Math.min(255,finish.rgb[k]*light)*amount;}
  c.putImageData(pixels,0,0);finishCache.set(key,cv);return cv;
 }
 function part(c,role,x,y,length,angle=0,width=null,finish=null){const a=DATA.parts[role];if(!a||!loaded||length<=0)return;const k=length/a.crop[3],w=width??a.crop[2]*k,h=length;c.save();c.translate(x,-y);c.rotate(angle);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';const source=finish?.amount>0?tintedPart(role,finish):null;if(source)c.drawImage(source,-a.attach[0]/a.crop[2]*w,-a.attach[1]/a.crop[3]*h,w,h);else c.drawImage(image,...a.crop,-a.attach[0]/a.crop[2]*w,-a.attach[1]/a.crop[3]*h,w,h);c.restore();}
 function stroke(c,points,width,color){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>c[i?'lineTo':'moveTo'](p.x,-p.y));c.stroke();}
 function branch(c,b){c.lineCap='round';c.beginPath();c.moveTo(b.start.x,-b.start.y);c.quadraticCurveTo(b.control.x,-b.control.y,b.end.x,-b.end.y);c.lineWidth=b.width*1.6;c.strokeStyle='#394b24';c.stroke();c.lineWidth=b.width;c.strokeStyle='#6f8540';c.stroke();c.lineWidth=b.width*.30;c.strokeStyle='#a7b16b';c.stroke();}
 function draw(c,p,x,y,pixelsPerInch=4,t=0,wind=1,{model=null,reduced=false}={}){
  if(!loaded)return;const g=model||Model.build(p,p.artIdentity?.traits||{}, {parts:DATA.parts}),pose=Model.pose(g,p,t,wind,reduced);
  c.save();c.translate(x,y);c.scale(pixelsPerInch,pixelsPerInch);
  const H=g.height,trunk=g.joints.map(j=>pose.joints.get(j.id)),trunkWidth=Math.max(.18,Math.min(1.2,H*.014)),finish=Model.senescence(p,undefined,window.BagseedNightColor),pigment=window.BagseedNightColor?.expression(p,p.artIdentity?.traits||{});
  if(p.staked)for(const side of [-1,1])part(c,'bamboo',side*H*.12,0,H*.78,0,1.15);
  function leaf(o){if(o.removed)return;const a=pose.organs.get(o.id);c.save();const lower=a.y<H*.48,lowFood=p.nutr<25&&lower,sick=p.health<50;if(lowFood||sick)c.filter='sepia(.48) saturate(.78) hue-rotate(-20deg) brightness(1.08)';else if(o.z<0)c.filter='brightness(.86) saturate(.92)';const leafFinish={...finish,amount:Math.min(1,finish.amount*(.78+.35*(1-a.y/H)+.10*Math.sin(o.id.length*5.3)))};part(c,o.role,a.x,a.y,o.length,a.angle,null,leafFinish);c.restore();}
  for(const o of g.organs.filter(o=>o.kind==='leaf'&&o.z<0))leaf(o);
  for(const b of pose.branches.values())if(!b.cut)branch(c,b);
  stroke(c,trunk,trunkWidth*1.5,'#3b4b28');stroke(c,trunk,trunkWidth,'#738443');stroke(c,trunk,trunkWidth*.28,'#b6b780');
  // A small painted knuckle at each true branch junction; stems remain continuous.
  for(const j of g.joints.slice(1,-1)){const a=pose.joints.get(j.id);part(c,'node',a.x,a.y,.7+H*.004,0,.6+H*.006);}
  for(const o of g.organs.filter(o=>o.kind==='leaf'&&o.z>=0))leaf(o);
  for(const o of g.organs.filter(o=>o.kind==='flower')){const a=pose.organs.get(o.id),tint=pigment?.strength?{...pigment,amount:pigment.strength*.5,palette:pigment.palette,flower:true}:null;part(c,o.role,a.x,a.y,o.length,a.angle,null,tint);}
  if(p.staked){c.strokeStyle='#dbcba1';c.lineWidth=.15;for(const side of [-1,1])for(const u of [.34,.57]){const anchor=pose.joints.get('node:'+Math.max(1,Math.round(g.nodes*u)));if(!anchor)continue;c.beginPath();c.moveTo(side*H*.12,-anchor.y);c.lineTo(anchor.x,-anchor.y);c.stroke();}}
  c.restore();return{model:g,pose,counts:Model.counts(g)};
 }
 const ready=new Promise((resolve,reject)=>{image.onload=()=>{loaded=true;resolve();};image.onerror=()=>reject(Error((DATA.name||'Porchlight')+' components did not load'));image.src=DATA.runtime;});
 window[DATA.apiName||'BagseedPorchlightGrowth']=Object.freeze({ready,draw,part,manifest:DATA,Model,get loaded(){return loaded;}});
})();
