// Technical reference diagrams only. No generated character pixels are edited,
// composited or installed by this tool. Native guides remain 288 x 432.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve('graphics/production/walk/pose-guides-v6');
const review=path.resolve('review/custom-walk-rerender-v6/corrected-guides');
fs.mkdirSync(root,{recursive:true});fs.mkdirSync(review,{recursive:true});
const phases=['right-contact','right-support-left-passing','left-contact','left-support-right-passing'];
const frames={};
for(const dir of ['down','up'])for(let f=0;f<4;f++){
 const passing=f%2===1;
 // Base front view: anatomical right is image left; support foot is lower.
 const points={neck:[48,78],shoulderL:[37,85],shoulderR:[59,85],hipL:[43,110],hipR:[53,110],
  kneeL:passing?[43,125]:[40,124],ankleL:passing?[43,137]:[39,137],
  kneeR:passing?[55,116]:[54,123],ankleR:passing?[54,125]:[56,132],
  elbowL:passing?[34,99]:[33,98],handL:passing?[36,111]:[34,110],
  elbowR:passing?[62,98]:[65,96],handR:passing?[60,108]:[61,104]};
 const mirror=(f>=2)!==(dir==='up');
 if(mirror)for(const p of Object.values(points))p[0]=96-p[0];
 const side=(f>=2)!==(dir==='up')?'right':'left';
 frames[dir+'/'+f]={phase:phases[f],view:dir,supportLeg:f<2?'anatomical-right':'anatomical-left',
  supportImageSide:side,passing,points,mirror,canvas:[288,432],density:3,groundBaseline:143,
  purpose:'technical pose reference only; approved idle remains garment/style reference'};
}
// Pair symmetry and phase differences are guarantees of these explicit joints,
// rather than an inference from the darkest pixel in a generated shoe.
for(const dir of ['down','up'])for(const f of [0,1]){
 const a=frames[dir+'/'+f],b=frames[dir+'/'+(f+2)];
 assert.notEqual(a.supportImageSide,b.supportImageSide);
 for(const key of Object.keys(a.points)){
  assert.equal(a.points[key][0]+b.points[key][0],96);
  assert.equal(a.points[key][1],b.points[key][1]);
 }
}
(async()=>{let browser;try{
 browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH});
 const page=await browser.newPage();await page.setContent('<!doctype html><body></body>');
 for(const[key,frame]of Object.entries(frames)){
  const data=await page.evaluate(frame=>{
   const c=document.createElement('canvas');c.width=288;c.height=432;const g=c.getContext('2d');g.scale(3,3);
   g.lineJoin='round';g.lineCap='round';g.strokeStyle='#49382e';g.lineWidth=.8;
   const p=frame.points,gray='#a5a4a0',shadow='#858783';
   function limb(a,b,d,width,color){g.beginPath();g.moveTo(...a);g.lineTo(...b);g.lineTo(...d);g.strokeStyle='#49382e';g.lineWidth=width+1.2;g.stroke();g.strokeStyle=color;g.lineWidth=width;g.stroke();}
   function shoe(ankle,raised){const[x,y]=ankle;g.fillStyle=raised?shadow:'#999b96';g.strokeStyle='#49382e';g.lineWidth=.8;g.beginPath();g.moveTo(x-3.8,y-2);g.quadraticCurveTo(x+3.8,y-2,x+4.5,y+2);g.quadraticCurveTo(x+5,y+5,x,y+5.5);g.quadraticCurveTo(x-5,y+5,x-4.5,y+2);g.closePath();g.fill();g.stroke();if(frame.view==='up'&&raised){g.strokeStyle='#c8c7be';for(const dy of [0,1.5,3]){g.beginPath();g.moveTo(x-3,y+dy);g.lineTo(x+3,y+dy);g.stroke();}}}
   // Each limb is a single explicit path; the torso occludes its shoulder.
   limb(p.hipR,p.kneeR,p.ankleR,8,shadow);shoe(p.ankleR,true);
   limb(p.hipL,p.kneeL,p.ankleL,8,gray);shoe(p.ankleL,false);
   limb(p.shoulderL,p.elbowL,p.handL,7,shadow);
   const body=[[36,84],[60,84],[61,96],[59,110],[37,110],[35,96]];
   g.fillStyle=gray;g.strokeStyle='#49382e';g.lineWidth=.8;g.beginPath();g.moveTo(...body[0]);for(const q of body.slice(1))g.lineTo(...q);g.closePath();g.fill();g.stroke();
   g.fillStyle='#b9afa1';g.beginPath();g.roundRect(p.neck[0]-4,76,8,9,2);g.fill();g.stroke();
   limb(p.shoulderR,p.elbowR,p.handR,7,gray);
   for(const name of ['handL','handR']){g.fillStyle='#b9afa1';g.strokeStyle='#49382e';g.lineWidth=.7;g.beginPath();g.ellipse(...p[name],3,3.6,0,0,Math.PI*2);g.fill();g.stroke();}
   return c.toDataURL();
  },frame);
  fs.writeFileSync(path.join(root,key.replace('/','-')+'.png'),Buffer.from(data.split(',')[1],'base64'));
 }
 for(const[key,frame]of Object.entries(frames))frame.guideSHA256=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,key.replace('/','-')+'.png'))).digest('hex');
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({version:'balanced-technical-pose-guides-v6',runtimeInstalled:false,frames},null,2)+'\n');
 const sheet=await page.evaluate(async frames=>{
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=920;const g=canvas.getContext('2d');g.fillStyle='#eee9dd';g.fillRect(0,0,1200,920);g.font='16px sans-serif';g.fillStyle='#342a24';
  // Image URLs are supplied below as canvas data, so no file origin is involved.
  for(const[key,entry]of Object.entries(frames)){
   const im=new Image();im.src=entry.png;await im.decode();const f=Number(key.split('/')[1]),row=key.startsWith('down')?0:1;
   g.fillText(key+' '+entry.phase,f*300+8,row*460+22);g.fillText('support: '+entry.supportImageSide,f*300+8,row*460+43);g.drawImage(im,f*300,row*460+20);
  }return canvas.toDataURL();
 },Object.fromEntries(Object.entries(frames).map(([key,f])=>[key,{...f,png:'data:image/png;base64,'+fs.readFileSync(path.join(root,key.replace('/','-')+'.png')).toString('base64')}])));
 fs.writeFileSync(path.join(review,'sequence.png'),Buffer.from(sheet.split(',')[1],'base64'));
 fs.copyFileSync(path.join(__dirname,'walk-pose-guides-review.html'),path.join(review,'index.html'));
 console.log('Eight technical guides written; mirrored phase pairs verified. No live art changed.');
}finally{await browser?.close();}})().catch(e=>{console.error(e);process.exitCode=1});
