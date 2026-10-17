const{test}=require('node:test'),assert=require('node:assert/strict');
const model=require('../graphics/plants/porchlight/sources/model.cjs');
function plant(height,changes={}){return{lineId:'porchlight',seed:147,genome115:{id:'porchlight-phenotype-study'},height,nodes:Math.min(11,1+height*.24),stage:height<5?2:height<14?3:5,loc:height>50?'outdoor':'tent5',training:'natural',density:.82,water:60,health:92,pheno:{b:1},...changes};}
test('50 and 90 inch plants add attached secondary growth while keeping the native 11-node limit',()=>{const a=model.build(plant(50)),b=model.build(plant(90));assert.equal(a.height,50);assert.equal(b.height,90);assert.equal(a.nodes,11);assert.equal(b.nodes,11);assert.ok(model.counts(b).leaves>model.counts(a).leaves);assert.ok(model.counts(b).secondaryBranches>model.counts(a).secondaryBranches);assert.deepEqual(b.joints.map(j=>j.id),a.joints.map(j=>j.id));const ids=new Set(b.branches.map(b=>b.id));for(const branch of a.branches)assert.ok(ids.has(branch.id),'old branch lost its identity: '+branch.id);});
test('every organ has a real parent, including at fractional new-node and side-shoot thresholds',()=>{for(let height=2;height<=90;height+=.35){const p=plant(height),m=model.build(p),known=new Set(m.joints.map(j=>j.id));for(const b of m.branches){assert.ok(known.has(b.parent));known.add(b.id);}for(const o of m.organs){assert.ok(known.has(o.parent));assert.ok(Number.isFinite(o.length)&&o.length>0);}const pose=model.pose(m,p,1.7,2);assert.equal(pose.organs.size,m.organs.length);}});
test('wind keeps the root fixed and supported branches move less; reduced motion is stationary',()=>{const p=plant(90),m=model.build(p),a=model.pose(m,p,0,2),b=model.pose(m,p,1,2);assert.deepEqual(a.joints.get('root'),{x:0,y:0});assert.deepEqual(b.joints.get('root'),{x:0,y:0});assert.notDeepEqual(a.joints.get('apex'),b.joints.get('apex'));const frozenA=model.pose(m,p,0,2,true),frozenB=model.pose(m,p,10,2,true);assert.deepEqual(frozenA,frozenB);const staked={...p,staked:true},s=model.pose(m,staked,1,2),rest=model.pose(m,p,0,0);assert.ok(Math.abs(s.joints.get('apex').x-rest.joints.get('apex').x)<Math.abs(b.joints.get('apex').x-rest.joints.get('apex').x));});
test('growth and posing are deterministic, preserve the input plant, and remember removed leaf IDs',()=>{const p=plant(50),before=JSON.stringify(p),a=model.build(p);assert.deepEqual(model.build(p),a);model.pose(a,p,1,1);assert.equal(JSON.stringify(p),before);const id=a.organs.find(o=>o.kind==='leaf').id,trimmed=model.build({...p,visualState:{removedLeaves:[id]}});assert.equal(trimmed.organs.find(o=>o.id===id).removed,true);assert.equal(model.build({...plant(90),visualState:{removedLeaves:[id]}}).organs.find(o=>o.id===id).removed,true);});

test('older fan leaves retain their leaflet type as later nodes grow',()=>{const young=model.build(plant(14)),older=model.build(plant(50)),parts=new Map(older.organs.map(o=>[o.id,o.role]));for(const o of young.organs)if(parts.has(o.id))assert.equal(parts.get(o.id),o.role,o.id+' changed its leaflet count');});

test('seedlings have cotyledons and their first single true-leaf pair',()=>{const m=model.build(plant(3)),roles=m.organs.map(o=>o.role);assert.equal(roles.filter(r=>r==='cotyledon').length,1);assert.equal(roles.filter(r=>r==='singleLeaf').length,2);assert.equal(roles.some(r=>r==='fiveLeaf'||r==='sevenLeaf'),false);});

test('senescence follows finishing stage and expressed color without depending on hunger or stress',()=>{
 const p=plant(50,{stage:9,nutr:60,stress:0,artIdentity:{seed:'stable',traits:{colorName:'Red accents'}}}),before=JSON.stringify(p);
 assert.equal(model.senescence(p).palette,'red');assert.equal(model.senescence(p).amount,.65);
 assert.deepEqual(model.senescence({...p,nutr:1,stress:90}),model.senescence(p));
 assert.equal(model.senescence({...p,stage:8,visualState:{senescence:1}}).amount,0);
 assert.equal(model.senescence({...p,stage:10}).amount,.9);
 assert.equal(model.senescence({...p,visualState:{senescence:2}}).amount,1);
 assert.equal(model.senescence({...p,visualState:{senescence:NaN}}).amount,.65);
 for(const [color,palette]of [['Forest green','gold'],['Purple','purple'],['Dark purple','deep-purple'],['Lavender','lavender']])assert.equal(model.senescence(p,{colorName:color}).palette,palette);
 assert.equal(model.senescence({...p,pheno:{mut:'ink'}}).palette,'near-black');
 assert.equal(JSON.stringify(p),before);
});
