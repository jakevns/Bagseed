const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('every rear garment frame has explicit rear artwork provenance',()=>{
 const root=path.resolve('graphics/production/walk'),read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
 const data=read('manifest.json'),focused=[...read('sources/focused-corrections.json'),...read('sources/phase2-corrections.json')];let views=0;
 for(const[id,item]of Object.entries(data.items).filter(([,v])=>v.kind==='top'))for(let frame=0;frame<4;frame++){
  const key='up/'+frame,view=item.frames[key];assert.ok(view?.parts?.torso,`${id}/${key} has no rear torso`);
  const registration=view.registration,source=registration.source.replaceAll('\\','/'),slot=registration.sourceSlot;
  const correction=focused.find(v=>(v.source||`assets/${v.id}-${v.version}.png`)===source);
  const direction=registration.sourceFrame?.split('/')[0]||(correction?correction.frames[slot]?.split('/')[0]:['down','right','up','left'][Math.floor(slot/4)]);
  assert.equal(direction,'up',`${id}/${key} incorrectly uses ${source} slot ${slot}`);views++;
 }
 assert.equal(views,60);
});
