// Body gate: completed source surfaces, explicit poses, magenta holes and ankle drift.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),{createEngine,apply,resolveGeometry}=require('../../src/character-system/compositor.js');
const contract=require('./generated/contract.json'),registry=require('./generated/registry.json'),manifest=require('./generated/manifest.json');
const {scale,length,sideTable}=require('./rig.cjs'),engine=createEngine(contract,registry),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let poses=0,matrices=0,maxAnkleDrift=0;
for(const doc of manifest.documents){
 const [,anatomy,direction]=doc.id.split('/'),side=['left','right'].includes(direction),standing=engine.plan({anatomy},{direction,mode:'idle'}),near=direction==='left'?'L':'R';
 assert.equal(doc.parts.length,15);for(const part of doc.parts){assert(part.completed);assert.equal(part.completed.method,'same-part-patch-quilting');for(const patch of part.completed.patchBrightness)assert(patch.relativeDifference<=.06);if(part.name==='thigh')assert.equal(part.completed.thighCapTexture.sourceFraction,.2);}
 for(const f of [null,0,1,2,3,4,5,6,7]){
  const key=f===null?`idle/${direction}`:`walk/${direction}/${f}`,p=engine.plan({anatomy},{direction,mode:f===null?'idle':'walk',frame:f??0}),data=contract.bodyPoseSets[anatomy+'/average'][key];
  assert(p.complete);assert.equal(p.trace.layers.length,15);poses++;
  for(const layer of p.trace.layers){const s=layer.geometry.shape,b=s.binding,[a,bb,c,d]=layer.geometry.matrix;
   assert.equal(b.uniformScale,scale);assert(!s.frameClip&&!s.frameFill&&!s.frameStrokes);assert(!s.sourceGroup,'Runtime must use completed parts');
   assert(Math.abs(Math.hypot(a,bb)-scale)<1e-10);assert(a*d-bb*c>0);matrices++;
   if(b.mode.startsWith('frontBack')){assert(!side);assert.equal(b.rotation,0);assert(b.projectionY>=(b.part==='calf'?.85:.9)&&b.projectionY<=1);assert.equal(d,scale*b.projectionY);}
   else{assert.equal(b.mode,'rigid');assert(Math.abs(Math.hypot(c,d)-scale)<1e-10);assert(Math.abs(a*c+bb*d)<1e-10);}
   if(side&&layer.side&&layer.side!==near){assert.deepEqual(s.appearance.rgbMultiply,[.8,.8,.8]);assert.equal(s.appearance.outlineStrength,.6);assert(layer.stage.startsWith('far'));}
   for(const cap of doc.parts.find(part=>layer.id.endsWith('/'+part.id)).completed.caps){const mapped=apply(layer.geometry.matrix,cap.center.map((v,i)=>v+doc.crop[i]));assert(mapped.every(Number.isFinite));}
  }
  for(const s of ['L','R']){
   for(const [a,b]of [['shoulder','elbow'],['hip','knee']])assert(Math.abs(length(p.trace.anchors[a+s],p.trace.anchors[b+s])-length(doc.pins[a+s],doc.pins[b+s])*scale)<1e-8,'Bone length changed');
   if(side){
    const expected=f===null?{thigh:0,knee:0,arm:0}:sideTable[(f+(s===near?0:4))%8];
    assert.equal(data.offsets[s].thigh,expected.thigh);assert.equal(data.offsets[s].knee,expected.knee);assert.equal(data.offsets[s].arm,expected.arm);
    assert.equal(data.rotations['foot.'+s],data.rotations['calf.'+s]);
    if(f!==null){const [hx,hy]=p.trace.anchors['hip'+s],[kx,ky]=p.trace.anchors['knee'+s];assert(Math.abs(Math.atan2(kx-hx,ky-hy)*180/Math.PI)<=22+1e-10);assert.equal(data.metrics.bodyBounce,[2,0,-2,0,2,0,-2,0][f]);}
   }else{
    const drift=Math.abs(p.trace.anchors['ankle'+s][0]-standing.trace.anchors['ankle'+s][0]);maxAnkleDrift=Math.max(maxAnkleDrift,drift);assert(drift<=2);
    for(const name of ['thigh','calf','foot','upperArm','forearm','hand'])assert.equal(data.rotations[name+'.'+s],0);
    const lift=standing.trace.anchors['ankle'+s][1]-p.trace.anchors['ankle'+s][1];if(data.metrics[s].swing){assert(lift>2&&lift<=7,'Swing foot lift outside bounds');if(data.offsets[s].phase===6)assert(lift>=5,'Passing lift below 5px');}else assert.equal(lift,0);
   }
   for(const name of ['upperArm','forearm','hand','thigh','calf','foot'])assert(p.trace.layers.some(l=>l.id.endsWith('body.'+name+'.'+s)));
  }
  for(const s of ['L','R'])for(const [parent,child]of [['upperArm','forearm'],['forearm','hand'],['thigh','calf'],['calf','foot']])assert(p.trace.layers.findIndex(l=>l.id.endsWith('body.'+child+'.'+s))>p.trace.layers.findIndex(l=>l.id.endsWith('body.'+parent+'.'+s)));
  for(const s of ['L','R'])assert(p.trace.layers.findIndex(l=>l.id.endsWith('body.pelvis'))>p.trace.layers.findIndex(l=>l.id.endsWith('body.thigh.'+s)),'Pelvis must own the hip socket');
 }
 assert.equal(sha(fs.readFileSync(path.join(root,doc.source))),doc.sourceSHA256);
}
assert.throws(()=>engine.plan({body:'curvy'}),/Unsupported body profile/);
const distorted=structuredClone(registry);distorted.assets['body/male'].layers[0].geometry.binding.uniformScale*=1.1;assert.throws(()=>createEngine(contract,distorted),/one whole-character scale/);
const projected=registry.assets['body/male'].layers.find(l=>l.geometry.binding.mode==='frontBackCalf').geometry;
for(const invalid of [{direction:'right'},{part:'thigh'},{projectionY:.7},{rotation:.1}]){const shape=structuredClone(projected);Object.assign(shape.binding,invalid);assert.throws(()=>resolveGeometry(shape,{[shape.binding.target]:[0,0]},{width:1,height:1},{}),/Only approved front\/back/);}
const projectedArm=registry.assets['body/male'].layers.find(l=>l.geometry.binding.mode==='frontBackForearm').geometry;
for(const invalid of [{direction:'left'},{part:'calf'},{projectionY:.89},{rotation:.1}]){const shape=structuredClone(projectedArm);Object.assign(shape.binding,invalid);assert.throws(()=>resolveGeometry(shape,{[shape.binding.target]:[0,0]},{width:1,height:1},{}),/Only approved front\/back/);}
console.log(JSON.stringify({poses,matrices,maxAnkleDrift,sourceViews:12,partsPerPose:15}));
async function browserCheck(){
 const {chromium}=require('playwright'),{createServer}=require('./server.cjs'),server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>window.reviewReady,null,{timeout:90000});
  const report=await page.evaluate(async()=>{
   const make=(w=288,h=432)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;},masks=new Map(),results=[],failures=[];
   async function mask(url){if(masks.has(url))return masks.get(url);const img=new Image();img.src=url;await img.decode();const cv=make(img.width,img.height),ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const rgba=ctx.getImageData(0,0,cv.width,cv.height);for(let i=0;i<rgba.data.length;i+=4){const a=rgba.data[i];rgba.data[i]=rgba.data[i+1]=rgba.data[i+2]=255;rgba.data[i+3]=a;}ctx.putImageData(rgba,0,0);masks.set(url,cv);return cv;}
   for(const doc of bodyReview.manifest.documents){
    const [,anatomy,direction]=doc.id.split('/');document.getElementById('anatomy').value=anatomy;document.getElementById('direction').value=direction;
    for(const frame of [null,0,1,2,3,4,5,6,7]){
     const plan=bodyReview.plan(frame),actual=bodyReview.render(frame),rgba=actual.getContext('2d').getImageData(0,0,288,432).data;
     const expected=make(),e=expected.getContext('2d');e.scale(3,3);
     for(const layer of plan.trace.layers){const image=await mask(layer.geometry.shape.expected);e.save();e.transform(...layer.geometry.matrix);e.drawImage(image,...layer.geometry.shape.sourceOffset);e.restore();}
     const alpha=expected.getContext('2d').getImageData(0,0,288,432).data;
     let checked=0,holes=0,examples=[],controlPoint=null;
     // Erode two output pixels: antialiasing belongs to the exterior contour.
     for(let y=2;y<430;y++)for(let x=2;x<286;x++){
      let interior=true;for(let dy=-2;dy<=2&&interior;dy++)for(let dx=-2;dx<=2;dx++)if(alpha[((y+dy)*288+x+dx)*4+3]<250){interior=false;break;}
      if(!interior)continue;checked++;if(rgba[(y*288+x)*4+3]===255&&!controlPoint)controlPoint=[x,y];if(rgba[(y*288+x)*4+3]<250){holes++;if(examples.length<4)examples.push({x,y,actual:rgba[(y*288+x)*4+3],expected:alpha[(y*288+x)*4+3]});}
     }
     // Test actual magenta compositing, rather than only transparent pixel data.
     const magenta=make(),m=magenta.getContext('2d');m.fillStyle='#ff00ff';m.fillRect(0,0,288,432);m.drawImage(actual,0,0);
     let jointChecks=0,jointLeaks=0;
     for(const name of ['shoulder','elbow','wrist','hip','knee','ankle'])for(const side of ['L','R']){
      const caps=doc.parts.flatMap(p=>p.completed.caps).filter(c=>c.joint===name+side),radius=Math.min(...caps.map(c=>c.radius))*.13*3*.45,center=plan.trace.anchors[name+side].map(v=>v*3);
      for(let y=Math.ceil(center[1]-radius);y<=center[1]+radius;y++)for(let x=Math.ceil(center[0]-radius);x<=center[0]+radius;x++)if((x-center[0])**2+(y-center[1])**2<radius**2&&x>=0&&x<288&&y>=0&&y<432){jointChecks++;if(rgba[(y*288+x)*4+3]<250)jointLeaks++;}
     }
     const result={id:doc.id,frame:frame===null?'Standing':frame,checkedInteriorPixels:checked,magentaLeaks:holes,jointInteriorPixels:jointChecks,jointLeaks,png:actual.toDataURL().split(',')[1],...(holes?{examples}:{})};results.push(result);if(holes||jointLeaks)failures.push({...result,png:undefined});
     if(!window.__negativeControl){if(!controlPoint)throw Error('No interior for hole check');const [x,y]=controlPoint,bad=make(),bc=bad.getContext('2d');bc.drawImage(actual,0,0);bc.clearRect(x,y,1,1);const badAlpha=bc.getImageData(x,y,1,1).data[3];if(!(alpha[(y*288+x)*4+3]>=250&&badAlpha<250))throw Error('Hole check failed to detect injected interior hole');const bg=make(),bgc=bg.getContext('2d');bgc.fillStyle='#ff00ff';bgc.fillRect(0,0,288,432);bgc.drawImage(bad,0,0);const pink=bgc.getImageData(x,y,1,1).data;if(pink[0]!==255||pink[1]!==0||pink[2]!==255)throw Error('Injected hole did not expose magenta');window.__negativeControl=true;}
    }
   }
   return {frames:results.length,results,failures};
  });
  const frameDir=path.join(__dirname,'generated/frame-renders');fs.mkdirSync(frameDir,{recursive:true});for(const result of report.results){const file=result.id.replaceAll('/','-')+'-'+result.frame+'.png';fs.writeFileSync(path.join(frameDir,file),Buffer.from(result.png,'base64'));delete result.png;result.render=file;}
  fs.writeFileSync(path.join(__dirname,'generated/magenta-diagnostics.json'),JSON.stringify(report,null,2));
  assert.deepEqual(errors,[]);assert.equal(report.frames,108);assert.equal(report.failures.length,0,'Magenta check failed; see generated/magenta-diagnostics.json');
  for(const f of manifest.files){const url=f.path.startsWith('review/character-rigid-body/generated/')&&!f.path.includes('completed-parts/')?'/generated/'+path.basename(f.path):'/source/'+f.path;const response=await fetch(base+url);assert(response.ok,url);assert.equal(sha(Buffer.from(await response.arrayBuffer())),f.sha256,url);}
  fs.writeFileSync(path.join(__dirname,'generated/verification.json'),JSON.stringify({poses,matrices,maxAnkleDrift,magenta:report},null,2)+'\n');console.log(JSON.stringify({browserFrames:report.frames,magentaLeaks:report.failures.length,maxAnkleDrift}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
}
if(process.argv.includes('--browser'))browserCheck().catch(e=>{console.error(e);process.exitCode=1;});
