const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),art=path.resolve(__dirname,'..');
const source=path.join(root,'baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html');
const sha=b=>createHash('sha256').update(b).digest('hex');
const archived=fs.readFileSync(source),original=fs.readFileSync(path.join(root,'src/game.html')),baselineSHA='4889b1d5c14ee0b95085ed6ef208615e19598f2bf5a656604284f22085502164';
assert.equal(sha(archived),baselineSHA,'The archived baseline changed');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'asset-manifest.json')));
const encoded=JSON.parse(fs.readFileSync(path.join(art,'encoded/manifest.json')));
assert.equal(encoded.decodedRGBAEqual,true,'Lossless encoding has not been verified');
const images={},add=(id,file)=>{const entry=encoded.files[path.relative(root,file)];assert.ok(entry,'Missing encoded image: '+file);assert.equal(sha(fs.readFileSync(file)),entry.sourceSHA256,'Stale encoded asset');const bytes=fs.readFileSync(path.join(root,entry.encoded));assert.equal(sha(bytes),entry.encodedSHA256,'Encoded image checksum differs');images[id]='data:image/webp;base64,'+bytes.toString('base64');return id;};
for(const [id,entry]of Object.entries(manifest.assets))if(!id.startsWith('hair/')&&!id.startsWith('hat/'))add(id,path.join(art,entry.path));
const customization=JSON.parse(fs.readFileSync(path.join(art,'customization/manifest.json')));
for(const [source,expected]of Object.entries(customization.sourceSHA256))assert.equal(sha(fs.readFileSync(path.join(art,manifest.sources[source].path))),expected,'Stale customization source: '+source);
for(const [id,file]of Object.entries(customization.assets))images[id]='data:image/png;base64,'+fs.readFileSync(path.join(art,file)).toString('base64');
const layers=JSON.parse(fs.readFileSync(path.join(art,'customization-v5/manifest.json')));
assert.equal(Object.keys(layers.hair).length,60,'All sixty independent hairstyles must be registered');
assert.equal(Object.keys(layers.hats).length,32,'All eight hat styles must be registered');
for(const [name,source]of Object.entries(layers.sources))assert.equal(sha(fs.readFileSync(path.join(art,'customization-v5/sources',name))),source.sha256,'Stale separate-layer source: '+name);
for(const [id,file]of Object.entries(layers.assets))images[id]='data:image/png;base64,'+fs.readFileSync(path.join(art,'customization-v5',file)).toString('base64');
const preview=path.join(root,'review/characters-v2'),fixtures=JSON.parse(fs.readFileSync(path.join(preview,'sources/baseline-assets.json')));
const approved=fixtures.people.map(person=>{
  const assets={},portraits={};
  for(const dir of ['down','right','up','left'])for(const frame of ['idle',0,1,2,3]){const name=dir+'-'+frame;assets[name]=add('approved/'+person.id+'/'+name,path.join(preview,'assets/sprites',person.id,name+'.png'));}
  for(const expression of ['neutral','friendly','concerned'])portraits[expression]=add('approved/'+person.id+'/portrait-'+expression,path.join(preview,'assets/portraits',person.id+'-'+expression+'.png'));
  return {id:person.id,name:person.name,look:person.look,kid:person.id==='poppy',assets,portraits};
});
const castRoot=path.join(art,'cast'),castManifest=JSON.parse(fs.readFileSync(path.join(castRoot,'sources/asset-manifest.json')));
const cast=castManifest.people.map(person=>{
  const assets={},portraits={};
  for(const dir of ['down','right','up','left'])assets[dir+'-idle']=add('cast/'+person.assetId+'/'+dir,path.join(castRoot,person.views[dir]));
  for(const expression of ['neutral','friendly','concerned'])portraits[expression]=add('cast/'+person.assetId+'/portrait-'+expression,path.join(castRoot,person.portraits[expression]));
  return {id:person.assetId,name:person.name,look:person.look,age:person.age,kid:!!person.kid,aliases:person.aliases,assets,portraits,rig:true};
});
assert.equal(cast.length,67,'Authored roster art is incomplete');
// Small approved pose batch: retain complete drawings, never composite an arm.
for(const [batch,names] of Object.entries({
  'batch-01':['marcus','ines'],
  'batch-02':['tobias','bev','kenji','mateo','elena'],
  'batch-03':['rosa','leo','mara','eli','nico'],
  'batch-04':['alma','owen','amina','ronan','leila'],
  'batch-05':['cass','jun','rosie','arthur','nadia'],
  'batch-06':['0','1','2','3','rosalind'],
  'batch-07':['suit','amani','grandma','pixel','moon'],
  'batch-08':['auto','swamp','rosalind','theo','marisol'],
  'batch-09':['cure','lumen','cafePT','gardenPT','hardwarePT'],
  'batch-10':['player','remy','doug','priya','poppy'],
  'batch-11':['dev','ari','sam','talia','luz']
})) for(const name of names) {
  const configPath=path.join(art,'actions',batch,'sheet.json');
  const assetId=fs.existsSync(configPath)?JSON.parse(fs.readFileSync(configPath)).assetIds[name]:null;
  const person=[...approved,...cast].find(p=>assetId?p.id===assetId:p.id.endsWith('-'+name));
  assert.ok(person,'Missing pose owner: '+name);
  person.actions={};
  for(const view of ['down','right','up','left','portrait']) {
    const id=`action/${batch}/${name}/${view}`;
    images[id]='data:image/png;base64,'+fs.readFileSync(path.join(art,'actions',batch,name,view+'.png')).toString('base64');
    person.actions[view]=id;
  }
}
const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/graphics/roster-audit.json'))),traits=[];
function visit(value,location='collections'){
  if(!value||typeof value!=='object')return;
  if(value.look)traits.push({look:{...value.look,...(value.kid?{short:true}:{})},name:value.name||null,age:value.age||value.authoredAge||null,kid:!!value.kid,source:location});
  for(const [k,v]of Object.entries(value))if(k!=='look')visit(v,location+'.'+k);
}
visit(audit.collections);
const detailLandmarks=JSON.parse(fs.readFileSync(path.join(art,'customization-v5/detail-landmarks.json')));
assert.deepEqual(detailLandmarks.canvas,[192,320],'Detail landmarks must use the registered bald-head canvas');
const data={images,approved,cast,traits,headFeatures:layers.features,detailLandmarks,hatRegistration:layers.hats,hatAssets:Object.keys(layers.hats),layeredHair:true,haircuts:61,manifest:{parts:Object.keys(manifest.assets),sourceHashes:Object.fromEntries(Object.entries(manifest.sources).map(([k,v])=>[k,v.sha256])),castSourceHashes:Object.fromEntries(Object.entries(castManifest.sources).map(([k,v])=>[k,v.sha256])),baselineSHA}};
const characterCode=fs.readFileSync(path.join(__dirname,'renderer.js'),'utf8').replace(/\r\n/g,'\n').replace('__BAGSEED_DETAIL_RENDERER__',()=>fs.readFileSync(path.join(__dirname,'face-details.js'),'utf8').replace(/\r\n/g,'\n')).replace('__BAGSEED_ART_DATA__',()=>JSON.stringify(data).replace(/</g,'\\u003c'));
new (require('node:vm').Script)(characterCode,{filename:'illustrated-production-code'});
const marker='bagseed-illustrated-production-code';
const target=path.join(root,'public/index.html'),current=fs.readFileSync(target);
const priorReport=path.join(art,'build.json'),priorSHA=fs.existsSync(priorReport)?JSON.parse(fs.readFileSync(priorReport)).updatedSHA:null;
assert.ok(sha(current)===baselineSHA||sha(current)===priorSHA,'Unexpected edits to the working HTML; preserve them before rebuilding');
const html=original.toString().replace('</body></html>',`<script id="${marker}">\n${characterCode}\n</script>\n${require('../../../tools/build-bedroom.cjs')()}</body></html>`);
assert.ok(html.includes(marker),'Could not find baseline insertion point');
const staging=target+'.tmp';fs.writeFileSync(staging,html);fs.renameSync(staging,target);
const report={version:'illustrated-1',approval:'Approved cast artwork retained; customization changes await user visual review.',customizationReview:'review/customization-v9/README.md',baselineSHA,workingSourceSHA:sha(original),updatedSHA:sha(Buffer.from(html)),bytes:Buffer.byteLength(html),modularAssets:Object.keys(manifest.assets).length,embeddedImages:Object.keys(images).length,approvedIdentities:approved.map(p=>p.id),additionalAuthoredAppearances:cast.length,bedroomRevision:'bedroom-shell-1',bedRevision:'beds-batch-04',bedCombinations:80,deskRevision:'seedling-desks-1',deskVariations:3};
fs.writeFileSync(path.join(art,'build.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
