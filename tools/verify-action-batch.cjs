const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const batches={
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
};
const samples=JSON.parse(fs.readFileSync('review/characters-v2/sources/baseline-assets.json')).people;
const roster=[...JSON.parse(fs.readFileSync('graphics/production/cast/sources/cast-roster.json')).people,...samples.map(p=>({...p,assetId:p.id}))];
const owner=(batch,id)=>{
 const file=`graphics/production/actions/${batch}/sheet.json`;
 const assetId=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)).assetIds[id]:null;
 const person=roster.find(p=>assetId?p.assetId===assetId:p.id===id);
 assert.ok(person,`Missing exact appearance for ${batch}/${id}`);return person;
};
const allApproved=new Set(Object.entries(batches).flatMap(([batch,ids])=>ids.map(id=>owner(batch,id).assetId)));
const latest=new Set(['batch-10','batch-11'].flatMap(batch=>batches[batch].map(id=>owner(batch,id).assetId)));
const rendererFix=process.argv.includes('--renderer-fix');
const priorFile=process.argv.slice(2).find(arg=>!arg.startsWith('--'))||'review/poses-batch-05/candidate.html';
const explicitPrior=priorFile!=='review/poses-batch-05/candidate.html';
const changedSincePrior=rendererFix&&explicitPrior?new Set():explicitPrior?latest:new Set(Object.entries(batches).filter(([batch])=>batch>'batch-05').flatMap(([batch,ids])=>ids.map(id=>owner(batch,id).assetId)));
(async()=>{
 const {createStaticServer}=await import('./server.mjs');const app=createStaticServer();
 const pages={'/before':'review/poses-batch-01/original-illustrated.html','/prior-batch':priorFile};
 const server=http.createServer((req,res)=>{const file=pages[req.url];if(file){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(file));}else app.emit('request',req,res);});
 // Use software canvas for exact RGBA comparisons across Windows GPU drivers.
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});
 try {
  const page=await browser.newPage(),snapshots=[],revisions=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/before','/prior-batch','/']){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   revisions.push(await page.evaluate(()=>BagseedArt.renderingRevision==='customization-2'));
   snapshots.push(await page.evaluate(async samples=>{
    const fingerprint=async canvas=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data))).map(v=>v.toString(16).padStart(2,'0')).join('');
    const result={};
    for(const p of [...samples,...BagseedArt.cast]){
     result[p.id]={portrait:await fingerprint(BagseedArt.portrait(p.look)),views:{}};
     for(const dir of ['down','right','up','left']){
      // Legacy suit/coat flags override shirtC, so change pantsC to exercise
      // a genuinely customized appearance for every member of the roster.
      result[p.id].views[dir]={standing:await fingerprint(BagseedArt.sprite(p.look,dir)),nose:await fingerprint(buildNoseSprite1151(p.look,dir)),custom:await fingerprint(buildNoseSprite1151({...p.look,pantsC:'#123456'},dir))};
     }
    }
    return result;
   },samples));
  }
  const [original,prior,current]=snapshots;assert.equal(Object.keys(current).length,72,'Full cast and original samples were not checked');let comparisons=0,customChanges=0;
  for(const id of Object.keys(current)){
   for(const [index,old]of [original,prior].entries()){if(!revisions[index]&&id==='player')assert.notEqual(current[id].portrait,old[id].portrait,'Player must use the consistent customizable portrait');else assert.equal(current[id].portrait,old[id].portrait,id+' regular portrait changed');comparisons++;}
   for(const dir of ['down','right','up','left']){
    const now=current[id].views[dir];
    for(const [index,[before,changed]]of [[original,allApproved.has(id)],[prior,changedSincePrior.has(id)]].entries()){
     const legacy=!revisions[index],was=before[id].views[dir];if(legacy&&id==='player')assert.notEqual(now.standing,was.standing,'Player must use the consistent customizable body');else assert.equal(now.standing,was.standing,id+' standing '+dir);
     if(legacy){if(now.custom!==was.custom)customChanges++;}else assert.equal(now.custom,was.custom,id+' custom '+dir);
     if(!(legacy&&!allApproved.has(id)))assert.equal(now.nose!==was.nose,changed,id+' action routing '+dir);comparisons+=3;
    }
   }
  }
  assert.ok(customChanges>0,'Custom renderer repair was not exercised against the legacy baseline');
  console.log(`${comparisons} full-cast comparisons passed: 71 NPC standing drawings/portraits preserved; ${customChanges} legacy custom views exercise the repaired renderer.`);
  const expected=[];
  for(const [batch,ids]of Object.entries(batches))for(const id of ids){
   const p=owner(batch,id),assets={};for(const view of ['down','right','up','left','portrait'])assets[view]='data:image/png;base64,'+fs.readFileSync(`graphics/production/actions/${batch}/${id}/${view}.png`).toString('base64');
   expected.push({id:p.assetId,look:p.look,assets});
  }
  const report=await page.evaluate(async expected=>{
   const fingerprint=async canvas=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data))).map(v=>v.toString(16).padStart(2,'0')).join('');
   const mismatches=[];let checks=0;
   const canvas=(w=96,h=108)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
   for(const entry of expected){
    const p=entry;
    for(const dir of ['down','right','up','left']){
     const image=new Image();image.src=entry.assets[dir];await image.decode();const c=canvas();c.getContext('2d').drawImage(image,0,0);
     if(await fingerprint(c)!==await fingerprint(buildNoseSprite1151(p.look,dir)))mismatches.push(entry.id+' '+dir);checks++;
    }
    const image=new Image();image.src=entry.assets.portrait;await image.decode();const expectedPortrait=canvas(192,192),g=expectedPortrait.getContext('2d');g.fillStyle=BagseedArt.normalize(p.look).bg||'#eadfc9';g.fillRect(0,0,192,192);g.drawImage(image,0,0);
    const actual=canvas(192,192);actual.dataset.illustratedDensity='3';const dialog=document.querySelector('#dialog'),children=[...dialog.childNodes],oldDialog=runtime.curDialog,oldSmell=Smell1151.active;
    try{dialog.replaceChildren(actual);runtime.curDialog={smell1151:true};Smell1151.active={dialog:runtime.curDialog};drawPortrait(actual,p.look);}
    finally{runtime.curDialog=oldDialog;Smell1151.active=oldSmell;dialog.replaceChildren(...children);}
    if(await fingerprint(actual)!==await fingerprint(expectedPortrait))mismatches.push(entry.id+' reaction portrait');checks++;
   }
   return {checks,mismatches};
  },expected);
  assert.deepEqual(report.mismatches,[]);assert.equal(report.checks,allApproved.size*5);assert.deepEqual(errors,[]);
  console.log(`${report.checks} registered-asset checks passed: all ${allApproved.size} characters use their complete drawings in four directions and reaction portraits; no browser errors.`);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
