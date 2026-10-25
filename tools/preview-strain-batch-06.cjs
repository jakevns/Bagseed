// Review-only replacement of the live plant script. Published index.html stays unchanged.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),review=path.join(root,'review/strain-batch-06');
const keys=['ogkush','whitewidow','northernlights'];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function reviewBuild({reviewRoot=review,kitKeys=keys}={}){
 const kits={},mutations={},routes={},specs=[];
 for(const id of fs.readdirSync(path.join(root,'graphics/plants'))){
  const dir='graphics/plants/'+id,file=dir+'/sources/manifest.json';
  if(!fs.existsSync(path.join(root,file)))continue;
  const m=JSON.parse(read(file)),specFile=dir+'/sources/profile.json';
  const s=fs.existsSync(path.join(root,specFile))?JSON.parse(read(specFile)):{traits:{leafShape:'broad',leafKey:'forest',colorName:'Forest green',branching:1.1}};
  kits[id]={...m,traits:s.traits,lineId:s.lineId||id};
 }
 for(const key of kitKeys){
  const dir=path.join(reviewRoot,'kits',key),m=JSON.parse(fs.readFileSync(path.join(dir,'sources/manifest.json'))),s=JSON.parse(fs.readFileSync(path.join(dir,'sources/profile.json')));
  assert.equal(m.status,'sample-awaiting-approval');
  const source=fs.readFileSync(path.join(dir,m.source)),runtime=fs.readFileSync(path.join(dir,'assets/components.webp'));
  assert.equal(sha(source),m.sourceSHA256);assert.equal(sha(runtime),m.runtimeSHA256);
  assert.equal(Object.keys(m.parts).length,16);
  kits[key]={...m,traits:s.traits,lineId:s.lineId};specs.push(s);routes['/'+m.runtime]=runtime;
 }
 for(const id of fs.readdirSync(path.join(root,'graphics/plants/mutations'))){
  const file='graphics/plants/mutations/'+id+'/sources/manifest.json';if(fs.existsSync(path.join(root,file)))mutations[id]=JSON.parse(read(file));
 }
 const code='(()=>{const module={exports:{}};'+read('graphics/plants/porchlight/sources/model.cjs')+';window.BagseedPlantModel=module.exports;})();\n'+read('graphics/plants/sources/live-renderer.js').replace('__BAGSEED_LIVE_PLANTS__',()=>JSON.stringify(kits)).replace('__BAGSEED_PLANT_MUTATIONS__',()=>JSON.stringify(mutations));
 const html=read('public/index.html'),pattern=/<script id="bagseed-live-plants-code">[\s\S]*?<\/script>/;
 assert.equal((html.match(new RegExp(pattern.source,'g'))||[]).length,1);
 return{html:html.replace(pattern,()=>'<script id="bagseed-live-plants-code">\n'+code+'\n</script>'),routes,specs,atlasCount:Object.keys(kits).length+Object.values(mutations).reduce((n,m)=>n+Object.keys(m.atlases).length,0)};
}
async function capture({reviewRoot=review,kitKeys=keys,out=reviewRoot,animate=false,production=false}={}){
 fs.mkdirSync(out,{recursive:true});const original=sha(read('public/index.html')),build=reviewBuild({reviewRoot,kitKeys});
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await require('../tests/helpers/art-page.cjs')(browser,{viewport:{width:1400,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(!production){
   await page.route('**/index.html',route=>route.fulfill({status:200,contentType:'text/html',body:build.html}));
   await page.route('**/assets/plants/**',route=>{const bytes=build.routes[new URL(route.request().url()).pathname];return bytes?route.fulfill({status:200,contentType:'image/webp',body:bytes}):route.continue();});
  }
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Expanded strain art review');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const result=await page.evaluate(async specs=>{
   settings.speed=0;settings.reduced=true;state.tut.on=false;state.scene='bedroom';state.minute=720;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();
   const M=BagseedPlants.Model,files={},copy=o=>JSON.parse(JSON.stringify(o)),sourceImages={};
   await Promise.all(specs.map(s=>new Promise((resolve,reject)=>{const im=new Image();sourceImages[s.id]=im;im.onload=resolve;im.onerror=reject;im.src=BagseedPlants.kits[s.id].runtime;})));
   for(const loc of ['closet','tent2']){const L=state.locations[loc];L.owned=true;L.door='open';Object.assign(L.equip,{pot:3,light:2,fan:2,exhaust:1,humid:0,dehum:0,sensor:2,ctrl:0});}
   const mothers=specs.map((s,i)=>{
    const p=createPlant(s.lineId,i?'tent2':'closet',i===2?1:0,{h:1,b:1,y:1,a:1,deep:false,mut:null,muts:[]});
    Object.assign(p,{stage:8,height:i===0?38:i===1?36:32,nodes:11,sex:'F',sexKnown:true,health:92,water:60,nutr:60,density:.82,stress:0,burn:0,mold:0,pest:{type:null,lvl:0},training:'natural'});return p;
   });
   const before=mothers.map(p=>JSON.stringify([p.genome115,p.pheno,p.height,p.stage,p.nodes,p.training]));
   const make=(i,stage=8,height=50,extra={})=>({...mothers[i],id:'strain-review-'+i+'-'+stage,stage,height,pheno:{...mothers[i].pheno},...extra});
   function canvas(w,h,title,subtitle){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.fillStyle='#f5efdf';c.fillRect(0,0,w,h);c.fillStyle='#29483a';c.font='bold 30px Georgia';c.fillText(title,24,44);c.font='18px Georgia';c.fillText(subtitle,24,78);return[cv,c];}
   function specimen(c,p,x,y,scale,t=0,wind=0,potScale=scale){
    c.save();c.translate(x,y);c.scale(potScale,potScale);BagseedWaterPots.potSprite(c,0,0,3,p.water);c.restore();
    const s=PlantArt.build(p),frame=BagseedPlants.frame(p,s,t,wind);c.drawImage(frame,x-s.ax*scale,y-s.ay*scale,s.w*scale,s.h*scale);
    c.save();c.translate(x,y);c.scale(potScale,potScale);BagseedWaterPots.potSprite(c,0,0,3,p.water,false,true);c.restore();return s;
   }
   function board(name,title,subtitle,entries,{cols=Math.min(3,specs.length),cw=600,ch=880,scale=null}={}){
    const [cv,c]=canvas(cols*cw,100+Math.ceil(entries.length/cols)*ch,title,subtitle);
    scale??=Math.min(6,...entries.map(e=>{const s=PlantArt.build(e.p);return Math.min((cw-45)/s.w,(ch-145)/s.h);}));
    entries.forEach((e,i)=>{const x=i%cols*cw,y=100+Math.floor(i/cols)*ch;c.fillStyle='#e0e5d2';c.fillRect(x+8,y+5,cw-16,ch-20);
     if(e.inspectRole){const kit=BagseedPlants.kits[e.kit],a=kit.parts[e.inspectRole],k=Math.min(240/a.crop[2],260/a.crop[3]);c.drawImage(sourceImages[e.kit],...a.crop,x+(cw-a.crop[2]*k)/2,y+130,a.crop[2]*k,a.crop[3]*k);}
     else if(e.inspectEarly){const cv=BagseedPlants.detail(e.p,{joint:'root',span:e.p.stage===2?3.5:10,width:400,height:420}),left=x+(cw-400)/2,top=y+75,ground=top+420*.68;c.save();c.translate(x+cw/2,ground);c.scale(3.5,3.5);BagseedWaterPots.potSprite(c,0,0,3,60);c.restore();c.drawImage(cv,left,top);c.save();c.translate(x+cw/2,ground);c.scale(3.5,3.5);BagseedWaterPots.potSprite(c,0,0,3,60,false,true);c.restore();}
     else specimen(c,e.p,x+cw/2,y+ch-145,e.scale??scale,0,0,e.potScale??e.scale??scale);
     c.fillStyle='#29483a';c.font='bold 24px Georgia';c.fillText(e.label,x+18,y+ch-58,cw-36);c.font='17px Georgia';c.fillText(e.note||'',x+18,y+ch-25,cw-36);});
    files[name]=cv.toDataURL();
   }
   board('three-strains-in-flower','BAGSEED / dedicated strain identities',specs.map(s=>s.name).join(', ')+' / native game compositor / matched 50-inch plants',specs.map((s,i)=>({p:make(i),label:s.name,note:s.traits.leafShape+' fans / '+s.traits.colorName})));
   if(specs.length===1)board('strain-for-approval',specs[0].name.toUpperCase()+' / DEDICATED PLANT ART','One saved phenotype / vegetative growth, flowering and natural final-week fade.',[{p:make(0,5,35),label:'Vegetative growth',note:'Forest-green hybrid fans'},{p:make(0,8,50),label:'Building flowers',note:'Resinous flower clusters / attached branch buds'},{p:make(0,10,50),label:'Final-week senescence',note:'Golden fans / amber pistils / retained flower detail'}],{cols:3});
   board('late-flower-senescence','BAGSEED / the final week','Healthy finishing colors follow each native phenotype / retained flower detail.',specs.map((s,i)=>({p:make(i,10),label:s.name,note:s.finishCaption||'Late flower / golden phenotype senescence'})));
   const coolStudies=[];
   if(specs.some(s=>s.coolNights)){
    const entries=[70,68].flatMap(nightTemp=>specs.map((s,i)=>{
     let exposure=null;const traits=BagseedPlants.recipe(make(i)).traits;
     for(let day=0;day<2;day++){
      for(let h=8;h<20;h++)exposure=BagseedNightColor.advance(exposure,{loc:'tent5',stage:10,temp:78,lightOn:true,stamp:day*1440+h*60},traits);
      for(let h=20;h<32;h++)exposure=BagseedNightColor.advance(exposure,{loc:'tent5',stage:10,temp:nightTemp,lightOn:false,stamp:day*1440+h*60},traits);
     }
     const p=make(i,10,50,{nightColor:exposure}),expression=BagseedNightColor.expression(p,traits),bonus=BagseedNightColor.socialBonus(p,traits,{filter:'none'});
     coolStudies.push({key:s.id,nightTemp,dayTemp:78,hours:exposure.hours,expression,sproutBonus:bonus});
     return{p,label:s.name+' / '+(78-nightTemp)+'F drop',note:expression.strength?'Deeper '+expression.palette+' / native response':s.coolNights?'Natural finish / below threshold':'Natural golden finish / no pigment eligibility'};
    }));
    board('cool-night-colors','BAGSEED / natural finish and cool-night color','Top: 8F lights-off drop / bottom: qualifying 10F drop / only receptive genetics deepen their pigment.',entries);
   }
   board('vegetative-identities','BAGSEED / leaf anatomy and branching','The same three plants before flowering / no mutation overlays.',specs.map((s,i)=>({p:make(i,5,35),label:s.name,note:s.traits.leafShape+' fans / '+s.traits.colorName})));
   const cycle=[[0,.5,'Seed'],[1,.5,'Germination'],[2,3,'Seedling'],[3,12,'Young vegetative'],[5,35,'Mature vegetative'],[7,50,'Early flower'],[8,50,'Building flowers'],[9,50,'Late flower'],[10,50,'Harvest ready']];
   specs.forEach((s,i)=>board(s.id+'-growth',s.name.toUpperCase()+' / GROWTH & FLOWER','Same phenotype / early organs and seedlings enlarged / selected growth and finishing stages.',cycle.map(([stage,height,label])=>({p:make(i,stage,height,{nodes:stage<3?2:stage===3?4:11}),label,note:height>=1?height+' inches':'Enlarged component detail',...(stage<2?{inspectRole:stage?'radicle':'seed',kit:s.id}:stage<=3?{inspectEarly:true}:{})})),{cols:3,cw:450,ch:610}));
   board('50-and-90-inches','BAGSEED / expanding plants','Each row holds one strain at the same physical scale / 50-inch pot and 90-inch outdoor model.',specs.flatMap((s,i)=>[50,90].map(height=>({p:make(i,8,height,{loc:height>50?'outdoor':mothers[i].loc}),label:s.name+' / '+height+' in',note:height>50?'Outdoor giant / more attached branches':'Potted model / current shared growth system'}))),{cols:2,cw:650,ch:850,scale:3.45});
   const care=specs.flatMap((s,i)=>[{p:make(i),label:s.name+' / natural'},{p:make(i,8,50,{staked:true}),label:'Bamboo support'},{p:make(i,8,50,{training:'scrog'}),label:'SCROG'},{p:make(i,8,50,{canopy:BagseedCanopy.care({...make(i),stage:7})}),label:'Lower growth cleaned'},{p:make(i,8,50,{water:9,nutr:12,health:40,stress:65}),label:'Low water / nutrient stress'}]);
   board('care-and-training','BAGSEED / connected care and training','Support, net training, lower-leaf/popcorn removal and stress reuse native saved systems.',care,{cols:5,cw:360,ch:660});
   const [detail,dc]=canvas(specs.length*600,1100,'BAGSEED / flowering detail','Native compositor / inspection detail');
   specs.forEach((s,i)=>{dc.fillStyle='#e0e5d2';dc.fillRect(i*600+8,105,584,910);const cv=BagseedPlants.detail(make(i),{joint:'node:9',span:10,width:570,height:800});dc.drawImage(cv,i*600+15,140);dc.fillStyle='#29483a';dc.font='bold 26px Georgia';dc.fillText(s.name,i*600+24,1060);});files['flower-detail']=detail.toDataURL();
   const families=specs.map((s,i)=>{
    const p=make(i),rig=PlantArt.build(p),m=rig.model,recipe=BagseedPlants.recipe(p),known=new Set([...m.joints.map(j=>j.id),...m.branches.map(b=>b.id)]),clean=PlantArt.build(care[i*5+3].p),giant=PlantArt.build(make(i,8,90,{loc:'outdoor'})),basePNG=rig.cv.toDataURL();
    const stages=Array.from({length:13},(_,stage)=>{const z=PlantArt.build(make(i,stage,stage<2?.5:stage===2?3:50));return{stage,painted:z.illustrated,finite:[z.w,z.h,z.ax,z.ay].every(Number.isFinite),leafKit:z.recipe.leafKit,flowerKit:z.recipe.flowerKit};});
    settings.reduced=false;const a=BagseedPlants.frame(p,rig,0,1.5).toDataURL(),b=BagseedPlants.frame(p,rig,1.2,1.5).toDataURL();settings.reduced=true;
    const reducedStable=BagseedPlants.frame(p,rig,0,1).toDataURL()===BagseedPlants.frame(p,rig,3,1).toDataURL(),pose=M.pose(m,rig.d.view,1.5,2,false),snap=snapPlant(mothers[i]);
    const old=state.locations.tent2.slots[1],clone=createPlant(p.lineId,'tent2',1,copy(mothers[i].pheno));state.locations.tent2.slots[1]=old;delete state.plants[clone.id];
    const male=PlantArt.build(make(i,9,50,{sex:'M'})),apex=m.organs.find(o=>o.id==='apex:flower');
    return{key:s.id,lineId:s.lineId,id:mothers[i].id,genome:JSON.stringify(mothers[i].genome115),recipe:JSON.stringify(mothers[i].paintArt115),stages,physicalHeight:m.height,giantHeight:giant.model.height,senescence:M.senescence(make(i,10),recipe.traits),
     dedicatedParts:recipe.leafKit===s.id&&recipe.flowerKit===s.id,connected:m.organs.every(o=>known.has(o.parent)),windChanged:a!==b,reducedStable,rootFixed:pose.joints.get('root').x===0&&pose.joints.get('root').y===0,
     expanding:M.counts(giant.model).secondaryBranches>M.counts(m).secondaryBranches,gradedBuds:m.organs.filter(o=>o.kind==='flower'&&o.site!=='apical').every(o=>o.length<apex.length),popcornPresent:m.organs.some(o=>o.site==='popcorn'),
     cleanupRemoves:M.counts(clean.model).flowers<M.counts(m).flowers&&M.counts(clean.model).leaves<M.counts(m).leaves,cleanupEnlargesTop:clean.model.organs.find(o=>o.id==='apex:flower').length>apex.length,
     stressChanges:PlantArt.build(care[i*5+4].p).cv.toDataURL()!==basePNG,trainingForms:new Set(['natural','topped','lst','scrog'].map(training=>PlantArt.build(make(i,8,50,{training})).cv.toDataURL())).size,
     maleWorks:male.model.organs.filter(o=>o.kind==='flower').every(o=>o.role==='maleOpen'),cloneStable:JSON.stringify(BagseedPlants.recipe(clone))===JSON.stringify(recipe),snapshotStable:JSON.stringify(snap.paintArt115)===JSON.stringify(recipe)};
   });
   const mutationChecks=specs.map((s,i)=>Object.keys(MUTS).map(key=>{const p=make(i,8,50,{mutSeen:true,pheno:{...mothers[i].pheno,mut:key,muts:[key]}}),r=PlantArt.build(p);return{key,painted:r.illustrated,finite:Number.isFinite(r.w+r.h),changed:r.cv.toDataURL()!==PlantArt.build(make(i)).cv.toDataURL()};}));
   const existing={...make(0),paintArt115:{...BagseedPlants.recipe(make(0)),leafKit:'cruise',flowerKit:'velvet'}};
   const pinnedRecipesPreserved=BagseedPlants.recipe(existing).leafKit==='cruise'&&BagseedPlants.recipe(existing).flowerKit==='velvet';
   window.strainBatchReview={frame(frame){
    settings.reduced=false;const [cv,c]=canvas(specs.length*500,930,'BAGSEED / growth and wind','Fixed roots / attached branches / review stages.');
    specs.forEach((s,i)=>{const u=Math.min(1,frame/64),stage=u<.08?2:u<.2?3:u<.42?5:u<.6?7:u<.78?8:10,height=3+47*Math.min(1,u/.65),p=make(i,stage,height,{nodes:2+9*Math.min(1,u/.6)});c.fillStyle='#e0e5d2';c.fillRect(i*500+8,105,484,705);specimen(c,p,i*500+250,760,5.15,frame/12,1.25);c.fillStyle='#29483a';c.font='bold 23px Georgia';c.fillText(s.name,i*500+22,855);c.font='18px Georgia';c.fillText(Math.round(height)+' in / '+(stage===10?'final-week fade':stage>=7?'flowering':'growing'),i*500+22,892);});return cv.toDataURL();
   }};
   const readOnly=mothers.every((p,i)=>JSON.stringify([p.genome115,p.pheno,p.height,p.stage,p.nodes,p.training])===before[i]);
   SaveSys.now('Expanded strain artwork review');return{files,families,mutationChecks,coolStudies,pinnedRecipesPreserved,readOnly,atlasCount:BagseedPlants.atlasCount,catalogCount:LINES.length};
  },build.specs);
  assert.equal(result.readOnly,true);assert.equal(result.pinnedRecipesPreserved,true);assert.equal(result.atlasCount,build.atlasCount);assert.equal(result.catalogCount,37);
  for(const f of result.families){
   for(const key of ['dedicatedParts','connected','windChanged','reducedStable','rootFixed','expanding','gradedBuds','popcornPresent','cleanupRemoves','cleanupEnlargesTop','stressChanges','maleWorks','cloneStable','snapshotStable'])assert.equal(f[key],true,f.key+'/'+key);
   assert.equal(f.trainingForms,4);assert.equal(f.physicalHeight,50);assert.equal(f.giantHeight,90);assert.equal(f.senescence.palette,build.specs.find(s=>s.id===f.key).finishPalette||'gold');
   assert.ok(f.stages.every(s=>s.painted&&s.finite&&s.leafKit===f.key&&s.flowerKit===f.key));
  }
  assert.ok(result.mutationChecks.flat().every(m=>m.painted&&m.finite&&m.changed));
  for(const c of result.coolStudies){const s=build.specs.find(s=>s.id===c.key),active=s.coolNights&&c.nightTemp===68;assert.equal(c.hours,active?24:0);assert.equal(c.expression.capable,!!s.coolNights);assert.equal(c.expression.strength,active?1:0);assert.equal(c.sproutBonus,active?.08:0);}
  for(const [name,url]of Object.entries(result.files))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));delete result.files;
  if(animate){const temp=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-strains06-'));try{
   for(let i=0;i<96;i++){const url=await page.evaluate(i=>strainBatchReview.frame(i),i);fs.writeFileSync(path.join(temp,String(i).padStart(3,'0')+'.png'),Buffer.from(url.split(',')[1],'base64'));if(i%24===0)console.log('Strain growth/wind frame',i);}
   execFileSync('ffmpeg',['-v','error','-y','-framerate','12','-i',path.join(temp,'%03d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-movflags','+faststart',path.join(out,'growth-and-wind.mp4')]);
   execFileSync('ffmpeg',['-v','error','-y','-i',path.join(out,'growth-and-wind.mp4'),'-vf','fps=8,scale='+Math.min(1050,kitKeys.length*500)+':-1:flags=lanczos','-loop','0',path.join(out,'growth-and-wind.gif')]);result.animation={frames:96,fps:12,seconds:8};
  }finally{fs.rmSync(temp,{recursive:true,force:true});}}
  await page.reload();await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const restored=await page.evaluate(ids=>ids.map(id=>({genome:JSON.stringify(state.plants[id].genome115),recipe:JSON.stringify(state.plants[id].paintArt115)})),result.families.map(f=>f.id));
  restored.forEach((p,i)=>{assert.equal(p.genome,result.families[i].genome);assert.equal(p.recipe,result.families[i].recipe);});
  if(production){
   const oldRecipes=await page.evaluate(ids=>{const save=JSON.parse(localStorage.getItem(SAVE_KEYS.main));const before=ids.map(id=>{const p=save.plants[id],r={...p.paintArt115,leafKit:'cruise',flowerKit:'velvet'};delete r.lineArtRevision;p.paintArt115=r;p.pheno.paintArt115=JSON.parse(JSON.stringify(r));return{seed:r.seed,traits:r.traits,genome:JSON.stringify(p.genome115),height:p.height};});localStorage.setItem(SAVE_KEYS.main,JSON.stringify(save));return before;},result.families.map(f=>f.id));
   await page.reload();await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
   const migrated=await page.evaluate(ids=>ids.map(id=>{const p=state.plants[id],a=JSON.stringify(p.paintArt115);BagseedPlants.ensure(p);return{recipe:p.paintArt115,genome:JSON.stringify(p.genome115),height:p.height,idempotent:a===JSON.stringify(p.paintArt115)};}),result.families.map(f=>f.id));
   migrated.forEach((p,i)=>{assert.equal(p.recipe.leafKit,kitKeys[i]);assert.equal(p.recipe.flowerKit,kitKeys[i]);assert.equal(p.recipe.seed,oldRecipes[i].seed);assert.deepEqual(p.recipe.traits,oldRecipes[i].traits);assert.equal(p.genome,oldRecipes[i].genome);assert.equal(p.height,oldRecipes[i].height);assert.equal(p.idempotent,true);});
   result.existingSaveArtworkUpgraded=true;result.artworkUpgradePreservesGeneticsSeedTraitsAndHeight=true;
  }
  assert.deepEqual(errors,[]);assert.equal(sha(read('public/index.html')),original);
  Object.assign(result,{status:production?'user-approved-production-integration':'sample-awaiting-approval',productionRenderer:production,saveReload:true,publishedHTMLUnchanged:true,publishedHTMLSHA256:original,errors});fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2)+'\n');return result;
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
module.exports=capture;
if(require.main===module)capture({animate:process.argv.includes('--animate'),production:process.argv.includes('--production'),out:process.argv.find(a=>a.startsWith('--out='))?.slice(6)||review}).then(()=>console.log('Expanded strain batch 06 review passed.')).catch(e=>{console.error(e);process.exitCode=1;});
