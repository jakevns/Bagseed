const {test}=require('node:test'),assert=require('node:assert/strict');
const api=require('../graphics/plants/sources/phenotype-library.cjs'),catalog=require('../graphics/plants/sources/library.json');
const clone=x=>JSON.parse(JSON.stringify(x)),plant={id:'plant-one',lineId:'porchlight',seed:123,genome115:{id:'phenotype-one'},pheno:{h:1,b:1}},traits={leafShape:'broad',leafKey:'forest',colorName:'Forest green'};
test('draft Porchlight library is explicit about unfinished art and does not change plant data',()=>{
 const before=JSON.stringify(plant),a=api.createIdentity(plant,traits,catalog);assert.equal(api.validateLibrary(catalog),true);assert.equal(JSON.stringify(plant),before);assert.equal(api.readiness(a,catalog).renderable,false);assert.equal(api.readiness(a,catalog).pending.length,15);
});
test('save/reload and cloned genomes preserve artwork identity; conditions do not reroll it',()=>{
 const a=api.createIdentity(plant,traits,catalog),saved=clone(a);
 assert.deepEqual(api.createIdentity({...plant,artIdentity:saved},traits,catalog),a);
 assert.deepEqual(api.createIdentity({...plant,id:'clone-in-another-pot',seed:999,water:5,stress:90,health:30,training:'scrog',pruned:1,staked:true},traits,catalog),a);
 const inherited={id:'cutting',lineId:'porchlight',pheno:{artIdentity:saved}};assert.deepEqual(api.createIdentity(inherited,traits,catalog),a);inherited.pheno.artIdentity.seed='different';assert.equal(a.seed,'phenotype-one');
});
test('new inherited phenotype IDs get their own stable variation seed without changing parents',()=>{
 const a=api.createIdentity(plant,traits,catalog),offspring={...clone(plant),id:'offspring',genome115:{id:'child-phenotype'}};const b=api.createIdentity(offspring,traits,catalog);assert.notEqual(a.seed,b.seed);assert.deepEqual(api.createIdentity(offspring,traits,catalog),b);assert.equal(plant.genome115.id,'phenotype-one');
});
test('adding parts and a new strain preserves pinned existing plants',()=>{
 const library=clone(catalog),saved=api.createIdentity(plant,traits,library),oldParts=clone(saved.parts),newId='porchlight.sevenLeaf-alternate@1';library.parts[newId]={...clone(library.parts['porchlight.sevenLeaf@1']),id:newId};library.profiles['porchlight@2']={...clone(library.profiles['porchlight@1']),id:'porchlight@2'};library.profiles['porchlight@2'].roles.sevenLeaf.push(newId);library.revision='plant-parts-library-2';library.strains.porchlight='porchlight@2';library.strains['future-cross']='porchlight@2';assert.equal(api.validateLibrary(library),true);assert.deepEqual(api.createIdentity({...plant,artIdentity:saved},traits,library),saved);assert.deepEqual(saved.parts,oldParts);assert.equal(api.createIdentity({...plant,lineId:'future-cross'},traits,library).profile,'porchlight@2');
});
test('incompatible leaf families, missing saved parts and unregistered strains are not silently replaced',()=>{
 assert.throws(()=>api.createIdentity(plant,{...traits,leafShape:'narrow'},catalog),/compatible artwork/);assert.throws(()=>api.createIdentity({...plant,lineId:'unreviewed'},traits,catalog),/No artwork profile/);const saved=api.createIdentity(plant,traits,catalog),broken=clone(catalog);delete broken.parts[saved.parts.sevenLeaf];assert.throws(()=>api.validateLibrary(broken),/incompatible part/);const changed=clone(saved);changed.parts.sevenLeaf='missing@1';assert.throws(()=>api.validateIdentity(changed,catalog),/missing or changed/);
});
test('approved parts need real asset references and anchors; transient conditions are not inherited selectors',()=>{
 const library=clone(catalog),id=Object.keys(library.parts)[0];library.parts[id].status='approved';assert.throws(()=>api.validateLibrary(library),/asset and normalized attachment/);library.parts[id].status='draft';library.parts[id].when={stress:50};assert.throws(()=>api.validateLibrary(library),/Temporary conditions/);
});

test('a newly registered phenotype trait can select new compatible artwork without rewriting the resolver',()=>{
 const library=clone(catalog);library.inheritedTraits.leafPattern={type:'string',default:'plain'};const original='porchlight.sevenLeaf@1',newId='porchlight.sevenLeaf-striped@1';library.parts[original].when.leafPattern='plain';library.parts[newId]={...clone(library.parts[original]),id:newId,when:{leafShape:'broad',leafPattern:'striped'}};library.profiles['porchlight@1'].roles.sevenLeaf.push(newId);const plain=api.createIdentity(plant,traits,library),striped=api.createIdentity(plant,{...traits,leafPattern:'striped'},library);assert.equal(plain.parts.sevenLeaf,original);assert.equal(striped.parts.sevenLeaf,newId);assert.equal(striped.traits.leafPattern,'striped');library.inheritedTraits.stress={type:'number'};assert.throws(()=>api.validateLibrary(library),/Invalid inherited trait/);
});
