  // Authored wardrobe walking. Standing, reactions and authored NPCs keep
  // their established paths. Every moving pixel comes from a generated frame.
  const walkParts=new Map(),walkFigures=new Map();
  const approvedBodies=new Map(),approvedNecks=new Map();
  function approvedOutfitView(L,dir,frame){
    return !isChild(L)&&L.bottomS==='jeans'&&L.shoesS==='sneakers'?DATA.walk?.approvedOutfits?.items[L.topS]?.frames[dir+'/'+frame]:null;
  }
  function approvedBodyFrame(L,dir,frame){
    const view=approvedOutfitView(L,dir,frame);if(!view)return null;
    const signature=key(L)+'|'+dir+'/'+frame;if(approvedBodies.has(signature))return approvedBodies.get(signature);
    const source=cv(288,432),s=source.getContext('2d',{willReadFrequently:true}),roles=cv(288,432),r=roles.getContext('2d',{willReadFrequently:true});
    s.drawImage(images.get('approved-outfits/'+L.topS),...view.rect,0,0,288,432);
    r.drawImage(images.get('approved-outfits/'+L.topS+'-roles'),...view.rect,0,0,288,432);
    const data=s.getImageData(0,0,288,432),a=data.data,labels=r.getImageData(0,0,288,432).data;
    for(let n=0;n<a.length;n+=4){
      const part=labels[n],role=labels[n+1];if(!a[n+3])continue;
      if(!role)continue;
      let tone=rgb(role===1?L.skin:role===2?L.shirtC:role===3?L.pantsC:L.shoesC);
      if(role===2&&pattern(L.topPat,((n/4)%288)/3,Math.floor(n/4/288)/3))tone=rgb(L.topC2||'#ffffff');
      if(role===3&&pattern(L.botPat,((n/4)%288)/3,Math.floor(n/4/288)/3))tone=rgb(L.botC2||'#ffffff');
      const color=material(tone,lum(a[n],a[n+1],a[n+2]),view.materialBases[role]);a[n]=color[0];a[n+1]=color[1];a[n+2]=color[2];
    }
    s.putImageData(data,0,0);
    const combined=cv(288,432),g=combined.getContext('2d');g.scale(3,3);
    g.drawImage(source,0,0,96,144);walkAccessories(g,L,dir,view.keypoints);
    combined.bagseedApprovedOutfit={garment:L.topS,frame:dir+'/'+frame,source:view.source};
    if(approvedBodies.size>240)approvedBodies.clear();approvedBodies.set(signature,combined);return combined;
  }
  function approvedAttachment(L,dir,frame){
    const k=L.topS+'/'+dir+'/'+frame;if(approvedNecks.has(k))return approvedNecks.get(k);
    const view=DATA.walk.approvedOutfits.items[L.topS].frames[dir+'/'+frame],source=cv(288,432),g=source.getContext('2d');
    g.drawImage(images.get('approved-outfits/'+L.topS),...view.rect,0,0,288,432);
    const result=paintedNeck(source,[48,78],3,dir,L.topS);approvedNecks.set(k,result);return result;
  }
  function approvedIdleBody(L,dir,density){
    const full=approvedBodyFrame(L,dir,'idle'),out=cv(96*density,108*density),g=out.getContext('2d');
    g.drawImage(full,0,108,288,324,0,0,out.width,out.height);
    const neck=approvedAttachment(L,dir,'idle');out.bagseedNeck={...neck,root:[neck.root[0],neck.root[1]-36],top:neck.top-36,opening:neck.opening-36,shoulderY:neck.shoulderY-36};
    out.bagseedApprovedOutfit=full.bagseedApprovedOutfit;return out;
  }
  function approvedWalkFigure(L,dir,frame,blink,density){
    const view=approvedOutfitView(L,dir,frame);if(!view)return null;
    const B=approvedBodyFrame(L,dir,frame),attachment=approvedAttachment(L,dir,frame),rest=approvedAttachment(L,dir,'idle');
    const sy=(L.short?.9:L.body==='tall'?1.07:1)*(143-rest.root[1])/(143-attachment.root[1]);
    const shoulderFit=rest.shoulderWidth/attachment.shoulderWidth;
    const width=({slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[L.body]||1)*(L.pres==='masc'?1.045:L.pres==='fem'?.955:1)*shoulderFit;
    const out=cv(96*density,144*density),g=out.getContext('2d');g.scale(density,density);
    const H=head(L,dir,blink,true),ny=143+(attachment.root[1]-143)*sy,nx=48+(attachment.root[0]-48)*width;
    const placement=headPlacement(L,dir,[nx,ny]),[hx,hy]=placement.origin;
    neckBacking(g,H,L,dir,hx,hy,ny,143+(attachment.opening-143)*sy);
    g.save();g.translate(48,143);g.scale(width,sy);g.drawImage(B,-48,-143,96,144);g.restore();
    neckSurface(g,H,L,dir,hx,hy,attachment,width,sy,144);g.drawImage(H,hx,hy,64,H.height/3);
    out.bagseedHeadOrigin=[hx,hy];out.bagseedBodyTransform={width,sy};out.bagseedApprovedOutfit=B.bagseedApprovedOutfit;
    out.bagseedAuthoredWalk=dir+'/'+frame;out.bagseedWalkProfile='approved-outfits/';out.bagseedEyes=H.bagseedEyes.map(([x,y])=>[hx+x/3,hy+y/3]);
    out.bagseedAlignment={...placement,attachment,shoulderBand:[3,7].map(d=>143+(attachment.shoulderY+d-143)*sy),shoulderWidth:attachment.shoulderWidth*width,uniformScale:sy,shoulderFit:1,rigNeck:view.keypoints.neck,garment:L.topS,bottom:L.bottomS,rear:dir==='up',source:view.source};
    const hand=view.keypoints['hand'+view.keypoints.nearArm];out.bagseedHand={x:48+(hand[0]-48)*width,y:143+(hand[1]-143)*sy};
    return scalePlayerFigure(out,PLAYER_FIGURE_SCALE);
  }
  function walkNeck(item,frame,walk){
    const key=(walk.imagePrefix||'walk/')+item+'|'+frame;
    if(neckRegistrations.has(key))return neckRegistrations.get(key);
    const entry=walk.items[item],view=entry?.frames[frame];
    if(!view?.parts?.torso&&!view?.parts?.wholeUpper)throw new Error('Missing authored wardrobe view: '+item+'/'+frame);
    const parts=view.parts,source=cv(288,432),s=source.getContext('2d');
    for(const name of parts.wholeUpper?['wholeUpper']:['farArm','torso','nearArm']){
      const part=parts[name];if(!part)continue;const[sx,sy,w,h]=part.rect;
      s.drawImage(images.get((walk.imagePrefix||'walk/')+item),sx,sy,w,h,...part.destination,w,h);
    }
    const registration=paintedNeck(source,walk.rig.frames[frame].keypoints.neck,3,frame.split('/')[0],item.slice(4));
    neckRegistrations.set(key,registration);return registration;
  }
  // Select a complete compatible outfit/rig; never mix eight-pose legs with
  // four-pose sleeves or shoes from the earlier wardrobe.
  function customWalkSet(L,dir){
    return DATA.walk.stride&&['right','left'].includes(dir)?DATA.walk.stride:DATA.walk;
  }
  function customWalkFrameCount(look,dir='down'){
    const L=normalize(look);return isChild(L)?4:customWalkSet(L,dir).frameCounts?.[dir]||4;
  }
  function walkLocal(p,x,y){
    const a=p.neck,b=p.waist,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
    return [48+((x-a[0])*dy-(y-a[1])*dx)/length,42+((x-a[0])*dx+(y-a[1])*dy)/length];
  }
  function walkLegLocal(frame,name,x,y){
    const side=name==='nearLeg'?frame.nearLeg:frame.nearLeg==='L'?'R':'L',p=frame.keypoints,a=p['hip'+side],b=p['ankle'+side],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
    return [48+((x-a[0])*dy-(y-a[1])*dx)/length,70+((x-a[0])*dx+(y-a[1])*dy)/length];
  }
  function walkPart(item,frame,name,L,walk=DATA.walk){
    const entry=walk.items[item],part=entry.frames[frame].parts[name];if(!part)return null;
    const sig=JSON.stringify([walk.imagePrefix||'walk/',item,frame,name,L.skin,L.shirtC,L.pantsC,L.shoesC,L.topS,L.bottomS,L.topPat,L.botPat,L.topC2,L.botC2]);
    if(walkParts.has(sig))return walkParts.get(sig);
    const [sx,sy,w,h]=part.rect,out=cv(w,h),g=out.getContext('2d',{willReadFrequently:true});g.drawImage(images.get((walk.imagePrefix||'walk/')+item),sx,sy,w,h,0,0,w,h);
    const data=g.getImageData(0,0,w,h),a=data.data,p=walk.rig.frames[frame].keypoints,kind=entry.kind;
    for(let i=0;i<a.length;i+=4){
      if(a[i+3]<=8){a[i+3]=0;continue;}
      const r=a[i],gg=a[i+1],b=a[i+2],light=lum(r,gg,b),x=((i/4)%w+part.destination[0])/3,y=(Math.floor(i/4/w)+part.destination[1])/3;
      const blue=b>r*1.05&&b>gg*.95,cream=r>175&&gg>160&&b>125&&Math.abs(r-gg)<45;
      const brass=r>120&&gg>85&&gg>b*2.6&&r<gg*1.65;
      const skin=bodySkinPixel(r,gg,b)&&!brass&&(kind!=='shoe'||entry.style==='sandals'&&light>88&&r<gg*1.9&&b>gg*.62);
      let tone,base;
      if(kind==='skin'){tone=rgb(wardrobeFullSuit(L)?L.shirtC:name==='pelvis'?L.pantsC:['skirt','shorts'].includes(L.bottomS)?L.skin:L.pantsC);base=145;}
      else if(skin){tone=rgb(L.skin);base=160;}
      else if(brass)continue;
      else if(cream&&kind!=='bottom'&&!(entry.fullSuit&&name.endsWith('Leg')))continue;
      else if(kind==='shoe'){tone=rgb(L.shoesC);base=62;}
      else if(!blue&&light<35)continue;
      else if(kind==='bottom'){tone=rgb(L.pantsC);base=70;}
      else if(entry.style==='labcoat'){tone=rgb('#f2f2ee');base=115;}
      // The front/rear suit source is much lighter than the standing jacket.
      // Match its cloth value; using the full-suit default made it flash pale
      // pink/green on movement even though the selected color was unchanged.
      else{tone=rgb(L.shirtC);base=entry.style==='suit'?180:entry.fullSuit?105:115;}
      const profileRole=kind==='shoe'?'shoe':kind==='bottom'||entry.fullSuit&&name.endsWith('Leg')?'lower':'upper';
      const profileBase=entry.frames[frame].profileBases?.[profileRole]||entry.profileBases?.[profileRole];
      if(!skin&&kind!=='skin'&&entry.style!=='labcoat'&&/^(right|left)\//.test(frame)&&profileBase)base=profileBase;
      if(!skin&&kind!=='shoe'&&kind!=='skin'){
        const [u,v]=name.endsWith('Leg')?walkLegLocal(walk.rig.frames[frame],name,x,y):walkLocal(p,x,y),pat=kind==='bottom'?L.botPat:L.topPat;
        if(blue&&pattern(pat,u,v)){tone=rgb((kind==='bottom'?L.botC2:L.topC2)||'#ffffff');}
      }
      // Cream placeholders on trouser panels are highlights of that fabric,
      // not white material. Preserve a modest fold highlight without the
      // generic material function bleaching dark pants toward pale gray.
      const fabricHighlight=cream&&(kind==='bottom'||entry.fullSuit&&name.endsWith('Leg'));
      const mapped=material(tone,fabricHighlight?Math.min(light,base*1.12):light,base);a[i]=mapped[0];a[i+1]=mapped[1];a[i+2]=mapped[2];
    }
    g.putImageData(data,0,0);const result={image:out,x:part.destination[0]/3,y:part.destination[1]/3};
    if(walkParts.size>1600)walkParts.clear();walkParts.set(sig,result);return result;
  }
  function walkAccessories(g,L,dir,p){
    const [nx,ny]=p.neck,[wx,wy]=p.waist;
    if(L.acc==='bandana'||L.acc==='scarf'){
      const color=L.accC||(L.acc==='bandana'?'#c94f4f':'#d26aa0');path(g,color,2,[nx-6,ny+2,nx,ny+4,nx+6,ny+2]);
      path(g,color,3,L.acc==='scarf'?[nx+4,ny+4,nx+5,ny+14]:[nx-3,ny+4,nx,ny+7,nx+3,ny+4]);
    }
    if(L.acc==='necklace'&&dir!=='up'){path(g,L.accC||'#d6b25a',.8,[nx-6,ny+3,nx-3,ny+7,nx,ny+9,nx+3,ny+7,nx+6,ny+3]);g.fillStyle=L.accC||'#d6b25a';g.beginPath();g.ellipse(nx,ny+10,1.2,1.7,0,0,7);g.fill();}
    if(L.acc==='belt'){path(g,L.accC||'#664a32',1.6,[wx-11,wy,wx,wy+1,wx+11,wy]);if(dir!=='up'){g.strokeStyle='#d5b470';g.lineWidth=.6;g.strokeRect(wx-2,wy-1,4,3);}}
    if(L.acc==='bag'){
      const color=L.accC||'#986642',shoulder=p.shoulderL,hip=p.hipR;
      path(g,color,1.4,[shoulder[0],shoulder[1],hip[0]+4,hip[1]+5]);g.fillStyle=color;g.strokeStyle='#543c2d';g.lineWidth=.7;g.beginPath();g.roundRect(hip[0]+1,hip[1]+1,10,10,1.5);g.fill();g.stroke();path(g,'#b58a62',.7,[hip[0]+2,hip[1]+4,hip[0]+10,hip[1]+4]);
    }
    if(L.topPat==='emblem'&&dir!=='up'){
      const icon=CLPAT.icon[L.emb]||CLPAT.icon.star,cx=(nx+wx)/2-3,cy=ny+(wy-ny)*.47;g.fillStyle=L.topC2||'#efe3c4';
      icon.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='x')g.fillRect(cx+x,cy+y,1,1);}));
    }
  }
  function authoredWalk(L,dir,frame,blink,density=1){
    const approved=approvedWalkFigure(L,dir,frame%4,blink,density);if(approved)return approved;
    const walk=customWalkSet(L,dir),top='top-'+L.topS,bottom='bottom-'+L.bottomS,shoe='shoe-'+L.shoesS,items=walk?.items;
    if(!items?.[top]?.accepted||!items[shoe]?.accepted||!items[top].fullSuit&&!items[bottom]?.accepted||isChild(L))return null;
    const f=dir+'/'+(frame%(walk.frameCounts?.[dir]||4)),sig=(walk.imagePrefix||'walk/')+key(L)+'|'+f+'|'+blink+'|'+density;
    if(walkFigures.has(sig))return walkFigures.get(sig);
    // Join all cropped parts at source density before any build transform or
    // gameplay downsampling. Independent low-resolution resampling leaves
    // antialiased seams along the otherwise perfectly adjacent label edges.
    const out=cv(96*density,144*density),g=out.getContext('2d'),bodyFrame=cv(288,432),b=bodyFrame.getContext('2d');g.scale(density,density);b.scale(3,3);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='low';
    // The front/rear wardrobe paintings have taller torsos than the standing
    // wardrobe. Register that body to the same feet-to-collar span before
    // attaching the head; burying the jaw was masking this scale mismatch.
    const p=walk.rig.frames[f].keypoints,attachment=walkNeck(top,f,walk),rest=body(L,dir,false,3).bagseedNeck;
    const restShoulder=36+rest.shoulderY,restCollar=36+rest.root[1];
    // One feet-anchored similarity fit to both anatomical landmarks. Shoulder
    // silhouettes alone vary with the garment's cut; fitting just that row
    // let a rear hoodie drop its collar and head several pixels on movement.
    const shoulderSpan=143-attachment.shoulderY,collarSpan=143-attachment.root[1];
    const bodyFit=((143-restShoulder)*shoulderSpan+(143-restCollar)*collarSpan)/(shoulderSpan*shoulderSpan+collarSpan*collarSpan);
    const build=({slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[L.body]||1)*(L.pres==='masc'?1.045:L.pres==='fem'?.955:1);
    // Register the complete walking body uniformly first. The separate build
    // fit matches the measured painted shoulder span, including presentation.
    const shoulderFit=rest.shoulderWidth/(attachment.shoulderWidth*bodyFit),width=build*bodyFit*shoulderFit,sy=(L.short?.9:L.body==='tall'?1.07:1)*bodyFit;
    // The walking rig's neck landmark is the collar/root, not the jaw. Using
    // the jaw there buried the painted neck under the head in every stride.
    // The collar covers the lower part of the head's original neck. Retain
    // a short exposed neck above it, fitted with the selected face shape.
    const H=head(L,dir,blink,true),nx=48+(p.neck[0]-48+attachment.root[0]-48)*width,ny=143+(attachment.root[1]-143)*sy;
    const placement=headPlacement(L,dir,[nx,ny]),[hx,hy]=placement.origin;
    const lower=wardrobeFullSuit(L)?top:bottom;
    // Side shirts retain their complete painted shoulder/arm silhouette.
    // Re-slicing sleeves around inferred wrists hid cuffs behind trousers.
    const intact=items[top].frames[f].parts.wholeUpper,layers=[];
    layers.push(['skin-base','pelvis']);
    if(!intact)layers.push([top,'farArm']);
    layers.push(['skin-base','farLeg'],[lower,'farLeg'],[shoe,'farFoot']);
    if(!intact)layers.push([top,'torso']);
    layers.push(['skin-base','nearLeg'],[lower,'nearLeg']);
    if(!intact&&items[top].longHem)layers.push([top,'farLeg'],[top,'nearLeg']);
    layers.push([shoe,'nearFoot'],[top,intact?'wholeUpper':'nearArm']);
    for(const [item,name]of layers){
      const part=walkPart(item,f,name,L,walk);if(part)b.drawImage(part.image,part.x,part.y,part.image.width/3,part.image.height/3);
    }
    neckBacking(g,H,L,dir,hx,hy,ny,143+(attachment.opening-143)*sy);
    walkAccessories(b,L,dir,p);g.save();g.translate(48,143);g.scale(width,sy);g.drawImage(bodyFrame,-48,-143,96,144);g.restore();
    // Cover the source's cut neck cap/placeholder inside the opening, ending
    // at the painted collar rather than continuing into the shirt's chest.
    neckSurface(g,H,L,dir,hx,hy,attachment,width,sy,144);
    // Hair, hats and ears retain the approved head renderer and translate as
    // one complete layer, above clothing, without a mesh or row deformation.
    g.drawImage(H,hx,hy,64,H.height/3);
    out.bagseedHeadOrigin=[hx,hy];
    out.bagseedAlignment={...placement,attachment:{root:attachment.root,top:attachment.top,opening:attachment.opening},shoulderBand:[3,7].map(d=>143+(attachment.shoulderY+d-143)*sy),shoulderWidth:attachment.shoulderWidth*width,uniformScale:bodyFit,shoulderFit,rigNeck:p.neck,garment:L.topS,bottom:wardrobeFullSuit(L)?L.topS:L.bottomS,rear:dir==='up',source:items[top].frames[f].registration?.source,sourceSlot:items[top].frames[f].registration?.sourceSlot};
    out.bagseedBodyTransform={width,sy};
    const hand=p['hand'+walk.rig.frames[f].nearArm];out.bagseedHand={x:48+(hand[0]-48)*width,y:143+(hand[1]-143)*sy};
    out.bagseedEyes=H.bagseedEyes.map(([x,y])=>[hx+x/3,hy+y/3]);out.bagseedAuthoredWalk=f;out.bagseedWalkProfile=walk.imagePrefix||'walk/';
    const registered=scalePlayerFigure(out,PLAYER_FIGURE_SCALE);
    if(walkFigures.size>96)walkFigures.clear();walkFigures.set(sig,registered);return registered;
  }
