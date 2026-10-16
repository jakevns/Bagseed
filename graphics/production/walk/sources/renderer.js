  // Authored wardrobe walking. Standing, reactions and authored NPCs keep
  // their established paths. Every moving pixel comes from a generated frame.
  const walkParts=new Map(),walkFigures=new Map();
  function walkLocal(p,x,y){
    const a=p.neck,b=p.waist,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
    return [48+((x-a[0])*dy-(y-a[1])*dx)/length,42+((x-a[0])*dx+(y-a[1])*dy)/length];
  }
  function walkLegLocal(frame,name,x,y){
    const side=name==='nearLeg'?frame.nearLeg:frame.nearLeg==='L'?'R':'L',p=frame.keypoints,a=p['hip'+side],b=p['ankle'+side],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
    return [48+((x-a[0])*dy-(y-a[1])*dx)/length,70+((x-a[0])*dx+(y-a[1])*dy)/length];
  }
  function walkPart(item,frame,name,L){
    const entry=DATA.walk.items[item],part=entry.frames[frame].parts[name];if(!part)return null;
    const sig=JSON.stringify([item,frame,name,L.skin,L.shirtC,L.pantsC,L.shoesC,L.topS,L.bottomS,L.topPat,L.botPat,L.topC2,L.botC2]);
    if(walkParts.has(sig))return walkParts.get(sig);
    const [sx,sy,w,h]=part.rect,out=cv(w,h),g=out.getContext('2d',{willReadFrequently:true});g.drawImage(images.get('walk/'+item),sx,sy,w,h,0,0,w,h);
    const data=g.getImageData(0,0,w,h),a=data.data,p=DATA.walk.rig.frames[frame].keypoints,kind=entry.kind;
    for(let i=0;i<a.length;i+=4){
      if(a[i+3]<=8){a[i+3]=0;continue;}
      const r=a[i],gg=a[i+1],b=a[i+2],light=lum(r,gg,b),x=((i/4)%w+part.destination[0])/3,y=(Math.floor(i/4/w)+part.destination[1])/3;
      const blue=b>r*1.05&&b>gg*.95,cream=r>175&&gg>160&&b>125&&Math.abs(r-gg)<45;
      const brass=r>120&&gg>85&&gg>b*2.6&&r<gg*1.65;
      const skin=bodySkinPixel(r,gg,b)&&!brass&&(kind!=='shoe'||entry.style==='sandals'&&light>88&&r<gg*1.9&&b>gg*.62);
      let tone,base;
      if(kind==='skin'){tone=rgb(['overalls','pjs','suit'].includes(L.topS)?L.shirtC:['skirt','shorts'].includes(L.bottomS)?L.skin:L.pantsC);base=145;}
      else if(skin){tone=rgb(L.skin);base=160;}
      else if(cream||brass)continue;
      else if(kind==='shoe'){tone=rgb(L.shoesC);base=62;}
      else if(!blue&&light<35)continue;
      else if(kind==='bottom'){tone=rgb(L.pantsC);base=70;}
      else{tone=rgb(L.shirtC);base=entry.fullSuit?105:115;}
      const profileRole=kind==='shoe'?'shoe':kind==='bottom'||entry.fullSuit&&name.endsWith('Leg')?'lower':'upper';
      if(!skin&&kind!=='skin'&&/^(right|left)\//.test(frame)&&entry.profileBases?.[profileRole])base=entry.profileBases[profileRole];
      if(!skin&&kind!=='shoe'&&kind!=='skin'){
        const [u,v]=name.endsWith('Leg')?walkLegLocal(DATA.walk.rig.frames[frame],name,x,y):walkLocal(p,x,y),pat=kind==='bottom'?L.botPat:L.topPat;
        if(blue&&pattern(pat,u,v)){tone=rgb((kind==='bottom'?L.botC2:L.topC2)||'#ffffff');}
      }
      const mapped=material(tone,light,base);a[i]=mapped[0];a[i+1]=mapped[1];a[i+2]=mapped[2];
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
    const top='top-'+L.topS,bottom='bottom-'+L.bottomS,shoe='shoe-'+L.shoesS,items=DATA.walk?.items;
    if(!items?.[top]?.accepted||!items[shoe]?.accepted||!items[top].fullSuit&&!items[bottom]?.accepted||isChild(L))return null;
    const f=dir+'/'+(frame%4),sig=key(L)+'|'+f+'|'+blink+'|'+density;
    if(walkFigures.has(sig))return walkFigures.get(sig);
    // Join all cropped parts at source density before any build transform or
    // gameplay downsampling. Independent low-resolution resampling leaves
    // antialiased seams along the otherwise perfectly adjacent label edges.
    const out=cv(96*density,144*density),g=out.getContext('2d'),bodyFrame=cv(288,432),b=bodyFrame.getContext('2d');g.scale(density,density);b.scale(3,3);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='low';
    const p=DATA.walk.rig.frames[f].keypoints,width=({slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[L.body]||1)*(L.pres==='masc'?1.045:L.pres==='fem'?.955:1),sy=L.short?.9:L.body==='tall'?1.07:1;
    const H=head(L,dir,blink,true),joinY=HEAD_NECK+(HEAD_JOIN-HEAD_NECK)*(faceFits[L.face]?.[1]||1),nx=48+(p.neck[0]-48)*width,ny=143+(p.neck[1]-143)*sy,hx=nx-32,hy=ny-joinY/3;
    g.drawImage(H.bagseedNeckBridge,hx,hy,64,H.height/3);
    const lower=items[top].fullSuit?top:bottom;
    const layers=[[top,'farArm'],['skin-base','farLeg'],[lower,'farLeg'],[shoe,'farFoot'],[top,'torso'],['skin-base','nearLeg'],[lower,'nearLeg']];
    // Aprons and coats keep their original painted hem pixels over trousers.
    // Their leg-labelled hem pieces are additional top layers, not bottoms.
    if(items[top].longHem)layers.push([top,'farLeg'],[top,'nearLeg']);
    layers.push([shoe,'nearFoot'],[top,'nearArm']);
    for(const [item,name]of layers){
      const part=walkPart(item,f,name,L);if(part)b.drawImage(part.image,part.x,part.y,part.image.width/3,part.image.height/3);
    }
    walkAccessories(b,L,dir,p);g.save();g.translate(48,143);g.scale(width,sy);g.drawImage(bodyFrame,-48,-143,96,144);g.restore();
    // Hair, hats and ears retain the approved head renderer and translate as
    // one complete layer, above clothing, without a mesh or row deformation.
    g.drawImage(H,hx,hy,64,H.height/3);
    const hand=p['hand'+DATA.walk.rig.frames[f].nearArm];out.bagseedHand={x:48+(hand[0]-48)*width,y:143+(hand[1]-143)*sy};
    out.bagseedEyes=H.bagseedEyes.map(([x,y])=>[hx+x/3,hy+y/3]);out.bagseedAuthoredWalk=f;
    if(walkFigures.size>96)walkFigures.clear();walkFigures.set(sig,out);return out;
  }
