// Detail anchors belong to the current bald artwork, in its native 192x320
// coordinates. They are transformed once with the complete head afterward.
const faceFits={round:[1.03,.98],angular:[.97,1.02],long:[.94,1.08],square:[1.06,.99],heart:[1.03,1],oval:[.97,1.03],diamond:[1.06,1.03],oblong:[.94,1.07],pear:[1.05,1.03],triangle:[1.06,1.02],wide:[1.12,.98],petite:[.92,.96],strong:[1.09,1.02],button:[.97,.94]};
const earFits={small:[.7,.76],large:[1.25,1.18],round:[1.16,1.08],lobed:[1,1.25],flat:[.52,.94],pointed:[1.12,1.04],elf:[1.32,1.12]};
const earAnatomy=new Map();
function detailGeometry(L,dir){
  const f=DATA.detailLandmarks.views[dir],size=earFits[L.ears]||[1,1];
  return {...f,ears:L.ears==='hidden'?[]:f.ears.map(e=>({...e,center:[e.hinge[0]+(e.center[0]-e.hinge[0])*size[0],e.hinge[1]+(e.center[1]-e.hinge[1])*size[1]],lobe:[e.hinge[0]+(e.lobe[0]-e.hinge[0])*size[0],e.hinge[1]+(e.lobe[1]-e.hinge[1])*size[1]]}))};
}
function detailHeadphones(g,L,dir){
  const f=detailGeometry(L,dir),ears=f.ears.length?f.ears:DATA.detailLandmarks.views[dir].ears,side=dir==='right'||dir==='left',sign=dir==='left'?-1:1,color=L.accC||'#4d4654';
  g.save();g.strokeStyle='#343239';g.lineWidth=5.5;g.lineCap='round';g.beginPath();
  if(side){const[x,y]=ears[0].center;g.moveTo(x,y-5);g.quadraticCurveTo(x+sign*3,113,x+sign*15,105);g.quadraticCurveTo(x+sign*25,99,x+sign*40,112);}
  else {const sorted=[...ears].sort((a,b)=>a.center[0]-b.center[0]),a=sorted[0].center,b=sorted[1].center;g.moveTo(a[0],a[1]-4);g.bezierCurveTo(a[0]-3,78,b[0]+3,78,b[0],b[1]-4);}g.stroke();
  for(const ear of ears){const[x,y]=ear.center;g.fillStyle='#27262e';g.beginPath();g.roundRect(x-7,y-11,14,24,5);g.fill();g.fillStyle=color;g.beginPath();g.roundRect(x-5,y-9,10,20,4);g.fill();path(g,'#8d8993',1,[x-3,y-6,x-3,y+6]);}
  g.restore();
}
function transformedDetails(L,dir){
  const f=detailGeometry(L,dir),[sx,sy]=faceFits[L.face]||[1,1],point=([x,y])=>[96+(x-96)*sx,HEAD_NECK+(y-HEAD_NECK)*sy];
  return {...f,eyes:f.eyes.map(point),brows:f.brows.map(point),irises:f.irises.map(point),cheeks:f.cheeks.map(point),mouth:f.mouth&&point(f.mouth),nose:f.nose&&point(f.nose),chin:f.chin&&point(f.chin),bridge:f.bridge&&point(f.bridge),ears:f.ears.map(e=>({...e,center:point(e.center),hinge:point(e.hinge),lobe:point(e.lobe)}))};
}
function earPath(g,e){
  g.beginPath();if(e.inset)g.ellipse(e.center[0],e.center[1],11.5,15.5,0,0,Math.PI*2);
  else {g.moveTo(...e.mask[0]);for(const p of e.mask.slice(1))g.lineTo(...p);g.closePath();}
}
// Reconstruct only a small feature's skin from its neighbouring painted skin.
// This removes the original mouth/brow/ear ink instead of leaving a second one
// below the new feature. It never touches hair or a broad forehead/face plate.
function skinRepair(g,box,axis='y',ellipse=true){
  const [x,y,w,h]=box.map(Math.round),im=g.getImageData(x,y,w,h),a=im.data;
  const source=g.getImageData(0,0,192,HEAD_HEIGHT).data;
  const anchor=(125*192+96)*4,reference=[...source.slice(anchor,anchor+3)],level=lum(...reference),rg=reference[0]/Math.max(1,reference[1]),gb=reference[1]/Math.max(1,reference[2]);
  const sample=(cx,cy)=>{
    for(let radius=0;radius<=10;radius++)for(const [dx,dy]of radius?[[0,-radius],[0,radius],[-radius,0],[radius,0],[-radius,-radius],[radius,radius]]:[[0,0]]){
      const xx=cx+dx,yy=cy+dy;if(xx<0||xx>=192||yy<0||yy>=HEAD_HEIGHT)continue;const n=(yy*192+xx)*4,r=source[n],gg=source[n+1],b=source[n+2],l=lum(r,gg,b);
      if(source[n+3]>180&&l>level*.55&&l<level*1.5&&Math.abs(r/Math.max(1,gg)-rg)<.075&&Math.abs(gg/Math.max(1,b)-gb)<.12)return [r,gg,b];
    }
    return reference;
  };
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
    if(ellipse&&((xx-w/2)/(w/2))**2+((yy-h/2)/(h/2))**2>1)continue;
    const n=(yy*w+xx)*4;if(a[n+3]<160)continue;
    const vertical=axis==='y'||axis==='above',p=sample(vertical?x+xx:x-2,vertical?y-2:y+yy),q=sample(vertical?x+xx:x+w+1,axis==='above'?y-5:vertical?y+h+1:y+yy),t=vertical?yy/Math.max(1,h-1):xx/Math.max(1,w-1);
    for(let k=0;k<3;k++)a[n+k]=p[k]*(1-t)+q[k]*t;
  }
  g.putImageData(im,x,y);
}
function detailBase(L,dir){
  const base=baldBase(L,dir);if(['normal','cuff'].includes(L.ears))return base;
  const signature=[dir,L.skin,L.hairC,L.ears].join('|');if(earAnatomy.has(signature))return earAnatomy.get(signature);
  const out=cv(192,HEAD_HEIGHT),g=out.getContext('2d');g.drawImage(base,0,0);
  for(const ear of DATA.detailLandmarks.views[dir].ears){
    const layer=cv(192,HEAD_HEIGHT),e=layer.getContext('2d');e.save();earPath(e,ear);e.clip();e.drawImage(base,0,0);e.restore();
    if(!ear.inset){
      // The ear cutout must exclude the neighbouring cheek/skull contour.
      // Stretching that contour with a long lobe produced a second jaw line.
      const data=e.getImageData(0,0,192,HEAD_HEIGHT),a=data.data,side=Math.sign(ear.center[0]-ear.hinge[0]);
      for(let y=ear.bounds[1];y<ear.bounds[3];y++){
        let edge=ear.edge.at(-1)[0];for(let i=1;i<ear.edge.length;i++){const p=ear.edge[i-1],q=ear.edge[i];if(y>=p[1]&&y<=q[1]){edge=p[0]+(q[0]-p[0])*(y-p[1])/(q[1]-p[1]);break;}}
        for(let x=ear.bounds[0];x<ear.bounds[2];x++)if(y>ear.lobe[1]+3||side*(x-edge)<1)a[(y*192+x)*4+3]=0;
      }e.putImageData(data,0,0);
    }
    if(ear.inset)skinRepair(g,ear.bounds.map((v,i)=>i>1?v-ear.bounds[i-2]:v),'x',false);
    else {g.save();g.globalCompositeOperation='destination-out';earPath(g,ear);g.fill();g.restore();
      const tone=rgb(L.skin).map(v=>Math.round(v*.4)),alpha=g.getImageData(0,0,192,HEAD_HEIGHT).data,side=Math.sign(ear.center[0]-ear.hinge[0]),edge=[];
      for(let y=ear.bounds[1];y<ear.bounds[3];y+=2){for(let step=0;step<192;step++){const x=side<0?step:191-step;if(alpha[(y*192+x)*4+3]>180){edge.push(x-side*.4,y);break;}}}
      g.save();g.globalCompositeOperation='source-atop';path(g,'rgb('+tone.join(',')+')',1.1,edge);g.restore();
    }
    if(L.ears==='hidden')continue;
    const [sx,sy]=earFits[L.ears]||[1,1],[hx,hy]=ear.hinge;
    if(['pointed','elf'].includes(L.ears)){
      const side=Math.sign(ear.center[0]-hx),reach=L.ears==='elf'?24:18,tip=[hx+side*reach,hy-(L.ears==='elf'?22:16)],tone=rgb(L.skin),color=f=>'rgb('+tone.map(v=>Math.min(255,v*f)).join(',')+')';
      const fill=g.createLinearGradient(hx,hy-15,hx,hy+15);fill.addColorStop(0,color(1.08));fill.addColorStop(1,color(.82));
      g.fillStyle=fill;g.strokeStyle=color(.43);g.lineWidth=1.1;g.beginPath();g.moveTo(hx,hy-8);g.quadraticCurveTo(hx+side*7,hy-13,...tip);g.quadraticCurveTo(hx+side*reach,hy+5,hx+side*6,hy+13);g.quadraticCurveTo(hx+side*2,hy+15,hx,hy+8);g.closePath();g.fill();g.stroke();
      path(g,color(.66),1.1,[hx+side*3,hy-3,tip[0]-side*4,tip[1]+5,hx+side*8,hy+6]);
    }else {g.save();g.translate(hx,hy);g.scale(sx,sy);g.drawImage(layer,-hx,-hy);g.restore();}
  }
  if(earAnatomy.size>100)earAnatomy.clear();earAnatomy.set(signature,out);return out;
}
// These silhouettes are drawn in the bald head's native coordinates. Deliberate
// widths, openings and fills keep the choices readable after sprite reduction.
function mouthStyle(g,style,mouth,dir){
  g.save();g.translate(...mouth);g.scale(dir==='down'?1:dir==='left'?-.62:.62,1);
  const ink='#60372e',inside='#48262b',tooth='#fff4df',lip='#b76e6d';
  g.lineCap='round';g.lineJoin='round';
  const stroke=(width=2,color=ink)=>{g.strokeStyle=color;g.lineWidth=width;g.stroke();};
  const fill=(color,outline=false)=>{g.fillStyle=color;g.fill();if(outline)stroke(1.3);};
  const oval=(x,y,rx,ry,color,outline=false)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);fill(color,outline);};
  const grin=()=>{g.beginPath();g.moveTo(-11,-3);g.quadraticCurveTo(0,-.5,11,-3);g.bezierCurveTo(10,7,-10,7,-11,-3);g.closePath();};
  switch(style){
    case 'smile':
      g.beginPath();g.moveTo(-9,-1.5);g.quadraticCurveTo(0,6.5,9,-1.5);stroke(2.1);break;
    case 'wide':
      g.beginPath();g.moveTo(-13,-3);g.bezierCurveTo(-8,8,8,8,13,-3);stroke(2.5);
      for(const x of [-13,13]){g.beginPath();g.moveTo(x,-4);g.lineTo(x,-1);stroke(1.7);}break;
    case 'small':
      g.beginPath();g.moveTo(-3.4,0);g.quadraticCurveTo(0,2.2,3.4,0);stroke(2);break;
    case 'full':
      g.beginPath();g.moveTo(-10,0);g.bezierCurveTo(-6,-1,-5,-6,0,-2.8);g.bezierCurveTo(5,-6,6,-1,10,0);g.bezierCurveTo(7,7,-7,7,-10,0);fill(lip);
      g.beginPath();g.moveTo(-9,0);g.quadraticCurveTo(0,1.4,9,0);stroke(1.25);
      g.beginPath();g.moveTo(-4,3);g.quadraticCurveTo(0,4.5,4,3);stroke(1.1,'#e0a39a');break;
    case 'pout':
      oval(0,.5,4.8,5.2,lip);g.beginPath();g.moveTo(0,-2.5);g.quadraticCurveTo(-2,.5,0,3);stroke(1.8);break;
    case 'smirk':
      g.beginPath();g.moveTo(-7,2);g.bezierCurveTo(-1,4,7,0,10,-4);stroke(2.2);
      g.beginPath();g.moveTo(9,-5);g.lineTo(10,-2);stroke(1.5);break;
    case 'open':
      oval(0,.5,4.8,5.5,inside,true);oval(0,3,2.7,1.6,'#c97e82');break;
    case 'teeth':case 'gap':case 'braces':
      grin();fill(inside,true);g.save();grin();g.clip();
      g.fillStyle=tooth;g.fillRect(-12,-3,24,6.5);
      if(style==='gap'){g.fillStyle=inside;g.fillRect(-1.8,-3,3.6,6.5);}
      else if(style==='braces'){
        g.beginPath();g.moveTo(-10,.5);g.lineTo(10,.5);stroke(1.2,'#727788');
        g.fillStyle='#6173be';for(const x of [-7,-2.3,2.3,7])g.fillRect(x-1.25,-1,2.5,2.8);
      }else {g.beginPath();g.moveTo(0,-2);g.lineTo(0,.4);stroke(.65,'#c9b6a3');}
      g.restore();break;
    case 'frown':
      g.beginPath();g.moveTo(-9,3);g.quadraticCurveTo(0,-5.5,9,3);stroke(2.2);break;
    case 'lopsided':
      g.beginPath();g.moveTo(-10,-2);g.bezierCurveTo(-6,6,-1,4,1,0);g.quadraticCurveTo(5,-3,10,1);stroke(2.1);break;
    case 'cupid':
      g.beginPath();g.moveTo(-7,.5);g.lineTo(-3.5,-3.5);g.quadraticCurveTo(-1,-4,0,-.5);g.quadraticCurveTo(1,-4,3.5,-3.5);g.lineTo(7,.5);g.quadraticCurveTo(0,5,-7,.5);fill('#a95760');
      g.beginPath();g.moveTo(-6,.5);g.lineTo(6,.5);stroke(1.15);break;
    case 'thin':
      g.beginPath();g.moveTo(-10,.5);g.lineTo(10,.5);stroke(1.6);break;
    case 'tongue':
      oval(0,0,9,4.2,inside,true);g.beginPath();g.moveTo(-4,1);g.lineTo(4,1);g.lineTo(4,4.5);g.bezierCurveTo(4,9,-4,9,-4,4.5);g.closePath();fill('#db7a89');
      g.beginPath();g.moveTo(0,2);g.lineTo(0,5);stroke(.9,'#a64d63');break;
    case 'fangs':
      oval(0,.5,9,5,inside,true);g.fillStyle=tooth;
      for(const x of [-5,5]){g.beginPath();g.moveTo(x-2.3,-2.7);g.lineTo(x+2.3,-2.7);g.lineTo(x,4);g.closePath();g.fill();}break;
    case 'cat':
      g.beginPath();g.moveTo(-8,-1);g.bezierCurveTo(-7,5,-2,5,0,0);g.bezierCurveTo(2,5,7,5,8,-1);stroke(2.2);break;
  }
  g.restore();
}
function faceDetails(c,L,dir,features=null){
  if(!features)return legacyFaceDetails(c,L,dir);
  const f=detailGeometry(L,dir),side=dir!=='down'&&dir!=='up',sign=dir==='left'?-1:1,ink='#59372c',gold='#e8bd57',silver='#d5dfe1';
  const ellipse=(g,color,x,y,rx,ry=rx,stroke=0)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(stroke){g.strokeStyle=color;g.lineWidth=stroke;g.stroke();}else {g.fillStyle=color;g.fill();}};
  // Draw face-only changes on an alpha-masked layer, so a profile's far cheek
  // and lip options cannot float outside the illustrated facial silhouette.
  if(dir!=='up'){
    const layer=cv(192,HEAD_HEIGHT),g=layer.getContext('2d'),[mx,my]=f.mouth,[nx,ny]=f.nose;
    // Classic follows the expression automatically. An explicitly chosen mouth
    // keeps its design; expressions must not collapse every choice to a smile.
    let mouth=L.mouth;if(mouth==='default')mouth=({happy:'smile',grin:'teeth',laugh:'open',proud:'wide',silly:'tongue',smug:'smirk',sad:'frown',worried:'frown',angry:'frown',surprised:'open'})[L.expr]||'default';
    if(mouth!=='default'){
      skinRepair(c,[mx-(side?7:12),my-5,side?14:24,11]);
      mouthStyle(g,mouth,f.mouth,dir);
    }
    if(L.nose!=='default'){
      const shapes={button:[1,0],dot:[0,0],long:[0,4],wide:[3,1],pointed:[2,2],round:[2,1],bridge:[0,-3],hook:[2,4],snub:[1,-1],flat:[3,0],tall:[0,5],small:[0,-1],soft:[1,1],none:[0,0]},[w,h]=shapes[L.nose]||[0,0];
      skinRepair(c,[nx-6,ny-4,12,10]);if(L.nose!=='none'){
        if(L.nose==='dot')ellipse(g,'#9d6a4e',nx,ny+1,1.1,.8);
        else path(g,'#9d6a4e',1,[nx-(side?sign*2:0),ny-3,nx+sign*w,ny+Math.min(3,h),nx-sign*2,ny+2]);
      }
    }
    const marks=new Set([...L.marks,...L.extras]);
    const cheek=(name)=>side?(name==='L'&&dir==='left'||name==='R'&&dir==='right'?null:f.cheeks[0]):f.cheeks[name==='L'?0:1];
    const dot=(p,color='#654230',r=1.2)=>p&&ellipse(g,color,...p,r);
    if(['shy','happy','laugh'].includes(L.expr)||marks.has('blush'))for(const [x,y]of f.cheeks){g.globalAlpha=.18;ellipse(g,'#e4837c',x,y,5,2);g.globalAlpha=1;}
    for(const mark of marks){
      if(mark.startsWith('freckles')||mark==='freckles')for(const [x,y]of f.cheeks)for(const [dx,dy]of (mark==='frecklesH'?[[-4,0],[-1,2],[2,-1],[4,1],[0,-2]]:[[-3,0],[0,2],[3,-1]]))dot([x+dx,y+dy],'#986247',.65);
      else if(['scarBrow','scarCheek','scar'].includes(mark)){const p=mark==='scarBrow'?f.brows.at(-1):f.cheeks[0];path(g,'#ebc6ad',1.5,[p[0]-3,p[1]-3,p[0]+3,p[1]+4]);}
      else if(mark==='dimples')for(const [x]of f.cheeks)path(g,'#a16d54',1,[x,my,x+.4,my+2]);
      else if(['birth','vitiligo','star','heart'].includes(mark)){const p=mark==='birth'||mark==='heart'?cheek('L'):cheek('R');if(p){const[x,y]=p;if(mark==='heart'){g.fillStyle='#bd577b';g.beginPath();g.moveTo(x,y+2);g.bezierCurveTo(x-5,y-1,x-2,y-5,x,y-2);g.bezierCurveTo(x+2,y-5,x+5,y-1,x,y+2);g.fill();}else if(mark==='star'){const pts=[];for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?1.3:3;pts.push(x+Math.cos(a)*r,y+Math.sin(a)*r);}path(g,'#3f6fa8',1,pts,true);}else ellipse(g,mark==='vitiligo'?'#e5b18d':'#8d5c46',x,y,mark==='vitiligo'?3:2.5,mark==='vitiligo'?5:3.5);}}
      else {const p={moleL:cheek('L'),moleR:cheek('R'),mole:cheek('R'),moleLip:[mx+sign*(side?-3:5),my-3],moleChin:[f.chin[0],f.chin[1]-2],moleEye:[f.eyes.at(-1)[0],f.eyes.at(-1)[1]+9],temple:[f.eyes.at(-1)[0]+(side?-sign*8:10),f.eyes.at(-1)[1]-6],pierce:[nx+sign*(side?-2:3),ny]}[mark];dot(p,mark==='pierce'?silver:undefined);}
    }
    g.globalCompositeOperation='destination-in';g.drawImage(detailBase(L,dir),0,0);c.drawImage(layer,0,0);
    // Eye edits use each eye's own local frame; mouth spacing cannot stretch
    // pupils, lids, glasses, or eyebrow decorations any more.
    for(let i=0;i<f.eyes.length;i++){
      const [x,y]=f.eyes[i],scale={round:1,wide:1.08,sleepy:.74,lashed:1,almond:.9,hooded:.8,monolid:.72,upturned:.95,downturned:.94,big:1.13,narrow:.68,starry:1.08,heavy:.78,lashed2:1.04}[L.eyes]||1;
      // Recolor the native iris before changing the eye opening. Recoloring
      // afterward used the old tall iris mask on narrowed lids and cheek skin.
      if(L.eyeC!=='#2b1d14'){
        const [ix,iy]=f.irises[i],box=c.getImageData(Math.floor(ix-6),Math.floor(iy-9),13,19),d=box.data,target=rgb(L.eyeC),raw=pixels('base/'+dir).data.data;
        for(let yy=0;yy<19;yy++)for(let xx=0;xx<13;xx++){const n=(yy*13+xx)*4,at=((Math.floor(iy-9)+yy)*192+Math.floor(ix-6)+xx)*4,l=lum(raw[at],raw[at+1],raw[at+2]);if(((xx-6)/(side?3.1:4.8))**2+((yy-9)/6.4)**2>1||l<35||l>130||raw[at]<=raw[at+2]+8)continue;const tone=material(target,l,90);for(let k=0;k<3;k++)d[n+k]=tone[k];}c.putImageData(box,Math.floor(ix-6),Math.floor(iy-9));
      }
      if(scale!==1){const patch=cv(26,22),p=patch.getContext('2d');p.drawImage(c.canvas,x-13,y-11,26,22,0,0,26,22);skinRepair(c,[x-13,y-11,26,22]);c.drawImage(patch,x-13,y-11*scale,26,22*scale);}
      const blink=L._blink||L.expr==='wink'&&i===0,narrow=['sleepy','hooded','monolid','narrow','heavy'].includes(L.eyes)||['sleepy','angry','determined','smug'].includes(L.expr);
      if(blink){skinRepair(c,[x-14,y-13,28,26],'y',false);path(c,ink,1.4,[x-7,y,x,y+2,x+7,y]);}
      else if(narrow)path(c,ink,1.2,[x-7,y-3,x+7,y-3]);
      if(!blink&&['lashed','lashed2','upturned'].includes(L.eyes))path(c,ink,L.eyes==='lashed2'?1.8:1.2,[x-6,y-5,x-9,y-8]);
      if(!blink&&(['wide','big','starry'].includes(L.eyes)||L.expr==='surprised'))ellipse(c,'#fff7e7',f.irises[i][0]-1,y-2,1,1.4);
    }
    if(L.brows!=='thin')for(const [x,y]of f.brows){
      skinRepair(c,[x-14,y-7,28,16],'above',false);if(L.brows==='none')continue;
      const lift=({arched:-3,high:-5,raised:-4,furrowed:3,soft:-1,flat:1,straight:2})[L.brows]||0,length=L.brows==='short'?4:9,width={thick:2.8,bushy:3.8,feathered:2.8,dots:1.7,short:1.4}[L.brows]||1.8;
      if(L.brows==='dots')for(const dx of [-5,0,5])ellipse(c,L.hairC,x+dx,y,1.2);
      else path(c,L.hairC,width,[x-length,y+1,x,y+lift,x+length,y+1]);
      if(L.brows==='slit')skinRepair(c,[x+3,y-4,2,10],'above',false);
      if(['bushy','feathered'].includes(L.brows))for(let dx=-6;dx<=6;dx+=3)path(c,L.hairC,.8,[x+dx,y+1,x+dx+1,y-3]);
    }
    if(L.glasses!=='none'){
      const color='#4d332a',r=side?10:12;for(const [x,y]of f.eyes){c.beginPath();if(L.glasses==='round')c.ellipse(x,y,r,10,0,0,Math.PI*2);else c.roundRect(x-r-1,y-10,r*2+2,20,3);if(L.glasses==='shades')c.fillStyle='#30323f',c.fill();c.strokeStyle=color;c.lineWidth=1.8;c.stroke();}
      if(side)path(c,color,1.6,[DATA.detailLandmarks.views[dir].ears[0].center[0],f.eyes[0][1]-2,f.eyes[0][0]-sign*10,f.eyes[0][1]-2]);else path(c,color,1.6,[f.eyes[0][0]+12,f.eyes[0][1]-1,f.eyes[1][0]-12,f.eyes[1][1]-1]);
    }
  }
  const stud=(p,color=silver,r=1.5)=>ellipse(c,color,...p,r),ring=(p,rx=2.7,ry=3.5)=>ellipse(c,gold,...p,rx,ry,1.2);
  const near=id=>f.ears.find(e=>e.id===id),drawEar=(ear,kind)=>{
    if(!ear)return;const [x,y]=ear.lobe;
    if(kind==='hoops')ring([x,y+2],3,4.3);
    else if(kind==='double'){stud([x,y-3]);stud([x,y+1],gold,1.3);}
    else if(kind==='industrial'){const p=ear.center,side=Math.sign(p[0]-ear.hinge[0]);path(c,silver,1.2,[p[0]-side*3,p[1]-9,p[0]+side*4,p[1]-3]);stud([p[0]-side*3,p[1]-9],silver,1);stud([p[0]+side*4,p[1]-3],silver,1);}
    else if(kind==='tragus')stud([ear.hinge[0]-Math.sign(ear.hinge[0]-ear.center[0])*2,ear.center[1]+1]);
    else if(kind==='cuff')path(c,silver,2,[ear.center[0]-2,ear.center[1]-6,ear.center[0]+3,ear.center[1]-5]);
    else stud(ear.lobe);
  };
  if(L.ears==='cuff')for(const e of f.ears)drawEar(e,'cuff');
  for(const id of new Set(L.pierce)){
    if(['earL','earR'].includes(id))drawEar(near(id),'stud');
    else if(id==='hoops')for(const e of f.ears)drawEar(e,'hoops');
    else if(id==='double'||id==='tragus')drawEar(near('earL'),id);
    else if(id==='industrial')drawEar(near('earR'),id);
    else if(dir!=='up'){
      const [nx,ny]=f.nose,[mx,my]=f.mouth;
      const p={nose:[nx+sign*(side?-2:3),ny],nosering:[nx+sign*(side?-2:3),ny+1],septum:[nx,ny+3],lip:[mx+sign*(side?-2:4),my+1],labret:[mx-sign*(side?2:0),my+4],bridge:f.bridge,browL:dir==='left'?null:f.brows[0],browR:dir==='right'?null:f.brows.at(-1)}[id];
      if(id==='dimple')for(const [x,y]of f.cheeks)stud([x,my-1]);else if(p){if(id==='nosering'||id==='lip')ring(p,1.8,2.4);else if(id==='septum'){c.beginPath();c.ellipse(...p,2.4,2.2,0,0,Math.PI);c.strokeStyle=gold;c.lineWidth=1.1;c.stroke();}else stud([p[0],p[1]+(id.startsWith('brow')?-2:0)]);}
    }
  }
  if(['earring','moon'].includes(L.acc))for(const ear of f.ears){const[x,y]=ear.lobe,color=L.accC||gold;stud([x,y],color,1.1);if(L.acc==='moon'){ellipse(c,color,x,y+4,2.4,3.2);path(c,color,1,[x,y+1,x,y+3]);}else ellipse(c,color,x,y+2.5,1.6,2.6);}
}
