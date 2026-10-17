const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const next=process.argv.includes('--next-three');
 const root=path.resolve(__dirname,'..'),out=path.join(root,next?'review/plant-batch-03':'review/popcorn-canopy');fs.mkdirSync(out,{recursive:true});
 const {createStaticServer}=await import('./server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium'});const page=await require('../tests/helpers/art-page.cjs')(browser,{viewport:{width:1400,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{timeout:120000});await page.evaluate(()=>BagseedStartup.ready);
  const model=fs.readFileSync(path.join(root,'graphics/plants/porchlight/sources/model.cjs'),'utf8');await page.addScriptTag({content:'(()=>{const module={exports:{}};'+model+';window.PorchlightModel=module.exports;})();'});
  const specs=[];
  const selections=next?[['halfmoon','Halfmoon CBD','Lime green'],['zoomies','Zoomies Auto','Lime green'],['cruise','Cruise Control Auto','Blue-green']]:[['porchlight','Porchlight','Forest green'],['velvet','Velvet Underbrush','Red accents'],['pixelpunch','Pixel Punch','Purple'],['cottoncandy','Cotton Candy CRT','Pink accents'],['moonberry','Moonberry','Lavender']];
  for(const [id,name,color]of selections){
   const manifest=JSON.parse(fs.readFileSync(path.join(root,'graphics/plants',id,'sources/manifest.json')));await page.addScriptTag({content:fs.readFileSync(path.join(root,'graphics/plants/porchlight/sources/renderer.js'),'utf8').replace('__PORCHLIGHT_COMPONENT_DATA__',()=>JSON.stringify(manifest))});await page.evaluate(n=>window[n].ready,manifest.apiName||'BagseedPorchlightGrowth');const profilePath=path.join(root,'graphics/plants',id,'sources/profile.json');const traits=fs.existsSync(profilePath)?JSON.parse(fs.readFileSync(profilePath)).traits:{colorName:color,branching:1.1};specs.push({id,name,color,traits,api:manifest.apiName||'BagseedPorchlightGrowth'});
  }
  const pictures=await page.evaluate(specs=>{
   const p=(s,clean=false)=>({id:s.id,seed:147,artIdentity:{seed:s.id+'-phenotype-study',traits:s.traits},height:50,nodes:11,stage:10,sex:'F',loc:'tent5',water:60,nutr:60,health:92,density:.82,pheno:{b:1},...(clean?{canopy:BagseedCanopy.care({stage:7})}:{})});
   const canvas=(w,h,title,sub)=>{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.fillStyle='#f5efdf';c.fillRect(0,0,w,h);c.fillStyle='#29483a';c.font='bold 30px Georgia';c.fillText(title,26,44);c.font='19px Georgia';c.fillText(sub,26,78);return[cv,c];};
   function draw(c,s,clean,x,y,ppi){c.save();c.translate(x,y);c.scale(ppi,ppi);BagseedWaterPots.potSprite(c,0,0,2,60,false,false);c.restore();const r=window[s.api].draw(c,p(s,clean),x,y,ppi,0,0,{reduced:true});c.save();c.translate(x,y);c.scale(ppi,ppi);BagseedWaterPots.potSprite(c,0,0,2,60,false,true);c.restore();return r;}
   const n=specs.length,step=1800/n;
   const [all,c]=canvas(1800,1110,n===3?'NEXT THREE STRAINS / LATE FLOWER':'BRANCH BUDS / ALL FIVE STRAINS','Mature, unshaped plants · Large upper colas and smaller flowers along the lower branches');
   const counts=[];for(const [i,s]of specs.entries()){c.fillStyle='#dfe5d2';c.fillRect(12+i*step,108,step-12,872);const r=draw(c,s,false,step/2+i*step,865,n===3?13.2:10.7);c.fillStyle='#29483a';c.font='bold 20px Georgia';c.fillText(s.name,25+i*step,1020);counts.push({strain:s.id,...r.counts});}
   const s=specs[0],[compare,d]=canvas(1440,1240,'CANOPY SHAPING / SAME '+specs[0].name.toUpperCase()+' PLANT','Same genetics and height · Early cleanup redirects the game’s growth budget toward retained top flowers');
   for(let i=0;i<2;i++){d.fillStyle='#dfe5d2';d.fillRect(20+i*710,110,690,885);const r=draw(d,s,!!i,365+i*710,895,15);d.fillStyle='#29483a';d.font='bold 25px Georgia';d.fillText(i?'Lower growth cleaned':'Lower growth retained',44+i*710,1120);d.font='20px Georgia';d.fillText(i?'Fewer flower sites · Larger retained tops':'More small buds · Smaller top flowers',44+i*710,1160);counts.push({treatment:i?'shaped':'natural',...r.counts});}
   return{files:{[n===3?'next-three-late-flower':'all-five-strains']:all.toDataURL(),'canopy-before-and-after':compare.toDataURL()},counts};
  },specs);
  for(const [name,data]of Object.entries(pictures.files))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'art-verification.json'),JSON.stringify({counts:pictures.counts,errors},null,2)+'\n');console.log('Captured '+specs.length+' strain comparisons and canopy shaping.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
