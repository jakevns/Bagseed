// Compare incoming and merged furniture in the same browser. Stored PNG hashes
// from a different browser/OS can differ despite unchanged source artwork.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(ROOT,process.argv[2]||'artifacts/merge-verification');fs.mkdirSync(OUT,{recursive:true});
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
(async()=>{
 const incoming=cp.execFileSync('git',['show','origin/main:public/index.html'],{cwd:ROOT,maxBuffer:100*1024*1024});
 const {createStaticServer}=await import('./server.mjs'),app=createStaticServer();
 const server=http.createServer((req,res)=>{if(req.url==='/incoming.html'){res.setHeader('Content-Type','text/html');res.end(incoming);}else app.emit('request',req,res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-accelerated-2d-canvas']});
 try{
  const results=[],errors=[];
  for(const route of ['/incoming.html','/']){
   const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+route);
   await page.evaluate(()=>Promise.all([BagseedArt.ready,BagseedBedroom.ready,BagseedBeds.ready,BagseedDesks.ready]));await page.locator('[data-act=newGame]').click();await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');
   results.push(await page.evaluate(()=>{
    settings.speed=0;const art={};
    for(const [frame]of STYLES.bed)for(const [bedding]of STYLES.bedding){const c=document.createElement('canvas');c.width=252;c.height=240;const g=c.getContext('2d');g.scale(3,3);g.translate(0,-100);state.room.bed=frame;state.room.bedding=bedding;RoomArt.drawBed(g);art[frame+':'+bedding]=c.toDataURL();}
    for(let tier=0;tier<3;tier++){const c=document.createElement('canvas');c.width=240;c.height=180;const g=c.getContext('2d');g.scale(3,3);Gear.bench(g,6,34,tier);art['desk:'+tier]=c.toDataURL();}return art;
   }));await context.close();
  }
  assert.deepEqual(Object.keys(results[1]),Object.keys(results[0]));const mismatches=[],hashes={};for(const [key,expected]of Object.entries(results[0])){if(results[1][key]!==expected)mismatches.push(key);hashes[key]=sha(expected);}
  const stored={};for(const batch of ['01','02','03'])Object.assign(stored,JSON.parse(fs.readFileSync(path.join(ROOT,'review/beds-batch-'+batch+'/render-hashes.json'))));
  const storedMatches=Object.entries(stored).filter(([key,hash])=>hashes[key]===hash).length;
  const report={incomingRef:cp.execFileSync('git',['rev-parse','origin/main'],{cwd:ROOT}).toString().trim(),bedViews:80,deskViews:3,mismatches,storedPNGHashMatches:storedMatches,storedPNGHashCount:Object.keys(stored).length,errors};
  fs.writeFileSync(path.join(OUT,'furniture-render-comparison.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(OUT,'incoming-furniture-render-hashes.json'),JSON.stringify(hashes,null,2)+'\n');console.log(JSON.stringify(report,null,2));assert.deepEqual(mismatches,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
