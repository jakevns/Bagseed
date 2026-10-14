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
    let hatMask;const faceAlpha=kind==='head'?faceMask(id).bagseedAlpha:null;
    if(kind==='hat'){
      const w=source.width,h=source.height,seed=new Uint8Array(w*h);hatMask=new Uint8Array(w*h);
      const straw=id.includes('/straw/')||id.includes('/sunhat/');
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,r=p[i],gg=p[i+1],b=p[i+2];if(p[i+3]>50&&y<95&&(straw?y<77&&r>gg&&gg>b*1.3:b>r*1.12&&b>gg*.95))seed[y*w+x]=1;}
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(seed[y*w+x])for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)hatMask[yy*w+xx]=1;}
    }
    for(let i=0;i<p.length;i+=4){if(p[i+3]<16){p[i+3]=0;continue;}
      const x=(i/4)%source.width,y=Math.floor(i/4/source.width),r=p[i],gg=p[i+1],b=p[i+2],l=lum(r,gg,b);
      const isSkin=kind==='top'||kind==='bottom'?bodySkinPixel(r,gg,b):kind==='shoe'?bodySkinPixel(r,gg,b)&&b>gg*.67&&(L.shoesS==='sandals'||y<98):skinPixel(r,gg,b);
      if(kind==='top'&&L.topS==='garden'&&x>32&&x<63&&y>48&&y<87&&r>gg&&gg>b*1.35&&r<gg*1.4)continue;
      let tone,base=160;
      if(kind==='head'||kind==='face'||kind==='facial'){
        if(kind==='head'&&faceAlpha[i/4]>128&&!isSkin){
          if(l<55||!(r>gg+8&&gg>b+6))continue;
          const color=material(skin,l,160);p[i]=color[0];p[i+1]=color[1];p[i+2]=color[2];continue;
        }
        if(isSkin){tone=skin;base=160;}else{tone=hair;base=id.includes('/balding/')?210:52;}
        if(kind==='face'){
          if(l<55||!(r>gg+8&&gg>b+6))continue;
          tone=skin;base=160;
        }
        if(kind==='facial'){
          if(isSkin||y<82||x<48||x>148||l>160){p[i+3]=0;continue;}
          tone=hair;base=52;
        }
        if(kind==='head'&&!isSkin&&L.hairHi!=='none'&&l>65&&(x+y*.5)%24<5)tone=hi;
      }else if(kind==='hat'){
        const straw=id.includes('/straw/')||id.includes('/sunhat/');
        if(!hatMask[y*source.width+x]){p[i+3]=0;continue;}
        tone=rgb(L.hatC||L.capC||(id.includes('/officer/')?'#2a3a5c':id.includes('/wizard/')?'#7d5bd6':straw?'#d9b46a':'#7d9cc8'));base=straw?165:110;
      }else{
        if(isSkin){tone=skin;base=160;}
        else if(kind==='shoe'){tone=shoe;base=62;if(l>190)continue;}
        else if(kind==='bottom'){tone=bot;base=46;if(pattern(L.botPat,x,y)){tone=rgb(L.botC2||'#ffffff');}}
        else{
          const upper=(b>r*1.1&&gg>r*1.05&&l>62)||y<75;
          tone=upper?top:bot;base=upper?115:46;
          if(L.topS==='overalls'&&y>60){tone=top;base=90;}
          if(L.topS==='pjs'&&y>75){tone=top;base=46;}
          if(pattern(upper?L.topPat:L.botPat,x,y))tone=rgb((upper?L.topC2:L.botC2)||'#ffffff');
          // Keep cream undershirts, white coats, brass buttons and ink contours.
          if(r>175&&gg>160&&b>125&&Math.abs(r-gg)<45)continue;
        }
      }
      const lightHair=kind==='head'&&!isSkin&&lum(...hair)>150&&!id.includes('/balding/');
      const edge=lightHair&&[i-4,i+4,i-source.width*4,i+source.width*4].some(n=>n<0||n>=p.length||source.data.data[n+3]<90);
      if(l<30&&!isSkin&&(!lightHair||edge)){p[i]=Math.min(r,40);p[i+1]=Math.min(gg,32);p[i+2]=Math.min(b,28);continue;}
      const mapped=material(tone,lightHair&&!edge?Math.max(l,36):l,base);p[i]=mapped[0];p[i+1]=mapped[1];p[i+2]=mapped[2];
    }
    g.putImageData(d,0,0);if(colored.size>500)colored.clear();colored.set(signature,out);return out;
  }
  function faceMask(id) {
    if(faceMasks.has(id))return faceMasks.get(id);
    const raw=pixels(id),a=raw.data.data,out=cv(192,192),g=out.getContext('2d'),mask=g.createImageData(192,192);
    for(let y=0;y<192;y++){
      let left=192,right=-1;
      for(let x=0;x<192;x++){const i=(y*192+x)*4;if(a[i+3]>100&&skinPixel(a[i],a[i+1],a[i+2])){left=Math.min(left,x);right=Math.max(right,x);mask.data[i+3]=255;}}
      if(y>62&&y<136&&right>left)for(let x=left;x<=right;x++)mask.data[(y*192+x)*4+3]=255;
    }
    g.putImageData(mask,0,0);out.bagseedAlpha=new Uint8Array(192*192);for(let i=0;i<out.bagseedAlpha.length;i++)out.bagseedAlpha[i]=mask.data[i*4+3];faceMasks.set(id,out);return out;
  }
  function path(c,color,width,points,fill=false) {
    c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';if(fill){c.closePath();c.fillStyle=color;c.fill();}else c.stroke();
  }
  function faceDetails(c,L,dir) {
    if(dir==='up')return;
    c.save();if(dir==='left'){c.translate(192,0);c.scale(-1,1);}
    const side=dir!=='down',eyeY=79,mouthY=108,skin=L.skin,ink='#59372c';
    const eyes=side?[113]:[78,110];
    const eyeScale={dot:.94,round:1,wide:1.1,sleepy:.74,lashed:1,almond:.9,hooded:.8,monolid:.72,upturned:.95,downturned:.94,big:1.15,narrow:.68,starry:1.1,heavy:.78,lashed2:1.04}[L.eyes]||1;
    if(eyeScale!==1)for(const x of eyes){const patch=cv(20,16);patch.getContext('2d').drawImage(c.canvas,x-10,eyeY-8,20,16,0,0,20,16);path(c,skin,14,[x-8,eyeY,x+8,eyeY]);c.drawImage(patch,x-10,eyeY-8*eyeScale,20,16*eyeScale);}
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
  function head(L,dir) {
    const signature=identityKey(L)+'|'+L.expr+'|'+dir;if(heads.has(signature))return heads.get(signature);
    const id=`hair/${L.hairS}/${dir}`,out=cv(192,192),g=out.getContext('2d');g.drawImage(paint(id,L,'head'),0,0);
    const trait=traits.get(key(L));
    const faceShape=trait?.age>=60?(L.pres==='fem'?'triangle':L.face==='square'?'strong':'wide'):trait?.kid?'petite':L.face;
    const face=cv(192,192),f=face.getContext('2d'),faceId=`face/${faceShape}/${dir}`;
    if(L.face!=='soft'||trait?.age>=60||trait?.kid){f.drawImage(paint(faceId,L,'face'),0,0);f.globalCompositeOperation='destination-in';f.drawImage(faceMask(id),0,0);g.drawImage(face,0,0);}
    if(L.facial!=='none')g.drawImage(paint(`facial/${L.facial}/${dir}`,L,'facial'),0,0);
    faceDetails(g,L,dir);
    if(L.acc==='headphones'){path(g,'#343239',8,[55,86,54,51,77,29,117,29,137,52,138,87]);for(const x of [55,138]){g.fillStyle=L.accC||'#4d4654';g.beginPath();g.roundRect(x-6,78,12,23,5);g.fill();}}
    if(L.hat!=='none')g.drawImage(paint(`hat/${L.hat==='hood'?'beanie':L.hat}/${dir}`,L,'hat'),0,0);
    if(heads.size>200)heads.clear();heads.set(signature,out);return out;
  }
  function body(L,dir,nose=false) {
    const signature=JSON.stringify([L.skin,L.topS,L.shirtC,L.bottomS,L.pantsC,L.shoesS,L.shoesC,L.acc,L.accC,L.topPat,L.topC2,L.botPat,L.botC2,L.emb,dir,nose]);if(bodies.has(signature))return bodies.get(signature);
    const out=cv(),g=out.getContext('2d'),top=`${nose?'nose':'top'}/${L.topS}/${dir}`;
    const full=paint(top,L,'top');
    const bottomId=`bottom/${L.bottomS==='pjs'?'jeans':L.bottomS}/${dir}`;
    g.drawImage(paint(bottomId,L,'bottom'),0,0);g.drawImage(full,0,0);
    if(!['overalls','pjs','suit'].includes(L.topS)){
      // Keep hands and long coat/apron hems over independently chosen bottoms.
      const overlay=cv(),o=overlay.getContext('2d',{willReadFrequently:true});o.drawImage(full,0,0);const a=o.getImageData(0,0,96,108),raw=pixels(top).data.data;
      for(let y=76;y<108;y++)for(let x=0;x<96;x++){const i=(y*96+x)*4,r=raw[i],gg=raw[i+1],b=raw[i+2];if(!bodySkinPixel(r,gg,b)&&!(['labcoat','garden'].includes(L.topS)&&y<(L.topS==='labcoat'?94:87))){a.data[i+3]=0;}}
      o.putImageData(a,0,0);g.clearRect(0,0,96,108);g.drawImage(paint(bottomId,L,'bottom'),0,0);g.drawImage(overlay,0,0);
    }
    // Footwear is its own authored asset, including bare skin in open sandals.
    g.clearRect(0,L.shoesS==='boots'||L.shoesS==='rainboots'?96:101,96,12);g.drawImage(paint(`shoe/${L.shoesS}/${dir}`,L,'shoe'),0,0);
    if(L.acc==='bandana'||L.acc==='scarf'){
      const color=L.accC||(L.acc==='bandana'?'#c94f4f':'#d26aa0');path(g,color,3,[39,43,48,46,57,43]);path(g,color,4,L.acc==='scarf'?[54,46,57,58]:[44,46,48,51,52,46]);
    }
    if(L.acc==='necklace'&&dir!=='up'){path(g,L.accC||'#d6b25a',.8,[40,45,43,49,48,51,53,49,56,45]);g.fillStyle=L.accC||'#d6b25a';g.beginPath();g.ellipse(48,52,1.5,2,0,0,7);g.fill();}
    if(L.acc==='belt'){path(g,L.accC||'#664a32',2,[35,77,48,78,61,77]);if(dir!=='up'){g.strokeStyle='#d5b470';g.lineWidth=.7;g.strokeRect(46,76,4,3);}}
    if(L.acc==='bag'){
      const color=L.accC||'#986642';path(g,color,1.7,[38,44,59,76]);g.fillStyle=color;g.strokeStyle='#543c2d';g.lineWidth=.8;g.beginPath();g.roundRect(55,72,13,12,2);g.fill();g.stroke();path(g,'#b58a62',.8,[56,76,67,76]);g.fillStyle='#d6b25a';g.fillRect(61,77,1.3,1.5);
    }
    if(L.topPat==='emblem'&&dir!=='up'){
      const icon=CLPAT.icon[L.emb]||CLPAT.icon.star,cx=dir==='down'?45:48;g.fillStyle=L.topC2||'#efe3c4';icon.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='x')g.fillRect(cx+x,56+y,1,1);}));
    }
    if(bodies.size>200)bodies.clear();bodies.set(signature,out);return out;
  }
  function generic(L,dir,nose=false,canonicalImage=null) {
    const out=cv(),g=out.getContext('2d'),B=body(L,dir,nose),H=canonicalImage?null:head(L,dir);
    const width={slim:.84,average:1,broad:1.15,curvy:1.08,stocky:1.2,tall:.91}[L.body]||1;
    const short=!!L.short,kid=isChild(L),sy=kid?.74:short?.9:L.body==='tall'?1.07:1;
    const neckY=107-66*sy,headScale=kid?.9:1,headY=neckY-43*headScale;
    const presentation=L.pres==='masc'?1.045:L.pres==='fem'?.955:1;
    g.save();g.translate(48,107);g.scale(width*presentation,sy);g.drawImage(B,-48,-107);g.restore();
    if(canonicalImage){const cut=kid?65:44;if(nose){const waist=Math.round(107-32*sy);g.drawImage(canonicalImage,0,waist,96,108-waist,0,waist,96,108-waist);}g.drawImage(canonicalImage,0,0,96,cut,0,0,96,cut);}
    else g.drawImage(H,48-32*headScale,headY,64*headScale,64*headScale);
    if(nose){g.save();g.beginPath();g.rect(0,0,96,neckY+3);g.clip();g.translate(48,107);g.scale(width*presentation,sy);g.drawImage(B,-48,-107);g.restore();}
    if(L.prop&&!nose&&dir!=='up')props(g,L,dir);
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
  function animate(source,L,dir,frame,breath,blink,act,rig) {
    const out=cv(),g=out.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    if(rig&&frame){
      const phase=frame===1?1:frame===3?-1:0;
      const hip=isChild(L)?86:79,side=dir==='right'||dir==='left';
      for(let leg=0;leg<2;leg++){
        const sign=leg?-1:1;g.save();g.translate(48,hip);
        if(side)g.rotate(sign*phase*.18*(dir==='left'?-1:1));else g.translate(sign*phase,sign*phase<0?-1.5:0);
        g.drawImage(source,leg*48,hip,48,108-hip,leg*48-48,0,48,108-hip);g.restore();
      }
      g.drawImage(source,0,0,96,hip+2,0,frame%2?-1:0,96,hip+2);
    }else if(breath){g.drawImage(source,0,0,96,77,0,-1,96,78);g.drawImage(source,0,77,96,31,0,77,96,31);}
    else g.drawImage(source,0,0);
    if(blink&&dir!=='up'){
      const metrics=faceCoordinates(out,L),y=metrics.eyeY,xs=dir==='down'?[metrics.x-metrics.width*.23,metrics.x+metrics.width*.23]:[metrics.x+(dir==='right'?1:-1)*metrics.width*.16];
      for(const x of xs){const strip=g.getImageData(x-3,y-5,7,2);const temp=cv(7,2);temp.getContext('2d').putImageData(strip,0,0);g.drawImage(temp,x-3,y-2,7,5);path(g,'#4a3028',.8,[x-2,y+1,x+3,y+1]);}
    }
    if(act&&dir!=='up'){
      // Existing interact flag remains visible; a small wrist/forearm lift uses
      // the same illustrated arm pixels, never the old character renderer.
      const x=dir==='left'?34:dir==='right'?46:62,arm=cv(12,22);arm.getContext('2d').drawImage(out,x-4,58,12,22,0,0,12,22);
      g.clearRect(x-4,65,12,15);g.save();g.translate(x+2,61);g.rotate(dir==='left'?.35:-.35);g.drawImage(arm,-6,0);g.restore();
    }
    out.bagseedHand=hands(out,L,dir);return out;
  }
  function faceCoordinates(canvas,L){
    const a=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,96,108).data,skin=rgb(L.skin),center=isChild(L)?43:L.short?30:25,rows=[];
    for(let y=Math.max(4,center-14);y<Math.min(70,center+15);y++){
      const xx=[];for(let x=20;x<77;x++){const i=(y*96+x)*4,r=a[i],g=a[i+1],b=a[i+2];if(a[i+3]>120&&lum(r,g,b)>lum(...skin)*.5&&Math.abs(r/Math.max(1,g)-skin[0]/Math.max(1,skin[1]))<.32&&Math.abs(g/Math.max(1,b)-skin[1]/Math.max(1,skin[2]))<.5)xx.push(x);}
      if(xx.length)rows.push({y,x:xx.reduce((s,x)=>s+x,0)/xx.length,width:xx.length,score:xx.length*Math.exp(-Math.pow((y-center)/9,2))});
    }
    rows.sort((a,b)=>b.score-a.score);const row=rows[0]||{x:48,y:center+2,width:20};return {x:row.x,eyeY:Math.round(row.y-2),mouthY:Math.round(row.y+5),width:Math.min(28,Math.max(14,row.width))};
  }
  function sprite(look,dir='down',frame=0,breath=0,blink=0,act=0,nose=false) {
    if(!loaded)return cv();const L=normalize(look),signature=key(L)+'|'+dir+'|'+[frame,breath,blink,act,nose].join(',');if(cache.has(signature))return cache.get(signature);
    const person=canonical.get(approvalKey(L));let source,rig=true;
    if(person&&!nose){source=images.get(person.assets[(!person.rig&&frame?`${dir}-${frame%4}`:`${dir}-idle`)]);rig=!!person.rig;}
    else {const owner=person||identities.get(identityKey(L));source=generic(L,dir,nose,owner?images.get(owner.assets[dir+'-idle']):null);}
    const out=animate(source,L,dir,frame,breath,blink,act&&!nose,rig&&!nose);
    if(person&&L.expr!=='neutral'&&dir!=='up'&&!nose){const g=out.getContext('2d'),f=faceCoordinates(out,L);g.save();g.translate(f.x-32,f.eyeY-79/3);g.scale(1/3,1/3);faceDetails(g,{...L,eyes:'round',eyeC:'#2b1d14',brows:'thin',mouth:'default',nose:'default',ears:'normal',extras:[],marks:[],pierce:[],glasses:'none',acc:'none'},dir);g.restore();}
    if(cache.size>600)cache.delete(cache.keys().next().value);cache.set(signature,out);return out;
  }
  function portrait(look) {
    if(!loaded)return cv(192,192);const L=normalize(look),signature=key(L)+'|'+(L.bg||'');if(portraits.has(signature))return portraits.get(signature);
    const out=cv(192,192),g=out.getContext('2d');g.fillStyle=L.bg||'#eadfc9';g.fillRect(0,0,192,192);
    const person=canonical.get(approvalKey(L));
    if(person){const expression=['happy','grin','laugh','proud'].includes(L.expr)?'friendly':['sad','worried','angry'].includes(L.expr)?'concerned':'neutral';g.drawImage(images.get(person.portraits[expression]),0,0);}
    else{
      g.drawImage(body(L,'down'),0,40,96,40,-48,124,288,120);
      const owner=identities.get(identityKey(L));
      if(owner){
        const face=cv(192,192),f=face.getContext('2d',{willReadFrequently:true});f.drawImage(images.get(owner.portraits.neutral),0,0);const a=f.getImageData(0,0,192,192),d=a.data,hair=rgb(L.hairC),hairLight=lum(...hair);
        for(let y=126;y<192;y++)for(let x=0;x<192;x++){const i=(y*192+x)*4,r=d[i],gg=d[i+1],b=d[i+2],isHair=Math.abs(r/Math.max(1,gg)-hair[0]/Math.max(1,hair[1]))<.3&&Math.abs(gg/Math.max(1,b)-hair[1]/Math.max(1,hair[2]))<.45&&lum(r,gg,b)<Math.max(80,hairLight*1.7);if(!(y<145&&x>65&&x<126&&skinPixel(r,gg,b))&&!(isHair&&(y<145||x<68||x>126)))d[i+3]=0;}
        f.putImageData(a,0,0);g.drawImage(face,0,0);
      }else g.drawImage(head(L,'down'),0,0);
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
    const image=sprite(look,dir,smell?0:anim.frame||0,anim.breath?1:0,anim.blink?1:0,anim.act?1:0,!!smell);
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,Math.round(x)-16*scale,Math.round(y)-36*scale,32*scale,36*scale);c.restore();
    if(scale===1&&NightLamps1151.drawing)NightLamps1151.carry(c,x,y,look,anim);
  };
  Cast115.drawKid=function(c,x,y,look,anim={}){drawPerson(c,x,y,{...look,short:true},1,anim);};
  drawTinyPerson=(c,x,y,look,frame=0,prop)=>drawPerson(c,x,y,{...look,prop},.42,{frame});
  drawPortrait=function(canvas,look){
    if(!loaded)return originalDrawPortrait(canvas,look);
    if(canvas.isConnected&&!canvas.dataset.illustratedDensity){const style=getComputedStyle(canvas);canvas.style.width=style.width;canvas.style.height=style.height;canvas.style.imageRendering='auto';canvas.width*=3;canvas.height*=3;canvas.dataset.illustratedDensity='3';}
    const g=canvas.getContext('2d');g.clearRect(0,0,canvas.width,canvas.height);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(portrait(look),0,0,canvas.width,canvas.height);
    if(runtime.curDialog?.smell1151&&Smell1151.active?.dialog===runtime.curDialog&&$('#dialog')?.querySelector('canvas')===canvas){
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
  window.BagseedArt=Object.freeze({version:'illustrated-1',ready,sprite,portrait,normalize,key,head,body,assets:DATA.manifest,approved:DATA.approved.map(p=>p.id),cast:DATA.cast.map(p=>({id:p.id,name:p.name,look:p.look,aliases:p.aliases})),get loaded(){return loaded;}});
  ready.catch(error=>console.error('Illustrated character assets failed',error));
})();
