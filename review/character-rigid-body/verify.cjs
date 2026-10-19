// Meaningful invariants: original-pixel identity, rigid matrices, measured bones,
// 15 parts in all 108 poses, and a browser comparison against the original PNG.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),{createEngine}=require('../../src/character-system/compositor.js');
const contract=require('./generated/contract.json'),registry=require('./generated/registry.json'),manifest=require('./generated/manifest.json'),map=require('./native-body-map.json');
const {pose,scale,length}=require('./rig.cjs'),engine=createEngine(contract,registry);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let poses=0,matrices=0;
for(const doc of map.documents){
 const [_,anatomy,direction]=doc.id.split('/'),native=manifest.documents.find(d=>d.id===doc.id);
 const svg=fs.readFileSync(path.join(__dirname,'generated',anatomy+'-'+direction+'.svg'),'utf8');
 assert(!/linearGradient|radialGradient|data-authored-underpaint|frameClip/.test(svg));
 assert.equal((svg.match(/<use href="#original"/g)||[]).length,15);
 assert(svg.includes(fs.readFileSync(path.join(root,doc.source)).toString('base64')));
 assert.equal(native.parts.length,15);
 for(const part of native.parts)if(!part.side)assert.equal(part.reusedVisiblePixels,false);
 for(const required of ['neck','hand','forearm','calf'])assert(native.parts.some(p=>p.name===required));
 for(const f of [null,0,1,2,3,4,5,6,7]){
  const p=engine.plan({anatomy},{direction,mode:f===null?'idle':'walk',frame:f??0});assert(p.complete);assert.equal(p.trace.layers.length,15);poses++;
  for(const layer of p.trace.layers){
   const g=layer.geometry,b=g.shape.binding,[a,bb,c,d]=g.matrix;
   assert.equal(b.mode,'rigid');assert.equal(b.uniformScale,scale);assert.equal(g.shape.tint.mode,'preserve');
   assert(Math.abs(Math.hypot(a,bb)-scale)<1e-10);assert(Math.abs(Math.hypot(c,d)-scale)<1e-10);assert(Math.abs(a*c+bb*d)<1e-10);assert(a*d-bb*c>0);
   assert(!g.shape.frameClip&&!g.shape.frameFill&&!g.shape.underpaint);matrices++;
   if(f===null)for(let i=0;i<6;i++)assert(Math.abs(g.matrix[i]-native.standingMatrix[i])<1e-10);
  }
  for(const s of ['L','R'])for(const [a,b]of [['shoulder','elbow'],['elbow','wrist'],['hip','knee'],['knee','ankle']])assert(Math.abs(length(p.trace.anchors[a+s],p.trace.anchors[b+s])-length(doc.pins[a+s],doc.pins[b+s])*scale)<1e-8,'Bone length changed');
 }
 for(const s of ['L','R']){const air=Array.from({length:8},(_,f)=>{const p=pose(doc,f);return {...p.offsets[s],actualForward:(p.anchors['ankle'+s][0]-p.anchors['hip'+s][0])*(direction==='left'?-1:1)};}).filter(v=>v.airborne).sort((a,b)=>a.phase-b.phase);for(let i=1;i<air.length;i++)assert(air[i].actualForward>air[i-1].actualForward,'Airborne ankle moves backward relative to hip');}
}
assert.throws(()=>engine.plan({body:'curvy'}),/Unsupported body profile/);
const api=require('../../src/character-system/compositor.js'),sample=engine.plan({},{}).trace.layers[0].geometry.shape;
const sampleAnchors={[sample.binding.target]:[0,0]};
assert.throws(()=>api.resolveGeometry(sample,sampleAnchors,{width:1.1,height:1},{}),/Rigid art cannot/);
assert.throws(()=>api.resolveGeometry({...sample,frameFill:true},sampleAnchors,{width:1,height:1},{}),/Rigid art cannot/);
const distorted=structuredClone(registry);distorted.assets['body/male'].layers[0].geometry.binding.uniformScale*=1.1;
assert.throws(()=>createEngine(contract,distorted),/one whole-character scale/);
console.log(JSON.stringify({poses,rigidMatrices:matrices,sourceViews:12,partsPerPose:15}));
async function browserCheck(){
 const {chromium}=require('playwright'),{createServer}=require('./server.cjs');
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const page=await browser.newPage({viewport:{width:1600,height:1150}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>window.reviewReady,null,{timeout:90000});
  const comparisons=await page.evaluate(async()=>{
   const result=[],gallery=document.createElement('div');gallery.id='comparisons';gallery.style='display:flex;flex-wrap:wrap;width:1248px;background:#17212b;color:white';
   for(const doc of bodyReview.manifest.documents){
    const [,anatomy,direction]=doc.id.split('/');document.getElementById('anatomy').value=anatomy;document.getElementById('direction').value=direction;document.getElementById('anatomy').dispatchEvent(new Event('change'));
    const original=bodyReview.original(doc),standing=bodyReview.render(null),a=original.getContext('2d').getImageData(0,0,288,432).data,b=standing.getContext('2d').getImageData(0,0,288,432).data;
    let union=0,intersection=0,opaque=0,colorError=0,alphaLoss=0;
    for(let i=0;i<a.length;i+=4){if(a[i+3]>127||b[i+3]>127)union++;if(a[i+3]>127&&b[i+3]>127)intersection++;if(a[i+3]>250&&b[i+3]>250){opaque++;for(let ch=0;ch<3;ch++)colorError+=Math.abs(a[i+ch]-b[i+ch]);}if(a[i+3]>250&&b[i+3]<127)alphaLoss++;}
    result.push({id:doc.id,silhouetteIoU:intersection/union,opaqueMeanChannelError:colorError/(opaque*3),lostOpaquePixels:alphaLoss});
    const fig=document.createElement('figure');fig.style='margin:8px;width:400px;text-align:center';const label=document.createElement('figcaption');label.textContent=doc.id+' — source / 15-part Standing';fig.append(label,original,standing);for(const cv of [original,standing])cv.style='width:192px;height:288px';gallery.append(fig);
   }
   document.body.append(gallery);return result;
  });
  fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});await page.locator('#comparisons').screenshot({path:path.join(__dirname,'screenshots/standing-original-comparisons.png')});
  for(const anatomy of ['androgynous','female','male']){await page.selectOption('#anatomy',anatomy);await page.selectOption('#direction','right');await page.locator('#comparisons').evaluate(e=>e.style.display='none');await page.screenshot({path:path.join(__dirname,'screenshots',anatomy+'-rigid-review.png'),fullPage:true});}
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'generated/verification.json'),JSON.stringify({poses,matrices,comparisons},null,2)+'\n');
  console.log(JSON.stringify(comparisons,null,2));
  // Browser SVG decoding and overlapping antialiased source edges differ from
  // a direct PNG resample. Allow <=1% mean channel error, never new opaque loss.
  for(const c of comparisons){assert(c.silhouetteIoU>.98,c.id+' source silhouette changed');assert(c.opaqueMeanChannelError<255*.01,c.id+' original shading changed');assert.equal(c.lostOpaquePixels,0,c.id+' source pixels missing');}
  // All inputs served by this review must equal the bytes fingerprinted on disk.
  for(const f of manifest.files){const url=f.path.startsWith('review/character-rigid-body/generated/')?'/generated/'+path.basename(f.path):'/source/'+f.path;const response=await fetch(base+url);assert(response.ok);assert.equal(sha(Buffer.from(await response.arrayBuffer())),f.sha256);}
 }finally{await browser.close();await new Promise(r=>server.close(r));}
}
if(process.argv.includes('--browser'))browserCheck().catch(e=>{console.error(e);process.exitCode=1;});
