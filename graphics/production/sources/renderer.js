/* Bagseed illustrated production renderer. Artwork is generated PNG material,
 * registered by extract.py; saved appearance objects remain authoritative.
 * This patch changes character rendering only. Baseline simulation is retained.
 */
(() => {
  'use strict';
  const DATA = __BAGSEED_ART_DATA__;
  const DIRS = ['down','right','up','left'];
  const HEAD_PAD=64,HEAD_HEIGHT=320,HEAD_NECK=199,HEAD_JOIN=184,BODY_JOIN=42;
  if(!HAIRS.some(([id])=>id==='bald'))HAIRS.unshift(['bald','Bald']);
  for(const mouth of [['braces','Braces'],['fangs','Fangs'],['cat','Cat smile']])if(!MOUTHS115.some(([id])=>id===mouth[0]))MOUTHS115.push(mouth);
  const images = new Map(), colored = new Map(), heads = new Map(), bodies = new Map();
  const cache = new Map(), portraits = new Map(), rawPixels = new Map(), faceMasks = new Map(), poseContacts = new Map();
  let loaded = false;
  const cv = (w=96,h=108) => {const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const rgb = hex => {let h=String(hex||'#000000').replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0);};
  const skinPixel = (r,g,b) => r>g*1.27 && g>b+12 && r>130 && g>68;
  const bodySkinPixel=(r,g,b)=>r>55&&g>25&&r>g*1.15&&g>b+6;
  const lum = (r,g,b) => .2126*r+.7152*g+.0722*b;
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  const fallback = {skin:'#cf9670',hairC:'#4a2c1a',hairS:'short',facial:'none',shirtC:'#3f7fbf',topS:'tee',pantsC:'#36405a',bottomS:'jeans',shoesC:'#2b1d14',shoesS:'sneakers',pres:'neutral',body:'average',face:'soft',eyes:'dot',brows:'thin',eyeC:'#2b1d14',nose:'default',mouth:'default',expr:'neutral',ears:'normal',hat:'none',glasses:'none',acc:'none',hairHi:'none'};
  function normalize(look={}) {
    const L={...fallback,...look};
    L.hairC=look.hairC||look.hair||fallback.hairC;L.hairS=look.hairS||look.style||'short';
    L.topS=look.topS||look.shirtS||(look.coat?'labcoat':look.suit?'suit':'tee');L.shirtC=look.coat?'#f2f2ee':look.suit?'#16161a':look.shirtC||look.shirt||fallback.shirtC;
    if(typeof L.face!=='string')L.face='soft';
    for(const field of ['skin','hairC','shirtC','pantsC','shoesC','eyeC','hairHi','hatC','capC','accC','topC2','botC2'])if(/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(L[field]||'')){let color=L[field].toLowerCase();if(color.length===4)color='#'+[...color.slice(1)].map(c=>c+c).join('');L[field]=color;}
    L.extras=[...(look.extras||[])];L.pierce=[...(look.pierce||[])];L.marks=[...(look.marks||[])];return L;
  }
  const fields=[...Object.keys(fallback),'short','hatC','capC','accC','topPat','topC2','botPat','botC2','emb','prop'];
  const key = look => {const L=normalize(look);return JSON.stringify([fields.map(k=>L[k]??null),L.extras,L.pierce,L.marks]);};
  const approvalKey = look => key({...look,expr:'neutral',prop:null});
  const canonical = new Map([...DATA.approved,...DATA.cast].map(p=>[approvalKey(p.look),p]));
  function authoredPerson(look){
    const person=canonical.get(approvalKey(look));if(person)return person;
    // drawKid adds short:true to the same approved child identity.
    const child=canonical.get(approvalKey({...look,short:look.short?undefined:true}));if(child?.kid)return child;
    return null;
  }
  const identityFields=['skin','hairC','hairS','facial','eyeC','eyes','brows','face','body','pres','short','nose','mouth','ears','hat','hatC','capC','glasses','acc','accC','hairHi'];
  const identityKey=look=>{const L=normalize(look);return JSON.stringify([identityFields.map(k=>L[k]??null),L.extras,L.pierce,L.marks]);};
  const identities=new Map();for(const p of [...DATA.approved,...DATA.cast])if(!identities.has(identityKey(p.look)))identities.set(identityKey(p.look),p);
  const traits = new Map(DATA.traits.map(t=>[key(t.look),t]));
  const isChild=L=>!!(traits.get(key(L))?.kid||identities.get(identityKey(L))?.kid);
  function pixels(id) {
    if(rawPixels.has(id))return rawPixels.get(id);
    const im=images.get(id);if(!im)throw new Error('Missing illustrated asset: '+id);
    const c=cv(im.width,im.height),g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
    const out={width:im.width,height:im.height,data:g.getImageData(0,0,im.width,im.height)};rawPixels.set(id,out);return out;
  }
  const material = (target,light,base=160) => {
    const ratio=light/base;
    return target.map(v=>Math.max(0,Math.min(255,ratio<=1.15?v*ratio:v*1.15+(255-v*1.15)*Math.min(.45,(ratio-1.15)*.8))));
  };
  function pattern(pat,x,y) {
    if(!pat||pat==='none')return false;
    if(pat==='stripe')return y%12<3;
    if(pat==='plaid')return x%14<3||y%12<3;
    if(pat==='dots')return Math.hypot((x+(Math.floor(y/12)%2)*6)%12-6,y%12-6)<2;
    if(pat==='floral')return Math.cos((x%17-8)*.65)+Math.cos((y%17-8)*.65)>1.05;
    if(pat==='sparkle')return x%16===8&&Math.abs(y%16-8)<3||y%16===8&&Math.abs(x%16-8)<3;
    if(pat==='split')return x>48;
    if(pat==='camo')return Math.sin(x*.35+y*.2)+Math.cos(y*.3-x*.17)>.75;
    if(pat==='tie')return Math.floor(Math.hypot(x-48,y-56)/5)%2===0;
    if(pat==='trim')return y%30<3;
    return false;
  }
  function paint(id,L,kind) {
    const palette=kind==='head'?[L.skin,L.hairC,L.hairHi]:kind==='face'?[L.skin]:kind==='facial'?[L.hairC]:kind==='hat'?[L.hatC,L.capC]:kind==='shoe'?[L.skin,L.shoesC]:[L.skin,L.shirtC,L.pantsC,L.topS,L.topPat,L.topC2,L.botPat,L.botC2];
    const signature=id+'|'+JSON.stringify(palette)+'|'+kind;if(colored.has(signature))return colored.get(signature);
    const source=pixels(id),out=cv(source.width,source.height),g=out.getContext('2d');
    const d=new ImageData(new Uint8ClampedArray(source.data.data),source.width,source.height),p=d.data;
    const skin=rgb(L.skin),hair=rgb(L.hairC),top=rgb(L.topS==='labcoat'?'#f2f2ee':L.shirtC),bot=rgb(L.pantsC),shoe=rgb(L.shoesC),hi=rgb(L.hairHi);
    const density=['top','bottom','shoe'].includes(kind)?source.width/96:1;
    let hatMask;const faceAlpha=kind==='head'?faceMask(id).bagseedAlpha:null;
    if(kind==='hat'&&!DATA.hatAssets?.includes(id)){
      const w=source.width,h=source.height,seed=new Uint8Array(w*h);hatMask=new Uint8Array(w*h);
      const straw=id.includes('/straw/')||id.includes('/sunhat/');
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,r=p[i],gg=p[i+1],b=p[i+2];if(p[i+3]>50&&y<95&&(straw?y<77&&r>gg&&gg>b*1.3:b>r*1.12&&b>gg*.95))seed[y*w+x]=1;}
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(seed[y*w+x])for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)hatMask[yy*w+xx]=1;}
    }
    for(let i=0;i<p.length;i+=4){if(p[i+3]<16){p[i+3]=0;continue;}
      const x=((i/4)%source.width)/density,y=Math.floor(i/4/source.width)/density,r=p[i],gg=p[i+1],b=p[i+2],l=lum(r,gg,b);
      const isSkin=kind==='head'?faceAlpha[i/4]>128&&r>gg+12&&gg>b+8&&l>55:kind==='top'||kind==='bottom'?bodySkinPixel(r,gg,b):kind==='shoe'?bodySkinPixel(r,gg,b)&&b>gg*.67&&(L.shoesS==='sandals'||y<98):skinPixel(r,gg,b);
      if(kind==='top'&&L.topS==='garden'&&x>32&&x<63&&y>48&&y<87&&r>gg&&gg>b*1.35&&r<gg*1.4)continue;
      let tone,base=160;
      if(kind==='head'||kind==='face'||kind==='facial'){
        if(kind==='head'&&faceAlpha[i/4]>128&&!isSkin){
          if(id.endsWith('/up')&&l<55){p[i]=p[i+1]=p[i+2]=Math.min(45,l);continue;}
          if(l<55||!(r>gg+8&&gg>b+6))continue;
          const color=material(skin,l,160);p[i]=color[0];p[i+1]=color[1];p[i+2]=color[2];continue;
        }
        if(isSkin){tone=skin;base=160;}else{tone=hair;base=52;}
        if(kind==='face'){
          if(l<55||!(r>gg+8&&gg>b+6))continue;
          tone=skin;base=160;
        }
        if(kind==='facial'){
          if(isSkin||y<82||x<48||x>148||l>160){p[i+3]=0;continue;}
          if(['mustache','pencil','handlebar'].includes(L.facial)&&(y<99||y>112)){p[i+3]=0;continue;}
          if(L.facial==='soul'&&(y<114||y>128||x<87||x>108)){p[i+3]=0;continue;}
          tone=hair;base=52;
        }
        if(kind==='head'&&!isSkin&&L.hairHi!=='none'&&l>65&&(x+y*.5)%24<5)tone=hi;
      }else if(kind==='hat'){
        const straw=id.includes('/straw/')||id.includes('/sunhat/');
        if(hatMask&&!hatMask[y*source.width+x]){p[i+3]=0;continue;}
        if(DATA.hatAssets?.includes(id)&&r>175&&gg>120&&b<110&&!straw)continue;
        tone=rgb(L.hatC||L.capC||(id.includes('/officer/')?'#2a3a5c':id.includes('/wizard/')?'#7d5bd6':straw?'#d9b46a':'#7d9cc8'));base=straw?165:110;
      }else{
        if(isSkin){tone=skin;base=160;}
        else if(kind==='shoe'){tone=shoe;base=62;if(l>190)continue;}
        else if(kind==='bottom'){tone=bot;base=70;if(pattern(L.botPat,x,y)){tone=rgb(L.botC2||'#ffffff');}}
        else{
          const upper=(b>r*1.1&&gg>r*1.05&&l>62)||y<75;
          tone=upper?top:bot;base=upper?115:70;
          if(L.topS==='overalls'&&y>60){tone=top;base=90;}
          if(L.topS==='pjs'&&y>75){tone=top;base=46;}
          if(pattern(upper?L.topPat:L.botPat,x,y))tone=rgb((upper?L.topC2:L.botC2)||'#ffffff');
          // Keep cream undershirts, white coats, brass buttons and ink contours.
          if(r>175&&gg>160&&b>125&&Math.abs(r-gg)<45)continue;
        }
      }
      const lightHair=kind==='head'&&!isSkin&&lum(...hair)>65;
      // Ink follows the chosen hair hue too. Retaining the source brown at the
      // outside of a pale haircut left a brunette band around the entire nape.
      if(l<30&&!isSkin&&!lightHair){p[i]=Math.min(r,32);p[i+1]=Math.min(gg,32);p[i+2]=Math.min(b,32);continue;}
      const mapped=material(tone,lightHair?Math.max(l,29):l,base);p[i]=mapped[0];p[i+1]=mapped[1];p[i+2]=mapped[2];
    }
    g.putImageData(d,0,0);if(colored.size>500)colored.clear();colored.set(signature,out);return out;
  }
  function faceMask(id) {
    if(faceMasks.has(id))return faceMasks.get(id);
    const raw=pixels(id),a=raw.data.data,out=cv(raw.width,raw.height),g=out.getContext('2d'),mask=g.createImageData(raw.width,raw.height);
    // Rear views have ears and a neck, rather than a face. A convex hull
    // between those patches wrongly classified the brown nape as facial ink.
    if(id.endsWith('/up')){
      const seed=new Uint8Array(raw.width*raw.height);
      for(let i=0;i<a.length;i+=4)if(a[i+3]>50&&a[i]>175&&a[i+1]>95&&a[i+2]>40&&a[i]>a[i+1]*1.15&&a[i+1]>a[i+2]+15)seed[i/4]=1;
      // The nape has saturated orange shadow pixels as well as lit skin.
      // Grow each local patch into that shading, without bridging the ears
      // across the entire haircut as the former convex hull did.
      for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(seed[y*raw.width+x])for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
        const xx=x+dx,yy=y+dy;if(xx<0||xx>=raw.width||yy<0||yy>=raw.height||dx*dx+dy*dy>10)continue;const i=(yy*raw.width+xx)*4;
        if(a[i+3]>50&&a[i]>a[i+1]+12&&a[i+1]>a[i+2]+8)mask.data[i+3]=255;
      }
      g.putImageData(mask,0,0);out.bagseedAlpha=new Uint8Array(raw.width*raw.height);for(let i=0;i<out.bagseedAlpha.length;i++)out.bagseedAlpha[i]=mask.data[i*4+3];faceMasks.set(id,out);return out;
    }
    const points=[];
    for(let y=0;y<160;y++){
      let left=192,right=-1;
      for(let x=0;x<192;x++){const i=(y*192+x)*4;if(a[i+3]>100&&a[i]>190&&a[i+1]>110&&a[i+2]>60&&a[i]>a[i+1]*1.15&&a[i]<a[i+1]*1.85&&a[i+1]>a[i+2]+15){left=Math.min(left,x);right=Math.max(right,x);}}
      if(right>=left){points.push([left,y],[right,y]);}
    }
    // Include eyes, shaded cheeks and the neck inside the face outline.
    // A brightness-only mask left holes that were recolored as hair.
    points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const half=values=>{const h=[];for(const p of values){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h;};
    const lo=half(points),hi=half([...points].reverse()),hull=[...lo.slice(0,-1),...hi.slice(0,-1)];
    if(hull.length){g.beginPath();g.moveTo(...hull[0]);for(const p of hull.slice(1))g.lineTo(...p);g.closePath();g.fillStyle='#fff';g.strokeStyle='#fff';g.lineWidth=4;g.fill();g.stroke();}
    const data=g.getImageData(0,0,raw.width,raw.height);mask.data.set(data.data);
    g.putImageData(mask,0,0);out.bagseedAlpha=new Uint8Array(raw.width*raw.height);for(let i=0;i<out.bagseedAlpha.length;i++)out.bagseedAlpha[i]=mask.data[i*4+3];faceMasks.set(id,out);return out;
  }
  function path(c,color,width,points,fill=false) {
    c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';if(fill){c.closePath();c.fillStyle=color;c.fill();}else c.stroke();
  }
  function legacyFaceDetails(c,L,dir,features=null) {
    if(dir==='up')return;
    c.save();if(dir==='left'){c.translate(192,0);c.scale(-1,1);}
    if(features){const eyes=features.eyes;const x=dir==='down'?(eyes[0][0]+eyes[1][0])/2:dir==='left'?192-eyes[0][0]:eyes[0][0],y=eyes.reduce((n,e)=>n+e[1],0)/eyes.length;const sx=dir==='down'?(eyes[1][0]-eyes[0][0])/32:1,sy=features.mouth?(features.mouth[1]-y)/29:.8;c.translate(x,y);c.scale(sx,sy);c.translate(dir==='down'?-94:-113,-79);}
    const side=dir!=='down',eyeY=79,mouthY=108,skin=L.skin,ink='#59372c';
    const eyes=side?[113]:[78,110];
    const eyeScale={dot:.94,round:1,wide:1.1,sleepy:.74,lashed:1,almond:.9,hooded:.8,monolid:.72,upturned:.95,downturned:.94,big:1.15,narrow:.68,starry:1.1,heavy:.78,lashed2:1.04}[L.eyes]||1;
    if(eyeScale!==1&&!(features&&L.eyes==='dot'))for(const x of eyes){const patch=cv(20,16),m=c.getTransform(),p=m.transformPoint({x:x-10,y:eyeY-8}),q=m.transformPoint({x:x+10,y:eyeY+8}),pg=patch.getContext('2d');if(m.a<0){pg.translate(20,0);pg.scale(-1,1);}pg.drawImage(c.canvas,Math.min(p.x,q.x),Math.min(p.y,q.y),Math.abs(q.x-p.x),Math.abs(q.y-p.y),0,0,20,16);path(c,skin,14,[x-8,eyeY,x+8,eyeY]);c.drawImage(patch,x-10,eyeY-8*eyeScale,20,16*eyeScale);}
    if(['upturned','downturned'].includes(L.eyes))for(const x of eyes)path(c,ink,1.3,[x-6,eyeY+(L.eyes==='upturned'?1:-1),x+6,eyeY+(L.eyes==='upturned'?-2:2)]);
    // Small expression adjustments retain the illustrated eye underneath.
    if(L.eyeC!=='#2b1d14')for(const x of eyes){c.fillStyle=L.eyeC;c.beginPath();c.ellipse(x+1,eyeY+2,2.4,3.2,0,0,7);c.fill();}
    const narrowed=['sleepy','hooded','monolid','narrow','heavy'].includes(L.eyes)||['sleepy','angry','determined','smug'].includes(L.expr);
    if(narrowed)for(const x of eyes){path(c,skin,5,[x-5,eyeY-4,x+5,eyeY-4]);path(c,ink,1.4,[x-5,eyeY-1,x+5,eyeY-1]);}
    if(['lashed','lashed2','upturned'].includes(L.eyes))for(const x of eyes)path(c,ink,L.eyes==='lashed2'?2:1.3,[x-5,eyeY-2,x-8,eyeY-5]);
    if(['wide','big','starry'].includes(L.eyes)||L.expr==='surprised')for(const x of eyes){c.fillStyle='#fff7e7';c.beginPath();c.ellipse(x-1,eyeY-1,1.4,2,0,0,7);c.fill();}
    if(L.brows!=='thin'){
      const widths={thick:2.8,bushy:4,feathered:3,none:0,dots:1.7,short:1.4};
      for(const x of eyes){if(L.brows==='none'){path(c,skin,5,[x-7,eyeY-12,x+7,eyeY-12]);continue;}
        const lift=({arched:-3,high:-5,raised:-4,furrowed:3,soft:-1,flat:1,straight:2})[L.brows]||0;
        const length=L.brows==='short'?3:L.brows==='soft'?5:6,offset=L.brows==='raised'?-3:0;
        path(c,L.hairC,widths[L.brows]||1.8,[x-length,eyeY-11+offset,x,eyeY-12+lift+offset,x+length,eyeY-10+offset]);
        if(['bushy','feathered'].includes(L.brows))for(let i=-4;i<=4;i+=2)path(c,L.hairC,.8,[x+i,eyeY-11,x+i+1,eyeY-15]);
        if(L.brows==='dots'){path(c,skin,2,[x-3,eyeY-12,x-2,eyeY-12]);path(c,skin,2,[x+2,eyeY-12,x+3,eyeY-12]);}
        if(L.brows==='slit')path(c,skin,1.6,[x+3,eyeY-15,x+1,eyeY-8]);
      }
    }
    if(L.nose!=='default'){
      const shapes={button:[0,1],dot:[0,0],long:[0,6],wide:[4,2],pointed:[3,4],round:[2,2],bridge:[0,-3],hook:[3,6],snub:[2,-1],flat:[4,0],tall:[0,7],small:[0,-1],soft:[1,2],none:[0,-2]};
      const [w,h]=shapes[L.nose]||[0,1],x=side?118:96;
      path(c,skin,6,[x-3,94,x+4,97]);if(L.nose!=='none')path(c,'#a56e50',1,[x,91,x+w,95+h,x-2,96+h]);
    }
    let mouth=L.mouth;if(['happy','grin','laugh','proud','silly'].includes(L.expr))mouth=({happy:'smile',grin:'teeth',laugh:'open',proud:'wide',silly:'tongue'})[L.expr];
    if(L.expr==='smug')mouth='smirk';
    if(L.expr==='wink'){const x=eyes[0];path(c,skin,10,[x-6,eyeY,x+6,eyeY]);path(c,ink,1.5,[x-6,eyeY,x,eyeY+2,x+6,eyeY]);}
    if(['sad','worried','angry'].includes(L.expr))mouth='frown';if(L.expr==='surprised')mouth='open';
    if(mouth!=='default'){
      const x=side?115:96;path(c,skin,6,[x-8,mouthY,x+8,mouthY]);
      const wide=mouth==='wide'?11:mouth==='small'?3:7;
      if(['open','teeth','gap','tongue'].includes(mouth)){c.fillStyle=mouth==='teeth'?'#fff5df':'#6b302b';c.beginPath();c.ellipse(x,mouthY,wide,3.5,0,0,7);c.fill();if(mouth==='gap')path(c,ink,1,[x,mouthY-2,x,mouthY+2]);if(mouth==='tongue')path(c,'#df8a91',3,[x,mouthY+2,x+3,mouthY+3]);}
      else if(mouth==='cupid')path(c,'#aa6964',1.6,[x-7,mouthY,x-2,mouthY-1,x,mouthY+1,x+2,mouthY-1,x+7,mouthY]);
      else path(c,mouth==='full'||mouth==='pout'?'#b56f69':ink,mouth==='full'?3:mouth==='pout'?2:1.2,[x-wide,mouthY,x,mouthY+(mouth==='frown'?-2:mouth==='thin'?0:mouth==='smirk'?-1:mouth==='pout'?1:3),x+wide,mouthY+(mouth==='lopsided'?2:0)]);
    }
    if(['shy','happy','laugh'].includes(L.expr)||L.extras.includes('blush')){c.globalAlpha=.18;c.fillStyle='#e4837c';for(const x of [68,122]){c.beginPath();c.ellipse(x,96,6,2,0,0,7);c.fill();}c.globalAlpha=1;}
    const marks=[...L.marks,...L.extras],gold='#e8bd57',silver='#d5dfe1';
    for(const mark of marks){const positions={moleL:[73,101],moleR:[119,101],moleLip:[103,105],moleChin:[94,120],moleEye:[114,91],temple:[121,75],birth:[72,101],star:[118,99],heart:[73,101]};
      if(mark.includes('freckles')||mark==='freckles')for(const [x,y]of [[69,94],[74,96],[78,93],[114,94],[119,97],[123,94]]){c.fillStyle='#9d644b';c.fillRect(x,y,1.4,1.4);}
      else if(mark==='scarBrow'||mark==='scarCheek'||mark==='scar')path(c,'#ebc6ad',1.5,mark==='scarBrow'?[115,65,112,74]:[67,95,74,104]);
      else if(mark==='vitiligo'){c.fillStyle='#e5b18d';c.beginPath();c.ellipse(116,97,4,6,.3,0,7);c.fill();}
      else if(mark==='dimples'){path(c,'#a16d54',1,[73,107,73,109]);path(c,'#a16d54',1,[119,107,119,109]);}
      else if(positions[mark]||mark==='mole'||mark==='pierce'){const [x,y]=positions[mark]||(mark==='mole'?[118,101]:[100,96]);c.fillStyle=mark==='pierce'?silver:mark==='star'?'#3f6fa8':mark==='heart'?'#bd577b':'#654230';c.beginPath();c.ellipse(x,y,mark==='birth'?3:1.4,mark==='birth'?4:1.4,0,0,7);c.fill();}
    }
    for(const piercing of L.pierce){const at={nose:[100,96],nosering:[99,98],septum:[96,99],browL:[73,68],browR:[118,68],lip:[103,111],labret:[96,115],earL:[58,98],earR:[133,98],hoops:[58,103],double:[58,97],industrial:[134,82],tragus:[62,92],dimple:[118,109],bridge:[96,79]}[piercing];if(!at)continue;
      c.strokeStyle=gold;c.fillStyle=silver;c.lineWidth=1.5;c.beginPath();c.ellipse(at[0],at[1],piercing==='hoops'?3:1.4,piercing==='hoops'?4:1.4,0,0,7);piercing==='hoops'||piercing.includes('ring')?c.stroke():c.fill();if(piercing==='double'){c.beginPath();c.ellipse(at[0],at[1]+4,1.3,1.3,0,0,7);c.fill();}}
    if(L.acc==='earring'||L.acc==='moon'){c.fillStyle=L.accC||gold;for(const x of side?[70]:[57,135]){c.beginPath();c.ellipse(x,100,1.8,3,0,0,7);c.fill();}}
    if(L._blink){
      // Close the illustrated eyes in their own registered face coordinates.
      // Sampling the adjacent cheek keeps the eyelid's skin shading intact.
      for(const x of eyes){const m=c.getTransform(),samples=[];
        for(const dx of [-5,0,5]){const at=m.transformPoint({x:x+dx,y:eyeY+13}),p=c.getImageData(Math.round(at.x),Math.round(at.y),1,1).data;if(p[3]>180&&p[0]>p[1]*1.1&&p[1]>p[2])samples.push([...p]);}
        const color=samples.length?samples.sort((a,b)=>lum(...b.slice(0,3))-lum(...a.slice(0,3)))[Math.floor(samples.length/2)]:rgb(L.skin);
        c.fillStyle=`rgb(${color[0]},${color[1]},${color[2]})`;c.beginPath();c.ellipse(x,eyeY,10,9,0,0,Math.PI*2);c.fill();path(c,ink,1.5,[x-6,eyeY+1,x,eyeY+3,x+6,eyeY+1]);
      }
    }
    if(L.glasses!=='none'){
      c.strokeStyle='#4d332a';c.lineWidth=2.7;const frames=side?[110]:[75,113];
      for(const x of frames){c.beginPath();if(L.glasses==='round')c.ellipse(x,80,12,11,0,0,7);else c.roundRect(x-13,70,26,20,4);if(L.glasses==='shades'){c.fillStyle='#30323f';c.fill();}c.stroke();}path(c,'#4d332a',2.4,side?[124,78,139,78]:[87,78,101,78]);
    }
    if(L.ears!=='normal'){
      for(const x of side?[70]:[58,135]){
        if(L.ears==='hidden'){path(c,L.hairC,7,[x,86,x,99]);continue;}
        const large=['large','round','lobed'].includes(L.ears),pointed=['pointed','elf'].includes(L.ears);c.fillStyle=skin;c.strokeStyle='#a36d51';c.lineWidth=1;
        c.beginPath();if(pointed){c.moveTo(x,83);c.lineTo(x+(x<96?-9:9),L.ears==='elf'?72:78);c.lineTo(x,99);}else c.ellipse(x,91,large?5:2,L.ears==='lobed'?9:large?7:4,0,0,7);c.fill();c.stroke();if(L.ears==='cuff')path(c,silver,2,[x-2,84,x+2,84]);
      }
    }
    c.restore();
  }
  __BAGSEED_DETAIL_RENDERER__
  // Facial atlases contain complete bald studies. Extract only the requested
  // hair, then attach its upper lip to the replacement head's own landmarks.
  // A complete lower face must never be pasted over the character's face.
  const facialLayers=new Map(),facialLandmarks=new Map();
  function facialSource(style,dir) {
    // The generated atlas omitted an anchor row. Its final rows are scruff,
    // Van Dyke and clean shaven; retain those semantics rather than the old
    // off-by-one registration labels. An anchor uses the narrow goatee study.
    const sourceStyle={anchor:'circle',scruff:'anchor',vandyke:'scruff'}[style]||style;
    const id=`facial/${sourceStyle}/${dir}`,raw=pixels(id),a=raw.data.data;
    if(!facialLandmarks.has(id)){
      const whites=[];for(let y=55;y<94;y++)for(let x=60;x<135;x++){const i=(y*raw.width+x)*4;if(a[i+3]>160&&a[i]>195&&a[i+1]>180&&a[i+2]>145&&a[i]-a[i+2]<70)whites.push([x,y]);}
      const eyeY=whites.length?whites.reduce((n,p)=>n+p[1],0)/whites.length:77;
      const eyeX=whites.length?whites.reduce((n,p)=>n+p[0],0)/whites.length:dir==='right'?116:dir==='left'?76:96;
      facialLandmarks.set(id,{mouthX:dir==='down'?96:eyeX+(dir==='right'?10:-10),mouthY:eyeY+26});
    }
    return {id,raw,...facialLandmarks.get(id)};
  }
  function facialHair(c,L,dir,features) {
    if(L.facial==='none'||dir==='up')return;
    const f=features||detailGeometry(L,dir),[mouthX,mouthY]=f.mouth,side=dir!=='down',sign=dir==='left'?-1:1;
    const result=cv(192,HEAD_HEIGHT),r=result.getContext('2d');
    if(['stubble','scruff'].includes(L.facial)){
      // Faint source stubble was mostly skin shading plus the neck outline.
      // Fine deterministic hairs follow the current jaw instead of recoloring
      // those anatomical lines into a pale chin strap.
      const scruff=L.facial==='scruff',base=detailBase(L,dir).getContext('2d').getImageData(0,0,192,HEAD_HEIGHT).data;
      const left=side?mouthX+Math.min(-30*sign,5*sign):mouthX-34,right=side?mouthX+Math.max(-30*sign,5*sign):mouthX+34;
      for(let y=Math.floor(mouthY-8);y<mouthY+11;y++)for(let x=Math.floor(left);x<right;x++){
        const dx=side?(x-mouthX)*sign:x-mouthX,dy=y-mouthY,edge=side?Math.hypot((dx+12)/22,(dy-2)/12):Math.hypot(dx/33,(dy-1)/12),seed=((x*73856093)^(y*19349663))>>>0,n=(y*192+x)*4;
        const opening=side?dx>-10&&dy<4:Math.abs(dx)<12&&dy<4;
        if(x<0||x>=192||base[n+3]<220||opening||edge>.98||seed%101>(scruff?40:22))continue;
        r.globalAlpha=(scruff?.45:.28)*smooth(1,.72,edge);r.strokeStyle=L.hairC;r.lineWidth=scruff?.95:.7;r.lineCap='round';r.beginPath();r.moveTo(x,y);r.lineTo(x+(seed%3-1)*.35,y+(scruff?1.3:.7));r.stroke();
      }r.globalAlpha=1;
    }else{
      const src=facialSource(L.facial,dir),signature=L.facial+'|'+dir+'|'+L.hairC;let layer=facialLayers.get(signature);
      if(!layer){
        const {width:w,height:h,data}=src.raw,a=data.data,out=cv(w,h),g=out.getContext('2d'),d=g.createImageData(w,h),target=rgb(L.hairC),matte=new Float32Array(w*h),distance=new Float32Array(w*h).fill(99),queue=[];
        const moustache=['mustache','pencil','handlebar'].includes(L.facial),my=src.mouthY,origin=src.mouthX;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          const i=(y*w+x)*4,dx=x-origin,dy=y-my;
          let region=smooth(-22,-15,dy);
          if(moustache)region*=smooth(4,0,dy)*smooth(1.15,.95,Math.hypot(dx/(side?25:L.facial==='handlebar'?43:34),(dy+4)/11));
          else if(L.facial==='soul')region*=smooth(1.15,.9,Math.hypot(dx/(side?8:10),(dy-10)/10));
          else if(['goatee','vandyke','anchor','circle'].includes(L.facial)){
            const top=smooth(1.15,.95,Math.hypot(dx/(side?22:30),(dy+4)/9));
            const chin=smooth(1.15,.95,Math.hypot(dx/(side?16:L.facial==='vandyke'?18:23),(dy-15)/18));region*=Math.max(top,chin);
          }else if(L.facial==='mutton'&&dy>3)region*=smooth(12,19,Math.abs(dx));
          // Keep the original mouth opening transparent, including its ink.
          region*=smooth(1,2.1,Math.hypot(dx/(side?8:11),(dy-1)/2.5));
          matte[y*w+x]=a[i+3]/255*smooth(180,125,a[i])*smooth(126,83,a[i+1])*smooth(102,66,a[i+2])*region;
        }
        // A moustache's authored pieces must connect to the upper lip. Ear
        // folds and cheek outlines are separate components, even when dark.
        if(moustache){const seen=new Uint8Array(w*h);for(let start=0;start<matte.length;start++)if(matte[start]>.04&&!seen[start]){const part=[start];seen[start]=1;let lip=false;for(let at=0;at<part.length;at++){const p=part[at],x=p%w,y=Math.floor(p/w);if(Math.abs(x-origin)<18&&y>my-12&&y<my+2)lip=true;for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const q=yy*w+xx;if(matte[q]>.04&&!seen[q]){seen[q]=1;part.push(q);}}}if(!lip)for(const p of part)matte[p]=0;}}
        // Seed actual hair masses. Single-pixel ear, nose and neck contours
        // cannot seed a beard. Nearby strand tips retain their natural alpha.
        const need=moustache?4:7,core=new Uint8Array(w*h);
        for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)if(matte[y*w+x]>.55){let count=0;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)if(matte[yy*w+xx]>.55)count++;if(count>=need)core[y*w+x]=1;}
        const minimum=L.facial==='pencil'?6:L.facial==='chinstrap'?8:moustache?12:25;
        for(let start=0;start<core.length;start++)if(core[start]===1){const component=[start];core[start]=2;for(let at=0;at<component.length;at++){const p=component[at],x=p%w,y=Math.floor(p/w);for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const n=yy*w+xx;if(core[n]===1){core[n]=2;component.push(n);}}}if(component.length>=minimum)for(const p of component){distance[p]=0;queue.push(p);}}
        for(let at=0;at<queue.length;at++){const p=queue[at],x=p%w,y=Math.floor(p/w),next=distance[p]+1;if(next>4)continue;for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const q=yy*w+xx;if(matte[q]>.015&&distance[q]>next){distance[q]=next;queue.push(q);}}}
        for(let at=0;at<matte.length;at++)if(distance[at]<=4){const i=at*4,l=lum(a[i],a[i+1],a[i+2]),color=material(target,l,65),alpha=matte[at]*smooth(5,2,distance[at]);for(let k=0;k<3;k++)d.data[i+k]=color[k];d.data[i+3]=Math.round(alpha*255);}
        g.putImageData(d,0,0);layer=out;if(facialLayers.size>100)facialLayers.clear();facialLayers.set(signature,layer);
      }
      r.save();r.translate(mouthX,mouthY);r.scale(side?1:1.04,.69);r.drawImage(layer,-src.mouthX,-src.mouthY);r.restore();
    }
    // Protect the larger eyes with a curved, feathered clearance. There is no
    // rectangular cheek window and no skin plate painted over beard strands.
    const image=r.getImageData(0,0,192,HEAD_HEIGHT),a=image.data;
    for(let y=130;y<180;y++)for(let x=35;x<158;x++){const n=(y*192+x)*4;if(!a[n+3])continue;for(const [ex,ey]of f.eyes){const d=Math.hypot((x-ex)/14,(y-ey)/12);a[n+3]*=smooth(1,1.18,d);}}
    r.putImageData(image,0,0);c.drawImage(result,0,0);
  }
  function baldBase(L,dir){
    const signature='bald|'+dir+'|'+L.skin+'|'+L.hairC;if(colored.has(signature))return colored.get(signature);
    const raw=pixels('base/'+dir),out=cv(192,HEAD_HEIGHT),g=out.getContext('2d'),d=new ImageData(new Uint8ClampedArray(raw.data.data),192,HEAD_HEIGHT),a=d.data,skin=rgb(L.skin),hair=rgb(L.hairC),f=DATA.headFeatures['base/'+dir];
    for(let n=0;n<a.length;n+=4){if(a[n+3]<10){a[n+3]=0;continue;}const x=n/4%192,y=Math.floor(n/4/192),l=lum(a[n],a[n+1],a[n+2]);
      const eye=(f.eyes||[]).some(([ex,ey])=>((x-ex)/12)**2+((y-ey)/11)**2<1),brow=(f.eyes||[]).some(([ex,ey])=>Math.abs(x-ex)<13&&Math.abs(y-(ey-20))<8);
      if(eye&&(l<150||a[n]-a[n+2]<40))continue;
      const tone=brow&&l<125?hair:skin,base=brow&&l<125?65:175,color=material(tone,l,base);
      a[n]=color[0];a[n+1]=color[1];a[n+2]=color[2];
    }
    g.putImageData(d,0,0);colored.set(signature,out);return out;
  }
  const scalpMasks=new Map();
  function scalpMask(dir){
    if(scalpMasks.has(dir))return scalpMasks.get(dir);
    const out=cv(192,HEAD_HEIGHT),g=out.getContext('2d');g.drawImage(images.get('base/'+dir),0,0);
    // A close-shaved material belongs to the scalp, never the ear or neck.
    // Follow the painted ear contours with feathered edges; loose strands
    // and fringes use their original alpha and do not pass through this mask.
    g.save();g.globalCompositeOperation='destination-out';g.filter='blur(0.65px)';g.fillStyle='#000';
    for(const e of DATA.detailLandmarks.views[dir].ears){
      if(e.inset){g.beginPath();g.ellipse(e.center[0],e.center[1],10,14.5,0,0,Math.PI*2);}
      else earPath(g,e);
      g.fill();
    }
    g.restore();const a=g.getImageData(0,0,192,HEAD_HEIGHT).data;
    for(let y=175;y<HEAD_HEIGHT;y++)for(let x=0;x<192;x++)a[(y*192+x)*4+3]*=1-smooth(175,186,y);
    scalpMasks.set(dir,a);return a;
  }
  __BAGSEED_HAIR_BATCH_01__
  __BAGSEED_HAIR_FIT_REST__
  const hairToneFields=new WeakMap(),hairContourMasks=new WeakMap(),hairLineMasks=new WeakMap();
  const hairInkProfiles={buzz:[0,0],hightop:[6,6],afro:[9,16],bigafro:[9,16],twistout:[9,16],puff:[9,14],puffs:[9,14],bantu:[8,10],boxbraids:[8,12],cornrows:[8,12]};
  const looseHairShadows=new Set(['long','wavy','lob','layered','bluntlong','beachwaves','longcurls','locs','boxbraids','longtwists']);
  function hairLinework(raw,style){
    if(hairLineMasks.has(raw.data))return hairLineMasks.get(raw.data);
    const [contrast,minStroke]=hairInkProfiles[style]||[13,18];
    if(!minStroke){const empty=new Uint8Array(192*HEAD_HEIGHT);hairLineMasks.set(raw.data,empty);return empty;}
    // Recover the original painted part/lock/curl lines before recoloring.
    // Compare with a small local light field, not a global darkness cutoff:
    // a shaded lock is still hair, while its darker crease is ink.
    const w=192,h=HEAD_HEIGHT,a=raw.data.data,kernel=[1,4,7,10,12,10,7,4,1],light=new Float32Array(w*h),weight=new Float32Array(w*h),candidate=new Uint8Array(w*h),mask=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      let sum=0,alpha=0;for(let dx=-4;dx<=4;dx++){const xx=x+dx;if(xx<0||xx>=w)continue;const n=(y*w+xx)*4,k=kernel[dx+4]*a[n+3];sum+=a[n]*k;alpha+=k;}
      light[y*w+x]=sum;weight[y*w+x]=alpha;
    }
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const p=y*w+x,n=p*4;if(a[n+3]<180||a[n]>160)continue;
      let sum=0,alpha=0;for(let dy=-4;dy<=4;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;const q=yy*w+x,k=kernel[dy+4];sum+=light[q]*k;alpha+=weight[q]*k;}
      if(alpha&&sum/alpha-a[n]>=contrast)candidate[p]=1;
    }
    // Discard isolated texture specks; retain connected authored strokes.
    const seen=new Uint8Array(w*h);
    for(let p=0;p<candidate.length;p++)if(candidate[p]&&!seen[p]){
      const component=[p];seen[p]=1;
      for(let i=0;i<component.length;i++){const q=component[i],x=q%w,y=Math.floor(q/w);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const next=yy*w+xx;if(candidate[next]&&!seen[next]){seen[next]=1;component.push(next);}}
      }
      if(component.length>=minStroke)for(const q of component)mask[q]=1;
    }
    hairLineMasks.set(raw.data,mask);return mask;
  }
  function hairContour(raw){
    if(hairContourMasks.has(raw.data))return hairContourMasks.get(raw.data);
    const a=raw.data.data,mask=new Uint8Array(192*HEAD_HEIGHT),neighbors=[[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,-1],[-1,1],[1,1]];
    for(let y=0;y<HEAD_HEIGHT;y++)for(let x=0;x<192;x++){
      if(a[(y*192+x)*4+3]<10)continue;
      for(const[dx,dy]of neighbors){const xx=x+dx,yy=y+dy;
        if(xx<0||xx>=192||yy<0||yy>=HEAD_HEIGHT||a[(yy*192+xx)*4+3]<80){mask[y*192+x]=1;break;}
      }
    }
    hairContourMasks.set(raw.data,mask);return mask;
  }
  function hairToneField(raw){
    if(hairToneFields.has(raw.data))return hairToneFields.get(raw.data);
    // Read broad light masses rather than individual painted strands. Keep the
    // original alpha/silhouette: this changes material, never scalp fitting.
    const source=cv(192,HEAD_HEIGHT);source.getContext('2d').putImageData(raw.data,0,0);
    const small=cv(12,20),s=small.getContext('2d');s.imageSmoothingQuality='high';s.drawImage(source,0,0,12,20);
    const broad=cv(192,HEAD_HEIGHT),b=broad.getContext('2d');b.imageSmoothingQuality='high';b.drawImage(small,0,0,192,HEAD_HEIGHT);
    const tones=b.getImageData(0,0,192,HEAD_HEIGHT).data,values=[];
    for(let n=0;n<tones.length;n+=4)if(raw.data.data[n+3]>220)values.push(tones[n]);
    values.sort((a,b)=>a-b);const lo=values[Math.floor(values.length*.1)]||0,hi=values[Math.floor(values.length*.9)]||255;
    for(let n=0;n<tones.length;n+=4){
      const x=n/4%192,y=Math.floor(n/4/192),volume=Math.max(0,1-Math.hypot((x-83)/90,(y-92)/120));
      tones[n]=hi-lo>35?Math.max(60,Math.min(190,75+(tones[n]-lo)/(hi-lo)*110)):80+volume*110;
    }
    hairToneFields.set(raw.data,tones);return tones;
  }
  function hairLayer(L,dir){
    const signature='wig|'+dir+'|'+L.hairS+'|'+L.hairC+'|'+L.hairHi+'|'+L.hat+'|'+L.ears;if(colored.has(signature))return colored.get(signature);
    const closeFade=['fade','hightop','flattop','quiff','pomp','fauxhawk','curlytop'].includes(L.hairS);
    const batchRear=dir==='up'&&(fittedHairCuts.has(L.hairS)||remainingClosedCuts.has(L.hairS)),raw=fittedHairCuts.has(L.hairS)?batchHairSource(L,dir):remainingHairFits[L.hairS]?remainingHairSource(L,dir):pixels(`wig/${L.hairS}/${dir}`),out=cv(192,HEAD_HEIGHT),g=out.getContext('2d'),d=new ImageData(new Uint8ClampedArray(raw.data.data),192,HEAD_HEIGHT),a=d.data,target=rgb(L.hairC),anatomy=L.hairS==='buzz'||closeFade?batchScalpMask(L,dir):null;
    const broad=hairToneField(raw),contour=hairContour(raw),linework=hairLinework(raw,L.hairS),highlight=L.hairHi!=='none'?rgb(L.hairHi):target;
    const shaved=L.hairS==='mohawk'?scalpMask(dir):null;
    for(let n=0;n<a.length;n+=4){if(a[n+3]<10){a[n+3]=0;continue;}const x=n/4%192,y=Math.floor(n/4/192),l=a[n],light=broad[n],factor=L.hairS==='buzz'?1:light<100?(looseHairShadows.has(L.hairS)?.74:.56):light<155?1:1.28,tone=light>=155&&L.hairS!=='buzz'?highlight:target;
      // Three cel colors plus the source painting's warm outline/interior ink.
      // Ink the inside of the existing silhouette, including the hairline.
      // Grayscale source edges are often light, so darkness cannot identify
      // their contour. Keep alpha intact: no halo or expanded haircut.
      // Interior strands shade the selected color; only the silhouette uses
      // dark brown ink. In particular, white hair must remain predominantly
      // white rather than inheriting dense brown source hatching.
      const pale=lum(...target)>200;
      const strand=pale?.84:looseHairShadows.has(L.hairS)?.74:.56;
      for(let k=0;k<3;k++)a[n+k]=contour[n/4]?[58,38,28][k]:Math.min(255,Math.round(linework[n/4]?target[k]*strand:tone[k]*(pale?Math.max(.84,factor):factor)));
      if(shaved&&y>125)a[n+3]*=shaved[n+3]<10?0:shaved[n+3]/255;
      // A buzzcut follows the bald skull, with no projecting fringe. Fade
      // density is alpha, so pale stubble reveals skin rather than a white cap.
      if(L.hairS==='buzz')a[n+3]*=.48*anatomy[n+3]/255;
      if(closeFade){
        // The fade reaches skin at the upper ear, not below the lobe. Its
        // source-painted short stubble follows skull anatomy while the top
        // keeps every strand and its intended volume.
        const temple=dir==='up'?1:dir==='right'?1-smooth(95,112,x):dir==='left'?smooth(80,97,x):Math.max(1-smooth(62,77,x),smooth(117,132,x));
        const fade=smooth(128,172,y)*temple,density=Math.max(.10,Math.min(.35,1-(l-65)/125));
        a[n+3]*=(1-fade+fade*density)*(1-fade+fade*anatomy[n+3]/255);
      }
    }
    if(L.hat!=='none'){
      const name=L.hat==='hood'?'beanie':L.hat,id=`headwear/${name}/${dir}`,hat=pixels(id).data.data,brim=DATA.hatRegistration[id].brimY;
      // Keep hair only inside the worn hat's outer crown or below its brim.
      // Filling the crown span preserves correctly colored hair through a cap
      // adjustment opening. The bald head itself is never erased.
      for(let y=0;y<brim-3;y++){let left=192,right=-1;for(let x=0;x<192;x++)if(hat[(y*192+x)*4+3]>60){left=Math.min(left,x);right=Math.max(right,x);}
        for(let x=0;x<192;x++)if(x<left||x>right)a[(y*192+x)*4+3]=0;
      }
    }
    g.putImageData(d,0,0);if(colored.size>700)colored.clear();colored.set(signature,out);return out;
  }
  function head(L,dir,blink=false,bodyJoined=false) {
    const signature=identityKey(L)+'|'+L.expr+'|'+dir+'|'+blink+'|'+bodyJoined;if(heads.has(signature))return heads.get(signature);
    const coveredEars=earCoveringHairCuts.has(L.hairS),anatomy=coveredEars?{...withoutEarJewelry(L),ears:'hidden'}:L;
    const out=cv(192,HEAD_HEIGHT),g=out.getContext('2d'),details=detailGeometry(anatomy,dir);g.drawImage(detailBase(anatomy,dir),0,0);
    let neckBridge;
    if(bodyJoined){
      // Garments already contain the neck and exposed chest. Remove only the
      // painted head's neck, following the underside of the jaw/skull. Hair,
      // beards and ear shapes are composed afterward and are never cropped.
      const cut=dir==='down'?'M73 181Q96 190 121 181L125 208H70Z':dir==='up'?'M70 178Q96 194 123 178L123 208H70Z':'M70 178Q88 185 110 185L116 208H70Z';
      const mask=cv(192,HEAD_HEIGHT),m=mask.getContext('2d');if(dir==='left'){m.translate(193,0);m.scale(-1,1);}m.fill(new Path2D(cut));
      neckBridge=cv(192,HEAD_HEIGHT);const n=neckBridge.getContext('2d');n.drawImage(out,0,0);n.globalCompositeOperation='destination-in';n.drawImage(mask,0,0);
      // The detached head painting ends in an outlined neck stump. Continue
      // clean upper-neck material instead of exposing that horizontal rim.
      const clean=cv(192,HEAD_HEIGHT),c=clean.getContext('2d');c.drawImage(neckBridge,0,0,192,195,0,0,192,195);c.drawImage(neckBridge,0,192,192,3,0,195,192,13);neckBridge=clean;
      g.save();g.globalCompositeOperation='destination-out';g.drawImage(mask,0,0);g.restore();
    }
    const faceShape=L.face,shape=faceFits[faceShape]||[1,1];
    faceDetails(g,{...(L.hairS!=='bald'?withoutEarJewelry(anatomy):anatomy),_blink:blink},dir,details);
    facialHair(g,L,dir,details);
    g.drawImage(hairLayer(L,dir),0,0);
    if(L.hairS!=='bald'&&!coveredEars)foregroundEars(g,L,dir,details);
    // Hair's original transparent opening reveals the face. Never repaint a
    // forehead/face plate over the strands: that sheared every fringe flat.
    if(L.acc==='headphones')detailHeadphones(g,L,dir);
    if(L.hat!=='none')g.drawImage(paint(`headwear/${L.hat==='hood'?'beanie':L.hat}/${dir}`,L,'hat'),0,0);
    if(faceShape!=='soft'){
      // Each face shape gets a fitted head variant around the same neck root.
      // Its anatomy, ear openings and hair roots share this transform. Never
      // derive face scale from the wig's outer bounds: changing hair used to
      // shrink the face, especially on wide heads and long/voluminous cuts.
      const base=cv(192,HEAD_HEIGHT);base.getContext('2d').drawImage(out,0,0);
      const [sx,sy]=shape;
      g.clearRect(0,0,192,HEAD_HEIGHT);g.save();g.translate(96,HEAD_NECK);g.scale(sx,sy);g.drawImage(base,-96,-HEAD_NECK);g.restore();
      if(neckBridge){const fitted=cv(192,HEAD_HEIGHT),n=fitted.getContext('2d');n.translate(96,HEAD_NECK);n.scale(sx,sy);n.drawImage(neckBridge,-96,-HEAD_NECK);neckBridge=fitted;}
    }
    out.bagseedFeatures=transformedDetails(L,dir);
    out.bagseedNeckBridge=neckBridge;
    out.bagseedEyes=out.bagseedFeatures.eyes;
    if(heads.size>200)heads.clear();heads.set(signature,out);return out;
  }
  const neckRegistrations=new Map();
  const wardrobeFullSuit=L=>['overalls','pjs'].includes(L.topS);
  function paintedNeck(source,expected,density=3,dir='down',style=''){
    const w=source.width,h=source.height,a=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,[cx,cy]=expected;
    const cloth=new Uint8Array(w*h),occlusion=cv(w,h),mask=occlusion.getContext('2d').createImageData(w,h);
    for(let n=0;n<a.length;n+=4){const r=a[n],g=a[n+1],b=a[n+2],skin=r>g*1.2&&g>b*1.15&&r-g>25;if(a[n+3]>30&&!skin)cloth[n/4]=1;}
    for(let y=Math.max(0,Math.floor((cy-20)*density));y<Math.min(h,(cy+20)*density);y++)for(let x=Math.max(0,Math.floor((cx-20)*density));x<Math.min(w,(cx+20)*density);x++){
      let covered=false;for(let dy=-2;dy<=2&&!covered;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&cloth[yy*w+xx]){covered=true;break;}}
      if(covered)mask.data[(y*w+x)*4+3]=255;
    }
    occlusion.getContext('2d').putImageData(mask,0,0);
    const skin=n=>a[n+3]>160&&bodySkinPixel(a[n],a[n+1],a[n+2]);let top=null,collar=null;
    for(let y=Math.max(0,Math.floor((cy-16)*density));y<Math.min(h,(cy+8)*density)&&top===null;y++){
      let count=0;for(let x=Math.floor((cx-4)*density);x<Math.ceil((cx+4)*density);x++)if(skin((y*w+x)*4))count++;
      if(count>=density*2)top=y/density;
    }
    if(top===null)top=cy-5;
    if(cy>60){
      // Walking cut-neck caps can be black or cream. Their physical top is
      // stable across materials; skin-color classification is not.
      for(let y=Math.max(0,Math.floor((cy-16)*density));y<Math.min(h,(cy+4)*density);y++){
        let count=0;for(let x=Math.floor((cx-3)*density);x<Math.ceil((cx+3)*density);x++)if(a[(y*w+x)*4+3]>160)count++;
        if(count>=density*3){top=y/density;break;}
      }
    }
    for(let y=Math.ceil((top+1)*density);y<Math.min(h,(cy+12)*density);y++){
      let count=0;for(let x=Math.floor((cx-1)*density);x<Math.ceil((cx+1)*density);x++){const n=(y*w+x)*4,r=a[n],g=a[n+1],b=a[n+2],fabric=(b>=r*.95&&g>=r*.95&&lum(r,g,b)>12)||(r>175&&g>160&&b>125&&Math.abs(r-g)<45);if(a[n+3]>160&&!skin(n)&&fabric)count++;}
      if(count>=density*1.5){collar=y/density;break;}
    }
    collar=collar??top+5;
    const centres=[],capWidths=[];
    // The cut cap may be black, cream or skin. Its alpha contour is a more
    // reliable centre than the few surviving warm pixels on one shaded edge.
    for(let y=Math.floor((top+1)*density);y<Math.ceil((top+3)*density);y++){
      let left=w,right=-1;for(let x=Math.max(0,Math.floor((cx-10)*density));x<Math.min(w,(cx+10)*density);x++)if(a[(y*w+x)*4+3]>160){left=Math.min(left,x);right=Math.max(right,x);}
      if(right>=left&&(right-left+1)/density<=14){centres.push((left+right+1)/(2*density));capWidths.push((right-left+1)/density);}
    }
    centres.sort((a,b)=>a-b);const neckX=centres.length?centres[Math.floor(centres.length/2)]:cx;
    // Source collars include a few blue antialias/placeholder pixels inside
    // the bare neck. Use a continuous anatomical aperture there, preserving
    // the actual lower collar edge and the surrounding hood fabric.
    const aperture=occlusion.getContext('2d');aperture.save();aperture.scale(density,density);aperture.globalCompositeOperation='destination-out';
    // Follow the taper of the painted opening, rather than erasing a skin
    // rectangle into the shirt. The central cut cap is a placeholder, not ink.
    aperture.beginPath();aperture.moveTo(neckX-3.5,top-1);aperture.lineTo(neckX+3.5,top-1);aperture.lineTo(neckX+4,collar-.3);
    if(style==='hoodie'&&dir==='down'){
      // The original cut cap continues into a cream V-shaped placeholder.
      // Follow that inner opening to its point without covering hood fabric
      // or the drawstrings on either side with a rectangular skin patch.
      aperture.quadraticCurveTo(neckX+2,collar+2,neckX,collar+3);aperture.quadraticCurveTo(neckX-2,collar+2,neckX-4,collar-.3);
    }else aperture.quadraticCurveTo(neckX,collar+1,neckX-4,collar-.3);
    aperture.closePath();aperture.fill();
    aperture.restore();
    // A tank's deeper neckline must expose chest, not lower the entire head.
    // Measure the painted collar, not a guessed offset from the cut neck cap.
    // Deep tank necklines expose chest below the anatomical shoulder root.
    const rootY=style==='tank'||style==='crop'?Math.min(collar,top+7):collar;
    const spanAt=y=>{let left=w,right=-1;for(let x=Math.max(0,Math.floor((cx-24)*density));x<Math.min(w,(cx+24)*density);x++)if(a[(y*w+x)*4+3]>160){left=Math.min(left,x);right=Math.max(right,x);}return right>left?(right-left+1)/density:0;};
    capWidths.sort((a,b)=>a-b);const threshold=Math.max(14,(capWidths[Math.floor(capWidths.length/2)]||9)*1.8);
    let shoulderY=cy+5;
    // Detect where the narrow neck cap actually widens into the shoulders.
    // Rig neck y is inferred and can sit well inside a hoodie, so adding a
    // fixed offset to it measured the chest and enlarged walking figures.
    for(let y=Math.ceil((top+1)*density);y<Math.min(h,(cy+14)*density);y++)if(spanAt(y)>=threshold){shoulderY=y/density;break;}
    const rows=[];
    for(let y=Math.floor((shoulderY+3)*density);y<=Math.ceil((shoulderY+7)*density)&&y<h;y++){
      let left=w,right=-1;for(let x=Math.max(0,Math.floor((cx-24)*density));x<Math.min(w,(cx+24)*density);x++)if(a[(y*w+x)*4+3]>160){left=Math.min(left,x);right=Math.max(right,x);}
      if(right>left)rows.push((right-left+1)/density);
    }
    rows.sort((a,b)=>a-b);
    return {root:[neckX,rootY],opening:Math.max(collar,rootY+3),top,occlusion,shoulderWidth:rows[Math.floor(rows.length/2)]||24,shoulderY};
  }
  // All poses attach the same fitted jaw to the body's own collar. The head
  // never inherits a garment's vertical distortion or a direction-specific
  // magic offset. These values are reference-canvas pixels (world scale /3).
  const VISIBLE_NECK=5;
  function headPlacement(L,dir,collar,headScale=1){
    const fit=faceFits[L.face]||[1,1],joinY=HEAD_NECK+(HEAD_JOIN-HEAD_NECK)*fit[1];
    const localX=96+((dir==='right'?90:dir==='left'?103:96)-96)*fit[0];
    const jaw=[collar[0],collar[1]-VISIBLE_NECK*headScale];
    return {origin:[jaw[0]-localX/3*headScale,jaw[1]-joinY/3*headScale],jaw,collar,neckLength:VISIBLE_NECK*headScale,headScale};
  }
  function neckBacking(g,H,L,dir,hx,hy,root,opening,headScale=1){
    // Fill the garment's transparent neck opening behind its collar. The
    // garment owns its neckline; no skin rectangle is painted over clothing.
    const fit=faceFits[L.face]||[1,1],join=HEAD_NECK+(HEAD_JOIN-HEAD_NECK)*fit[1],localX=96+((dir==='right'?90:dir==='left'?103:96)-96)*fit[0];
    const cx=hx+localX/3*headScale,y=hy+join/3*headScale;
    if(opening>y){g.fillStyle=L.skin;g.beginPath();g.moveTo(cx-3.3*headScale,y-1);g.lineTo(cx+3.3*headScale,y-1);g.lineTo(cx+4.5*headScale,opening+1);g.quadraticCurveTo(cx,opening+2,cx-4.5*headScale,opening+1);g.closePath();g.fill();}
    g.drawImage(H.bagseedNeckBridge,hx,hy,64*headScale,H.height/3*headScale);
  }
  function neckSurface(g,H,L,dir,hx,hy,registration,width,sy,bodyHeight,headScale=1){
    const surface=cv(288,432),c=surface.getContext('2d');c.scale(3,3);
    neckBacking(c,H,L,dir,hx,hy,143+(registration.root[1]-bodyHeight+1)*sy,143+(registration.opening-bodyHeight+1)*sy,headScale);
    c.globalCompositeOperation='destination-out';c.translate(48,143);c.scale(width,sy);c.drawImage(registration.occlusion,-48,-bodyHeight+1,96,bodyHeight);
    // Fabric can divide the backing into tiny isolated fragments. Only the
    // connected neck surface belongs here, never skin flecks on a shirt.
    const im=c.getImageData(0,0,288,432),a=im.data,seen=new Uint8Array(288*432);let largest=[];
    for(let p=0;p<seen.length;p++)if(!seen[p]&&a[p*4+3]>8){const component=[p];seen[p]=1;for(let i=0;i<component.length;i++){const q=component[i],x=q%288,y=Math.floor(q/288);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,n=yy*288+xx;if(xx>=0&&xx<288&&yy>=0&&yy<432&&!seen[n]&&a[n*4+3]>8){seen[n]=1;component.push(n);}}}if(component.length>largest.length)largest=component;}
    seen.fill(0);for(const p of largest)seen[p]=1;for(let p=0;p<seen.length;p++)if(!seen[p])a[p*4+3]=0;c.putImageData(im,0,0);
    g.drawImage(surface,0,0,96,144);
  }
  function body(L,dir,nose=false,density=1) {
    const signature=JSON.stringify([L.skin,L.topS,L.shirtC,L.bottomS,L.pantsC,L.shoesS,L.shoesC,L.acc,L.accC,L.topPat,L.topC2,L.botPat,L.botC2,L.emb,dir,nose,density]);if(bodies.has(signature))return bodies.get(signature);
    const out=cv(96*density,108*density),g=out.getContext('2d');g.scale(density,density);
    const asset=id=>density>1&&images.has('hires/'+id)?'hires/'+id:id;
    const top=asset(`${nose?'nose':'top'}/${L.topS}/${dir}`),full=paint(top,L,'top');
    const bottomId=asset(`bottom/${L.bottomS==='pjs'?'jeans':L.bottomS}/${dir}`),side=dir==='right'||dir==='left';
    // Component sheets use different proportions. Register trousers to the
    // torso's waist and shoes to its ankles before layering, once per body.
    const lowerScale=side?1.9:1.8;
    const fullSuit=wardrobeFullSuit(L);
    const waist={tee:73,tank:73,hoodie:75,flannel:76,sweater:75,cardigan:76,work:75,crop:71,jacket:74,garden:75,pjs:75,labcoat:75,suit:75,officer:75}[L.topS]||75;
    // Long trousers keep their own hem. It sits just above the bottom sheet's
    // baked shoes, so clip there rather than at a shared line that cut it off.
    const bottomSource=pixels(bottomId);
    if(bottomSource.hemY==null){
      const p=bottomSource.data.data,w=bottomSource.data.width,h=bottomSource.data.height,bd=w/96;let last=-1;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(p[i+3]>100&&p[i+2]>p[i]+12){last=y;break;}}
      bottomSource.hemY=last<0?100:68+((last+1)/bd-76)*39/31;
    }
    const longPants=!fullSuit&&bottomSource.hemY>=99,pantsHem=longPants?Math.max(100,Math.min(103,bottomSource.hemY)):100;
    if(!fullSuit){
      g.save();g.beginPath();g.rect(0,68,96,pantsHem-68);g.clip();g.translate(48,0);g.scale(lowerScale,1);const lower=paint(bottomId,L,'bottom'),ld=lower.width/96;g.drawImage(lower,0,76*ld,96*ld,31*ld,-48,68,96,39);g.restore();
    }
    const overlay=cv(full.width,full.height),o=overlay.getContext('2d',{willReadFrequently:true});o.drawImage(full,0,0);
    const a=o.getImageData(0,0,full.width,full.height),raw=pixels(top).data.data,d=full.width/96,W=full.width,Hh=full.height;
    // Hands hang below the hem over the companion trousers. Seed them from
    // skin pixels, then keep their dark outline and shading around the seed.
    // Profile hands hang over the hip, so they are not limited to the sides.
    const seeds=new Uint8Array(W*Hh),keep=new Uint8Array(W*Hh),reach=Math.round(1.2*d);
    for(let yy=0;yy<Hh;yy++)for(let xx=0;xx<W;xx++){
      const n=yy*W+xx,i=n*4,y=yy/d,x=xx/d;
      if(raw[i+3]>100&&y>=Math.max(waist,74)&&y<92&&(side||x<37||x>59)&&bodySkinPixel(raw[i],raw[i+1],raw[i+2]))seeds[n]=1;
    }
    for(let yy=0;yy<Hh;yy++)for(let xx=0;xx<W;xx++){
      if(!seeds[yy*W+xx])continue;
      for(let dy=-reach;dy<=reach;dy++)for(let dx=-reach;dx<=reach;dx++){
        const X=xx+dx,Y=yy+dy;if(X<0||Y<0||X>=W||Y>=Hh||dx*dx+dy*dy>reach*reach)continue;
        const i=(Y*W+X)*4;if(bodySkinPixel(raw[i],raw[i+1],raw[i+2])||lum(raw[i],raw[i+1],raw[i+2])<48)keep[Y*W+X]=1;
      }
    }
    for(let yy=0;yy<Hh;yy++)for(let xx=0;xx<W;xx++){
      const n=yy*W+xx,i=n*4,y=yy/d;
      const hem=L.topS==='labcoat'?y<94:L.topS==='garden'?y<83:y<waist;
      if(y>=100||(!fullSuit&&!hem&&!keep[n]))a.data[i+3]=0;
    }
    o.putImageData(a,0,0);
    // A shared neck/waist/ankle skeleton is used by every garment. The old
    // torso reached the hips and compressed the legs into the bottom quarter.
    g.drawImage(overlay,0,0,96*d,41*d,0,0,96,41);
    g.drawImage(overlay,0,41*d,96*d,(waist-41)*d,0,41,96,28);
    g.drawImage(overlay,0,waist*d,96*d,(107-waist)*d,0,69,96,38);
    const neckKey=top+'|neck';
    if(!neckRegistrations.has(neckKey)){
      const source=cv(288,324),s=source.getContext('2d');s.drawImage(images.get(top),0,0,96*d,41*d,0,0,288,123);s.drawImage(images.get(top),0,41*d,96*d,(waist-41)*d,0,123,288,84);
      neckRegistrations.set(neckKey,paintedNeck(source,[48,BODY_JOIN],3,dir,L.topS));
    }
    out.bagseedNeck=neckRegistrations.get(neckKey);
    // Exclude the feet baked into clothing sheets. The selected footwear is
    // the only shoe layer; its ankle overlaps the trousers by a few pixels.
    const shoeTop=['boots','rainboots'].includes(L.shoesS)?93:99;
    const shoeId=asset(`shoe/${L.shoesS}/${dir}`),shoe=paint(shoeId,L,'shoe'),shoeSource=pixels(shoeId),sd=shoe.width/96;
    if(!shoeSource.footprint){let left=shoe.width,right=-1;for(let y=0;y<shoe.height;y++)for(let x=0;x<shoe.width;x++)if(shoeSource.data.data[(y*shoe.width+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);}shoeSource.footprint={left,right};}
    const {left:shoeLeft,right:shoeRight}=shoeSource.footprint;
    // Source sheets were fitted to equal height, making taller boots much
    // narrower than sneakers. Register every pair by its actual footprint.
    const shoeScale=(side?28:32)/((shoeRight-shoeLeft+1)/sd),shoeCenter=(shoeLeft+shoeRight+1)/(2*sd);
    // Long trousers fall over the shoe: keep everything above their hem and
    // slide the shoe in behind it. Shorts and skirts show the shoe's ankle.
    const overShoe=longPants;
    g.clearRect(0,overShoe?pantsHem:shoeTop,96,108-(overShoe?pantsHem:shoeTop));
    // Resample the shoe once, identically for every outfit, then place it 1:1.
    const feet=cv(96*density,108*density),f=feet.getContext('2d');f.scale(density,density);f.beginPath();f.rect(0,shoeTop,96,108-shoeTop);f.clip();f.translate(48,0);f.scale(shoeScale,1);f.drawImage(shoe,-shoeCenter,0,96,108);
    const shoeClip=overShoe?Math.floor((pantsHem-2.5)*density)/density:shoeTop;g.save();g.beginPath();g.rect(0,shoeClip,96,108-shoeClip);g.clip();if(overShoe)g.globalCompositeOperation='destination-over';g.drawImage(feet,0,0,96,108);g.restore();
    if(L.acc==='bandana'||L.acc==='scarf'){
      const color=L.accC||(L.acc==='bandana'?'#c94f4f':'#d26aa0');path(g,color,3,[39,43,48,46,57,43]);path(g,color,4,L.acc==='scarf'?[54,46,57,58]:[44,46,48,51,52,46]);
    }
    if(L.acc==='necklace'&&dir!=='up'){path(g,L.accC||'#d6b25a',.8,[40,45,43,49,48,51,53,49,56,45]);g.fillStyle=L.accC||'#d6b25a';g.beginPath();g.ellipse(48,52,1.5,2,0,0,7);g.fill();}
    if(L.acc==='belt'){path(g,L.accC||'#664a32',2,[35,69,48,70,61,69]);if(dir!=='up'){g.strokeStyle='#d5b470';g.lineWidth=.7;g.strokeRect(46,68,4,3);}}
    if(L.acc==='bag'){
      const color=L.accC||'#986642';path(g,color,1.7,[38,44,59,76]);g.fillStyle=color;g.strokeStyle='#543c2d';g.lineWidth=.8;g.beginPath();g.roundRect(55,72,13,12,2);g.fill();g.stroke();path(g,'#b58a62',.8,[56,76,67,76]);g.fillStyle='#d6b25a';g.fillRect(61,77,1.3,1.5);
    }
    if(L.topPat==='emblem'&&dir!=='up'){
      const icon=CLPAT.icon[L.emb]||CLPAT.icon.star,cx=dir==='down'?45:48;g.fillStyle=L.topC2||'#efe3c4';icon.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='x')g.fillRect(cx+x,56+y,1,1);}));
    }
    if(nose){
      // Register against the uncolored artwork, so dark skin, blue skin and
      // clothing colors cannot change where the raised fingers meet the face.
      if(!poseContacts.has(top)){
        const source=cv(288,324),s=source.getContext('2d',{willReadFrequently:true});
        s.drawImage(images.get(top),0,0,96*d,41*d,0,0,288,123);
        s.drawImage(images.get(top),0,41*d,96*d,(waist-41)*d,0,123,288,84);
        const a=s.getImageData(0,0,288,324).data;let first=-1,sum=0,count=0;
        const skin=(x,y)=>{const n=(y*288+x)*4;return a[n+3]>160&&bodySkinPixel(a[n],a[n+1],a[n+2]);};
        for(let y=90;y<170&&first<0;y++)for(let x=80;x<220;x++)if(skin(x,y)){first=y;break;}
        if(first>=0)for(let y=first;y<=first+5;y++)for(let x=80;x<220;x++)if(skin(x,y)){sum+=x;count++;}
        poseContacts.set(top,count?[sum/count/3,first/3+1.5]:[48,45]);
      }
      out.bagseedNoseContact=poseContacts.get(top);
    }
    if(bodies.size>200)bodies.clear();bodies.set(signature,out);return out;
  }
  __BAGSEED_WALK_RENDERER__
  const PLAYER_FIGURE_SCALE=100/97;
  function scalePlayerFigure(source,factor){
    const out=cv(source.width,source.height),g=out.getContext('2d'),density=source.width/96,ground=143;
    g.imageSmoothingQuality='high';g.setTransform(factor,0,0,factor,48*density*(1-factor),ground*density*(1-factor));g.drawImage(source,0,0);
    const point=([x,y])=>[48+(x-48)*factor,ground+(y-ground)*factor];
    out.bagseedEyes=(source.bagseedEyes||[]).map(point);
    if(source.bagseedHeadOrigin)out.bagseedHeadOrigin=point(source.bagseedHeadOrigin);
    if(source.bagseedNose)out.bagseedNose=point(source.bagseedNose);
    if(source.bagseedHand){const [x,y]=point([source.bagseedHand.x,source.bagseedHand.y]);out.bagseedHand={x,y};}
    out.bagseedAuthoredWalk=source.bagseedAuthoredWalk;out.bagseedWalkProfile=source.bagseedWalkProfile;
    out.bagseedBodyTransform=source.bagseedBodyTransform;
    if(source.bagseedAlignment){const a=source.bagseedAlignment;out.bagseedAlignment={...a,origin:point(a.origin),jaw:point(a.jaw),collar:point(a.collar),shoulderBand:a.shoulderBand.map(y=>point([48,y])[1]),neckLength:a.neckLength*factor,shoulderWidth:a.shoulderWidth*factor,headScale:a.headScale*factor};}
    out.bagseedFigureScale=factor;return out;
  }
  function generic(L,dir,nose=false,blink=false,density=1) {
    const out=cv(96*density,144*density),g=out.getContext('2d'),B=body(L,dir,nose,3);
    // The reaction artwork turns toward the raised hand. A profile head's
    // projecting nose cannot meet these front-facing fingers at the collar.
    const headDir=nose&&dir!=='up'?'down':dir,H=head(L,headDir,blink,true);g.scale(density,density);
    const width={slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[L.body]||1;
    const short=!!L.short,kid=isChild(L),sy=kid?.74:short?.9:L.body==='tall'?1.07:1;
    const neckY=143+((B.bagseedNeck?.root[1]??BODY_JOIN)-107)*sy,headScale=kid?.9:1;
    const presentation=L.pres==='masc'?1.045:L.pres==='fem'?.955:1;
    const collar=[48+(B.bagseedNeck.root[0]-48)*width*presentation,neckY],placement=headPlacement(L,headDir,collar,headScale);
    const joinY=HEAD_NECK;let [headX,headY]=placement.origin;
    if(nose){
      const [x,y]=B.bagseedNoseContact,point=H.bagseedFeatures.nose||[96,joinY],target=dir==='up'?[48,y+4]:[x,y];
      headX=48+(target[0]-48)*width*presentation-point[0]/3*headScale;
      headY=143+(target[1]-107)*sy-point[1]/3*headScale;
    }
    const drawHead=()=>g.drawImage(H,headX,headY,64*headScale,H.height/3*headScale);
    // The anatomical join is underneath the body, filling gaps in posed art.
    // Its neck occupies the same span as the body's neck, rather than stacking
    // above it. Clothing and the body's painted neck own the visible surface.
    neckBacking(g,H,L,headDir,headX,headY,neckY,143+((B.bagseedNeck?.opening??BODY_JOIN)-107)*sy,headScale);
    g.save();g.translate(48,143);g.scale(width*presentation,sy);g.drawImage(B,-48,-107,96,108);g.restore();
    neckSurface(g,H,L,headDir,headX,headY,B.bagseedNeck,width*presentation,sy,108,headScale);
    // Draw the complete transparent head over clothing. Cropping this pass at
    // the neck used to put a horizontal shirt edge through every loose length.
    drawHead();
    if(nose&&dir!=='up'){
      // Only the raised forearm crosses the face. Redrawing the whole upper
      // torso here repainted its neck stump over the jaw, making two necks.
      const [x,y]=B.bagseedNoseContact,right=dir==='right',slope=dir==='down'?1:.7;
      g.save();g.translate(48,143);g.scale(width*presentation,sy);g.translate(-48,-107);
      g.beginPath();g.rect(0,0,96,y+7);g.clip();g.beginPath();g.moveTo(0,0);g.lineTo(96,0);
      if(right){g.lineTo(96,108);g.lineTo(x-2.5+(108-y)*slope,108);g.lineTo(x-2.5,y);}
      else{g.lineTo(x+2.5,y);g.lineTo(x+2.5-(108-y)*slope,108);g.lineTo(0,108);}
      g.closePath();g.clip();g.drawImage(B,0,0,96,108);g.restore();
    }
    if(L.prop&&!nose&&dir!=='up'){g.save();g.translate(0,36);props(g,L,dir);g.restore();}
    out.bagseedEyes=H.bagseedEyes.map(([x,y])=>[headX+x*headScale/3,headY+y*headScale/3]);
    out.bagseedHeadOrigin=[headX,headY];
    out.bagseedAlignment={...placement,shoulderBand:[3,7].map(d=>143+(B.bagseedNeck.shoulderY+d-107)*sy),shoulderWidth:B.bagseedNeck.shoulderWidth*width*presentation,garment:L.topS,bottom:wardrobeFullSuit(L)?L.topS:L.bottomS,rear:dir==='up',source:`top/${L.topS}/${dir}`};
    out.bagseedNose=(H.bagseedFeatures.nose||[96,155]).map((v,i)=>(i?headY:headX)+v*headScale/3);
    return nose?out:scalePlayerFigure(out,PLAYER_FIGURE_SCALE);
  }
  function props(g,L,dir) {
    const side=dir!=='down',x=side?50:64,y=77;g.save();g.strokeStyle='#413b35';g.lineWidth=1.2;
    if(L.prop==='can'){g.fillStyle='#899899';g.beginPath();g.roundRect(x,y-2,13,11,3);g.fill();g.stroke();path(g,'#899899',3,[x+10,y,x+18,y-5]);g.beginPath();g.ellipse(x+3,y-4,4,4,0,Math.PI,Math.PI*2);g.stroke();}
    else if(['book','clipboard','phone','camera'].includes(L.prop)){g.fillStyle=L.prop==='book'?'#9b504d':L.prop==='clipboard'?'#c4a56e':'#363c47';g.beginPath();g.roundRect(x-3,y-8,L.prop==='phone'?5:11,L.prop==='camera'?8:13,1.5);g.fill();g.stroke();if(L.prop==='clipboard'){g.fillStyle='#eee1c4';g.fillRect(x-1,y-6,7,9);}if(L.prop==='camera'){g.beginPath();g.arc(x+3,y-4,2,0,7);g.fillStyle='#88b6c4';g.fill();}}
    else if(L.prop==='leash')path(g,'#b95757',1.4,[x,y,x+5,y+8,x+10,y+18]);
    else if(L.prop==='knit'){g.fillStyle='#cf7aa3';g.beginPath();g.ellipse(48,75,7,4,0,0,7);g.fill();path(g,'#b6aba0',1,[40,67,52,77]);path(g,'#b6aba0',1,[55,67,43,77]);}
    g.restore();
  }
  function hands(canvas,L,dir) {
    const offset=canvas.height-108,a=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,96,canvas.height).data,skin=rgb(L.skin),sRatio=skin[0]/Math.max(1,skin[1]);let points=[];
    for(let y=54+offset;y<85+offset;y++)for(let x=14;x<82;x++){
      const i=(y*96+x)*4;if(a[i+3]<120)continue;const ratio=a[i]/Math.max(1,a[i+1]);
      if(Math.abs(ratio-sRatio)<.22&&Math.abs(a[i+1]/Math.max(1,a[i+2])-skin[1]/Math.max(1,skin[2]))<.45&&a[i]>a[i+1]*1.12&&a[i+1]>a[i+2]*1.1){
        const expected=dir==='down'||dir==='up'?28:dir==='right'?50:46;
        points.push({x,y,score:Math.abs(x-expected)*1.3+Math.abs(y-72-offset)*.35});
      }
    }
    points.sort((a,b)=>a.score-b.score);const near=points.slice(0,8);
    return near.length?{x:near.reduce((s,p)=>s+p.x,0)/near.length,y:near.reduce((s,p)=>s+p.y,0)/near.length}:{x:dir==='down'||dir==='up'?31:48,y:72+offset};
  }
  function animate(source,L,dir,frame,breath,blink,act,rig,density=1) {
    const height=source.height/(source.width/96),ground=height-1,offset=height-108,out=cv(96*density,height*density),g=out.getContext('2d');g.scale(density,density);g.imageSmoothingEnabled=source.width>=out.width;g.imageSmoothingQuality='high';
    // Custom figures already contain several fitted art layers. A second
    // whole-bitmap 99% squash softened every line whenever idle breath toggled.
    // Preserve their native rest drawing; blinking remains independent.
    const breathe=breath&&!source.bagseedFigureScale;
    if(rig&&frame){
      // Move one continuous silhouette. Cutting a drawing at x=48/y=79
      // severed overlapping profile legs and exposed rectangular seams.
      const phase=frame===1?1:frame===3?-1:0,side=dir==='right'||dir==='left';
      g.save();g.translate(48,ground);g.transform(1,0,phase*(side?.018:.01),frame%2?.988:1,0,0);g.drawImage(source,-48,-ground,96,height);g.restore();
    }else if(breathe){g.save();g.translate(48,ground);g.scale(1,.99);g.drawImage(source,-48,-ground,96,height);g.restore();}
    else g.drawImage(source,0,0,96,height);
    if(act&&dir!=='up'){
      // Existing interact flag remains visible; a small wrist/forearm lift uses
      // the same illustrated arm pixels, never the old character renderer.
      const x=dir==='left'?34:dir==='right'?46:62,arm=cv(12*density,22*density);arm.getContext('2d').drawImage(out,(x-4)*density,(58+offset)*density,12*density,22*density,0,0,12*density,22*density);
      g.clearRect(x-4,65+offset,12,15);g.save();g.translate(x+2,61+offset);g.rotate(dir==='left'?.35:-.35);g.drawImage(arm,-6,0,12,22);g.restore();
    }
    out.bagseedEyes=(source.bagseedEyes||[]).map(([x,y])=>rig&&frame?[x+(frame===1?1:frame===3?-1:0)*(dir==='right'||dir==='left'?.018:.01)*(y-ground),ground+(y-ground)*(frame%2?.988:1)]:breathe?[x,ground+(y-ground)*.99]:[x,y]);
    out.bagseedNose=source.bagseedNose;
    out.bagseedHeadOrigin=source.bagseedHeadOrigin;
    out.bagseedAlignment=source.bagseedAlignment;
    out.bagseedBodyTransform=source.bagseedBodyTransform;
    out.bagseedAuthoredWalk=source.bagseedAuthoredWalk;out.bagseedWalkProfile=source.bagseedWalkProfile;
    out.bagseedCastWalk=source.bagseedCastWalk;
    out.bagseedFigureScale=source.bagseedFigureScale;
    if(source.bagseedHand)out.bagseedHand={...source.bagseedHand};
    else if(density===1)out.bagseedHand=hands(out,L,dir);return out;
  }
  function faceCoordinates(canvas,L){
    const a=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,96,108).data,skin=rgb(L.skin),center=isChild(L)?43:L.short?30:25,rows=[];
    for(let y=Math.max(4,center-14);y<Math.min(70,center+15);y++){
      const xx=[];for(let x=20;x<77;x++){const i=(y*96+x)*4,r=a[i],g=a[i+1],b=a[i+2];if(a[i+3]>120&&lum(r,g,b)>lum(...skin)*.5&&Math.abs(r/Math.max(1,g)-skin[0]/Math.max(1,skin[1]))<.32&&Math.abs(g/Math.max(1,b)-skin[1]/Math.max(1,skin[2]))<.5)xx.push(x);}
      if(xx.length)rows.push({y,x:xx.reduce((s,x)=>s+x,0)/xx.length,width:xx.length,score:xx.length*Math.exp(-Math.pow((y-center)/9,2))});
    }
    rows.sort((a,b)=>b.score-a.score);const row=rows[0]||{x:48,y:center+2,width:20};return {x:row.x,eyeY:Math.round(row.y-2),mouthY:Math.round(row.y+5),width:Math.min(28,Math.max(14,row.width))};
  }
  function sprite(look,dir='down',frame=0,breath=0,blink=0,act=0,nose=false,density=1,walking=false) {
    if(!loaded)return cv();const L=normalize(look),signature=key(L)+'|'+dir+'|'+[frame,breath,blink,act,nose,density,walking].join(',');if(cache.has(signature))return cache.get(signature);
    const person=authoredPerson(L);let source,rig=true,sniff=false;
    if(person&&person.id!=='player'&&nose&&person.actions?.[dir]){source=images.get(person.actions[dir]);rig=false;}
    else if(person&&person.id!=='player'){
      const moving=!nose&&(walking||frame);
      source=images.get(person.assets[(!person.rig&&moving?`${dir}-${frame%(person.walkFrameCount||4)}`:`${dir}-idle`)]);
      if(!source)throw new Error('Missing authored NPC idle art: '+person.id+'/'+dir);
      rig=!!person.rig;sniff=!!nose;
      if(person.walkFrameCount===8&&moving)source.bagseedCastWalk={id:person.id,dir,frame:frame%8};
    }
    else if(!nose&&(walking||frame>0)&&(source=authoredWalk(L,dir,frame,!!blink,density))){rig=false;breath=0;act=0;}
    else{
      // The legacy modular reaction puts fingers at the collar and lowers the
      // head to meet them. Preserve the fitted figure until matching raised-
      // hand outfit art exists; a small sniff emote carries the reaction.
      source=generic(L,dir,false,!!blink,density);sniff=!!nose;
    }
    const out=animate(source,L,dir,frame,breath,blink,act&&!nose,rig&&!nose,density);
    out.bagseedAuthoredId=person&&person.id!=='player'?person.id:null;
    if(sniff){
      // A small sniff emote preserves the complete idle drawing and its size.
      const probe=cv();probe.getContext('2d').drawImage(out,0,0,96,108);
      const face=faceCoordinates(probe,L),g=out.getContext('2d');g.save();g.setTransform(density,0,0,density,0,0);g.strokeStyle='#62432d';g.lineWidth=.7;g.lineCap='round';
      const modular=!person||person.id==='player',point=out.bagseedNose||[48,63];
      const side=dir==='left'?-1:1,x=modular?(side<0?12:84):face.x+side*7,y=modular?point[1]:face.mouthY-2;
      for(let i=0;i<2;i++){g.beginPath();g.moveTo(x+i*2*side,y+2);g.quadraticCurveTo(x+i*2*side+1.5*side,y,x+i*2*side,y-2);g.stroke();}g.restore();
      out.bagseedAuthoredNoseFallback=true;
    }
    if(person&&person.id!=='player'&&L.expr!=='neutral'&&dir!=='up'&&!nose){const g=out.getContext('2d'),f=faceCoordinates(out,L);g.save();g.translate(f.x-32,f.eyeY-79/3);g.scale(1/3,1/3);faceDetails(g,{...L,eyes:'round',eyeC:'#2b1d14',brows:'thin',mouth:'default',nose:'default',ears:'normal',extras:[],marks:[],pierce:[],glasses:'none',acc:'none'},dir);g.restore();}
    if(cache.size>600)cache.delete(cache.keys().next().value);cache.set(signature,out);return out;
  }
  function portrait(look) {
    if(!loaded)return cv(192,192);const L=normalize(look),signature=key(L)+'|'+(L.bg||'');if(portraits.has(signature))return portraits.get(signature);
    const out=cv(192,192),g=out.getContext('2d');g.fillStyle=L.bg||'#eadfc9';g.fillRect(0,0,192,192);
    const person=authoredPerson(L);
    if(person&&person.id!=='player'){const expression=['happy','grin','laugh','proud'].includes(L.expr)?'friendly':['sad','worried','angry'].includes(L.expr)?'concerned':'neutral';g.drawImage(images.get(person.portraits[expression]),0,0);}
    else{
      const torso=body(L,'down',false,3),d=torso.width/96;
      const width=({slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[L.body]||1)*(L.pres==='masc'?1.045:L.pres==='fem'?.955:1);
      const h=head(L,'down',false,true),p=h.getContext('2d').getImageData(0,0,192,HEAD_HEIGHT).data;let top=HEAD_HEIGHT;
      for(let y=0;y<HEAD_HEIGHT&&top===HEAD_HEIGHT;y++)for(let x=0;x<192;x++)if(p[(y*192+x)*4+3]>100){top=y;break;}
      const joinY=HEAD_NECK+(HEAD_JOIN-HEAD_NECK)*(faceFits[L.face]?.[1]||1),anchor=joinY-(-11+(BODY_JOIN-40)*3);
      // Match the illustrated busts: the head occupies about 60% of the frame,
      // with shoulders filling the lower third and full hair above the brow.
      const fit=Math.min(1,116/(anchor-top));g.save();g.translate(96,148);g.scale(fit,fit);
      g.drawImage(h.bagseedNeckBridge,-96,-anchor);
      g.save();g.scale(width,1);g.drawImage(torso,0,40*d,96*d,40*d,-144,-11,288,120);g.restore();
      g.drawImage(h,-96,-anchor);g.restore();

    }
    portraits.set(signature,out);return out;
  }
  const originalDrawPortrait=drawPortrait;
  charSprite=sprite;buildChar=sprite;buildPortrait=portrait;
  buildNoseSprite1151=(L,dir)=>sprite(L,dir,0,0,0,0,true);
  drawPerson=function(c,x,y,look,scale=1,anim={},face){
    if(typeof anim==='number')anim={frame:anim,dir:face<0?'left':face>0?'right':'down'};
    if(castWalkDrawing&&canonical.get(approvalKey(normalize(look)))?.id===castWalkDrawing.id)anim={...anim,frame:castWalkDrawing.frame,walk:castWalkDrawing.walk};
    let smell=Smell1151.drawing;
    if(!smell&&Smell1151.active?.kind==='staff'&&Smell1151.active.scene===Smell1151.scene()&&Math.abs(x-Smell1151.active.view.x)<1&&Math.abs(y-Smell1151.active.view.y)<1)smell=Smell1151.active;
    const dir=smell?Smell1151.face({x,y}):anim.dir||'down';
    // Compose at the native artwork resolution, then fit the finished figure
    // once. Sizing intermediate canvases to the display footprint threw away
    // line detail before the 1.8x bedroom/grow-room enlargement.
    const transform=c.getTransform(),density=3;
    const image=sprite(look,dir,smell?0:anim.frame||0,anim.breath?1:0,anim.blink?1:0,anim.act?1:0,!!smell,density,!!anim.walk);
    const height=32*image.height/image.width;c.save();c.imageSmoothingEnabled=image.width>=32*scale*Math.abs(transform.a);c.imageSmoothingQuality='high';c.drawImage(image,Math.round(x)-16*scale,Math.round(y)-height*scale,32*scale,height*scale);c.restore();
    if(scale===1&&NightLamps1151.drawing)NightLamps1151.carry(c,x,y,look,anim);
  };
  Cast115.drawKid=function(c,x,y,look,anim={}){drawPerson(c,x,y,{...look,short:true},1,anim);};
  drawTinyPerson=(c,x,y,look,frame=0,prop)=>drawPerson(c,x,y,prop===undefined?look:{...look,prop},.42,{frame});
  __BAGSEED_CAST_WALK_CLOCKS__
  const previousPlayerAnim=playerAnim;
  playerAnim=function(t){
    const anim=previousPlayerAnim(t),count=customWalkFrameCount(playerLook(),anim.dir);
    if(anim.walk&&count===8)anim.frame=settings.reduced?2:Math.floor(t*8)%8;
    return anim;
  };
  drawCreatorPreview=function(t){
    const canvas=$('#creatorPreview');if(!canvas||!runtime.cr)return;
    if(!canvas.dataset.illustratedDensity){canvas.width=540;canvas.height=336;canvas.dataset.illustratedDensity='3';canvas.style.imageRendering='auto';canvas.style.aspectRatio='180 / 112';canvas.style.height='auto';}
    const g=canvas.getContext('2d');g.setTransform(3,0,0,3,0,0);
    const W=180,H=112,look=creatorLook(runtime.cr),walk=runtime.crWalk!==false&&!settings.reduced,frame=walk?Math.floor(t*6)%4:0;
    R(g,0,0,W,H,'#2a2230');for(let y=H-16;y<H;y+=4)R(g,0,y,W,2,'#352b3c');
    [['FRONT','down'],['SIDE','right'],['BACK','up']].forEach(([label,dir],i)=>{const x=30+i*60;groundShadow(g,x,H-10,22);drawPerson(g,x,H-10,look,2,{dir,frame:walk?Math.floor(t*(customWalkFrameCount(look,dir)===8?8:6))%customWalkFrameCount(look,dir):0,walk,breath:!walk&&Math.floor(t/1.4)%2,blink:!walk&&idleBlink(t,i)});pxText(g,label,x-pxTextW(label)/2,3,1,'#b3b89c');});
  };
  CharacterUI115.mirrorDraw=function(){
    const root=$('#panelBody'),canvas=root?.querySelector('canvas[data-draw="person"]');if(!canvas||!root.querySelector('.character-layout115'))return;
    if(!canvas.dataset.illustratedDensity){canvas.width=540;canvas.height=336;canvas.dataset.illustratedDensity='3';canvas.style.imageRendering='auto';canvas.style.aspectRatio='180 / 112';canvas.style.height='auto';}
    if(!root.querySelector('[data-walk-preview]')){
      const controls=document.createElement('div');controls.dataset.walkPreview='true';controls.style.marginTop='8px';
      for(const [text,value]of [['Walk',true],['Idle',false]]){const button=document.createElement('button');button.textContent=text;button.style.marginRight='6px';button.addEventListener('click',()=>{runtime.mirrorWalk=value;CharacterUI115.mirrorDraw();});controls.append(button);}
      canvas.insertAdjacentElement('afterend',controls);
    }
    const walk=runtime.mirrorWalk!==false&&!settings.reduced,frame=walk?Math.floor((runtime.t||0)*6)%4:0;
    [...root.querySelector('[data-walk-preview]').children].forEach((b,i)=>{b.classList.toggle('on',walk===(i===0));b.setAttribute('aria-pressed',String(walk===(i===0)));});
    const g=canvas.getContext('2d'),look=playerLook();g.setTransform(3,0,0,3,0,0);R(g,0,0,180,112,'#2a2230');
    [['FRONT','down'],['SIDE','right'],['BACK','up']].forEach(([label,dir],i)=>{const x=30+i*60;groundShadow(g,x,102,22);drawPerson(g,x,102,look,2,{dir,frame:walk?Math.floor((runtime.t||0)*(customWalkFrameCount(look,dir)===8?8:6))%customWalkFrameCount(look,dir):0,walk,blink:false,breath:false});pxText(g,label,x-pxTextW(label)/2,3,1,'#b3b89c');});
  };
  drawPortrait=function(canvas,look){
    if(!loaded)return originalDrawPortrait(canvas,look);
    if(canvas.isConnected&&!canvas.dataset.illustratedDensity){const style=getComputedStyle(canvas);canvas.style.width=style.width;canvas.style.height=style.height;canvas.style.imageRendering='auto';canvas.width*=3;canvas.height*=3;canvas.dataset.illustratedDensity='3';}
    const g=canvas.getContext('2d');g.clearRect(0,0,canvas.width,canvas.height);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(portrait(look),0,0,canvas.width,canvas.height);
    if(runtime.curDialog?.smell1151&&Smell1151.active?.dialog===runtime.curDialog&&$('#dialog')?.querySelector('canvas')===canvas){
      const person=canonical.get(approvalKey(look));
      if(person?.actions){
        g.fillStyle=normalize(look).bg||'#eadfc9';g.fillRect(0,0,canvas.width,canvas.height);
        g.drawImage(images.get(person.actions.portrait),0,0,canvas.width,canvas.height);
        return;
      }
      // Isolate the generated raised arm, without pasting a rectangular torso
      // over the portrait. Register fingertips to this portrait's own face.
      const L=normalize(look),pose=body(L,'down',true),arm=cv(),a=arm.getContext('2d');
      a.beginPath();a.moveTo(20,12);a.lineTo(59,12);a.lineTo(59,42);a.lineTo(40,43);a.lineTo(40,64);a.lineTo(20,64);a.closePath();a.clip();a.drawImage(pose,0,0);
      const p=pose.getContext('2d').getImageData(0,0,96,108).data,skin=rgb(L.skin),warm=(r,gg,b)=>r>gg*1.15&&gg>b+6;
      let minY=108,hand=[];for(let y=10;y<43;y++)for(let x=22;x<65;x++){const i=(y*96+x)*4;if(p[i+3]>100&&warm(p[i],p[i+1],p[i+2])){minY=Math.min(minY,y);hand.push([x,y]);}}
      hand=hand.filter(v=>v[1]<=minY+4);const hx=hand.length?hand.reduce((s,v)=>s+v[0],0)/hand.length:48,hy=Number.isFinite(minY)&&minY<108?minY+2:32;
      const portraitPixels=portrait(look).getContext('2d').getImageData(0,0,192,192).data,rows=[];
      for(let y=80;y<121;y++){const xx=[];for(let x=45;x<155;x++){const i=(y*192+x)*4,r=portraitPixels[i],gg=portraitPixels[i+1],b=portraitPixels[i+2];if(warm(r,gg,b)&&Math.abs(r/Math.max(1,gg)-skin[0]/Math.max(1,skin[1]))<.35&&lum(r,gg,b)>lum(...skin)*.45)xx.push(x);}if(xx.length)rows.push({x:xx.reduce((s,x)=>s+x,0)/xx.length,y,width:xx.length,score:xx.length*Math.exp(-Math.pow((y-100)/16,2))});}
      rows.sort((a,b)=>b.score-a.score);const face=rows[0]||{x:96,y:100,width:65},nx=face.x+face.width*.12,ny=face.y;
      // Match the illustrated portrait's actual skin lighting, rather than its
      // saved palette swatch, so the raised hand belongs to the same face.
      const samples=[[],[],[]];for(let y=Math.max(80,face.y-10);y<Math.min(121,face.y+10);y++)for(let x=Math.floor(face.x-face.width*.3);x<face.x+face.width*.3;x++){const i=(y*192+x)*4,r=portraitPixels[i],gg=portraitPixels[i+1],b=portraitPixels[i+2];if(warm(r,gg,b)&&r>120){samples[0].push(r);samples[1].push(gg);samples[2].push(b);}}
      const target=samples.map((values,i)=>values.length?values.sort((a,b)=>a-b)[Math.floor(values.length*.65)]:skin[i]);
      const armPixels=a.getImageData(0,0,96,108);for(let i=0;i<armPixels.data.length;i+=4){const d=armPixels.data;if(d[i+3]&&warm(d[i],d[i+1],d[i+2]))for(let k=0;k<3;k++)d[i+k]=Math.min(255,d[i+k]*target[k]/Math.max(1,skin[k]));}a.putImageData(armPixels,0,0);
      g.save();g.scale(canvas.width/192,canvas.height/192);g.drawImage(arm,nx-hx*3,ny-hy*3,288,324);g.restore();
    }
  };
  NightLamps1151.hand=function(x,y,look,anim={}){const dir=anim.dir||'down',image=sprite(look,dir,anim.frame||0,anim.breath?1:0,0,0,false,1,!!anim.walk),hand=image.bagseedHand||{x:31,y:image.height-36};return {x:x+(hand.x-48)/3,y:y+(hand.y-image.height)/3,dir};};
  const ensure=View.ensureWorld;
  View.ensureWorld=function(){
    const S=curScene();if(this.world.width!==S.w*3||this.world.height!==S.h*3){this.world.width=S.w*3;this.world.height=S.h*3;this.wctx=this.world.getContext('2d');}
    this.wctx.setTransform(3,0,0,3,0,0);this.wctx.imageSmoothingEnabled=false;
    if(this.sceneId!==state.scene){this.sceneId=state.scene;this.computeZoom();this.update(0,true);}
  };
  // The original render performs all camera, border and screen-coordinate work.
  // Substitute only its world draw source rectangle; coordinates stay native.
  const render=View.render;
  View.render=function(){
    const g=this.ctx,draw=g.drawImage,world=this.world;
    g.drawImage=function(image,...args){if(image===world&&args.length===8){args[2]*=3;args[3]*=3;}return draw.call(this,image,...args);};
    try{return render.call(this);}finally{g.drawImage=draw;}
  };
  const ready=Promise.all(Object.entries(DATA.images).map(([id,src])=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>{images.set(id,image);resolve();};image.onerror=()=>reject(new Error('Failed character asset '+id));image.src=src;
  }))).then(()=>{loaded=true;charCache.clear();portraitCache.clear();Smell1151.poses.clear();if(screen==='create')hydrate($('#screen-create'));else if(screen==='game'){hydrate(document);View.snap();}return {assets:images.size,haircuts:DATA.haircuts,approvedIdentities:DATA.approved.length};});
  window.BagseedArt=Object.freeze({version:'illustrated-1',renderingRevision:'character-alignment-audit-v6',playerFigureScale:PLAYER_FIGURE_SCALE,walkFrameCount:castWalkFrameCount,customWalkFrameCount,walkReview:{status:DATA.walk.status,rig:DATA.walk.rig,items:DATA.walk.items},ready,sprite,portrait,normalize,key,head,body,landmarks:(look,dir='down')=>transformedDetails(normalize(look),dir),baldBase:(look,dir='down')=>baldBase(normalize(look),dir),hairLayer:(look,dir='down')=>hairLayer(normalize(look),dir),assets:DATA.manifest,approved:DATA.approved.map(p=>p.id),cast:DATA.cast.map(p=>({id:p.id,name:p.name,look:p.look,aliases:p.aliases})),get loaded(){return loaded;}});
  ready.catch(error=>console.error('Illustrated character assets failed',error));
})();
