const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../graphics/plants/porchlight/sources/model.cjs');
const p={id:'stature-study',height:22,nodes:11,stage:8,sex:'F',water:60,pheno:{b:1},genome115:{id:'fixed-parent'}};
const reach=m=>Math.max(...m.branches.filter(b=>b.order===1).map(b=>Math.abs(b.dx)));
test('Pocket Dwarf compresses mature node spacing and branch reach while retaining substantial leaf anatomy',()=>{
 const plain=M.build(p),dwarf=M.build({...p,visualState:{mutationArts:['dwarf']}}),gap=m=>m.joints[5].y-m.joints[4].y,fan=m=>m.organs.find(o=>o.id==='fan:6:1');
 assert.equal(dwarf.height,p.height);assert.ok(gap(dwarf)<gap(plain)*.9);assert.ok(reach(dwarf)<reach(plain)*.8);assert.ok(fan(dwarf).length>fan(plain).length*1.5);assert.equal(fan(dwarf).role,fan(plain).role);
 assert.deepEqual(dwarf.joints.map(j=>j.id),plain.joints.map(j=>j.id));assert.ok(dwarf.organs.some(o=>o.site==='popcorn'));
});
test('Triploid alone changes no leaf, flower, node, branch, or training geometry',()=>{
 for(const stage of [2,3,5,6,8,10])for(const sex of ['F','M'])for(const height of [3,22,50,90])for(const training of ['natural','topped','lst','scrog']){
  const base={...p,stage,sex,height,training,nodes:Math.min(11,1+height*.24)};
  assert.deepEqual(M.build({...base,visualState:{mutationArts:['triploid']}}),M.build(base));
 }
 const whorl={...p,visualState:{mutationArts:['whorl']}};assert.deepEqual(M.build({...whorl,visualState:{mutationArts:['whorl','triploid']}}),M.build(whorl));
});
test('compact forms remain distinct and keep physical height and removed-leaf identity through further growth',()=>{
 const forms=[{trunkRatio:.62,branchScale:.56,leafFloor:.46},{trunkRatio:.72,branchScale:.66,leafFloor:.40}];
 const models=forms.map(geometry=>M.build({...p,visualState:{mutationArts:['dwarf'],structuralGeometry:{pocketdwarf:geometry}}}));
 assert.notDeepEqual(models[0].branches,models[1].branches);assert.ok(models.every(m=>m.height===22));
 for(const geometry of forms){const q={...p,visualState:{mutationArts:['dwarf'],structuralGeometry:{pocketdwarf:geometry},removedLeaves:['fan:6:1']}};for(const height of [22,50,90]){const m=M.build({...q,height});assert.equal(m.height,height);assert.equal(m.organs.find(o=>o.id==='fan:6:1').removed,true);}}
});
test('final mutations compose with earlier structures and preserve genetics, attached organs, fixed roots and reduced motion',()=>{
 for(const arts of [['dwarf'],['triploid'],['dwarf','triploid'],['dwarf','twin','crest','whorl','triploid']])for(const height of [3,8,22,50,90]){
  const q={...p,height,nodes:Math.min(11,1+height*.35),visualState:{mutationArts:arts}},before=JSON.stringify(q),m=M.build(q),known=new Set(m.joints.map(j=>j.id));
  for(const b of m.branches){assert.ok(known.has(b.parent));known.add(b.id);}for(const o of m.organs){assert.ok(known.has(o.parent));assert.ok(o.length>0&&Number.isFinite(o.length));}
  assert.deepEqual(M.pose(m,q,1.5,2).joints.get('root'),{x:0,y:0});assert.deepEqual(M.pose(m,q,0,2,true),M.pose(m,q,4,2,true));assert.equal(JSON.stringify(q),before);
 }
});
