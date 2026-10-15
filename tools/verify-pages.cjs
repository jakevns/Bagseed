// Exercise the staged deployment at the GitHub Pages project subpath.
// Stage public/ and run the workflow's revision-writing step before using this.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve('artifacts/pages/public');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.endsWith('/favicon.ico')){res.writeHead(204);res.end();return;}
  const name={'/Bagseed/':'index.html','/Bagseed/index.html':'index.html','/Bagseed/version.json':'version.json'}[url.pathname];
  if(!name){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',name.endsWith('.json')?'application/json':'text/html; charset=utf-8');
  res.end(fs.readFileSync(path.join(root,name)));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:'+server.address().port;
  const response=await page.goto(base+'/Bagseed/');assert.equal(response.status(),200);
  await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=newGame]').click();
  await page.locator('#crName').fill('Pages Verification');await page.locator('[data-act=startGame]').click();
  await page.waitForFunction(()=>screen==='game'&&state.scene==='bedroom'&&RoomArt.hits.length>0);
  const result=await page.evaluate(()=>({name:state.player.name,pixels:View.wctx.getImageData(0,0,View.world.width,View.world.height).data.some(v=>v>0)}));
  assert.equal(result.name,'Pages Verification');assert.equal(result.pixels,true);
  const version=await page.evaluate(async()=>{const r=await fetch('version.json');if(!r.ok)throw Error('Revision endpoint failed');return r.json();});
  assert.match(version.commit,/^[a-f0-9]{40}$/);assert.ok(Number.isFinite(Date.parse(version.deployedAt)));
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'artifacts/pages-game.png'});
  console.log('Staged Pages check passed: /Bagseed/ serves a playable bedroom; relative version.json resolves; no browser errors.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
