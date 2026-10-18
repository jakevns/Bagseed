// Native index.html samples and behavioral checks for the next three mutations.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
async function capture({batch='02',out=path.resolve(__dirname,'../review/mutation-detail/implemented-batch-'+batch),animate=false}={}){
 assert.ok(['02','03'].includes(batch));
 fs.mkdirSync(out,{recursive:true});
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 const write=(name,url)=>fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await require('../tests/helpers/art-page.cjs')(browser,{viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let release;const gate=new Promise(r=>release=r),requests=[];
  await page.route('**/assets/plants/mutations/**',async route=>{requests.push(new URL(route.request().url()).pathname);await gate;await route.continue();});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded',timeout:120000});
  assert.equal(await page.evaluate(()=>BagseedPlants.loaded),false);
  assert.equal(await page.evaluate(()=>BagseedStartup.canRender),false);
  release();await page.evaluate(()=>BagseedStartup.ready);assert.equal(requests.length,await page.evaluate(()=>Object.values(BagseedPlants.mutations).reduce((n,m)=>n+Object.keys(m.atlases).length,0)));
  await page.unroute('**/assets/plants/mutations/**');
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Mutation artwork');
  await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const result=await page.evaluate(batch=>{
   const next=batch==='03';
   settings.speed=0;settings.reduced=true;state.tut.on=false;state.scene='bedroom';state.minute=720;state.day=100;state.mess=[];
   runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();
   for(const loc of ['closet','tent2']){const L=state.locations[loc];L.owned=true;L.door='open';Object.assign(L.equip,{pot:3,light:2,fan:2,exhaust:1,humid:0,dehum:0,sensor:2,ctrl:0});}
   const names=next?{snowtip:'Snowtip',fernfrond:'Fernfrond',goldleaf:'Goldleaf'}:{ducksfoot:'Ducksfoot',monophylla:'Monophylla',moonmarble:'Moonmarble'},keys=Object.keys(names),files={};
   const mothers=keys.map((key,i)=>{
    const p=createPlant('porchlight',i?'tent2':'closet',i===2?1:0,{h:1,b:1,y:1,a:1,deep:false,mut:key,muts:[key]});
    Object.assign(p,{stage:8,height:31,nodes:9,sex:'F',sexKnown:true,health:92,water:60,nutr:60,density:.82,stress:0,burn:0,mold:0,pest:{type:null,lvl:0},training:'natural'});return p;
   });
   const make=(index,stage=5,height=50,changes={})=>({...JSON.parse(JSON.stringify(mothers[index])),id:'mutation-review-'+index+'-'+stage+'-'+height,stage,height,nodes:Math.min(11,1+height*.24),...changes});
   const setTraits=(p,traits)=>{p.paintArt115={...BagseedPlants.recipe(p),traits:{...BagseedPlants.recipe(p).traits,...traits}};return p;};
   const formPlant=(index,desired)=>{for(let i=0;i<100;i++){const p=make(index,8);p.paintArt115={...BagseedPlants.recipe(p),seed:'mutation-form-'+i};if(BagseedPlants.descriptor(p).mutation.variant===desired)return p;}throw Error('Missing form '+desired);};
   const pot=(c,p,x,y,sc,t=0,wind=0)=>{
    c.save();c.translate(x,y);c.scale(sc,sc);BagseedWaterPots.potSprite(c,0,0,3,p.water);c.restore();
    PlantArt.draw(c,p,x,y,sc,t,wind);
    c.save();c.translate(x,y);c.scale(sc,sc);BagseedWaterPots.potSprite(c,0,0,3,p.water,false,true);c.restore();
   };
   const board=(title,subtitle,entries,{cols=3,cw=500,ch=720,sharedScale=null}={})=>{
    const cv=document.createElement('canvas');cv.width=cols*cw;cv.height=100+Math.ceil(entries.length/cols)*ch;
    const c=cv.getContext('2d');c.fillStyle='#f5efdf';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='#264b36';c.font='bold 30px Georgia';c.fillText(title,22,40);c.font='18px Georgia';c.fillText(subtitle,22,72);
    const scale=sharedScale??Math.min(6,...entries.map(e=>{const s=PlantArt.get(e.p);return Math.min((cw-42)/s.w,(ch-125)/s.h);}));
    entries.forEach((e,i)=>{const x=i%cols*cw,top=100+Math.floor(i/cols)*ch;c.fillStyle='#e7eadb';c.fillRect(x+8,top+4,cw-16,ch-16);c.fillStyle='#264b36';c.font='bold 21px Georgia';c.fillText(e.label,x+18,top+32,cw-36);pot(c,e.p,x+cw/2,top+ch-95,scale);c.font='16px Georgia';c.fillText(e.note||'',x+18,top+ch-22,cw-36);});return cv;
   };
   // Capture the real processed tile canvases, not source art pasted onto a mockup.
   const tiles=new Map(),sources=new Set(),draw=CanvasRenderingContext2D.prototype.drawImage;
   const protectedState=p=>JSON.stringify([p.genome115,p.pheno,p.stage,p.height,p.nodes,p.health,p.water,p.nutr,p.yieldPot,p.training,p.canopy]);
   const before=mothers.map(protectedState),forms={};
   try{
    CanvasRenderingContext2D.prototype.drawImage=function(im,...args){
     if(im instanceof HTMLImageElement&&im.src.includes('/plants/mutations/')){const family=im.src.split('/').slice(-2)[0];sources.add(family);tiles.set(family+':'+args.slice(0,4).join(','),this.canvas);}
     return draw.call(this,im,...args);
    };
    for(let i=0;i<keys.length;i++){
     PlantArt.build(mothers[i]);forms[keys[i]]=Object.keys(BagseedPlants.mutations[keys[i]].variants).map(v=>formPlant(i,v));
     for(const p of forms[keys[i]])PlantArt.build(p);
    }
   }finally{CanvasRenderingContext2D.prototype.drawImage=draw;}
   const readOnly=mothers.every((p,i)=>protectedState(p)===before[i]);
   // Protect actual pale tissue under the strongest dark finishing overlays.
   // Read both the source pixels and the shader's final canvas for each organ.
   const tissue=[],probe=setTraits(make(2,10,50,{pheno:{...mothers[2].pheno,mut:'moonmarble',muts:['moonmarble','inkleaf']},nightColor:{hours:24}}),{leafKey:'blue',colorName:'Dark purple'});
   try{
    CanvasRenderingContext2D.prototype.drawImage=function(im,...args){const value=draw.call(this,im,...args);if(im instanceof HTMLImageElement&&im.src.includes('/mutations/moonmarble/'))tissue.push({cv:this.canvas,source:this.getImageData(0,0,this.canvas.width,this.canvas.height).data});return value;};
    PlantArt.build(probe);
   }finally{CanvasRenderingContext2D.prototype.drawImage=draw;}
   let palePixels=0,retainedPixels=0;for(const {cv,source}of tissue){const pixels=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;for(let i=0;i<source.length;i+=4)if(source[i+3]>220&&source[i]>200&&source[i+1]>195&&source[i+2]>170){palePixels++;if(pixels[i]>160&&pixels[i+1]>155&&pixels[i+2]>130)retainedPixels++;}}
   const paleRetention=palePixels?retainedPixels/palePixels:0;
   const leafSheet=document.createElement('canvas');leafSheet.width=1600;leafSheet.height=1540;const lc=leafSheet.getContext('2d');
   lc.fillStyle='#f5efdf';lc.fillRect(0,0,leafSheet.width,leafSheet.height);lc.fillStyle='#264b36';lc.font='bold 30px Georgia';lc.fillText('BAGSEED / native mutation leaf details',22,40);lc.font='18px Georgia';lc.fillText('Actual processed game tiles. Two mature forms, a young leaf and a sugar leaf for each family.',22,72);
   keys.forEach((key,row)=>{
    const variants=Object.values(BagseedPlants.mutations[key].variants),parts=[variants[0].parts.sevenLeaf,variants[1].parts.sevenLeaf,variants[0].parts.threeLeaf,variants[0].parts.sugarLeaf];
    parts.forEach((part,col)=>{const tile=tiles.get(key+':'+part.crop.join(','));if(!tile)throw Error('Missing tile '+key+'/'+col);const scale=Math.min(350/tile.width,340/tile.height),top=110+row*475;lc.fillStyle='#e7eadb';lc.fillRect(col*400+8,top,384,455);lc.drawImage(tile,col*400+200-tile.width*scale/2,top+35+(340-tile.height*scale)/2,tile.width*scale,tile.height*scale);lc.fillStyle='#264b36';lc.font='bold 20px Georgia';lc.fillText(names[key],col*400+18,top+402);lc.font='16px Georgia';lc.fillText(['Mature form A','Mature form B','Young leaf','Sugar leaf'][col],col*400+18,top+430);});
   });files['runtime-leaf-details']=leafSheet.toDataURL();
   const notes=next?['Pale new growth / green supporting leaves','Fine connected fronds / airy fan anatomy','Healthy golden tissue / retained green veins']:['Joined tissue / serrated webbed lobes','Single blade / softly quilted veins','Cream sectors / intact fan-leaf veins'];
   files['three-mutations']=board('BAGSEED / three new growing mutations','Actual game renderer / 50-inch plants at the same scale / mature vegetative growth.',keys.map((key,i)=>({p:make(i),label:names[key],note:notes[i]})),{cw:600,ch:820}).toDataURL();
   keys.forEach((key,i)=>{
    const life=[[2,3,'Seedling'],[3,8,'Young growth'],[5,24,'Vegetative'],[7,40,'Early flower'],[8,50,'Mid flower'],[10,50,'Late flower']].map(([stage,height,label])=>({p:make(i,stage,height),label,note:height+' in / '+(stage>=9?'phenotype finishing color':'attached growing organs')}));
    files[key+'-growth']=board(names[key].toUpperCase()+' / native growth stages','Shared physical scale. Roots stay fixed; organs follow their own growing branches.',life,{cols:6,cw:320,ch:610,sharedScale:3.5}).toDataURL();
   });
   const palettes=[['Forest green','forest',5],['Blue-green','blue',5],['Purple','forest',10],['Red accents','forest',10]];
   const colorEntries=keys.flatMap((key,i)=>palettes.map(([colorName,leafKey,stage])=>({p:setTraits(make(i,stage,50,{nightColor:{hours:24}}),{colorName,leafKey}),label:names[key]+' / '+colorName,note:stage===10?'Late-flower color + eligible cool-night pigment':'Healthy vegetative leaf palette'})));
   files['phenotype-colors']=board('BAGSEED / mutation colors and finishing',next?'Pale growing tips, fine fronds and golden tissue retain their identity through native finishing colors.':'Native color families; Moonmarble pale tissue remains distinct from green or pigmented tissue.',colorEntries,{cols:4,cw:450,ch:610}).toDataURL();
   const careEntries=keys.flatMap((key,i)=>[
    {p:make(i,8,50,{training:'scrog'}),label:names[key]+' / SCROG',note:'Attached branches and native net'},
    {p:make(i,8,50,{staked:true}),label:names[key]+' / bamboo',note:'Native stakes and ties; damped motion'},
    {p:make(i,8,50,{canopy:{v:1,cleaned:1,credit:1},pruned:1}),label:names[key]+' / cleanup',note:'Lower foliage and popcorn buds removed'},
    {p:make(i,8,50,{water:2,nutr:10,health:38,stress:75}),label:names[key]+' / stress',note:'Native droop and lower-leaf yellowing'}]);
   files['training-and-stress']=board('BAGSEED / support, care and canopy cleanup','Existing simulation and training systems, using the new painted organs.',careEntries,{cols:4,cw:450,ch:610}).toDataURL();
   const familyResults=keys.map((key,i)=>{
    const base=make(i,8),rig=PlantArt.build(base),model=rig.model,pose=BagseedPlants.Model.pose(model,base,1,1),known=new Set([...model.joints.map(x=>x.id),...model.branches.map(x=>x.id)]);
    const descriptor=BagseedPlants.descriptor(mothers[i]),variants=Array.from({length:13},(_,stage)=>BagseedPlants.descriptor({...mothers[i],stage}).mutation.variant);
    const stages=Array.from({length:13},(_,stage)=>{const s=PlantArt.build(make(i,stage,stage<2?.5:stage===2?3:50,stage>=11?{dry:{prog:.4,mold:0}}:{}));return{stage,painted:s.illustrated,finite:[s.w,s.h,s.ax,s.ay].every(Number.isFinite)};});
    const png=p=>PlantArt.build(p).cv.toDataURL(),natural=png(base),male=PlantArt.build(make(i,9,50,{sex:'M'}));
    const formImages=forms[key].map(png),training=['natural','topped','lst','scrog'].map(training=>png({...base,training}));
    settings.reduced=false;const a=BagseedPlants.frame(base,rig,0,1.5).toDataURL(),b=BagseedPlants.frame(base,rig,1,1.5).toDataURL();settings.reduced=true;
    const reducedStable=BagseedPlants.frame(base,rig,0,1.5).toDataURL()===BagseedPlants.frame(base,rig,1,1.5).toDataURL();
    const snap=snapPlant(mothers[i]);
    const clone=createPlant(mothers[i].lineId,'tent2',1,JSON.parse(JSON.stringify(mothers[i].pheno)));state.locations.tent2.slots[1]=mothers[2].id;delete state.plants[clone.id];
    const cloneStable=JSON.stringify(BagseedPlants.descriptor(clone).mutation)===JSON.stringify(descriptor.mutation)&&Mut.list(clone).includes(key)&&JSON.stringify(clone.genome115.mg)===JSON.stringify(mothers[i].genome115.mg)&&JSON.stringify(clone.genome115.som)===JSON.stringify(mothers[i].genome115.som);
    const catalog=Object.values(state.genetics).filter(g=>g.id).map(g=>{const s=PlantArt.build(demoPlant(g.id,8,157,{sex:'F',pheno:{h:1,b:1,mut:key,muts:[key]}}));return s.illustrated&&s.d.mutation.key===key;});
    const giant=PlantArt.build(make(i,8,90,{loc:'outdoor'})),clean=PlantArt.build(careEntries[i*4+2].p);
    return{key,id:mothers[i].id,mutation:descriptor.mutation,genome:JSON.stringify(mothers[i].genome115),recipe:JSON.stringify(mothers[i].paintArt115),variants,stages,connected:model.organs.every(o=>known.has(o.parent)&&pose.organs.has(o.id)),sugarLeaves:model.organs.filter(o=>o.role==='sugarLeaf').length,formsDiffer:new Set(formImages).size===2,trainingForms:new Set(training).size,stressChanges:png(careEntries[i*4+3].p)!==natural,cleanupRemoves:clean.model.organs.filter(o=>o.removed).length>0&&clean.model.organs.filter(o=>o.site==='popcorn').length<model.organs.filter(o=>o.site==='popcorn').length,maleWorks:male.model.organs.some(o=>o.role==='maleOpen')&&!male.model.organs.some(o=>o.role==='sugarLeaf'),windChanged:a!==b,reducedStable,rootFixed:[0,1,2].every(t=>{const r=BagseedPlants.Model.pose(model,base,t,2).joints.get('root');return r.x===0&&r.y===0;}),cloneStable,snapshotStable:JSON.stringify(BagseedPlants.descriptor(snap).mutation)===JSON.stringify(descriptor.mutation)&&snap.paintArt115!==mothers[i].paintArt115,catalogCount:catalog.length,catalogWorks:catalog.every(Boolean),giantHeight:giant.model.height,giantGrowsMore:giant.model.branches.length>model.branches.length};
   });
   let chlorophyllChecks=null;
   if(next){
    // Read the actual leaf tile stamped at one known node's transform. This
    // follows the same attached organ before/after newer nodes grow above it.
    const sampleOrgan=(p,id)=>{
     const rig=PlantArt.build(p),pose=BagseedPlants.Model.pose(rig.model,rig.d.view,0,0,true).organs.get(id),organ=rig.model.organs.find(o=>o.id===id);let pixels=null,image=null;
     if(!pose||!organ)throw Error('Missing sampled organ '+id);
     try{CanvasRenderingContext2D.prototype.drawImage=function(im,...args){const m=this.getTransform();if(im instanceof HTMLCanvasElement&&args.length===4&&Math.abs(m.e-(rig.ax*3+pose.x*6.3))<.01&&Math.abs(m.f-(rig.ay*3-pose.y*6.3))<.01){image=im;pixels=im.getContext('2d').getImageData(0,0,im.width,im.height).data;}return draw.call(this,im,...args);};PlantArt.build(p);}finally{CanvasRenderingContext2D.prototype.drawImage=draw;}
     if(!pixels)throw Error('Native leaf stamp not observed: '+id);
     let total=0,pale=0,green=0,gold=0,light=0;
     for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>220){const [r,g,b]=pixels.subarray(i,i+3);total++;light+=r*.2126+g*.7152+b*.0722;if(r>170&&g>160&&b>130)pale++;if(g>r*1.12&&g>b*1.2)green++;if(g>70&&r>g*.85&&b<g*.65)gold++;}
     return{id,maturity:organ.maturity,total,brightness:light/total,pale:pale/total,green:green/total,gold:gold/total,image};
    };
    const young=make(0,5,18,{nodes:4}),older=make(0,5,28,{nodes:7}),a=sampleOrgan(young,'fan:4:-1'),mid=sampleOrgan(make(0,5,23,{nodes:5.25}),'fan:4:-1'),b=sampleOrgan(older,'fan:4:-1'),g=sampleOrgan(make(2,5,28,{nodes:7}),'fan:4:-1');
    const age=document.createElement('canvas');age.width=1500;age.height=660;const ac=age.getContext('2d');ac.fillStyle='#f5efdf';ac.fillRect(0,0,1500,660);ac.fillStyle='#264b36';ac.font='bold 30px Georgia';ac.fillText('SNOWTIP / one attached leaf as new nodes grow above it',22,42);ac.font='18px Georgia';ac.fillText('Actual processed leaf at fan:4:-1. Same phenotype and original tissue; no replacement leaf sprite.',22,75);
    [a,mid,b].forEach((v,i)=>{const scale=Math.min(440/v.image.width,440/v.image.height);ac.fillStyle='#e7eadb';ac.fillRect(i*500+8,105,484,535);ac.drawImage(v.image,i*500+250-v.image.width*scale/2,120+(440-v.image.height*scale)/2,v.image.width*scale,v.image.height*scale);ac.fillStyle='#264b36';ac.font='bold 22px Georgia';ac.fillText(['New pale leaf','Greening tissue','Mature green support'][i],i*500+25,602);delete v.image;});files['snowtip-leaf-aging']=age.toDataURL();delete g.image;
    chlorophyllChecks={young:a,middle:mid,older:b,gold:g,formStable:JSON.stringify(BagseedPlants.descriptor(young).mutation)===JSON.stringify(BagseedPlants.descriptor(older).mutation),greensWithAge:b.pale<a.pale-.1&&b.green>a.green+.1&&a.brightness>mid.brightness+2&&mid.brightness>b.brightness+2&&mid.maturity>a.maturity&&mid.maturity<b.maturity,goldIsHealthy:make(2).health===92&&g.gold>.2};
   }
   // Multiple expressed mutations keep shape, tissue pattern and structural traits.
   const combinations=next?[['monophylla','snowtip'],['fernfrond','moonmarble'],['ducksfoot','goldleaf'],['snowtip','goldleaf'],['goldleaf','moonmarble']]:[['ducksfoot','moonmarble'],['monophylla','moonmarble'],['freakshow','moonmarble'],['monophylla','ducksfoot','moonmarble'],['fernfrond','moonmarble']];
   const combos=combinations.map(muts=>{
    const p=make(0,8,50,{pheno:{...mothers[0].pheno,mut:muts[0],muts}}),s=PlantArt.build(p),single=PlantArt.build({...p,pheno:{...p.pheno,mut:muts[0],muts:[muts[0]]}});
    return{muts,shape:s.d.mutation?.key||'fernfrond',material:s.d.material,chlorophyll:s.d.chlorophyll,changed:s.cv.toDataURL()!==single.cv.toDataURL(),finite:[s.w,s.h].every(Number.isFinite)};
   });
   const comboEntries=combos.slice(0,3).map((c,i)=>({p:make(i,8,50,{pheno:{...mothers[i].pheno,mut:c.muts[0],muts:c.muts}}),label:c.muts.map(k=>k[0].toUpperCase()+k.slice(1)).join(' + '),note:next?'Existing shape + tissue traits / attached growing organs':'Existing expressed mutation stack / painted cream sectors'}));
   files['combined-mutations']=board('BAGSEED / combined expressed traits',next?'Anatomical leaf shapes remain intact under pale growth, variegation and golden tissue.':'Leaf-shape mutations retain their anatomy when Moonmarble variegation is also expressed.',comboEntries,{cols:3,cw:600,ch:820}).toDataURL();
   // Actual game scene and native codex/plant-card canvases.
   state.locations.tent2.slots[1]=mothers[2].id;state.player.x=250;state.player.y=145;state.player.dir='down';
   const scene=document.createElement('canvas');scene.width=1920;scene.height=720;const context=scene.getContext('2d');context.scale(4,4);RoomArt.hits=[];BagseedWaterPots.layers.length=0;curScene().draw(context,0);files['bedroom-gameplay']=scene.toDataURL();const layers=BagseedWaterPots.layers.slice();
   const guide=document.createElement('canvas');guide.width=1200;guide.height=450;const gc=guide.getContext('2d');gc.fillStyle='#f5efdf';gc.fillRect(0,0,1200,450);gc.fillStyle='#264b36';gc.font='bold 28px Georgia';gc.fillText('Native mutation guide / plant-card artwork',20,38);
   keys.forEach((key,i)=>{for(const [j,mode]of ['plant','leaf'].entries()){const cv=document.createElement('canvas');cv.width=mode==='plant'?104:40;cv.height=mode==='plant'?80:40;MutGen.draw(cv,key,mode);gc.imageSmoothingEnabled=false;gc.drawImage(cv,i*400+22+j*220,90,cv.width*2,cv.height*2);}gc.font='bold 22px Georgia';gc.fillStyle='#264b36';gc.fillText(names[key],i*400+22,360);});files['native-guide']=guide.toDataURL();
   window.mutationReview={mothers,keys,names,make,pot,animateFrame(i){
    settings.reduced=false;const cv=document.createElement('canvas');cv.width=1500;cv.height=900;const c=cv.getContext('2d');c.fillStyle='#f5efdf';c.fillRect(0,0,1500,900);c.fillStyle='#264b36';c.font='bold 30px Georgia';c.fillText('BAGSEED / native growth + wind',24,42);c.font='18px Georgia';c.fillText('Painted organs follow growing branches. Shared scale; soil and roots stay fixed.',24,75);
    const u=Math.min(1,i/42);keys.forEach((key,k)=>{const height=3+47*u,p=make(k,u<.12?2:u<.30?3:u<.65?5:8,height);pot(c,p,k*500+250,780,3.45,i/12,1.3);c.fillStyle='#264b36';c.font='bold 23px Georgia';c.fillText(names[key]+' / '+Math.round(height)+' in',k*500+55,860);});return cv.toDataURL();
   }};
   SaveSys.now('Mutation artwork review');return{readOnly,palePixels,paleRetention,chlorophyllChecks,sources:[...sources],families:familyResults,combos,layers,files};
  },batch);
  assert.equal(result.readOnly,true);assert.deepEqual(result.sources.sort(),batch==='03'?['fernfrond','goldleaf','snowtip']:['ducksfoot','monophylla','moonmarble']);
  assert.ok(result.palePixels>50);assert.ok(result.paleRetention>.9,'Pale tissue survives blue leaves, dark pigment and late-flower finishing');
  if(batch==='03')for(const k of ['formStable','greensWithAge','goldIsHealthy'])assert.equal(result.chlorophyllChecks[k],true,k+' / '+JSON.stringify(result.chlorophyllChecks));
  for(const f of result.families){
   for(const key of ['connected','formsDiffer','stressChanges','cleanupRemoves','maleWorks','windChanged','reducedStable','rootFixed','cloneStable','snapshotStable','catalogWorks','giantGrowsMore'])assert.equal(f[key],true,f.key+'/'+key);
   assert.ok(f.sugarLeaves>0);assert.equal(f.trainingForms,4);assert.equal(f.giantHeight,90);assert.ok(f.catalogCount>12);assert.ok(f.variants.every(v=>v===f.mutation.variant));assert.ok(f.stages.every(s=>s.painted&&s.finite));
  }
  assert.deepEqual(result.combos.map(c=>c.shape),batch==='03'?['monophylla','fernfrond','ducksfoot','snowtip','moonmarble']:['ducksfoot','monophylla','freakshow','monophylla','fernfrond']);
  assert.ok(result.combos.every(c=>c.changed&&c.finite));
  assert.ok(result.combos.every(c=>!c.muts.includes('moonmarble')||c.material==='moonmarble'));
  if(batch==='03')for(const c of result.combos)for(const k of ['snowtip','goldleaf'])if(c.muts.includes(k))assert.ok(c.chlorophyll.includes(k));
  assert.ok(result.layers.some(l=>l.phase==='soil-before-plant'));assert.ok(result.layers.some(l=>l.phase==='rim-after-plant'));
  for(const [key,url]of Object.entries(result.files))write(key,url);delete result.files;
  if(animate){
   const frames=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-mutations-'));
   try{
    for(let i=0;i<72;i++){const frame=await page.evaluate(i=>mutationReview.animateFrame(i),i);fs.writeFileSync(path.join(frames,String(i).padStart(3,'0')+'.png'),Buffer.from(frame.split(',')[1],'base64'));if(i%24===0)console.log('Native mutation animation frame',i);}
    execFileSync('ffmpeg',['-v','error','-y','-framerate','12','-i',path.join(frames,'%03d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','20',path.join(out,'growth-and-wind.mp4')]);
    execFileSync('ffmpeg',['-v','error','-y','-i',path.join(out,'growth-and-wind.mp4'),'-vf','fps=8,scale=1000:-1:flags=lanczos','-loop','0',path.join(out,'growth-and-wind.gif')]);
    result.animation={frames:72,fps:12,seconds:6};
   }finally{fs.rmSync(frames,{recursive:true,force:true});}
  }
  const resume=async()=>{await page.reload({timeout:120000});await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);};
  await resume();
  const restore=()=>page.evaluate(ids=>ids.map(id=>{const p=state.plants[id];return{genome:JSON.stringify(p.genome115),recipe:JSON.stringify(p.paintArt115),mutation:BagseedPlants.descriptor(p).mutation};}),result.families.map(f=>f.id));
  const saved=await restore();saved.forEach((p,i)=>{assert.equal(p.genome,result.families[i].genome);assert.equal(p.recipe,result.families[i].recipe);assert.deepEqual(p.mutation,result.families[i].mutation);});
  await page.evaluate(ids=>{const s=JSON.parse(localStorage.getItem(SAVE_KEYS.main));for(const id of ids){delete s.plants[id].paintArt115;delete s.plants[id].pheno.paintArt115;}localStorage.setItem(SAVE_KEYS.main,JSON.stringify(s));},result.families.map(f=>f.id));
  await resume();const legacy=await restore();legacy.forEach((p,i)=>{assert.equal(p.genome,result.families[i].genome);assert.deepEqual(p.mutation,result.families[i].mutation);});
  await page.setViewportSize({width:440,height:980});await page.evaluate(()=>{settings.speed=0;settings.reduced=true;state.scene='bedroom';state.player.x=90;state.player.y=145;closePanel();View.resize();View.snap();document.getElementById('toasts').replaceChildren();});await page.screenshot({path:path.join(out,'mobile-gameplay.png')});
  assert.deepEqual(errors,[]);Object.assign(result,{mutationAtlasRequests:requests,saveReload:true,legacySave:true,errors});fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2)+'\n');return result;
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
module.exports=capture;
if(require.main===module){const args=process.argv.slice(2),out=args.find(a=>!a.startsWith('--'));capture({out:out?path.resolve(out):undefined,animate:args.includes('--animate')}).then(()=>console.log('Three native mutation families verified; saves and clones preserved.')).catch(e=>{console.error(e);process.exitCode=1;});}
