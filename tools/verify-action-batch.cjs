const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const batches={
 'batch-01':['marcus','ines'],
 'batch-02':['tobias','bev','kenji','mateo','elena'],
 'batch-03':['rosa','leo','mara','eli','nico'],
 'batch-04':['alma','owen','amina','ronan','leila'],
 'batch-05':['cass','jun','rosie','arthur','nadia']
};
const roster=JSON.parse(fs.readFileSync('graphics/production/cast/sources/cast-roster.json')).people;
const allApproved=new Set(Object.values(batches).flat().map(id=>roster.find(p=>p.id===id).assetId));
const latest=new Set(batches['batch-05'].map(id=>roster.find(p=>p.id===id).assetId));
(async()=>{
 const {createStaticServer}=await import('./server.mjs');const app=createStaticServer();
 const pages={'/before':'review/poses-batch-01/original-illustrated.html','/prior-batch':'review/poses-batch-04/candidate.html'};
 const server=http.createServer((req,res)=>{const file=pages[req.url];if(file){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(file));}else app.emit('request',req,res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
 try {
  const page=await browser.newPage(),snapshots=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/before','/prior-batch','/']){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   snapshots.push(await page.evaluate(async()=>{
    const fingerprint=async canvas=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data))).map(v=>v.toString(16).padStart(2,'0')).join('');
    const result={};
    for(const p of BagseedArt.cast){
     result[p.id]={portrait:await fingerprint(BagseedArt.portrait(p.look)),views:{}};
     for(const dir of ['down','right','up','left']){
      result[p.id].views[dir]={standing:await fingerprint(BagseedArt.sprite(p.look,dir)),nose:await fingerprint(buildNoseSprite1151(p.look,dir)),custom:await fingerprint(buildNoseSprite1151({...p.look,shirtC:'#123456'},dir))};
     }
    }
    return result;
   }));
  }
  const [original,prior,current]=snapshots;assert.equal(Object.keys(current).length,67,'Full cast was not checked');let comparisons=0;
  for(const id of Object.keys(current)){
   for(const old of [original,prior]){assert.equal(current[id].portrait,old[id].portrait,id+' regular portrait changed');comparisons++;}
   for(const dir of ['down','right','up','left']){
    const now=current[id].views[dir];
    for(const [before,changed]of [[original,allApproved.has(id)],[prior,latest.has(id)]]){
     const was=before[id].views[dir];assert.equal(now.standing,was.standing,id+' standing '+dir);assert.equal(now.custom,was.custom,id+' custom '+dir);
     assert.equal(now.nose!==was.nose,changed,id+' action routing '+dir);comparisons+=3;
    }
   }
  }
  console.log(`${comparisons} full-cast image comparisons passed: standing art, regular portraits, custom outfits and earlier batches preserved; 5 new action sets integrated.`);
  const expected=[];
  for(const [batch,ids]of Object.entries(batches))for(const id of ids){
   const p=roster.find(p=>p.id===id),assets={};for(const view of ['down','right','up','left','portrait'])assets[view]='data:image/png;base64,'+fs.readFileSync(`graphics/production/actions/${batch}/${id}/${view}.png`).toString('base64');
   expected.push({id:p.assetId,assets});
  }
  const report=await page.evaluate(async expected=>{
   const fingerprint=async canvas=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data))).map(v=>v.toString(16).padStart(2,'0')).join('');
   const mismatches=[];let checks=0;
   const canvas=(w=96,h=108)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
   for(const entry of expected){
    const p=BagseedArt.cast.find(p=>p.id===entry.id);
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
  assert.deepEqual(report.mismatches,[]);assert.equal(report.checks,110);assert.deepEqual(errors,[]);
  console.log(`${report.checks} registered-asset checks passed: all 22 approved characters use their complete drawings in four directions and reaction portraits; no browser errors.`);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
