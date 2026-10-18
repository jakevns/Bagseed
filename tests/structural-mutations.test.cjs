const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../graphics/plants/porchlight/sources/model.cjs'),Canopy=require('../graphics/plants/sources/canopy.cjs');
const plant=(arts,changes={})=>({id:'structural-study',height:50,nodes:11,stage:8,sex:'F',water:60,training:'natural',pheno:{b:1},visualState:{mutationArts:arts},...changes});
test('a natural fork develops from one rooted trunk and keeps two distinct terminal flowers',()=>{
 const young=M.build(plant(['twin'],{nodes:3,stage:3}));assert.equal(young.branches.filter(b=>b.order===0).length,0);
 const starts=[3.05,3.3,3.6,4].map(nodes=>M.build(plant(['twin'],{nodes,stage:5})).branches.find(b=>b.id==='leader:-1'));
 for(let i=1;i<starts.length;i++)assert.ok(Math.hypot(starts[i].dx,starts[i].dy)>Math.hypot(starts[i-1].dx,starts[i-1].dy));
 const p=plant(['twin']),m=M.build(p),tops=m.organs.filter(o=>o.site==='apical');
 assert.equal(m.joints.filter(j=>j.parent===null).length,1);assert.equal(tops.length,2);assert.notEqual(tops[0].parent,tops[1].parent);
 for(const top of tops){const b=m.branches.find(b=>b.id===top.parent);assert.equal(b.parent,'apex');assert.equal(top.at,1);}
 assert.ok(!m.organs.some(o=>o.id==='apex:flower'));
});
test('topping a Twin Leader creates four connected tops while retaining the original fork parents',()=>{
 const p=plant(['twin'],{training:'topped'}),m=M.build(p),tops=m.organs.filter(o=>o.site==='apical');assert.equal(tops.length,4);
 for(const o of tops){const tip=m.branches.find(b=>b.id===o.parent),leader=m.branches.find(b=>b.id===tip.parent);assert.equal(tip.at,1);assert.equal(leader.parent,'apex');}
 for(const t of [0,1,2])assert.deepEqual(M.pose(m,p,t,2).joints.get('root'),{x:0,y:0});
});
test('Triple Whorl supplies three distinct fans and three branch origins at a shared node, not extra leaflets',()=>{
 const seedling=M.build(plant(['whorl'],{stage:2,height:3,nodes:2}));assert.equal(seedling.organs.filter(o=>o.id.startsWith('seedling:true:')).length,3);
 const p=plant(['whorl'],{stage:5}),m=M.build(p);
 for(const j of m.joints.filter(j=>j.id.startsWith('node:'))){const leaves=m.organs.filter(o=>o.parent===j.id&&o.id.startsWith('fan:'));assert.equal(leaves.length,3);assert.equal(new Set(leaves.map(o=>o.id)).size,3);assert.ok(leaves.every(o=>o.at===0));assert.equal(new Set(leaves.map(o=>o.role)).size,1);assert.ok(leaves.some(o=>o.z<0));const branches=m.branches.filter(b=>b.parent===j.id&&b.order===1);if(branches.length)assert.equal(branches.length,3);}
 const clean=M.build({...p,canopy:Canopy.care({...p,stage:7})});assert.ok(M.counts(clean).leaves<M.counts(m).leaves);
});
test('fasciation marks only female terminal flowers and keeps lateral/popcorn buds graded',()=>{
 const p=plant(['crest']),m=M.build(p);assert.equal(m.organs.filter(o=>o.crested).length,1);
 assert.ok(m.organs.filter(o=>o.site==='popcorn').length>0);assert.ok(m.organs.filter(o=>o.kind==='flower'&&o.site!=='apical').every(o=>!o.crested));
 assert.ok(m.organs.filter(o=>o.kind==='flower').every(o=>o.widthScale===undefined));
 const male=M.build({...p,sex:'M'});assert.ok(male.organs.some(o=>o.kind==='flower'));assert.ok(!male.organs.some(o=>o.crested));
 const clean=M.build({...p,pruned:1,canopy:Canopy.care({...p,stage:7})});assert.equal(clean.organs.filter(o=>o.crested).length,1);assert.ok(M.counts(clean).flowers<M.counts(m).flowers);
});
test('structural combinations retain all attachment parents, input genetics, fixed roots and stable removed-leaf identities',()=>{
 for(const arts of [['twin'],['crest'],['whorl'],['twin','crest','whorl']])for(const height of [3,8,18,50,90])for(const training of ['natural','topped','lst','scrog']){
  const p=plant(arts,{height,nodes:Math.min(11,1+height*.24),stage:height<5?2:8,training,genome115:{id:'stable',mg:{whorl:2},som:['crested']}}),before=JSON.stringify(p),m=M.build(p),known=new Set(m.joints.map(j=>j.id));
  for(const b of m.branches){assert.ok(known.has(b.parent),b.id);known.add(b.id);}
  for(const o of m.organs){assert.ok(known.has(o.parent),o.id);assert.ok(Number.isFinite(o.length)&&o.length>0);}
  const pose=M.pose(m,p,1.7,1.5);assert.deepEqual(pose.joints.get('root'),{x:0,y:0});assert.equal(pose.organs.size,m.organs.length);assert.equal(JSON.stringify(p),before);
  const leaf=m.organs.find(o=>o.kind==='leaf'&&o.id!=='cotyledons');if(leaf){const trimmed=M.build({...p,visualState:{...p.visualState,removedLeaves:[leaf.id]}});assert.equal(trimmed.organs.find(o=>o.id===leaf.id).removed,true);}
 }
});
