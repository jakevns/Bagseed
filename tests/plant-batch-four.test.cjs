const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const library=require('../graphics/plants/sources/library.json'),identity=require('../graphics/plants/sources/phenotype-library.cjs'),model=require('../graphics/plants/porchlight/sources/model.cjs'),canopy=require('../graphics/plants/sources/canopy.cjs'),night=require('../graphics/plants/sources/night-color.cjs');
const oldIds=['porchlight','velvet','pixelpunch','cottoncandy','moonberry','halfmoon','zoomies','cruise'],newIds=['boglantern','frogprince','nightshift'];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('registering three new kits preserves every earlier part/profile record and saved identity',()=>{
 const saved={};for(const id of oldIds)saved[id]={parts:Object.fromEntries(Object.entries(library.parts).filter(([key])=>key.startsWith(id+'.'))),profile:library.profiles[id+'@1'],strain:library.strains[id]};
 assert.equal(sha(JSON.stringify(saved)),'a8741b3e2370e296a9ff0d4212260463fc57b1a0f7a48b0864b1a63d1aab16ad');
 const before=structuredClone(library);for(const id of newIds){delete before.strains[id];delete before.profiles[id+'@1'];for(const key of Object.keys(before.parts))if(key.startsWith(id+'.'))delete before.parts[key];}
 before.revision='plant-parts-library-8';
 for(const id of oldIds){const traits=id==='porchlight'?{leafShape:'broad',leafKey:'forest',colorName:'Forest green'}:id==='velvet'?{leafShape:'broad',leafKey:'forest',colorName:'Red accents'}:require('../graphics/plants/'+id+'/sources/profile.json').traits;
  const p={lineId:id,genome115:{id:id+'-saved'}},art=identity.createIdentity(p,traits,before);assert.deepEqual(identity.createIdentity({...p,artIdentity:art},traits,library),art);
 }
});
for(const id of newIds){
 const spec=require('../graphics/plants/'+id+'/sources/profile.json'),manifest=require('../graphics/plants/'+id+'/sources/manifest.json');
 const p={id:id+'-review',lineId:id,genome115:{id:id+'-phenotype-study'},height:50,nodes:11,stage:10,loc:'tent5',training:'natural',water:60,nutr:60,health:92,stress:0,density:.82,sex:'F',pheno:{b:1}};
 test(spec.name+' has isolated measured organs and a pinned compatible phenotype',()=>{
  const root=path.resolve(__dirname,'..'),base=path.join(root,'graphics/plants',id);assert.equal(sha(fs.readFileSync(path.join(base,manifest.source))),manifest.sourceSHA256);assert.equal(sha(fs.readFileSync(path.join(root,'public',manifest.runtime))),manifest.runtimeSHA256);
  const parts=Object.values(manifest.parts);assert.equal(parts.length,16);
  for(const [i,a]of parts.entries()){
   const [x,y,w,h]=a.crop;assert.ok(w>0&&h>0&&x>=0&&y>=0&&x+w<=manifest.size[0]&&y+h<=manifest.size[1]);assert.ok(a.attach[0]>=0&&a.attach[0]<w&&a.attach[1]>=0&&a.attach[1]<h);assert.ok(a.outline.length>=3);
   for(const b of parts.slice(i+1)){const [xx,yy,ww,hh]=b.crop;assert.ok(x+w<=xx||xx+ww<=x||y+h<=yy||yy+hh<=y,'Neighboring organ enters crop');}
  }
  const art=identity.createIdentity(p,spec.traits,library);assert.equal(art.profile,id+'@1');assert.deepEqual(art.traits,spec.traits);assert.equal(identity.readiness(art,library).pending.length,15);assert.ok(Object.values(art.parts).every(key=>key.startsWith(id+'.')));
  assert.deepEqual(identity.createIdentity({...p,id:'clone',artIdentity:art,health:20,canopy:{v:1,cleaned:1,credit:1},training:'scrog'},spec.traits,library),art);
  assert.throws(()=>identity.createIdentity(p,{...spec.traits,leafShape:spec.traits.leafShape==='narrow'?'broad':'narrow'},library),/compatible artwork/);
 });
 test(spec.name+' grows attached popcorn buds, preserves branches and supports cleanup and wind',()=>{
  const art=identity.createIdentity(p,spec.traits,library),plant={...p,artIdentity:art},small=model.build(plant,art.traits,{parts:manifest.parts}),tall=model.build({...plant,height:90,loc:'outdoor'},art.traits,{parts:manifest.parts}),trim=model.build({...plant,canopy:canopy.care(plant,7)},art.traits,{parts:manifest.parts});
  assert.ok(model.counts(tall).leaves>model.counts(small).leaves);assert.equal(tall.nodes,11);const ids=new Set(tall.branches.map(b=>b.id));for(const b of small.branches)assert.ok(ids.has(b.id));
  assert.equal(model.counts(small).flowers,model.counts(small).primaryBranches*5+1);assert.ok(model.counts(trim).flowers<model.counts(small).flowers);assert.ok(model.counts(trim).leaves<model.counts(small).leaves);
  assert.ok(trim.organs.find(o=>o.id==='apex:flower').length>small.organs.find(o=>o.id==='apex:flower').length);
  for(const [stage,role]of [[6,'femaleEarly'],[7,'femaleEarly'],[8,'femaleMid'],[9,'femaleLate'],[10,'femaleLate']]){
   const m=model.build({...plant,stage},art.traits);const parents=new Set([...m.joints,...m.branches].map(b=>b.id));for(const o of m.organs)assert.ok(parents.has(o.parent));assert.ok(m.organs.filter(o=>o.kind==='flower').every(o=>o.role===role));
  }
  for(const [stage,role]of [[8,'maleClosed'],[9,'maleOpen']])assert.ok(model.build({...plant,sex:'M',stage},art.traits).organs.filter(o=>o.kind==='flower').every(o=>o.role===role));
  const rest=model.pose(small,plant,0,0),a=model.pose(small,plant,1,1),b=model.pose(small,plant,2,1);assert.deepEqual(a.joints.get('root'),{x:0,y:0});assert.notDeepEqual(a.organs.get('apex:flower'),b.organs.get('apex:flower'));assert.deepEqual(model.pose(small,plant,1,1,true),model.pose(small,plant,10,1,true));assert.deepEqual(rest.joints.get('root'),{x:0,y:0});
 });
 test(spec.name+' finishes with its own senescence and only genetically eligible cold color',()=>{
  const art=identity.createIdentity(p,spec.traits,library),plant={...p,artIdentity:art},cold={...plant,nightColor:{hours:24}};
  assert.equal(model.senescence(plant,art.traits,night).palette,spec.finishPalette);assert.equal(model.senescence({...plant,stage:8},art.traits).amount,0);
  if(spec.coolNights){assert.equal(night.expression(cold,art.traits).palette,spec.coolPalette);assert.equal(model.senescence(cold,art.traits,night).palette,spec.finishPalette+'-cool');assert.equal(night.socialBonus(cold,art.traits),.08);}else{assert.equal(night.capability(art.traits),null);assert.equal(night.socialBonus(cold,art.traits),0);assert.deepEqual(model.senescence(cold,art.traits,night),model.senescence(plant,art.traits,night));}
 });
}

for(const id of ['boglantern','frogprince'])test(id+' experimental review never silently replaces a different rolled phenotype',()=>{
 const spec=require('../graphics/plants/'+id+'/sources/profile.json'),p={lineId:id,id:'experimental-review'};
 assert.equal(spec.experimental,true);
 for(const key of ['leafShape','leafKey','colorName']){
  const wrong={...spec.traits,[key]:key==='leafShape'?'hybrid':key==='leafKey'?'blue':'Forest green'};
  assert.throws(()=>identity.createIdentity(p,wrong,library),/compatible artwork/);
 }
 const source=fs.readFileSync(path.resolve(__dirname,'../src/game.html'),'utf8');
 const lines=require('node:vm').runInNewContext('('+source.match(/const LINES = (\[[\s\S]*?\n\]);/)[1]+')');
 const native=lines.find(line=>line.id===id);assert.equal(native.experimental,true);assert.equal(native.lifecycle,id==='frogprince'?'auto':'photo');
 assert.equal(native.leafShape,undefined);assert.equal(native.colorName,undefined);
 // Review choices are all within the real native experimental roll domain.
 assert.ok(['broad','narrow','hybrid'].includes(spec.traits.leafShape));assert.ok(['lime','forest','blue'].includes(spec.traits.leafKey));
 assert.ok(spec.traits.branching>=.75&&spec.traits.branching<=1.3);
});
