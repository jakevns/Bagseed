const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const catalog=require('../graphics/plants/sources/library.json'),identity=require('../graphics/plants/sources/phenotype-library.cjs'),model=require('../graphics/plants/porchlight/sources/model.cjs'),manifest=require('../graphics/plants/velvet/sources/manifest.json');
const traits={leafShape:'broad',leafKey:'forest',colorName:'Red accents',branching:1};
const p={lineId:'velvet',height:50,nodes:11,stage:9,sex:'F',training:'natural',health:92,water:60,nutr:60,genome115:{id:'velvet-study'}};
test('Velvet source/runtime checksums and all attachment crops resolve to distinct registered parts',()=>{
 const base=path.resolve(__dirname,'../graphics/plants/velvet'),root=path.resolve(__dirname,'..');
 const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 assert.equal(sha(path.join(base,manifest.source)),manifest.sourceSHA256);assert.equal(sha(path.join(root,'public',manifest.runtime)),manifest.runtimeSHA256);
 assert.equal(Object.keys(manifest.parts).length,16);
 for(const part of Object.values(manifest.parts)){const [x,y,w,h]=part.crop;assert.ok(x>=0&&y>=0&&x+w<=manifest.size[0]&&y+h<=manifest.size[1]);assert.ok(part.attach[0]>=0&&part.attach[0]<w&&part.attach[1]>=0&&part.attach[1]<h);assert.ok(part.outline.length>=3);}
 const a=identity.createIdentity(p,traits,catalog);assert.equal(a.profile,'velvet@1');assert.ok(Object.values(a.parts).every(id=>id.startsWith('velvet.')));assert.equal(identity.readiness(a,catalog).pending.length,15);
});
test('adding Velvet leaves existing pinned Porchlight identities intact and clones preserve Velvet selections',()=>{
 const prior=structuredClone(catalog);delete prior.profiles['velvet@1'];delete prior.strains.velvet;for(const id of Object.keys(prior.parts))if(id.startsWith('velvet.'))delete prior.parts[id];
 const porch={...p,lineId:'porchlight'},pt={leafShape:'broad',leafKey:'forest',colorName:'Forest green'},old=identity.createIdentity(porch,pt,prior);
 assert.deepEqual(identity.createIdentity({...porch,artIdentity:old},pt,catalog),old);
 const a=identity.createIdentity(p,traits,catalog);assert.deepEqual(identity.createIdentity({...p,id:'clone',artIdentity:a,stress:90,training:'scrog'},traits,catalog),a);
});
test('Velvet uses expressed branching with shared growth, wind and red finishing, including attached flower sites',()=>{
 const a=identity.createIdentity(p,traits,catalog),plant={...p,artIdentity:a};
 const m=model.build(plant,a.traits,{parts:manifest.parts}),wide=model.build(plant,{...a.traits,branching:1.1},{parts:manifest.parts});
 assert.notEqual(m.branches[0].dx,wide.branches[0].dx);assert.equal(model.senescence(plant).palette,'red');
 assert.equal(model.senescence({...plant,stage:5}).amount,0);
 const pose=model.pose(m,plant,1,1);assert.deepEqual(pose.joints.get('root'),{x:0,y:0});
 const parents=new Set([...m.joints,...m.branches].map(x=>x.id));for(const o of m.organs)assert.ok(parents.has(o.parent));
 const ready=model.build({...plant,stage:10},a.traits);assert.equal(model.counts(ready).flowers,model.counts(ready).primaryBranches*5+1);assert.ok(ready.organs.filter(o=>o.kind==='flower').every(o=>o.role==='femaleLate'));
 const male=model.build({...plant,sex:'M',stage:9},a.traits);assert.ok(male.organs.filter(o=>o.kind==='flower').every(o=>o.role==='maleOpen'));
 const tall=model.build({...plant,height:90,loc:'outdoor'},a.traits);assert.ok(model.counts(tall).leaves>model.counts(m).leaves);
});
