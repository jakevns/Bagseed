// Review only: preserve the existing head renderer, no save or public build writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../..'),w=path.join(root,'graphics/production/walk'),out=path.join(root,'review/custom-walk-v4');
let html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const {data,start:dataStart,end:dataEnd}=require('../../../../tools/read-character-data.cjs')(html,root);
const candidate=JSON.parse(fs.readFileSync(path.join(w,'stride-v4/candidate-manifest.json')));data.walk={...candidate,rig:candidate.candidateRig};delete data.walk.candidateRig;
for(const[id,item]of Object.entries(candidate.items))if(item.profileRevision==='eight-pose-profiles-v4')data.images['walk/'+id]='data:image/png;base64,'+fs.readFileSync(path.join(w,item.atlas)).toString('base64');
html=html.slice(0,dataStart)+JSON.stringify(data).replace(/</g,'\\u003c')+html.slice(dataEnd);
const walkStart=html.indexOf('  // Authored wardrobe walking.'),walkEnd=html.indexOf('  function generic(',walkStart);
if(walkStart<0||walkEnd<0)throw Error('Walk renderer insertion point missing');
// Direction counts are changed only in this candidate page until all garment
// layers have compatible phases. Never silently wrap pose five back to one.
const walkRenderer=fs.readFileSync(path.join(w,'sources/renderer.js'),'utf8').replace("const f=dir+'/'+(frame%4)","const f=dir+'/'+(frame%(DATA.walk.frameCounts[dir]||4))");
html=html.slice(0,walkStart)+walkRenderer+'\n'+html.slice(walkEnd);
html=html.replace('window.BagseedArt=Object.freeze(',`window.drawStrideCandidate=function(L,dir,body,neck){
 L=normalize(L);const out=cv(288,432),g=out.getContext('2d');g.scale(3,3);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='low';
 const H=head(L,dir,false,true),joinY=HEAD_NECK+(HEAD_JOIN-HEAD_NECK)*(faceFits[L.face]?.[1]||1),hx=neck[0]-32,hy=neck[1]-joinY/3;
 g.drawImage(H.bagseedNeckBridge,hx,hy,64,H.height/3);g.drawImage(body,0,0,96,144);g.drawImage(H,hx,hy,64,H.height/3);return out;
};window.BagseedArt=Object.freeze(`);
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=http.createServer((req,res)=>{
  if(req.url==='/character-data.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(fs.readFileSync(path.join(root,'public/character-data.js')));return;}
  const match=/^\/body\/(right|left)\/([0-7])\.png$/.exec(req.url);if(match){res.writeHead(200,{'Content-Type':'image/png'});res.end(fs.readFileSync(path.join(w,'stride-v4',`${match[1]}-${match[2]}.png`)));return;}
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('../../../../tests/helpers/art-page.cjs')(browser,{viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port,{timeout:180000});await page.evaluate(()=>BagseedArt.ready);
  const registered=JSON.parse(fs.readFileSync(path.join(w,'stride-v4/registration.json'))),fixtures=JSON.parse(fs.readFileSync(path.join(root,'review/characters-v2/sources/baseline-assets.json'))).people;
  const result=await page.evaluate(async({registered,fixtures})=>{
   const bodies=await Promise.all(Array.from({length:16},(_,i)=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src='/body/'+(i<8?'right':'left')+'/'+(i%8)+'.png';}))),L=BagseedArt.normalize({skin:'#cf9670',topS:'hoodie',shirtC:'#5086bf',bottomS:'jeans',pantsC:'#36405a',shoesS:'sneakers',shoesC:'#2b1d14',hairS:'short',hairC:'#49322a',mouth:'cat',body:'average',pres:'neutral',acc:'none',topPat:'none',botPat:'none'});
   const frames=[],checks=[],board=document.createElement('canvas');board.width=2304;board.height=432;const bg=board.getContext('2d');bg.fillStyle='#292330';bg.fillRect(0,0,2304,432);
   for(let f=0;f<8;f++){
    const c=document.createElement('canvas');c.width=1440;c.height=864;const g=c.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,1440,864);
    for(let row=0;row<2;row++){g.save();g.translate(0,row*432);const dir=row?'left':'right';
    const labels=['Standing','Eight-pose candidate','Remy source','Priya source','Doug source'];
    g.drawImage(BagseedArt.sprite(L,dir,0,0,0,0,false,3,false),0,0);
    const moving=BagseedArt.sprite(L,dir,f,0,0,0,false,3,true);g.drawImage(moving,288,0);if(!row)bg.drawImage(moving,f*288,0);
    const hand=moving.bagseedHand,lamp=NightLamps1151.hand(300,180,L,{dir,frame:f,walk:true});checks.push({dir,frame:f,authored:moving.bagseedAuthoredWalk,hand,flashlightError:Math.hypot(lamp.x-(300+(hand.x-48)/3),lamp.y-(180+(hand.y-144)/3))});
    ['remy','priya','doug'].forEach((id,i)=>{const look=fixtures.find(v=>v.id===id).look,im=BagseedArt.sprite(look,dir,Math.floor(f/2),0,0,0,false,3,true);g.drawImage(im,(i+2)*288,432-im.height);});
    g.font='16px sans-serif';g.fillStyle='#eee8dc';labels.forEach((s,i)=>g.fillText(s,i*288+10,25));g.fillText(dir+' '+(f+1)+' / 8',298,49);g.restore();
    }frames.push(c.toDataURL());bg.font='16px sans-serif';bg.fillStyle='#eee8dc';bg.fillText((f+1)+': '+registered.frames[f].phase,f*288+8,25);
   }return {frames,board:board.toDataURL(),checks};
  },{registered,fixtures});
  if(result.checks.some(c=>c.authored!==c.dir+'/'+c.frame||c.flashlightError>.001)||new Set(result.frames).size!==8||errors.length)throw Error('Eight-pose runtime capture failed');
  for(let f=0;f<8;f++)fs.writeFileSync(path.join(out,`right-${f}.png`),Buffer.from(result.frames[f].split(',')[1],'base64'));fs.writeFileSync(path.join(out,'right-all-poses.png'),Buffer.from(result.board.split(',')[1],'base64'));fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({status:'modular sample motion candidate; remaining wardrobe integration and visual approval pending',frameCount:8,uniqueImages:new Set(result.frames).size,browserErrors:errors,standingAndMovingResolution:[288,432],existingSourcesUnchanged:true,checks:result.checks},null,2)+'\n');console.log('Captured all eight modular candidate phases with unchanged standing and approved source walkers.',errors);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
