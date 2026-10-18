const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('front and rear reference guides complete both leg phases without duplicated half-steps',()=>{
 const root=path.resolve('graphics/production/walk/pose-guides-v6');
 const data=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 assert.equal(data.runtimeInstalled,false);
 const hashes=new Set(),crypto=require('node:crypto');
 for(const dir of ['down','up']){
  const views=Array.from({length:4},(_,f)=>data.frames[dir+'/'+f]);
  assert.deepEqual(views.map(v=>v.passing),[false,true,false,true]);
  assert.equal(views.filter(v=>v.supportImageSide==='left').length,2);
  assert.equal(views.filter(v=>v.supportImageSide==='right').length,2);
  assert.equal(new Set(views.map(v=>v.phase)).size,4);
  for(let f=0;f<4;f++){
   const v=views[f],p=v.points;
   assert.equal(p.ankleL[1],137,'support leg must stay planted');
   assert.ok(p.ankleR[1]<p.ankleL[1]);
   if(v.passing)assert.ok(p.ankleR[1]<views[f-1].points.ankleR[1]-4,'passing foot must lift distinctly');
   const bytes=fs.readFileSync(path.join(root,`${dir}-${f}.png`));
   assert.equal(bytes.readUInt32BE(16),288);assert.equal(bytes.readUInt32BE(20),432);
   const hash=crypto.createHash('sha256').update(bytes).digest('hex');
   assert.equal(hash,v.guideSHA256);hashes.add(hash);
   for(const q of Object.values(p)){assert.ok(q[0]>0&&q[0]<96);assert.ok(q[1]>0&&q[1]<144);}
   if(f<2)for(const key of Object.keys(p)){
    assert.equal(p[key][0]+views[f+2].points[key][0],96,'opposite step must switch side');
    assert.equal(p[key][1],views[f+2].points[key][1]);
   }
  }
  assert.notDeepEqual(views[0].points.handR,views[1].points.handR,'arm swing must settle during passing');
 }
 assert.equal(hashes.size,8,'every diagram must be distinct');
});
