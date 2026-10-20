const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const { chromium }=require('playwright');
const pack=path.resolve(__dirname,'../../graphics/character-system/sources/unified-body-v7');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto('http://127.0.0.1:5193/?body-review=v7&sync=verified');assert.equal(response.status(),200);
    const images=page.locator('section img');assert.equal(await images.count(),6);
    const decoded=await images.evaluateAll(async imgs=>Promise.all(imgs.map(async i=>{await i.decode();return{src:new URL(i.src).pathname,width:i.naturalWidth,height:i.naturalHeight};})));
    const served=[];
    for(const image of decoded){assert.equal(image.width,1600);assert.equal(image.height,1500);const name=path.basename(image.src);const r=await page.request.get(new URL(image.src,page.url()).href);assert.equal(r.status(),200);assert.equal(sha(await r.body()),sha(fs.readFileSync(path.join(pack,name))));served.push(name);}
    const auditResponse=await page.request.get(new URL('/audit.json',page.url()).href);assert.equal(sha(await auditResponse.body()),sha(fs.readFileSync(path.join(pack,'audit.json'))));
    const body=await page.locator('body').innerText();assert(body.includes('information only'));assert(!body.includes('(limit 3)'));assert.equal(errors.length,0);
    await page.screenshot({path:path.join(pack,'live-review.png'),fullPage:false});
    const report={url:page.url(),boards:served,imageFilesMatchDisk:true,auditMatchesDisk:true,browserErrors:errors,walkIntegrated:false,approved:false};
    fs.writeFileSync(path.join(pack,'live-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
