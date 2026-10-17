// --check exits nonzero on regressions without rewriting the evidence.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'docs/graphics/character-audit'),check=process.argv.includes('--check');
(async()=>{
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu']});const page=await require('../tests/helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
  const res=await page.evaluate(makeEvidence=>{
   const data=window.__BAGSEED_ILLUSTRATED_DATA__,people=[...data.approved,...data.cast],dirs=['down','right','up','left'];
   const cv=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
   function measure(im){const a=im.getContext('2d',{willReadFrequently:true}).getImageData(0,0,im.width,im.height).data;let top=im.height,bottom=-1;for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(a[(y*im.width+x)*4+3]>80){top=Math.min(top,y);bottom=Math.max(bottom,y);}return bottom<top?0:+((bottom-top+1)*32/im.width).toFixed(1);}
   const rows=people.map(p=>{
    const row={id:p.id,name:p.name,idle:{},walk:{},nose:{},failures:[]};
    for(const dir of dirs){
     const count=p.id==='player'?BagseedArt.customWalkFrameCount(p.look,dir):p.walkFrameCount||4,idle=BagseedArt.sprite(p.look,dir,0,0,0,0,false,3),nose=BagseedArt.sprite(p.look,dir,0,0,0,0,true,3);
     row.idle[dir]=measure(idle);row.walk[dir]=Array.from({length:count},(_,frame)=>measure(BagseedArt.sprite(p.look,dir,frame,0,0,0,false,3,true)));row.nose[dir]=measure(nose);
     if(!row.idle[dir])row.failures.push(dir+': empty idle');
     if(!p.actions?.[dir]||nose.bagseedAuthoredNoseFallback)row.failures.push(dir+': missing authored reaction');
     if(p.id!=='player'&&(idle.bagseedAuthoredId!==p.id||nose.bagseedAuthoredId!==p.id))row.failures.push(dir+': authored identity mismatch');
     if(Math.abs(row.nose[dir]-row.idle[dir])>1)row.failures.push(dir+': nose/idle height differs by more than 1 world unit');
    }
    const moving=[...Object.values(row.idle),...Object.values(row.walk).flat()];if(Math.max(...moving)-Math.min(...moving)>2)row.failures.push('idle/walk height range exceeds 2 world units');return row;
   });
   if(!makeEvidence)return {rows};
   const render=(g,p,dir,x,baseline,nose=false,walk=false)=>{const im=BagseedArt.sprite(p.look,dir,walk?1:0,0,0,0,nose,3,walk);g.drawImage(im,x-48,baseline-96*im.height/im.width,96,96*im.height/im.width);};
   const cols=6,cw=430,ch=165,all=cv(cols*cw,Math.ceil(people.length/cols)*ch),g=all.getContext('2d');g.fillStyle='#e8dfce';g.fillRect(0,0,all.width,all.height);g.font='13px sans-serif';
   people.forEach((p,i)=>{const x=i%cols*cw,y=Math.floor(i/cols)*ch;g.fillStyle='#b14d48';g.fillRect(x,y+35,cw-10,1);render(g,p,'down',x+50,y+135);render(g,p,'right',x+150,y+135,false,true);render(g,p,'down',x+250,y+135,true);render(g,p,'right',x+350,y+135,true);g.fillStyle='#38281c';g.fillText(p.name.slice(0,38),x+4,y+157);});
   const cIds=['cast-01-marcus','cast-05-kenji','cast-06-mateo','cast-16-ronan','cast-24-hugo','cast-28-dev','cast-41-shed','cast-48-cure','cast-52-hardwarePT','cast-58-suit','cast-66-theo'],bIds=['cast-14-owen','cast-21-arthur','cast-26-enzo','cast-34-1','cast-51-gardenPT','cast-19-jun'];
   const groups=[['Approved style reference',['remy','priya','doug','poppy']],['Tier C — redrawn',cIds.slice(0,6)],['Tier C — redrawn',cIds.slice(6)],['Tier B — softened',bIds]],tiers=cv(960,720),t=tiers.getContext('2d');t.fillStyle='#e8dfce';t.fillRect(0,0,960,720);
   groups.forEach(([title,ids],row)=>{t.fillStyle='#38281c';t.font='18px sans-serif';t.fillText(title,10,row*180+23);ids.forEach((id,col)=>{const p=people.find(p=>p.id===id);if(!p)throw Error('Missing style-board character '+id);render(t,p,'down',80+col*160,row*180+147);t.font='12px sans-serif';t.fillText(p.name.slice(0,24),col*160+8,row*180+169);});});return {rows,sheet:all.toDataURL(),tiers:tiers.toDataURL()};
  },!check);
  if(!check){fs.mkdirSync(OUT,{recursive:true});for(const [file,value]of [['measurements.json',JSON.stringify(res.rows,null,1)+'\n'],['all-characters-idle-walk-nose.png',Buffer.from(res.sheet.split(',')[1],'base64')],['style-tiers.png',Buffer.from(res.tiers.split(',')[1],'base64')]]){const target=path.join(OUT,file),temp=target+'.tmp';fs.writeFileSync(temp,value);fs.renameSync(temp,target);}}
  for(const r of res.rows)console.log(r.id.padEnd(22),'idle',JSON.stringify(r.idle),'nose',JSON.stringify(r.nose),r.failures.length?' <<< '+r.failures.join('; '):'');
  const failed=res.rows.filter(r=>r.failures.length);console.log(`${res.rows.length} appearances, ${res.rows.length*4} direction comparisons, ${failed.length} flagged rows.`);if(failed.length)process.exitCode=1;
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
