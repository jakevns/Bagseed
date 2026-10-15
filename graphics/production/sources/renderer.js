/* Bagseed illustrated production renderer. Artwork is generated PNG material,
 * registered by extract.py; saved appearance objects remain authoritative.
 * This patch changes character rendering only. Baseline simulation is retained.
 */
(() => {
  'use strict';
  const DATA = __BAGSEED_ART_DATA__;
  const DIRS = ['down','right','up','left'];
  const images = new Map(), colored = new Map(), heads = new Map(), bodies = new Map();
  const cache = new Map(), portraits = new Map(), rawPixels = new Map(), faceMasks = new Map();
  let loaded = false;
  const cv = (w=96,h=108) => {const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const rgb = hex => {let h=String(hex||'#000000').replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0);};
  const skinPixel = (r,g,b) => r>g*1.27 && g>b+12 && r>130 && g>68;
  const bodySkinPixel=(r,g,b)=>r>55&&g>25&&r>g*1.15&&g>b+6;
  const lum = (r,g,b) => .2126*r+.7152*g+.0722*b;
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
  const approvalKey = look => key({...look,expr:'neutral'});
  const canonical = new Map([...DATA.approved,...DATA.cast].map(p=>[approvalKey(p.look),p]));
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
    const skin=rgb(L.skin),hair=rgb(L.hairC),top=rgb(L.shirtC),bot=rgb(L.pantsC),shoe=rgb(L.shoesC),hi=rgb(L.hairHi);
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
  function faceDetails(c,L,dir,features=null) {
    if(dir==='up')return;
    c.save();if(dir==='left'){c.translate(192,0);c.scale(-1,1);}
    if(features){const eyes=features.eyes;const x=dir==='down'?(eyes[0][0]+eyes[1][0])/2:dir==='left'?192-eyes[0][0]:eyes[0][0],y=eyes.reduce((n,e)=>n+e[1],0)/eyes.length;const sx=dir==='down'?Math.max(.8,Math.min(1.4,(eyes[1][0]-eyes[0][0])/32)):1;c.translate(x,y);c.scale(sx,.8);c.translate(dir==='down'?-94:-113,-79);}
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
    const src=facialSource(L.facial,dir),signature=L.facial+'|'+dir+'|'+L.hairC;
    let layer=facialLayers.get(signature);
    if(!layer){
      const {width:w,height:h,data}=src.raw,a=data.data,out=cv(w,h),g=out.getContext('2d'),d=g.createImageData(w,h),target=rgb(L.hairC),side=dir!=='down';
      const moustache=['mustache','pencil','handlebar'].includes(L.facial),light=['stubble','scruff'].includes(L.facial);
      const origin=src.mouthX,my=src.mouthY,mask=new Uint8Array(w*h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=(y*w+x)*4,r=a[i],gg=a[i+1],b=a[i+2],l=lum(r,gg,b),dx=x-origin,dy=y-my;
        if(a[i+3]<20||r>165||gg>117||b>91||l>135)continue;
        let keep;
        if(moustache){const reach=L.facial==='handlebar'?36:L.facial==='pencil'?23:27;keep=Math.abs(dx)<(side?19:reach)&&dy>(L.facial==='handlebar'?-14:-9)&&dy<1;}
        else if(L.facial==='soul')keep=Math.abs(dx)<(side?10:13)&&dy>3&&dy<19;
        else if(['goatee','vandyke'].includes(L.facial))keep=dy>-10&&dy<1&&Math.abs(dx)<(side?19:28)||dy>3&&dy<24&&(side?dx>-15&&dx<11:Math.abs(dx)<22);
        else if(light)keep=dy>3&&dy<18&&Math.abs(dx)<(side?32:31)||dy>-7&&dy<11&&(side?dx<-10:Math.abs(dx)>21)&&Math.abs(dx)<38;
        else {keep=dy>-22&&dy<27&&Math.abs(dx)<(side?43:42);if(Math.abs(dx)<(side?9:13)&&dy<-9)keep=false;}
        if(L.facial==='anchor')keep=keep&&(dy<1&&Math.abs(dx)<(side?18:28)||dy>5&&(side?dx>-21&&dx<11:Math.abs(dx)<26));
        if(keep)mask[y*w+x]=1;
      }
      // Reject detached nose and neck contour fragments. Facial-hair strands
      // stay attached to a substantial beard/moustache component.
      if(!light){const seen=new Uint8Array(w*h);for(let start=0;start<mask.length;start++)if(mask[start]&&!seen[start]){const todo=[start],component=[];seen[start]=1;while(todo.length){const at=todo.pop();component.push(at);const x=at%w,y=Math.floor(at/w);for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const n=yy*w+xx;if(mask[n]&&!seen[n]){seen[n]=1;todo.push(n);}}}if(component.length<7)for(const n of component)mask[n]=0;}}
      for(let at=0;at<mask.length;at++)if(mask[at]){const i=at*4,l=lum(a[i],a[i+1],a[i+2]),shade=Math.max(.32,Math.min(1.35,l/52)),color=target.map(v=>Math.min(255,v*shade));d.data[i]=color[0];d.data[i+1]=color[1];d.data[i+2]=color[2];d.data[i+3]=a[i+3]*(light?.55:1);}
      g.putImageData(d,0,0);layer=out;if(facialLayers.size>100)facialLayers.clear();facialLayers.set(signature,layer);
    }
    const eyes=features?.eyes|| (dir==='down'?[[75,94],[117,94]]:[[dir==='right'?120:72,96]]),eyeY=eyes.reduce((n,p)=>n+p[1],0)/eyes.length,eyeX=eyes.reduce((n,p)=>n+p[0],0)/eyes.length;
    const mouthX=dir==='down'?eyeX:eyeX+(dir==='right'?12:-12),mouthY=eyeY+(dir==='down'?16:20);
    c.save();
    // The adult source studies have smaller eyes. Keep their sideburn texture
    // outside the larger illustrated eyes instead of painting over a lower
    // eyelid when the study is fitted to the new jaw.
    c.beginPath();c.rect(0,0,192,256);for(const [x,y]of eyes){c.moveTo(x+11,y);c.ellipse(x,y,11,10,0,0,Math.PI*2);}c.clip('evenodd');
    c.translate(mouthX,mouthY);c.scale(dir==='down'?1.04:1,.69);c.drawImage(layer,-src.mouthX,-src.mouthY);c.restore();
  }
/* Fit isolated hat artwork to the skull without resizing the wearer's face.
 * Call before the complete head's face-shape transform. Coordinates retain
 * the registered neck at (96,135) on a 192x256 head canvas.
 */
function fitHat(headCanvas, hatCanvas, look, direction, frontFeatures, directionFeatures) {
  const hatName = look.hat === 'hood' ? 'beanie' : look.hat;
  const settings = {
    beanie: {width:1.15, sideWidth:1.13, height:76, forehead:13},
    cap: {width:1.18, sideWidth:1.32, height:76, forehead:13},
    bucket: {width:1.30, sideWidth:1.31, height:76, forehead:13},
    straw: {width:1.51, sideWidth:1.53, height:63, forehead:14},
    sunhat: {width:1.64, sideWidth:1.66, height:77, forehead:12},
    officer: {width:1.31, sideWidth:1.36, height:63, forehead:12},
    wizard: {width:1.46, sideWidth:1.47, height:91, forehead:12},
    beret: {width:1.20, sideWidth:1.20, height:65, forehead:14}
  };
  const spec = settings[hatName];
  if (!spec) return headCanvas;
  const width=hatCanvas.width,height=hatCanvas.height;
  const pixels=hatCanvas.getContext('2d').getImageData(0,0,width,height).data;
  let left=width,top=height,right=0,bottom=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
  if(right<=left||bottom<=top)return headCanvas;
  const eyes=frontFeatures?.eyes||[[76,96],[116,96]];
  const eyeDistance=Math.abs(eyes[1][0]-eyes[0][0]);
  const skullWidth=Math.max(72,Math.min(112,eyeDistance*2.4));
  const viewEyes=directionFeatures?.eyes||eyes;
  const eyeY=viewEyes.reduce((total,eye)=>total+eye[1],0)/viewEyes.length;
  const side=direction==='right'||direction==='left';
  const drawWidth=Math.min(178,skullWidth*(side?spec.sideWidth:spec.width));
  const brimY=eyeY-spec.forehead+(direction==='up'?2:0);
  const naturalHeight=(bottom-top)*drawWidth/(right-left);
  const drawHeight=Math.min(naturalHeight,spec.height,brimY-8);
  let anchor=.5;
  // The profile bill projects beyond the scalp; align the crown, not the
  // image rectangle's midpoint, with the skull.
  if(['cap','officer'].includes(hatName)&&side)anchor=direction==='right'?.42:.58;
  else if(hatName==='beret'&&side)anchor=direction==='right'?.47:.53;
  const center=direction==='down'?(eyes[0][0]+eyes[1][0])/2:96;
  const drawX=Math.max(6,Math.min(186-drawWidth,center-drawWidth*anchor));
  const drawY=brimY-drawHeight;
  const layer=document.createElement('canvas');layer.width=192;layer.height=256;
  const h=layer.getContext('2d');
  h.drawImage(hatCanvas,left,top,right-left,bottom-top,drawX,drawY,drawWidth,drawHeight);
  const hatPixels=h.getImageData(0,0,192,256).data;
  const band=new Int16Array(192);band.fill(-1);
  for(let y=0;y<256;y++)for(let x=0;x<192;x++)if(hatPixels[(y*192+x)*4+3]>80)band[x]=y;
  const context=headCanvas.getContext('2d');
  // A fitted hat contains the crown and tied-up hair. Long hair, braids and
  // curls below the band remain visible; no hair can poke through its top.
  context.save();context.globalCompositeOperation='destination-out';
  for(let x=0;x<192;x++)context.fillRect(x,0,1,band[x]>=0?band[x]-1:brimY-7);
  context.restore();context.drawImage(layer,0,0);
  return headCanvas;
}

  function head(L,dir,blink=false) {
    const signature=identityKey(L)+'|'+L.expr+'|'+dir+'|'+blink;if(heads.has(signature))return heads.get(signature);
    const id=`hair/${L.hairS}/${dir}`,out=cv(192,256),g=out.getContext('2d');g.drawImage(paint(id,L,'head'),0,0);
    const faceShape=L.face,shape={round:[1.03,.98],angular:[.97,1.02],long:[.94,1.08],square:[1.06,.99],heart:[1.03,1],oval:[.97,1.03],diamond:[1.06,1.03],oblong:[.94,1.07],pear:[1.05,1.03],triangle:[1.06,1.02],wide:[1.12,.98],petite:[.92,.96],strong:[1.09,1.02],button:[.97,.94]}[faceShape]||[1,1];
    facialHair(g,L,dir,DATA.headFeatures?.[id]);
    faceDetails(g,{...L,_blink:blink},dir,DATA.headFeatures?.[id]);
    if(L.acc==='headphones'){path(g,'#343239',8,[55,86,54,51,77,29,117,29,137,52,138,87]);for(const x of [55,138]){g.fillStyle=L.accC||'#4d4654';g.beginPath();g.roundRect(x-6,78,12,23,5);g.fill();}}
    if(L.hat!=='none')fitHat(out,paint(`hat/${L.hat==='hood'?'beanie':L.hat}/${dir}`,L,'hat'),L,dir,DATA.headFeatures?.[`hair/${L.hairS}/down`],DATA.headFeatures?.[id]);
    let faceScale=[1,1];
    if(faceShape!=='soft'){
      // Apply one transform to hair, face and facial hair together, with
      // explicit canvas margins so wide/long faces cannot crop a hairstyle.
      const base=cv(192,256);base.getContext('2d').drawImage(out,0,0);const a=g.getImageData(0,0,192,256).data;let left=192,right=0,top=256,bottom=0;
      for(let y=0;y<256;y++)for(let x=0;x<192;x++)if(a[(y*192+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      const sx=Math.min(shape[0],90/Math.max(1,96-left),90/Math.max(1,right-96)),sy=Math.min(shape[1],129/Math.max(1,135-top),114/Math.max(1,bottom-135));
      faceScale=[sx,sy];
      g.clearRect(0,0,192,256);g.save();g.translate(96,135);g.scale(sx,sy);g.drawImage(base,-96,-135);g.restore();
    }
    out.bagseedEyes=(DATA.headFeatures?.[id]?.eyes||[]).map(([x,y])=>[96+(x-96)*faceScale[0],135+(y-135)*faceScale[1]]);
    if(heads.size>200)heads.clear();heads.set(signature,out);return out;
  }
  function body(L,dir,nose=false,density=1) {
    const signature=JSON.stringify([L.skin,L.topS,L.shirtC,L.bottomS,L.pantsC,L.shoesS,L.shoesC,L.acc,L.accC,L.topPat,L.topC2,L.botPat,L.botC2,L.emb,dir,nose,density]);if(bodies.has(signature))return bodies.get(signature);
    const out=cv(96*density,108*density),g=out.getContext('2d');g.scale(density,density);
    const asset=id=>density>1&&images.has('hires/'+id)?'hires/'+id:id;
    const top=asset(`${nose?'nose':'top'}/${L.topS}/${dir}`),full=paint(top,L,'top');
    const bottomId=asset(`bottom/${L.bottomS==='pjs'?'jeans':L.bottomS}/${dir}`),side=dir==='right'||dir==='left';
    // Component sheets use different proportions. Register trousers to the
    // torso's waist and shoes to its ankles before layering, once per body.
    const lowerScale=side?1.9:1.8,shoeScale=side?1.25:1.5;
    const fullSuit=['overalls','pjs','suit'].includes(L.topS);
    const waist={tee:73,tank:73,hoodie:75,flannel:76,sweater:75,cardigan:76,work:75,crop:71,jacket:74,garden:75,pjs:75,labcoat:75,suit:75,officer:75}[L.topS]||75;
    if(!fullSuit){
      g.save();g.beginPath();g.rect(0,68,96,32);g.clip();g.translate(48,0);g.scale(lowerScale,1);const lower=paint(bottomId,L,'bottom'),ld=lower.width/96;g.drawImage(lower,0,76*ld,96*ld,31*ld,-48,68,96,39);g.restore();
    }
    const overlay=cv(full.width,full.height),o=overlay.getContext('2d',{willReadFrequently:true});o.drawImage(full,0,0);
    const a=o.getImageData(0,0,full.width,full.height),raw=pixels(top).data.data,d=full.width/96;
    for(let yy=0;yy<full.height;yy++)for(let xx=0;xx<full.width;xx++){
      const i=(yy*full.width+xx)*4,y=yy/d,x=xx/d;
      const hand=y<88&&(x<37||x>59)&&bodySkinPixel(raw[i],raw[i+1],raw[i+2]);
      const hem=L.topS==='labcoat'?y<94:L.topS==='garden'?y<83:y<waist;
      if(y>=100||(!fullSuit&&!hem&&!hand))a.data[i+3]=0;
    }
    o.putImageData(a,0,0);
    // A shared neck/waist/ankle skeleton is used by every garment. The old
    // torso reached the hips and compressed the legs into the bottom quarter.
    g.drawImage(overlay,0,0,96*d,41*d,0,0,96,41);
    g.drawImage(overlay,0,41*d,96*d,(waist-41)*d,0,41,96,28);
    g.drawImage(overlay,0,waist*d,96*d,(107-waist)*d,0,69,96,38);
    // Exclude the feet baked into clothing sheets. The selected footwear is
    // the only shoe layer; its ankle overlaps the trousers by a few pixels.
    const shoeTop=['boots','rainboots'].includes(L.shoesS)?94:99;
    g.clearRect(0,shoeTop,96,108-shoeTop);
    g.save();g.beginPath();g.rect(0,shoeTop,96,108-shoeTop);g.clip();g.translate(48,0);g.scale(shoeScale,1);g.drawImage(paint(asset(`shoe/${L.shoesS}/${dir}`),L,'shoe'),-48,0,96,108);g.restore();
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
    if(bodies.size>200)bodies.clear();bodies.set(signature,out);return out;
  }
  function generic(L,dir,nose=false,blink=false,density=1) {
    const out=cv(96*density,108*density),stage=cv(96*density,144*density),g=stage.getContext('2d'),B=body(L,dir,nose,3),H=head(L,dir,blink);g.scale(density,density);g.translate(0,36);
    const width={slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[L.body]||1;
    const short=!!L.short,kid=isChild(L),sy=kid?.74:short?.9:L.body==='tall'?1.07:1;
    const neckY=107-66*sy,headScale=kid?.9:1,headY=neckY-43*headScale;
    const presentation=L.pres==='masc'?1.045:L.pres==='fem'?.955:1;
    const drawHead=()=>g.drawImage(H,48-32*headScale,headY,64*headScale,H.height/3*headScale);
    drawHead();
    g.save();g.translate(48,107);g.scale(width*presentation,sy);g.drawImage(B,-48,-107,96,108);g.restore();
    g.save();g.beginPath();g.rect(0,-36,96,neckY+38);g.clip();drawHead();g.restore();
    if(nose){g.save();g.beginPath();g.rect(0,0,96,neckY+3);g.clip();g.translate(48,107);g.scale(width*presentation,sy);g.drawImage(B,-48,-107,96,108);g.restore();}
    if(L.prop&&!nose&&dir!=='up')props(g,L,dir);
    // Fit the complete silhouette once, at the feet. Tall bodies and tall
    // hairstyles used to lose their crowns at the fixed sprite canvas edge.
    const w=stage.width,h=stage.height,a=g.getImageData(0,0,w,h).data;let top=h-1;
    for(let y=0;y<h&&top===h-1;y++)for(let x=0;x<w;x++)if(a[(y*w+x)*4+3]>80){top=y;break;}
    const fit=Math.min(1,104/Math.max(1,143-top/density)),o=out.getContext('2d');
    o.scale(density,density);o.translate(48,107);o.scale(fit,fit);o.drawImage(stage,-48,-143,96,144);
    out.bagseedEyes=H.bagseedEyes.map(([x,y])=>[48+((x-96)*headScale/3)*fit,107+(headY+y*headScale/3-107)*fit]);
    return out;
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
    const a=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,96,108).data,skin=rgb(L.skin),sRatio=skin[0]/Math.max(1,skin[1]);let points=[];
    for(let y=54;y<85;y++)for(let x=14;x<82;x++){
      const i=(y*96+x)*4;if(a[i+3]<120)continue;const ratio=a[i]/Math.max(1,a[i+1]);
      if(Math.abs(ratio-sRatio)<.22&&Math.abs(a[i+1]/Math.max(1,a[i+2])-skin[1]/Math.max(1,skin[2]))<.45&&a[i]>a[i+1]*1.12&&a[i+1]>a[i+2]*1.1){
        const expected=dir==='down'||dir==='up'?28:dir==='right'?50:46;
        points.push({x,y,score:Math.abs(x-expected)*1.3+Math.abs(y-72)*.35});
      }
    }
    points.sort((a,b)=>a.score-b.score);const near=points.slice(0,8);
    return near.length?{x:near.reduce((s,p)=>s+p.x,0)/near.length,y:near.reduce((s,p)=>s+p.y,0)/near.length}:{x:dir==='down'||dir==='up'?31:48,y:72};
  }
  function animate(source,L,dir,frame,breath,blink,act,rig,density=1) {
    const out=cv(96*density,108*density),g=out.getContext('2d');g.scale(density,density);g.imageSmoothingEnabled=source.width>=out.width;g.imageSmoothingQuality='high';
    if(rig&&frame){
      // Move one continuous silhouette. Cutting a drawing at x=48/y=79
      // severed overlapping profile legs and exposed rectangular seams.
      const phase=frame===1?1:frame===3?-1:0,side=dir==='right'||dir==='left';
      g.save();g.translate(48,107);g.transform(1,0,phase*(side?.018:.01),frame%2?.988:1,0,0);g.drawImage(source,-48,-107,96,108);g.restore();
    }else if(breath){g.save();g.translate(48,107);g.scale(1,.99);g.drawImage(source,-48,-107,96,108);g.restore();}
    else g.drawImage(source,0,0,96,108);
    if(act&&dir!=='up'){
      // Existing interact flag remains visible; a small wrist/forearm lift uses
      // the same illustrated arm pixels, never the old character renderer.
      const x=dir==='left'?34:dir==='right'?46:62,arm=cv(12*density,22*density);arm.getContext('2d').drawImage(out,(x-4)*density,58*density,12*density,22*density,0,0,12*density,22*density);
      g.clearRect(x-4,65,12,15);g.save();g.translate(x+2,61);g.rotate(dir==='left'?.35:-.35);g.drawImage(arm,-6,0,12,22);g.restore();
    }
    out.bagseedEyes=(source.bagseedEyes||[]).map(([x,y])=>rig&&frame?[x+(frame===1?1:frame===3?-1:0)*(dir==='right'||dir==='left'?.018:.01)*(y-107),107+(y-107)*(frame%2?.988:1)]:breath?[x,107+(y-107)*.99]:[x,y]);
    if(density===1)out.bagseedHand=hands(out,L,dir);return out;
  }
  function faceCoordinates(canvas,L){
    const a=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,96,108).data,skin=rgb(L.skin),center=isChild(L)?43:L.short?30:25,rows=[];
    for(let y=Math.max(4,center-14);y<Math.min(70,center+15);y++){
      const xx=[];for(let x=20;x<77;x++){const i=(y*96+x)*4,r=a[i],g=a[i+1],b=a[i+2];if(a[i+3]>120&&lum(r,g,b)>lum(...skin)*.5&&Math.abs(r/Math.max(1,g)-skin[0]/Math.max(1,skin[1]))<.32&&Math.abs(g/Math.max(1,b)-skin[1]/Math.max(1,skin[2]))<.5)xx.push(x);}
      if(xx.length)rows.push({y,x:xx.reduce((s,x)=>s+x,0)/xx.length,width:xx.length,score:xx.length*Math.exp(-Math.pow((y-center)/9,2))});
    }
    rows.sort((a,b)=>b.score-a.score);const row=rows[0]||{x:48,y:center+2,width:20};return {x:row.x,eyeY:Math.round(row.y-2),mouthY:Math.round(row.y+5),width:Math.min(28,Math.max(14,row.width))};
  }
  function sprite(look,dir='down',frame=0,breath=0,blink=0,act=0,nose=false,density=1) {
    if(!loaded)return cv();const L=normalize(look),signature=key(L)+'|'+dir+'|'+[frame,breath,blink,act,nose,density].join(',');if(cache.has(signature))return cache.get(signature);
    const person=canonical.get(approvalKey(L));let source,rig=true;
    if(person&&nose&&person.actions){source=images.get(person.actions[dir]);rig=false;}
    else if(person&&person.id!=='player'&&!nose){source=images.get(person.assets[(!person.rig&&frame?`${dir}-${frame%4}`:`${dir}-idle`)]);rig=!!person.rig;}
    else source=generic(L,dir,nose,!!blink,density);
    const out=animate(source,L,dir,frame,breath,blink,act&&!nose,rig&&!nose,density);
    if(person&&person.id!=='player'&&L.expr!=='neutral'&&dir!=='up'&&!nose){const g=out.getContext('2d'),f=faceCoordinates(out,L);g.save();g.translate(f.x-32,f.eyeY-79/3);g.scale(1/3,1/3);faceDetails(g,{...L,eyes:'round',eyeC:'#2b1d14',brows:'thin',mouth:'default',nose:'default',ears:'normal',extras:[],marks:[],pierce:[],glasses:'none',acc:'none'},dir);g.restore();}
    if(cache.size>600)cache.delete(cache.keys().next().value);cache.set(signature,out);return out;
  }
  function portrait(look) {
    if(!loaded)return cv(192,192);const L=normalize(look),signature=key(L)+'|'+(L.bg||'');if(portraits.has(signature))return portraits.get(signature);
    const out=cv(192,192),g=out.getContext('2d');g.fillStyle=L.bg||'#eadfc9';g.fillRect(0,0,192,192);
    const person=canonical.get(approvalKey(L));
    if(person&&person.id!=='player'){const expression=['happy','grin','laugh','proud'].includes(L.expr)?'friendly':['sad','worried','angry'].includes(L.expr)?'concerned':'neutral';g.drawImage(images.get(person.portraits[expression]),0,0);}
    else{
      const torso=body(L,'down',false,3),d=torso.width/96;
      const width=({slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[L.body]||1)*(L.pres==='masc'?1.045:L.pres==='fem'?.955:1);
      const h=head(L,'down');g.drawImage(h,0,0);
      g.save();g.translate(96,0);g.scale(width,1);g.translate(-96,0);
      g.drawImage(torso,0,40*d,96*d,40*d,-48,124,288,120);
      g.restore();
      g.save();g.beginPath();g.rect(0,0,192,136);g.clip();g.drawImage(h,0,0);g.restore();

    }
    portraits.set(signature,out);return out;
  }
  const originalDrawPortrait=drawPortrait;
  charSprite=sprite;buildChar=sprite;buildPortrait=portrait;
  buildNoseSprite1151=(L,dir)=>sprite(L,dir,0,0,0,0,true);
  drawPerson=function(c,x,y,look,scale=1,anim={},face){
    if(typeof anim==='number')anim={frame:anim,dir:face<0?'left':face>0?'right':'down'};
    let smell=Smell1151.drawing;
    if(!smell&&Smell1151.active?.kind==='staff'&&Smell1151.active.scene===Smell1151.scene()&&Math.abs(x-Smell1151.active.view.x)<1&&Math.abs(y-Smell1151.active.view.y)<1)smell=Smell1151.active;
    const dir=smell?Smell1151.face({x,y}):anim.dir||'down';
    const transform=c.getTransform(),density=Math.max(1,Math.min(3,Math.ceil(Math.max(Math.abs(transform.a),Math.abs(transform.d))*scale/3)));
    const image=sprite(look,dir,smell?0:anim.frame||0,anim.breath?1:0,anim.blink?1:0,anim.act?1:0,!!smell,density);
    c.save();c.imageSmoothingEnabled=image.width>=32*scale*Math.abs(transform.a);c.imageSmoothingQuality='high';c.drawImage(image,Math.round(x)-16*scale,Math.round(y)-36*scale,32*scale,36*scale);c.restore();
    if(scale===1&&NightLamps1151.drawing)NightLamps1151.carry(c,x,y,look,anim);
  };
  Cast115.drawKid=function(c,x,y,look,anim={}){drawPerson(c,x,y,{...look,short:true},1,anim);};
  drawTinyPerson=(c,x,y,look,frame=0,prop)=>drawPerson(c,x,y,{...look,prop},.42,{frame});
  drawCreatorPreview=function(t){
    const canvas=$('#creatorPreview');if(!canvas||!runtime.cr)return;
    if(!canvas.dataset.illustratedDensity){canvas.width=540;canvas.height=288;canvas.dataset.illustratedDensity='3';canvas.style.imageRendering='auto';}
    const g=canvas.getContext('2d');g.setTransform(3,0,0,3,0,0);
    const W=180,H=96,look=creatorLook(runtime.cr),walk=runtime.crWalk!==false&&!settings.reduced,frame=walk?Math.floor(t*6)%4:0;
    R(g,0,0,W,H,'#2a2230');for(let y=H-16;y<H;y+=4)R(g,0,y,W,2,'#352b3c');
    [['FRONT','down'],['SIDE','right'],['BACK','up']].forEach(([label,dir],i)=>{const x=30+i*60;groundShadow(g,x,H-10,22);drawPerson(g,x,H-10,look,2,{dir,frame,breath:!walk&&Math.floor(t/1.4)%2,blink:!walk&&idleBlink(t,i)});pxText(g,label,x-pxTextW(label)/2,3,1,'#b3b89c');});
  };
  CharacterUI115.mirrorDraw=function(){
    const root=$('#panelBody'),canvas=root?.querySelector('canvas[data-draw="person"]');if(!canvas||!root.querySelector('.character-layout115'))return;
    if(!canvas.dataset.illustratedDensity){canvas.width=540;canvas.height=288;canvas.dataset.illustratedDensity='3';canvas.style.imageRendering='auto';}
    const g=canvas.getContext('2d'),look=playerLook();g.setTransform(3,0,0,3,0,0);R(g,0,0,180,96,'#2a2230');
    [['FRONT','down'],['SIDE','right'],['BACK','up']].forEach(([label,dir],i)=>{const x=30+i*60;groundShadow(g,x,86,22);drawPerson(g,x,86,look,2,{dir,frame:0,blink:false,breath:false});pxText(g,label,x-pxTextW(label)/2,3,1,'#b3b89c');});
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
  NightLamps1151.hand=function(x,y,look,anim={}){const dir=anim.dir||'down',hand=sprite(look,dir,anim.frame||0,anim.breath?1:0,0,0).bagseedHand||{x:31,y:72};return {x:x+(hand.x-48)/3,y:y+(hand.y-108)/3,dir};};
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
  window.BagseedArt=Object.freeze({version:'illustrated-1',renderingRevision:'customization-4',ready,sprite,portrait,normalize,key,head,body,assets:DATA.manifest,approved:DATA.approved.map(p=>p.id),cast:DATA.cast.map(p=>({id:p.id,name:p.name,look:p.look,aliases:p.aliases})),get loaded(){return loaded;}});
  ready.catch(error=>console.error('Illustrated character assets failed',error));
})();
