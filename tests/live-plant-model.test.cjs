const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../graphics/plants/porchlight/sources/model.cjs');
const p={id:'trained',height:40,nodes:11,stage:9,sex:'F',water:60,training:'natural',pheno:{b:1}};
test('topping and inherited twin leaders carry connected leaves and flowers along both new shoots',()=>{
 for(const state of [{...p,training:'topped'},{...p,visualState:{mutationArts:['twin']}}]){
  const model=M.build(state),leaders=model.branches.filter(b=>b.order===0);assert.equal(leaders.length,2);
  assert.equal(model.organs.filter(o=>o.site==='apical').length,2);assert.equal(model.organs.some(o=>o.id==='apex:flower'),false);
  for(const leader of leaders){assert.ok(model.organs.filter(o=>o.parent===leader.id&&o.kind==='leaf').length>=8);assert.equal(model.organs.filter(o=>o.parent===leader.id&&o.kind==='flower').length,4);}
  for(const t of [0,1,2])assert.deepEqual(M.pose(model,state,t,1).joints.get('root'),{x:0,y:0});
 }
});
test('SCROG and LST retain attachment parents, whorls add real node leaves, and giant proxy properties remain readable',()=>{
 const base=M.build(p);for(const training of ['lst','scrog']){const state={...p,training},m=M.build(state);assert.notDeepEqual(m.branches,base.branches);assert.equal(m.organs.filter(o=>o.kind==='flower').length,base.organs.filter(o=>o.kind==='flower').length);M.pose(m,state,1,1);}
 assert.ok(M.counts(M.build({...p,visualState:{mutationArts:['whorl']}})).leaves>M.counts(base).leaves);
 const proxy=Object.assign(Object.create(p),{height:65});assert.ok(M.build(proxy).organs.some(o=>o.kind==='flower'));
});
