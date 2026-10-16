// Character audit: measures every authored character (idle, walk, nose pose) in world units
// and writes a visual sheet. Usage: node tools/audit-characters.cjs (prints flagged rows with <<<).
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'docs/graphics/character-audit');
const fixtures=JSON.parse(fs.readFileSync(path.join(ROOT,'review/characters-v2/sources/baseline-assets.json')));
(async()=>{
 const {createStaticServer}=await import('./server.mjs');const server=createStaticServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/opt/pw-browsers/chromium'});
 const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage();
 await page.goto(base+'/');await page.evaluate(()=>BagseedArt.ready);
 await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Sam');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2500);
 const res=await page.evaluate((approved)=>{
  const people=[...approved.map(p=>({id:p.id,name:p.name,look:p.look})),...BagseedArt.cast];
  const cv=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
  function m(draw){const c=cv(64*3,80*3),g=c.getContext('2d');g.setTransform(3,0,0,3,0,0);draw(g);const d=g.getImageData(0,0,c.width,c.height).data;let t=1e9,b=-1,l=1e9,r=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>80){t=Math.min(t,y);b=Math.max(b,y);l=Math.min(l,x);r=Math.max(r,x);}return {h:+((b-t+1)/3).toFixed(1),w:+((r-l+1)/3).toFixed(1),top:+(t/3).toFixed(1),bot:+(b/3).toFixed(1),c};}
  const out=[];const sheets=[];
  for(const p of people){
   const row={id:p.id,name:p.name,idle:{},walk:{},nose:{}};
   for(const dir of ['down','right','up','left']){
    row.idle[dir]=m(g=>drawPerson(g,32,76,p.look,1,{dir})).h;
    row.walk[dir]=[0,1,2,3].map(f=>m(g=>drawPerson(g,32,76,p.look,1,{dir,frame:f,walk:true})).h);
    const n=m(g=>{const im=buildNoseSprite1151(p.look,dir);const H=32*im.height/im.width;g.drawImage(im,16,76-H,32,H);});row.nose[dir]=n.h;
   }
   out.push(row);
  }
  // visual sheet: idle down, walk f1 down, nose down, nose right for each, plus player
  const list=[{id:'PLAYER',name:'player',look:playerLook()},...people];
  const cols=6,cw=4*40+20,ch=70,sheet=cv(cols*cw*2,Math.ceil(list.length/cols)*ch*2),g=sheet.getContext('2d');g.fillStyle='#d8cfb8';g.fillRect(0,0,sheet.width,sheet.height);g.scale(2,2);
  list.forEach((p,i)=>{const x=(i%cols)*cw,y=Math.floor(i/cols)*ch;g.fillStyle='#b44';g.fillRect(x,y+56-33.3,cw-10,.3);
   drawPerson(g,x+20,y+56,p.look,1,{dir:'down'});drawPerson(g,x+60,y+56,p.look,1,{dir:'right',frame:1,walk:true});
   for(const [k,dir] of [[2,'down'],[3,'right']]){const im=buildNoseSprite1151(p.look,dir),H=32*im.height/im.width;g.drawImage(im,x+k*40+4,y+56-H,32,H);}
   g.fillStyle='#222';g.font='6px sans-serif';g.fillText(p.name.slice(0,30),x+2,y+65);});
  return {out,sheet:sheet.toDataURL()};
 },fixtures.people);
 fs.writeFileSync(OUT+'/all-characters-idle-walk-nose.png',Buffer.from(res.sheet.split(',')[1],'base64'));fs.writeFileSync(OUT+'/measurements.json',JSON.stringify(res.out,null,1));
 for(const r of res.out){const all=[...Object.values(r.idle),...Object.values(r.walk).flat()],n=Object.values(r.nose);const flag=(Math.max(...all)-Math.min(...all)>2||Math.abs(Math.max(...n)-r.idle.down)>2.5)?' <<<':'';console.log(r.id.padEnd(22),'idle',JSON.stringify(r.idle),'walk',Math.min(...all),'-',Math.max(...all),'nose',JSON.stringify(r.nose),flag);}
 await browser.close();server.close();
})();
