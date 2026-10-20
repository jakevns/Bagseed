// Approved painted body, rigid Standing/walk poses, independently fitted clothing.
const unifiedParts=new Map(),unifiedFigures=new Map();
function unifiedTint(id,roleId,rect,tone,base,patternId='none',secondary='#ffffff',balance=false){
 const signature=JSON.stringify([id,rect,tone,base,patternId,secondary,balance]);if(unifiedParts.has(signature))return unifiedParts.get(signature);
 const [x,y,w,h]=rect,out=cv(w,h),g=out.getContext('2d',{willReadFrequently:true}),mask=cv(w,h),m=mask.getContext('2d',{willReadFrequently:true});
 g.drawImage(images.get(id),x,y,w,h,0,0,w,h);m.drawImage(images.get(roleId),x,y,w,h,0,0,w,h);
 const pixels=g.getImageData(0,0,w,h),roles=m.getImageData(0,0,w,h).data,a=pixels.data;
 if(balance){const levels=[];for(let i=0;i<a.length;i+=4)if(a[i+3]>200&&roles[i+2]>127){const light=lum(a[i],a[i+1],a[i+2]);if(light>35)levels.push(light);}levels.sort((a,b)=>a-b);if(levels.length)base=levels[Math.floor(levels.length/2)]*1.15;}
 for(let i=0;i<a.length;i+=4)if(a[i+3]&&roles[i+2]>127){const color=patternId!=='none'&&pattern(patternId,(i/4)%w/3,Math.floor(i/4/w)/3)?rgb(secondary):rgb(tone);const mapped=material(color,lum(a[i],a[i+1],a[i+2]),base);for(let ch=0;ch<3;ch++)a[i+ch]=mapped[ch];}
 g.putImageData(pixels,0,0);if(unifiedParts.size>1600)unifiedParts.clear();unifiedParts.set(signature,out);return out;
}
function unifiedBone(a,b,c,d,widthScale=null){
 const u=[b[0]-a[0],b[1]-a[1]],v=[d[0]-c[0],d[1]-c[1]],sl=Math.hypot(...u),tl=Math.hypot(...v),sy=tl/sl,sx=widthScale??sy;
 const ex=u[0]/sl,ey=u[1]/sl,fx=v[0]/tl,fy=v[1]/tl;
 const A=fx*ex*sy+fy*ey*sx,B=fy*ex*sy-fx*ey*sx,C=fx*ey*sy-fy*ex*sx,E=fy*ey*sy+fx*ex*sx;
 return [A,B,C,E,c[0]-A*a[0]-C*a[1],c[1]-B*a[0]-E*a[1]];
}
function unifiedFigure(L,dir,frame,blink,density=1){
 const data=DATA.unifiedV7;if(!data||!['right','left'].includes(dir)||isChild(L))return null;
 const anatomy=['male','female','androgynous'].includes(L.anatomy)?L.anatomy:L.pres==='masc'?'male':L.pres==='fem'?'female':'androgynous';
 const view=data.views[anatomy+'-'+dir],pose=view.poses[frame===null?'idle':String(frame%8)],p=pose.keypoints;
 const signature=key(L)+'|'+dir+'|'+frame+'|'+blink+'|'+density;if(unifiedFigures.has(signature))return unifiedFigures.get(signature);
 const sourceKey=dir+'/'+(frame===null?0:frame%8),old=data.sourceRig.frames[sourceKey],q=old.keypoints;
 const out=cv(96*density,144*density),g=out.getContext('2d',{willReadFrequently:true});g.scale(density,density);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 const body=column=>{const part=pose.bodyParts[column],im=unifiedTint('unified/body/'+anatomy+'-'+dir,'unified/body-roles/'+anatomy+'-'+dir,part.rect,L.skin,160);g.drawImage(im,...part.destination,im.width/3,im.height/3);};
 const top='top-'+L.topS,bottom='bottom-'+L.bottomS,shoe='shoe-'+L.shoesS,full=data.garments[top]?.fullSuit,lower=full?top:bottom;
 const corePose=frame===null?'idle':String(frame%8);
 function core(slot,style,column,toneOverride){
  const id=slot+'-'+style,entry=view.core[id],part=entry?.poses[corePose]?.[column];if(!part)return false;
  const tone=toneOverride||(slot==='upper'?L.shirtC:slot==='lower'?L.pantsC:L.shoesC),pat=slot==='upper'?L.topPat:slot==='lower'?L.botPat:'none';
  const key=anatomy+'-'+dir+'/'+id,im=unifiedTint('unified/core/'+key,'unified/core-roles/'+key,part.rect,tone,entry.base,pat||'none',slot==='upper'?L.topC2:L.botC2);
  g.drawImage(im,...part.destination,im.width/3,im.height/3);return true;
 }
 function garment(id,name){
  const entry=data.garments[id],part=entry?.frames[sourceKey]?.parts[name];if(!part)return;
  const slot=entry.kind==='top'?'upper':entry.kind==='bottom'?'lower':'footwear';
  const clothTone=entry.style==='labcoat'?'#f2f2ee':L.shirtC;
  const column=name==='farArm'||name==='farLeg'||name==='farFoot'?0:name==='nearArm'?2:1;
  if(core(slot,entry.style,column))return;
  // Complete the non-core catalogue with a compatible painted lining. The
  // existing style-specific panels remain on top; the approved body is shared.
  if(slot==='upper'){
   if(name==='torso')core('upper','tee',1,clothTone);
   else if(name.endsWith('Leg'))core('lower','jeans',name==='farLeg'?0:1,L.shirtC);
   else if(!['tank','crop'].includes(entry.style))core('upper','hoodie',column,clothTone);
  }else if(slot==='lower')core('lower',entry.style==='skirt'?'shorts':'jeans',column);
  else if(entry.style==='rainboots')core('footwear','boots',column);
  const role=entry.kind==='shoe'?'shoe':entry.kind==='bottom'||name.endsWith('Leg')?'lower':'upper';
  const base=entry.frames[sourceKey].profileBases?.[role]||entry.profileBases?.[role]||(role==='shoe'?62:role==='lower'?70:115);
  const tone=entry.kind==='shoe'?L.shoesC:entry.kind==='bottom'?L.pantsC:clothTone;
  const pat=entry.kind==='shoe'?'none':entry.kind==='bottom'?L.botPat:L.topPat;
  const im=unifiedTint('unified/garment/'+id,'unified/garment-roles/'+id,part.rect,tone,base,pat||'none',entry.kind==='bottom'?L.botC2:L.topC2,['suit','labcoat'].includes(entry.style));
  const far=name.startsWith('far'),oldSide=far?(old.nearArm==='R'?'L':'R'):old.nearArm,newSide=far?(pose.nearArm==='R'?'L':'R'):pose.nearArm;
  const draw=(matrix,clip)=>{g.save();g.transform(...matrix);if(clip){g.beginPath();g.moveTo(...clip[0]);clip.slice(1).forEach(pt=>g.lineTo(...pt));g.closePath();g.clip();}g.drawImage(im,part.destination[0]/3,part.destination[1]/3,im.width/3,im.height/3);g.restore();};
  if(name.endsWith('Arm')||name.endsWith('Leg')){
   const arm=name.endsWith('Arm'),os=arm?oldSide:(far?(old.nearLeg==='R'?'L':'R'):old.nearLeg),ns=arm?newSide:(far?(pose.nearLeg==='R'?'L':'R'):pose.nearLeg);
   const a=q[(arm?'shoulder':'hip')+os],b=q[(arm?'elbow':'knee')+os],end=q[(arm?'hand':'ankle')+os];
   const wrist=arm?[b[0]+(end[0]-b[0])*.78,b[1]+(end[1]-b[1])*.78]:end;
   const na=p[(arm?'shoulder':'hip')+ns],nb=p[(arm?'elbow':'knee')+ns],nc=p[(arm?'wrist':'ankle')+ns];
   const axis=[wrist[0]-a[0],wrist[1]-a[1]],len=Math.hypot(...axis),normal=[-axis[1]/len,axis[0]/len],forward=[axis[0]/len,axis[1]/len];
   const point=(across,along)=>[b[0]+normal[0]*across+forward[0]*along,b[1]+normal[1]*across+forward[1]*along];
   // Existing trouser panels end at the ankle. Exclude their old baked shoe
   // pixels so only the selected independent footwear occupies the foot.
   const reach=Math.hypot(wrist[0]-b[0],wrist[1]-b[1])+(arm?0:1);
   const upper=[point(-100,-200),point(100,-200),point(100,1),point(-100,1)],low=[point(-100,-1),point(100,-1),point(100,reach),point(-100,reach)];
   draw(unifiedBone(a,b,na,nb,arm?.85:.72),upper);draw(unifiedBone(b,wrist,nb,nc,arm?.85:.72),low);
  }else if(name.endsWith('Foot')){
   const os=far?(old.nearLeg==='R'?'L':'R'):old.nearLeg,ns=far?(pose.nearLeg==='R'?'L':'R'):pose.nearLeg;
   draw(unifiedBone(q['heel'+os],q['toe'+os],p['heel'+ns],p['toe'+ns]));
  }else{
   const sourceHeight=q.waist[1]-q.neck[1],targetHeight=p.waist[1]-p.neck[1],sy=targetHeight/sourceHeight;
   const sx=(view.torsoWidth+(L.topS==='hoodie'?5:3))/(part.rect[2]/3);
   const shear=(p.waist[0]-p.neck[0])/sourceHeight;
   draw([sx,0,shear,sy,p.neck[0]-sx*q.neck[0]-shear*q.neck[1],p.neck[1]-sy*q.neck[1]]);
  }
 }
 // Parent/child ownership is fixed for every outfit, frame and anatomy.
 body(0);garment(top,'farArm');garment(shoe,'farFoot');garment(lower,'farLeg');
 body(1);garment(shoe,'nearFoot');garment(lower,'nearLeg');
 if(data.garments[top]?.longHem&&!full){garment(top,'farLeg');garment(top,'nearLeg');}
 garment(top,'torso');body(2);garment(top,'nearArm');body(3);
 walkAccessories(g,L,dir,p);
 const H=head(L,dir,blink,true),placement=headPlacement(L,dir,p.neck),[hx,hy]=placement.origin;
 // The head painting has a detached upper-neck layer. Preserve that painted
 // join rather than leaving its transparent opening over the body's rim.
 g.drawImage(H.bagseedNeckBridge,hx,hy,64,H.height/3);
 g.drawImage(H,hx,hy,64,H.height/3);
 if(L.prop&&L.prop!=='none')props(g,L,dir);
 out.bagseedHeadOrigin=[hx,hy];out.bagseedEyes=H.bagseedEyes.map(([x,y])=>[hx+x/3,hy+y/3]);
 out.bagseedNose=(H.bagseedFeatures.nose||[96,155]).map((v,i)=>(i?hy:hx)+v/3);
 const worldFit=.9; // Uniform whole-character fit to the retained front/back height.
 out.bagseedHand={x:p['hand'+pose.nearArm][0],y:p['hand'+pose.nearArm][1]};out.bagseedBodyTransform={width:worldFit,sy:worldFit};
 out.bagseedAuthoredWalk=frame===null?undefined:dir+'/'+frame%8;out.bagseedWalkProfile='unified-v7/';
 out.bagseedUnifiedV7={anatomy,pose:frame===null?'idle':frame%8,keypoints:p,nearArm:pose.nearArm,nearLeg:pose.nearLeg,version:data.version};
 out.bagseedAlignment={...placement,shoulderBand:[p['shoulder'+pose.nearArm][1],p['shoulder'+pose.nearArm][1]+4],shoulderWidth:view.torsoWidth,garment:L.topS,bottom:L.bottomS,source:'approved-v7/'+anatomy+'/'+dir};
 const result=scalePlayerFigure(out,PLAYER_FIGURE_SCALE*worldFit);if(unifiedFigures.size>120)unifiedFigures.clear();unifiedFigures.set(signature,result);return result;
}
