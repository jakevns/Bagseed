const fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const {createStaticServer}=await import('./server.mjs');const app=createStaticServer();
 const server=http.createServer((req,res)=>{if(req.url==='/before'){res.setHeader('Content-Type','text/html');res.end(fs.readFileSync('review/poses-batch-01/original-illustrated.html'));}else app.emit('request',req,res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
 try {
  const page=await browser.newPage();const snapshots=[];
  for(const route of ['/before','/']){
   await page.goto('http://127.0.0.1:'+server.address().port+route);await page.evaluate(()=>BagseedArt.ready);
   snapshots.push(await page.evaluate(()=>{
    const result={};
    for(const name of ['Marcus Bell','Inés Calderón']){
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
  console.log(checks+' action-batch comparisons passed: standing and custom looks unchanged, both action sets replaced in all four directions.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
