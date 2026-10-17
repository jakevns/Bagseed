const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const library=require('../graphics/plants/sources/library.json'),api=require('../graphics/plants/sources/phenotype-library.cjs'),model=require('../graphics/plants/porchlight/sources/model.cjs'),night=require('../graphics/plants/sources/night-color.cjs');
const manifest=require('../graphics/plants/pixelpunch/sources/manifest.json'),spec=require('../graphics/plants/pixelpunch/sources/profile.json');
const p={id:'pixelpunch-review',lineId:'pixelpunch',genome115:{id:'pixelpunch-phenotype-study'},height:50,nodes:11,stage:10,loc:'tent5',training:'natural',water:60,nutr:60,health:92,stress:0,density:.82,sex:'F',pheno:{b:1}};
test('Pixel Punch atlas checksums, isolated crop bounds and attachment points match its hybrid profile',()=>{
 const root=path.resolve(__dirname,'..'),base=path.join(root,'graphics/plants/pixelpunch'),sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 assert.equal(sha(path.join(base,manifest.source)),manifest.sourceSHA256);assert.equal(sha(path.join(root,'public',manifest.runtime)),manifest.runtimeSHA256);
 const parts=Object.values(manifest.parts);assert.equal(parts.length,16);
 for(const [i,a]of parts.entries()){
  const [x,y,w,h]=a.crop;assert.ok(x>=0&&y>=0&&x+w<=manifest.size[0]&&y+h<=manifest.size[1]);assert.ok(a.attach[0]>=0&&a.attach[0]<w&&a.attach[1]>=0&&a.attach[1]<h);assert.ok(a.outline.length>=3);
  for(const b of parts.slice(i+1)){const [xx,yy,ww,hh]=b.crop;assert.ok(x+w<=xx||xx+ww<=x||y+h<=yy||yy+hh<=y,'Neighboring component can enter a crop');}
 }
 const identity=api.createIdentity(p,spec.traits,library);assert.equal(identity.profile,'pixelpunch@1');assert.equal(identity.traits.leafShape,'hybrid');assert.equal(api.readiness(identity,library).pending.length,15);
 assert.ok(Object.values(identity.parts).every(id=>id.startsWith('pixelpunch.')));assert.throws(()=>api.createIdentity(p,{...spec.traits,leafShape:'broad'},library),/compatible artwork/);
});
test('third kit preserves saved Porchlight/Velvet identities, clones and all earlier part/profile records',()=>{
 const old=structuredClone(library);old.revision='plant-parts-library-2';delete old.profiles['pixelpunch@1'];delete old.strains.pixelpunch;for(const id of Object.keys(old.parts))if(id.startsWith('pixelpunch.'))delete old.parts[id];
 for(const lineId of ['porchlight','velvet']){const traits={leafShape:'broad',leafKey:'forest',colorName:lineId==='porchlight'?'Forest green':'Red accents'},saved=api.createIdentity({...p,lineId},traits,old);assert.deepEqual(api.createIdentity({...p,lineId,artIdentity:saved},traits,library),saved);}
 const identity=api.createIdentity(p,spec.traits,library);assert.deepEqual(api.createIdentity({...p,id:'cutting',artIdentity:identity,health:30,training:'scrog'},spec.traits,library),identity);
});
test('Pixel Punch uses attached growth and wind, female/male flower organs, purple senescence and genetics-gated cold color',()=>{
 const identity=api.createIdentity(p,spec.traits,library),plant={...p,artIdentity:identity},a=model.build(plant,identity.traits,{parts:manifest.parts}),tall=model.build({...plant,height:90,loc:'outdoor'},identity.traits,{parts:manifest.parts});
 assert.equal(a.nodes,11);assert.equal(tall.nodes,11);assert.ok(model.counts(tall).leaves>model.counts(a).leaves);
 const ids=new Set(tall.branches.map(b=>b.id));for(const b of a.branches)assert.ok(ids.has(b.id));
 const parents=new Set([...a.joints,...a.branches].map(x=>x.id));for(const o of a.organs)assert.ok(parents.has(o.parent));
 assert.equal(model.counts(a).flowers,model.counts(a).primaryBranches*5+1);assert.ok(a.organs.filter(o=>o.kind==='flower').every(o=>o.role==='femaleLate'));
 const male=model.build({...plant,sex:'M',stage:8},identity.traits);assert.ok(male.organs.filter(o=>o.kind==='flower').every(o=>o.role==='maleClosed'));
 assert.deepEqual(model.pose(a,plant,1,1).joints.get('root'),{x:0,y:0});assert.deepEqual(model.pose(a,plant,1,1,true),model.pose(a,plant,10,1,true));
 const warm=model.senescence(plant,identity.traits,night),coldPlant={...plant,nightColor:{hours:24}},cold=model.senescence(coldPlant,identity.traits,night);
 assert.equal(warm.palette,'purple');assert.equal(cold.palette,'purple-cool');assert.notDeepEqual(warm.rgb,cold.rgb);assert.equal(night.socialBonus(coldPlant,identity.traits,{filter:'none'}),.08);assert.equal(night.socialBonus(coldPlant,identity.traits,{filter:'mono'}),0);
});
