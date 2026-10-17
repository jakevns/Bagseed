const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('mutations live in the genome: clones keep them, seeds segregate them, and the guide draws them',async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});const page=await require('./helpers/art-page.cjs')(browser),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Mutation Study');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const r=await page.evaluate(()=>{
   settings.speed=0;settings.reduced=true;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);ACT.tipOff();closePanel();state.scene='bedroom';state.money=500;
   const out={},rect=locRect('closet');state.player.x=rect[0]+rect[2]/2;state.player.y=rect[1]+rect[3]+6;state.player.energy=100;
   const plain=()=>({h:1,b:1,y:1,a:1,deep:false,mut:null,muts:[]});
   // a fresh Freakshow seedling: the rolled trait becomes two recessive copies
   const p=createPlant('porchlight','closet',0,{...plain(),mut:'freakshow',muts:['freakshow']});
   out.fresh={mg:p.genome115.mg.freakshow,list:Mut.list(p)};
   Object.assign(p,{stage:S.veg,height:14,nodes:6,health:92,sex:'F',sexKnown:true});Mut.reveal(p);
   // clone her, retire the mother, then grow the cutting
   runtime.plantSel=p.id;doCare('cut');const cut=state.inv.seeds.find(s=>s.kind==='cutting');
   out.cutting={has:!!cut,muts:cut&&cut.pheno.muts,mg:cut&&cut.pheno.genome115.mg.freakshow,note:seedInfo(cut.lineId,cut)};
   const mother=Individual115.snapshot(p);delete state.plants[p.id];state.locations.closet.slots[0]=null;state.player.energy=100;
   ACT.sow('closet:0:'+cut.id);const c=state.plants[state.locations.closet.slots[0]];
   out.clone={clone:c.clone,muts:Mut.list(c),pid:c.pheno.pid===p.pheno.pid,mg:c.genome115.mg.freakshow};
   const stats=state.stats.mutations;c.stage=S.veg;Mut.reveal(c);out.cloneRevealQuiet=state.stats.mutations===stats&&c.mutSeen;
   Panels.plant(c.id,'overview');out.panel=document.querySelector('#panelBody').textContent.includes('Mutation genetics');closePanel();
   // seeds: Mendelian segregation through saved individuals
   const snap=(id,mg,som=[],odds={})=>({plantId:id,phenotypeId:id,name:id,lineId:'porchlight',pheno:{cx:{}},sex:'F',genome:{id,alleles:mother.genome.alleles,mg,som,odds,mut:null}});
   const grow=(m,f,n=600,seed='x')=>{const bp={seed,mother:m,father:f};return Array.from({length:n},(_,i)=>Individual115.offspring(bp,i,'porchlight'));};
   const share=(kids,k)=>kids.filter(x=>x.muts.includes(k)).length/kids.length;
   const F=snap('freak',{freakshow:2}),N=snap('plain',{});
   const f1=grow(F,N,200,'f1');out.f1={shows:share(f1,'freakshow'),carriers:f1.filter(x=>x.genome115.mg.freakshow===1).length/f1.length,odds:f1[0].genome115.odds.freakshow};
   const H=snap('het',{freakshow:1},[],{freakshow:1}),H2=snap('het2',{freakshow:1},[],{freakshow:1});
   out.f2=share(grow(H,H2,1200,'f2'),'freakshow');out.backcross=share(grow(H,F,1200,'bx'),'freakshow');
   out.lot=MutGen.lotOdds({mother:H,father:H2}).find(x=>x.k==='freakshow');
   out.dominant=share(grow(snap('em',{ember:1}),N,1200,'em'),'ember');
   out.chimeraMother=share(grow(snap('mm',{},['moonmarble']),N,1500,'mm'),'moonmarble');out.chimeraFather=share(grow(N,snap('mm',{},['moonmarble']),800,'mf'),'moonmarble');
   out.triploidKids=share(grow(snap('tri',{},['triploid']),N,800,'tri'),'triploid');
   // triploids make no pollen and set no seed
   const t=createPlant('porchlight','closet',0,{...plain(),mut:'triploid',muts:['triploid']});state.locations.closet.slots[0]=c.id;
   Object.assign(t,{stage:S.midflower,sex:'M',sexKnown:true,loc:'closet'});const vials=state.inv.pollen.length;Breeding.pollenFrom(t);out.triploidPollen=state.inv.pollen.length===vials;
   // older saves: the expressed trait becomes the gene
   const old={pheno:{...plain(),mut:'inkleaf'},genome115:{id:'old',mut:'inkleaf'}};MutGen.sync(old);out.legacy={mg:old.genome115.mg.inkleaf,muts:old.pheno.muts};
   out.hiddenBefore=Object.keys(MUTS).filter(k=>!state.codex.mutations[k]).length;for(const k of Object.keys(MUTS))state.codex.mutations[k]=state.codex.mutations[k]||{first:1,line:'porchlight',count:1};
   Panels.codex();const cv=[...document.querySelectorAll('canvas[data-draw^="mutart:"]')];out.guide={n:cv.length,text:document.querySelector('#panelBody').textContent.includes('Mutation field guide'),drawn:cv.filter(x=>x.getContext('2d').getImageData(0,0,x.width,x.height).data.some((v,i)=>i%4===1&&v>80)).length};closePanel();
   SaveSys.now('Mutation Study');out.cloneId=c.id;return out;
  });
  assert.deepEqual(r.fresh,{mg:2,list:['freakshow']});
  assert.equal(r.cutting.has,true);assert.deepEqual(r.cutting.muts,['freakshow']);assert.equal(r.cutting.mg,2);assert.match(r.cutting.note,/Clone keeps Freakshow/);
  assert.deepEqual(r.clone,{clone:true,muts:['freakshow'],pid:true,mg:2});assert.equal(r.cloneRevealQuiet,true);assert.equal(r.panel,true);
  assert.equal(r.f1.shows,0);assert.equal(r.f1.carriers,1);assert.equal(r.f1.odds,1);
  assert.ok(r.f2>.19&&r.f2<.31,'F2 ~25% '+r.f2);assert.ok(r.backcross>.43&&r.backcross<.57,'backcross ~50% '+r.backcross);
  assert.equal(Math.round(r.lot.show*100),25);assert.equal(Math.round(r.lot.carry*100),50);
  assert.ok(r.dominant>.43&&r.dominant<.57,'dominant ~50% '+r.dominant);
  assert.ok(r.chimeraMother>.07&&r.chimeraMother<.18,'maternal chimera ~12% '+r.chimeraMother);assert.ok(r.chimeraFather<.03,'paternal chimera '+r.chimeraFather);
  assert.ok(r.triploidKids<.03,'triploid seeds '+r.triploidKids);assert.equal(r.triploidPollen,true);
  assert.deepEqual(r.legacy,{mg:2,muts:['inkleaf']});
  assert.equal(r.hiddenBefore,14);assert.equal(r.guide.text,true);assert.equal(r.guide.n,15);assert.equal(r.guide.drawn,15);
  await page.reload({waitUntil:'load',timeout:120000});await page.evaluate(()=>BagseedStartup.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state.player);
  const saved=await page.evaluate(id=>{const c=state.plants[id];return {muts:Mut.list(c),mg:c.genome115.mg.freakshow,clone:c.clone};},r.cloneId);
  assert.deepEqual(saved,{muts:['freakshow'],mg:2,clone:true});
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
