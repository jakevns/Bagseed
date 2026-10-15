const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const {createStaticServer}=await import('./server.mjs');const app=createStaticServer();
 const server=http.createServer((req,res)=>{const before={'/before':'original-illustrated.html','/batch-01':'candidate.html'}[req.url];if(before){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync('review/poses-batch-01/'+before));}else app.emit('request',req,res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
 try {
  const page=await browser.newPage();const snapshots=[];
  for(const route of ['/before','/','/batch-01']){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   snapshots.push(await page.evaluate(()=>{
    const result={};
    for(const name of ['Marcus Bell','Inés Calderón','Tobias Nguyen','Beverly Sloane','Kenji Mori','Mateo Market','Elena Market']){
     const p=BagseedArt.cast.find(p=>p.name===name);if(!p)throw Error('Missing '+name);
     result[name]={};
     for(const dir of ['down','right','up','left']){
      result[name][dir]={standing:BagseedArt.sprite(p.look,dir).toDataURL(),nose:BagseedArt.sprite(p.look,dir,0,0,0,0,true).toDataURL(),custom:BagseedArt.sprite({...p.look,shirtC:'#123456'},dir,0,0,0,0,true).toDataURL()};
     }
    }
    return result;
   }));
  }
  let checks=0;for(const name of Object.keys(snapshots[0]))for(const dir of ['down','right','up','left']){
   const before=snapshots[0][name][dir],after=snapshots[1][name][dir];
   assert.equal(after.standing,before.standing,name+' standing '+dir);assert.equal(after.custom,before.custom,name+' custom '+dir);assert.ok(after.nose!==before.nose,name+' action '+dir);checks+=3;
  }
  console.log(checks+' action-batch comparisons passed: standing and custom looks unchanged, all seven action sets replaced in all four directions.');
  let batchChecks=0;
  for(const name of Object.keys(snapshots[1]))for(const dir of ['down','right','up','left']){
   const prior=snapshots[2][name][dir],current=snapshots[1][name][dir];
   assert.equal(current.standing,prior.standing,name+' standing since batch 01 '+dir);
   assert.equal(current.custom,prior.custom,name+' custom since batch 01 '+dir);
   if(['Marcus Bell','Inés Calderón'].includes(name))assert.equal(current.nose,prior.nose,name+' approved batch 01 pose '+dir);
   else assert.ok(current.nose!==prior.nose,name+' new batch 02 pose '+dir);
   batchChecks+=3;
  }
  console.log(batchChecks+' batch-02 comparisons passed: five new action sets, original two preserved.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
