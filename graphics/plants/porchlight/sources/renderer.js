/* Review-only Porchlight component renderer. No simulation or save writes. */
(()=>{
 'use strict';
 const DATA=__PORCHLIGHT_COMPONENT_DATA__,Model=window.PorchlightModel,image=new Image();let loaded=false;
 function part(c,role,x,y,length,angle=0,width=null){const a=DATA.parts[role];if(!a||!loaded||length<=0)return;const k=length/a.crop[3],w=width??a.crop[2]*k,h=length;c.save();c.translate(x,-y);c.rotate(angle);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,...a.crop,-a.attach[0]/a.crop[2]*w,-a.attach[1]/a.crop[3]*h,w,h);c.restore();}
 function stroke(c,points,width,color){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>c[i?'lineTo':'moveTo'](p.x,-p.y));c.stroke();}
 function branch(c,b){c.lineCap='round';c.beginPath();c.moveTo(b.start.x,-b.start.y);c.quadraticCurveTo(b.control.x,-b.control.y,b.end.x,-b.end.y);c.lineWidth=b.width*1.6;c.strokeStyle='#394b24';c.stroke();c.lineWidth=b.width;c.strokeStyle='#6f8540';c.stroke();c.lineWidth=b.width*.30;c.strokeStyle='#a7b16b';c.stroke();}
 function draw(c,p,x,y,pixelsPerInch=4,t=0,wind=1,{model=null,reduced=false}={}){
  if(!loaded)return;const g=model||Model.build(p,{}, {parts:DATA.parts}),pose=Model.pose(g,p,t,wind,reduced);
  c.save();c.translate(x,y);c.scale(pixelsPerInch,pixelsPerInch);
  const H=g.height,trunk=g.joints.map(j=>pose.joints.get(j.id)),trunkWidth=Math.max(.18,Math.min(1.2,H*.014));
  if(p.staked)for(const side of [-1,1])part(c,'bamboo',side*H*.12,0,H*.78,0,1.15);
  function leaf(o){if(o.removed)return;const a=pose.organs.get(o.id);c.save();const lower=a.y<H*.48,lowFood=p.nutr<25&&lower,sick=p.health<50;if(lowFood||sick)c.filter='sepia(.48) saturate(.78) hue-rotate(-20deg) brightness(1.08)';else if(o.z<0)c.filter='brightness(.86) saturate(.92)';part(c,o.role,a.x,a.y,o.length,a.angle);c.restore();}
  for(const o of g.organs.filter(o=>o.kind==='leaf'&&o.z<0))leaf(o);
  for(const b of pose.branches.values())if(!b.cut)branch(c,b);
  stroke(c,trunk,trunkWidth*1.5,'#3b4b28');stroke(c,trunk,trunkWidth,'#738443');stroke(c,trunk,trunkWidth*.28,'#b6b780');
  // A small painted knuckle at each true branch junction; stems remain continuous.
  for(const j of g.joints.slice(1,-1)){const a=pose.joints.get(j.id);part(c,'node',a.x,a.y,.7+H*.004,0,.6+H*.006);}
  for(const o of g.organs.filter(o=>o.kind==='leaf'&&o.z>=0))leaf(o);
  for(const o of g.organs.filter(o=>o.kind==='flower')){const a=pose.organs.get(o.id);part(c,o.role,a.x,a.y,o.length,a.angle);}
  if(p.staked){c.strokeStyle='#dbcba1';c.lineWidth=.15;for(const side of [-1,1])for(const u of [.34,.57]){const anchor=pose.joints.get('node:'+Math.max(1,Math.round(g.nodes*u)));if(!anchor)continue;c.beginPath();c.moveTo(side*H*.12,-anchor.y);c.lineTo(anchor.x,-anchor.y);c.stroke();}}
  c.restore();return{model:g,pose,counts:Model.counts(g)};
 }
 const ready=new Promise((resolve,reject)=>{image.onload=()=>{loaded=true;resolve();};image.onerror=()=>reject(Error('Porchlight components did not load'));image.src=DATA.runtime;});
 window.BagseedPorchlightGrowth=Object.freeze({ready,draw,part,manifest:DATA,Model,get loaded(){return loaded;}});
})();
