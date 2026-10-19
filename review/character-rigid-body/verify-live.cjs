// Confirm the existing review port serves exactly the current on-disk files.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 const base='http://127.0.0.1:5189',files=[['/','review/character-rigid-body/index.html'],['/app.js','review/character-rigid-body/app.js'],...['compositor','canvas-renderer','raster-sources'].map(n=>['/'+n+'.js','src/character-system/'+n+'.js']),...['contract','registry','manifest'].map(n=>['/generated/'+n+'.json','review/character-rigid-body/generated/'+n+'.json'])];
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'generated/manifest.json')));
 for(const doc of manifest.documents)files.push(['/source/'+doc.parts.find(p=>p.name==='pelvis').completed.path,doc.parts.find(p=>p.name==='pelvis').completed.path]);
 const checked=[];
 for(const [url,file]of files){const response=await fetch(base+url);assert(response.ok,url);assert.equal(response.headers.get('cache-control'),'no-store');const actual=Buffer.from(await response.arrayBuffer()),expected=fs.readFileSync(path.join(root,file));assert.equal(hash(actual),hash(expected),url+' stale');checked.push({url,path:file,sha256:hash(actual)});}
 const {chromium}=require('playwright'),browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/?body-review=painted-joints&sync=verified');await page.waitForFunction(()=>window.reviewReady,null,{timeout:90000});assert.deepEqual(errors,[]);assert.match(await page.locator('#status').textContent(),/15 completed art parts/);}finally{await browser.close();}
 const report={base,checked,uiReady:true,bodyApproved:false,clothingFrozen:true};fs.writeFileSync(path.join(__dirname,'generated/live-sync.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({liveFiles:checked.length,uiReady:true}));
}main().catch(e=>{console.error(e);process.exitCode=1;});
