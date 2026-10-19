const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const library=require('../graphics/plants/sources/library.json'),identity=require('../graphics/plants/sources/phenotype-library.cjs'),model=require('../graphics/plants/porchlight/sources/model.cjs'),canopy=require('../graphics/plants/sources/canopy.cjs'),night=require('../graphics/plants/sources/night-color.cjs');
const ids=['gasstation','boglantern-lavender','frogprince-red'],root=path.resolve(__dirname,'..'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('last catalog strain and two extra profiles preserve all eleven earlier kits and native defaults',()=>{
 const saved={};for(const id of Object.keys(library.strains).filter(id=>id!=='gasstation'&&!id.startsWith('cl_')))saved[id]={parts:Object.fromEntries(Object.entries(library.parts).filter(([key])=>key.startsWith(id+'.'))),profile:library.profiles[id+'@1'],strain:library.strains[id]};
 assert.equal(Object.keys(saved).length,11);assert.equal(sha(JSON.stringify(saved)),'034c7cbc0c172b8b43232a0079bd726de2c2abd5e8435a366c605d204e16fbb6');
 assert.equal(Object.keys(library.strains).filter(id=>!id.startsWith('cl_')).length,12);assert.equal(library.strains.gasstation,'gasstation@1');assert.equal(library.strains.boglantern,'boglantern@1');assert.equal(library.strains.frogprince,'frogprince@1');
 assert.equal(library.strains['boglantern-lavender'],undefined);assert.equal(library.strains['frogprince-red'],undefined);
 const source=fs.readFileSync(path.join(root,'src/game.html'),'utf8'),native=require('node:vm').runInNewContext('('+source.match(/const LINES = (\[[\s\S]*?\n\]);/)[1]+')');
 assert.equal(native.length,12);const gas=native.find(g=>g.id==='gasstation');assert.equal(gas.heightF,1.3);assert.equal(gas.lifecycle,'photo');assert.equal(gas.leafShape,'narrow');assert.equal(gas.colorName,'Blue-green');
});
for(const id of ids){
 const spec=require('../graphics/plants/'+id+'/sources/profile.json'),manifest=require('../graphics/plants/'+id+'/sources/manifest.json');
 const p={id:id+'-review',lineId:spec.lineId,genome115:{id:id+'-phenotype-study'},height:50,nodes:11,stage:10,loc:'tent5',training:'natural',water:60,nutr:60,health:92,stress:0,density:.82,sex:'F',pheno:{b:1}};
 const pick=(p,traits=spec.traits)=>identity.createIdentity(p,traits,library,{profile:id+'@1'});
 test(spec.name+' has isolated organs and a saved identity belonging to its native strain',()=>{
  const base=path.join(root,'graphics/plants',id);assert.equal(sha(fs.readFileSync(path.join(base,manifest.source))),manifest.sourceSHA256);assert.equal(sha(fs.readFileSync(path.join(root,'public',manifest.runtime))),manifest.runtimeSHA256);assert.equal(manifest.lineId,spec.lineId);assert.equal(library.profiles[id+'@1'].lineId,spec.lineId);
  const parts=Object.values(manifest.parts);assert.equal(parts.length,16);
  for(const [i,a]of parts.entries()){
   const [x,y,w,h]=a.crop;assert.ok(w>0&&h>0&&x>=0&&y>=0&&x+w<=manifest.size[0]&&y+h<=manifest.size[1]);assert.ok(a.attach[0]>=0&&a.attach[0]<w&&a.attach[1]>=0&&a.attach[1]<h);assert.ok(a.outline.length>=3);
   for(const b of parts.slice(i+1)){const [xx,yy,ww,hh]=b.crop;assert.ok(x+w<=xx||xx+ww<=x||y+h<=yy||yy+hh<=y,'Organ crops overlap');}
  }
  const art=pick(p);assert.equal(art.profile,id+'@1');assert.deepEqual(art.traits,spec.traits);assert.equal(identity.readiness(art,library).pending.length,15);
  const before=JSON.stringify(p);assert.deepEqual(pick(p),art);assert.equal(JSON.stringify(p),before);
  const saved=JSON.parse(JSON.stringify(art));assert.deepEqual(identity.createIdentity({...p,id:'cloned-new-id',artIdentity:saved,training:'scrog',canopy:{v:1,cleaned:1,credit:1}},spec.traits,library),art);
  assert.throws(()=>pick(p,{...spec.traits,leafShape:spec.traits.leafShape==='broad'?'hybrid':'broad'}),/compatible artwork/);
 });
 test(spec.name+' expands attached branch buds and preserves cleanup, male flowers and root-fixed wind',()=>{
  const art=pick(p),plant={...p,artIdentity:art},small=model.build(plant,spec.traits,{parts:manifest.parts}),tall=model.build({...plant,height:90,loc:'outdoor'},spec.traits,{parts:manifest.parts}),trim=model.build({...plant,canopy:canopy.care(plant,7)},spec.traits,{parts:manifest.parts});
  assert.equal(tall.nodes,11);assert.ok(model.counts(tall).leaves>model.counts(small).leaves);const branches=new Set(tall.branches.map(b=>b.id));for(const b of small.branches)assert.ok(branches.has(b.id));
  assert.equal(model.counts(small).flowers,model.counts(small).primaryBranches*5+1);assert.ok(model.counts(trim).flowers<model.counts(small).flowers);assert.ok(model.counts(trim).leaves<model.counts(small).leaves);assert.ok(trim.organs.find(o=>o.id==='apex:flower').length>small.organs.find(o=>o.id==='apex:flower').length);
  for(const [stage,role]of [[6,'femaleEarly'],[7,'femaleEarly'],[8,'femaleMid'],[9,'femaleLate'],[10,'femaleLate']]){const m=model.build({...plant,stage},spec.traits),parents=new Set([...m.joints,...m.branches].map(x=>x.id));for(const o of m.organs)assert.ok(parents.has(o.parent));assert.ok(m.organs.filter(o=>o.kind==='flower').every(o=>o.role===role));}
  for(const [stage,role]of [[8,'maleClosed'],[9,'maleOpen']])assert.ok(model.build({...plant,stage,sex:'M'},spec.traits).organs.filter(o=>o.kind==='flower').every(o=>o.role===role));
  const a=model.pose(small,plant,1,1),b=model.pose(small,plant,2,1);assert.deepEqual(a.joints.get('root'),{x:0,y:0});assert.notDeepEqual(a.organs.get('apex:flower'),b.organs.get('apex:flower'));assert.deepEqual(model.pose(small,plant,1,1,true),model.pose(small,plant,10,1,true));
 });
 test(spec.name+' uses phenotype-specific finishing and eligible cool-night color without reselecting organs',()=>{
  const art=pick(p),plant={...p,artIdentity:art},cold={...plant,nightColor:{hours:24}};assert.equal(model.senescence(plant,spec.traits,night).palette,spec.finishPalette);assert.equal(model.senescence({...plant,stage:8},spec.traits).amount,0);
  assert.equal(night.expression(cold,spec.traits).palette,spec.coolPalette);assert.equal(model.senescence(cold,spec.traits,night).palette,spec.finishPalette+'-cool');assert.equal(night.socialBonus(cold,spec.traits),.08);assert.equal(night.socialBonus(cold,spec.traits,{filter:'mono'}),0);assert.deepEqual(pick(cold),art);
 });
 if(spec.experimental)test(spec.name+' is an additional compatible phenotype, without replacing the approved default',()=>{
  assert.equal(spec.registerAsDefault,false);const def=require('../graphics/plants/'+spec.lineId+'/sources/profile.json'),original=identity.createIdentity(p,def.traits,library),variant=pick(p);assert.equal(original.profile,spec.lineId+'@1');assert.notEqual(original.profile,variant.profile);
  assert.throws(()=>identity.createIdentity(p,spec.traits,library),/compatible artwork/);
  for(const key of ['leafKey','colorName'])assert.throws(()=>pick(p,{...spec.traits,[key]:key==='leafKey'?'lime':'Forest green'}),/compatible artwork/);
  assert.deepEqual(identity.createIdentity({...p,artIdentity:original},spec.traits,library,{profile:id+'@1'}),original);
 });
}
