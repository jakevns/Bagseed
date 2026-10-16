// Five-cut batch: keep the original paintings and compose real ears above hair.
const fittedHairCuts=new Set(['short','buzz','crop','caesar','fade']);
// Loose lengths and dense curls cover the attachment of the ear. Their
// anatomy/jewelry stay selected in the saved look, but are occluded by hair.
// Short cuts and swept-up/tied styles retain the complete foreground ear.
const earCoveringHairCuts=new Set(['medium','long','bob','curly','wavy','locs','afro','curtains','angledbob','asymbob','braidbob','lob','shag','wolf','curlybob','twistout','halfup','layered','bluntlong','beachwaves','longcurls','boxbraids','longtwists','bigafro']);
const foregroundEarContours={
 down:['M60.6 145H45V172H69C67 166 65 160 63 153Z','M132 145H149V172H124C126 166 129 160 130.5 153Z'],
 right:['M96 155C95 148 90 145 84 145C77 145 72 150 72 157C72 166 77 172 84 173.5C89 174 93 172 97 170C96 165 95 159 96 155Z'],
 up:['M61 147H45V175H70C66 167 64 158 61 147Z','M132 147H149V175H123C127 167 130 158 132 147Z'],
 left:['M97 155C98 148 103 145 109 145C116 145 121 150 121 157C121 166 116 172 109 173.5C104 174 100 172 96 170C97 165 98 159 97 155Z']
};
const batchRearFits={short:[-.5,0,1.02,1.09],buzz:[0,0,1,1.07],crop:[0,0,1.02,1.09],caesar:[0,0,1.02,1.08],fade:[0,0,1.02,1.13]};
const batchScalpMasks=new Map();
function batchScalpMask(L,dir){
 if(batchScalpMasks.has(dir))return batchScalpMasks.get(dir);
 const out=cv(192,HEAD_HEIGHT),g=out.getContext('2d');g.drawImage(detailBase({...L,ears:'hidden'},dir),0,0);
 const a=g.getImageData(0,0,192,HEAD_HEIGHT).data;
 for(let y=175;y<HEAD_HEIGHT;y++)for(let x=0;x<192;x++)a[(y*192+x)*4+3]*=1-smooth(175,186,y);
 batchScalpMasks.set(dir,a);return a;
}
const batchRearSources=new Map();
function batchHairSource(L,dir){
 if(dir==='down')return pixels(`wig/${L.hairS}/${dir}`);
 const key=L.hairS+'|'+dir+'|'+L.ears;if(batchRearSources.has(key))return batchRearSources.get(key);
 const original=pixels(`wig/${L.hairS}/${dir}`),a=original.data.data;let left=192,right=-1,top=HEAD_HEIGHT,bottom=-1;
 for(let y=0;y<HEAD_HEIGHT;y++)for(let x=0;x<192;x++)if(a[(y*192+x)*4+3]>60){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 const out=cv(192,HEAD_HEIGHT),g=out.getContext('2d'),painting=images.get(`wig/${L.hairS}/${dir}`);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 if(dir==='up'){
  const[dx,dy,sx,sy]=batchRearFits[L.hairS];g.drawImage(painting,left,top,right-left+1,bottom-top+1,96+(left-96)*sx+dx,top+dy,(right-left+1)*sx,(bottom-top+1)*sy);
  const support=cv(192,HEAD_HEIGHT),s=support.getContext('2d');s.drawImage(detailBase(L.hairS==='buzz'?{...L,ears:'hidden'}:L,dir),0,0);s.globalCompositeOperation='destination-in';s.fill(new Path2D('M0 0H192V171L131 176Q119 184 110 186Q96 188 83 185Q70 179 62 172L0 171Z'));
  const im=g.getImageData(0,0,192,HEAD_HEIGHT),p=im.data,mask=s.getImageData(0,0,192,HEAD_HEIGHT).data;
  for(let y=0;y<HEAD_HEIGHT;y++)for(let x=0;x<192;x++){const n=(y*192+x)*4,t=L.hairS==='buzz'?1:smooth(140,148,y);p[n+3]*=1-t+t*mask[n+3]/255;}g.putImageData(im,0,0);
 }else{
  // The old ear aperture is filled behind the independent foreground ear.
  // This also supports small/flat/hidden ears without leaving a skin halo.
  const right=dir==='right',cx=right?85:108,patch=cv(192,HEAD_HEIGHT),p=patch.getContext('2d');
  g.drawImage(painting,0,0);p.drawImage(painting,right?72:95,116,26,24,cx-18,136,36,42);
  const im=p.getImageData(0,0,192,HEAD_HEIGHT),a=im.data,support=detailBase({...L,ears:'hidden'},dir).getContext('2d').getImageData(0,0,192,HEAD_HEIGHT).data,texture=new Uint8ClampedArray(a),samples=[];
  // Match the adjacent painted shading, retaining the sampled strand grain.
  // A bright crown patch alone leaves a visible circle when ears are hidden.
  for(let angle=0;angle<Math.PI*2;angle+=Math.PI/16){const x=Math.round(cx+18*Math.cos(angle)),y=Math.round(157+21*Math.sin(angle)),n=(y*192+x)*4;if(original.data.data[n+3]>200)samples.push([x,y,original.data.data[n]]);}
  for(let y=136;y<178;y++)for(let x=cx-18;x<cx+18;x++){
   const n=(y*192+x)*4,r=Math.hypot((x-cx)/18,(y-157)/21);let level=0,weight=0,mean=0,count=0;
   for(const[sx,sy,value]of samples){const w=1/(4+(x-sx)**2+(y-sy)**2);level+=value*w;weight+=w;}
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const at=((y+dy)*192+x+dx)*4;if(texture[at+3]>200){mean+=texture[at];count++;}}
   if(weight&&count){const value=Math.max(0,Math.min(255,level/weight+(texture[n]-mean/count)*.85));a[n]=a[n+1]=a[n+2]=value;}
   a[n+3]*=(1-smooth(.72,1,r))*support[n+3]/255;
  }
  p.putImageData(im,0,0);g.drawImage(patch,0,0);
 }
 const result={width:192,height:HEAD_HEIGHT,data:g.getImageData(0,0,192,HEAD_HEIGHT)};batchRearSources.set(key,result);return result;
}
function foregroundEarJewelry(c,L,f){
 const silver='#d5dfe1',gold='#e8bd57',ellipse=(color,x,y,rx,ry=rx,width=0)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(width){c.strokeStyle=color;c.lineWidth=width;c.stroke();}else{c.fillStyle=color;c.fill();}},stud=(p,color=silver,r=1.5)=>ellipse(color,...p,r),ring=(p,rx=2.7,ry=3.5)=>ellipse(gold,...p,rx,ry,1.2);
 const near=id=>f.ears.find(e=>e.id===id),draw=(ear,kind)=>{if(!ear)return;const[x,y]=ear.lobe;
  if(kind==='hoops')ring([x,y+2],3,4.3);else if(kind==='double'){stud([x,y-3]);stud([x,y+1],gold,1.3);}
  else if(kind==='industrial'){const p=ear.center,side=Math.sign(p[0]-ear.hinge[0]);path(c,silver,1.2,[p[0]-side*3,p[1]-9,p[0]+side*4,p[1]-3]);stud([p[0]-side*3,p[1]-9],silver,1);stud([p[0]+side*4,p[1]-3],silver,1);}
  else if(kind==='tragus')stud([ear.hinge[0]-Math.sign(ear.hinge[0]-ear.center[0])*2,ear.center[1]+1]);
  else if(kind==='cuff')path(c,silver,2,[ear.center[0]-2,ear.center[1]-6,ear.center[0]+3,ear.center[1]-5]);else stud(ear.lobe);
 };
 if(L.ears==='cuff')for(const e of f.ears)draw(e,'cuff');
 for(const id of new Set(L.pierce)){if(['earL','earR'].includes(id))draw(near(id),'stud');else if(id==='hoops')for(const e of f.ears)draw(e,'hoops');else if(id==='double'||id==='tragus')draw(near('earL'),id);else if(id==='industrial')draw(near('earR'),id);}
 if(['earring','moon'].includes(L.acc))for(const ear of f.ears){const[x,y]=ear.lobe,color=L.accC||gold;stud([x,y],color,1.1);if(L.acc==='moon'){ellipse(color,x,y+4,2.4,3.2);path(c,color,1,[x,y+1,x,y+3]);}else ellipse(color,x,y+2.5,1.6,2.6);}
}
function withoutEarJewelry(L){
 return {...L,ears:L.ears==='cuff'?'normal':L.ears,
  pierce:L.pierce.filter(p=>!['earL','earR','hoops','double','tragus','industrial'].includes(p)),
  acc:['earring','moon'].includes(L.acc)?'none':L.acc};
}
function foregroundEars(g,L,dir,features){
 if(L.ears==='hidden')return;
 // Retain the source ink's antialiased edge instead of multiplying its alpha
 // by the same contour a second time.
 const base=detailBase(L,dir),mask=cv(192,HEAD_HEIGHT),m=mask.getContext('2d');m.fillStyle=m.strokeStyle='#fff';m.lineWidth=3;m.lineJoin='round';
 DATA.detailLandmarks.views[dir].ears.forEach((ear,index)=>{
  m.save();m.translate(...ear.hinge);
  if(['pointed','elf'].includes(L.ears)){
   const side=Math.sign(ear.center[0]-ear.hinge[0]),[hx,hy]=ear.hinge,reach=L.ears==='elf'?24:18,tip=[hx+side*reach,hy-(L.ears==='elf'?22:16)];m.translate(-hx,-hy);
   m.beginPath();m.moveTo(hx,hy-8);m.quadraticCurveTo(hx+side*7,hy-13,...tip);m.quadraticCurveTo(hx+side*reach,hy+5,hx+side*6,hy+13);m.quadraticCurveTo(hx+side*2,hy+15,hx,hy+8);m.closePath();m.fill();m.stroke();
  }else {m.scale(...(earFits[L.ears]||[1,1]));m.translate(-ear.hinge[0],-ear.hinge[1]);const contour=new Path2D(foregroundEarContours[dir][index]);m.fill(contour);m.stroke(contour);}
  m.restore();
 });
 const layer=cv(192,HEAD_HEIGHT),e=layer.getContext('2d');e.drawImage(base,0,0);
 faceDetails(e,withoutEarJewelry(L),dir,features);
 e.globalCompositeOperation='destination-in';e.drawImage(mask,0,0);g.drawImage(layer,0,0);foregroundEarJewelry(g,L,features);
}
