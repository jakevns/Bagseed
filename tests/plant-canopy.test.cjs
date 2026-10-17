const {test}=require('node:test'),assert=require('node:assert/strict');
const canopy=require('../graphics/plants/sources/canopy.cjs'),model=require('../graphics/plants/porchlight/sources/model.cjs');
const p={id:'same-plant',height:50,nodes:11,stage:8,sex:'F',water:60,pheno:{b:1}};
test('all female kits have stable graded branch sites and the largest apical flower',()=>{
 for(const strain of ['porchlight','velvet','pixelpunch','cottoncandy','moonberry']){
  const manifest=require('../graphics/plants/'+strain+'/sources/manifest.json'),m=model.build(p,{}, {parts:manifest.parts}),apex=m.organs.find(o=>o.id==='apex:flower');
  assert.equal(model.counts(m).flowers,model.counts(m).primaryBranches*5+1);
  for(const b of m.branches.filter(b=>b.order===1)){
   const tip=m.organs.find(o=>o.id===b.id+'/flower'),sites=m.organs.filter(o=>o.id.startsWith(b.id+'/bud:'));
   assert.equal(sites.length,4);assert.ok(tip.length<apex.length);assert.ok(sites.every(o=>o.length<tip.length));
   for(let i=1;i<sites.length;i++)assert.ok(sites[i].length>sites[i-1].length);
   const pose=model.pose(m,p,1,1);assert.ok(sites.every(o=>pose.organs.has(o.id)));
  }
 }
});
test('cleanup persists, removes lower sites and leaves, enlarges retained tops and cannot stack',()=>{
 const clean={...p,canopy:canopy.care({...p,stage:7})},a=model.build(p),b=model.build(clean);
 assert.ok(model.counts(b).flowers<model.counts(a).flowers);assert.ok(model.counts(b).leaves<model.counts(a).leaves);
 assert.ok(b.organs.find(o=>o.id==='apex:flower').length>a.organs.find(o=>o.id==='apex:flower').length);
 assert.ok(!b.organs.some(o=>o.id.endsWith('/bud:0')));
 assert.deepEqual(canopy.care(clean,8),clean.canopy);
 assert.equal(canopy.yieldFactor(p),.9);assert.equal(canopy.yieldFactor(clean),1.08);
 assert.ok(canopy.yieldFactor({...p,canopy:canopy.care(p)})<canopy.yieldFactor(clean));
 assert.deepEqual(canopy.care({...p,stage:9}),canopy.read(p));
 const grown=model.build({...clean,height:90});assert.ok(!grown.organs.some(o=>o.id.endsWith('/bud:0')));
 const male=model.build({...clean,sex:'M'});assert.ok(male.organs.filter(o=>o.kind==='flower').every(o=>o.role==='maleClosed'));
});
test('old pruned saves receive bounded credit and old dried harvests keep their quantity',()=>{
 assert.equal(canopy.read({pruned:1}).cleaned,1);assert.equal(canopy.yieldFactor({stage:12,pruned:1}),1);
 const c=canopy.care({...p,stage:7}),harvest={...p,stage:12,canopyHarvest:structuredClone(c),canopy:{v:1,cleaned:0,credit:0}};
 assert.equal(canopy.yieldFactor(harvest),1.08);const before=JSON.stringify(harvest);model.build(harvest);assert.equal(JSON.stringify(harvest),before);
});
