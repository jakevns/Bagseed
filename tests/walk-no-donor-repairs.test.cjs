const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');

test('walk manifests never reuse donor-frame parts or retain pasted-repair metadata',()=>{
 const root=path.resolve('graphics/production/walk'),failures=[];
 for(const file of ['manifest.json','wardrobe-v5/manifest.json']){
  const data=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  for(const [id,item]of Object.entries(data.items)){
   const owners=new Map();
   for(const [key,frame]of Object.entries(item.frames)){
    for(const forbidden of ['rearTorsoRepair','rearTorsoProvenance','donorFrame','donorRect'])
     if(Object.hasOwn(frame,forbidden))failures.push(`${file}: ${id}/${key} retains ${forbidden}`);
    for(const [name,part]of Object.entries(frame.parts)){
     const rect=JSON.stringify(part.rect),owner=owners.get(rect);
     if(owner&&owner!==key)failures.push(`${file}: ${id}/${key}/${name} reuses the atlas rectangle owned by ${owner}`);
     owners.set(rect,key);
     if(part.sourceFrame&&part.sourceFrame!==key)failures.push(`${file}: ${id}/${key}/${name} comes from ${part.sourceFrame}`);
    }
    if(frame.registration?.sourceFrame&&frame.registration.sourceFrame!==key)
     failures.push(`${file}: ${id}/${key} was registered from ${frame.registration.sourceFrame}`);
   }
  }
 }
 assert.deepEqual(failures,[],'Replace the rejected source art; do not remove provenance merely to hide a donor repair');
});
