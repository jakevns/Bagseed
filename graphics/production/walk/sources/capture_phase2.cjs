// Real renderer captures, using disposable browser storage only.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../..'),review=path.join(root,'review/custom-walk-v2');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'review/characters-v2/sources/baseline-assets.json'))),inventory=JSON.parse(fs.readFileSync(path.join(root,'review/custom-walk-v1/inventory.json'))),base=fixture.people.find(p=>p.id==='player').look;
const colors=['#588455','#4d83a6','#a27e96','#b58d57','#6b838e','#8a6959','#6c6b9b','#a46d67'];
const tops=inventory.top.map((topS,i)=>({id:topS,name:topS,look:{...base,topS,shirtC:topS==='labcoat'?'#e9e9df':colors[i%colors.length],bottomS:'jeans',shoesS:'sneakers',hairS:'short',hairC:'#49322a',mouth:'smile'}}));
const sets={
 'tops-a':tops.slice(0,8),'tops-b':tops.slice(8),
 bottoms:inventory.bottom.map((bottomS,i)=>({id:bottomS,name:bottomS+' / '+inventory.shoe[i%4],look:{...base,topS:'tee',bottomS,shoesS:inventory.shoe[i%4],shirtC:'#718eaa',pantsC:colors[i],mouth:'smile'}})),
 varied:[
  {id:'pajamas',name:'Broad / pajamas',look:{...base,topS:'pjs',shirtC:'#8b80b1',body:'broad',pres:'masc',hairS:'ponytail',hairC:'#ae593b',skin:'#e3b7a0',shoesS:'sandals',topPat:'stripe',topC2:'#c4bce3'}},
  {id:'labcoat',name:'Slim / lab coat',look:{...base,topS:'labcoat',shirtC:'#edece3',body:'slim',pres:'fem',hairS:'long',hairC:'#d5b66a',skin:'#6b3f2e',bottomS:'cargo',shoesS:'boots',acc:'necklace'}},
  {id:'garden',name:'Stocky / apron',look:{...base,topS:'garden',shirtC:'#a88e55',body:'stocky',hairS:'bun',hairC:'#dfdfdb',hat:'bucket',hatC:'#7a925b',bottomS:'shorts',shoesS:'rainboots'}},
  {id:'crop',name:'Curvy / crop top',look:{...base,topS:'crop',shirtC:'#a3779d',body:'curvy',pres:'fem',hairS:'braids',hairC:'#4d3030',bottomS:'skirt',shoesS:'sandals',topPat:'plaid',topC2:'#e0bda0',acc:'bag'}},
  ...['remy','priya'].map(id=>({id,name:id+' / approved',look:fixture.people.find(p=>p.id===id).look}))]
};
(async()=>{
 const {createStaticServer}=await import('../../../../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('../../../../tests/helpers/art-page.cjs')(browser,{viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{timeout:180000});await page.evaluate(()=>BagseedArt.ready);fs.mkdirSync(review,{recursive:true});
  const report={sets,frames:0,rendering:'Actual drawPerson game renderer on its density-three canvas; no low-resolution thumbnail intermediate',revision:await page.evaluate(()=>BagseedArt.renderingRevision),browserErrors:errors};
  for(const [set,looks]of Object.entries(sets)){
   const images=await page.evaluate(async({looks,backgrounds})=>{
    const result={};for(const [name,bg]of Object.entries(backgrounds)){
     const im=new Image();im.src=bg.src;await im.decode();result[name]=[];
     for(let f=0;f<4;f++){
      const cv=document.createElement('canvas');cv.width=looks.length*240;cv.height=1008;const g=cv.getContext('2d');g.setTransform(3,0,0,3,0,0);g.imageSmoothingEnabled=false;
      for(let row=0;row<4;row++)for(let col=0;col<looks.length;col++){
       const x=col*80,y=row*84,dir=['down','right','up','left'][row],who=looks[col];g.save();g.beginPath();g.rect(x,y,80,84);g.clip();
       const patch=name==='indoor'?[56,40,48,24]:[24,18,64,24];
       for(let yy=0;yy<84;yy+=patch[3])for(let xx=0;xx<80;xx+=patch[2])g.drawImage(im,...patch,x+xx,y+yy,patch[2],patch[3]);g.restore();
       g.fillStyle=name==='night'?'#eee7cc':'#251f29';g.font='6px sans-serif';g.fillText(who.name,x+3,y+8);g.fillText(dir,x+3,y+16);
       drawPerson(g,x+40,y+74,who.look,1,{dir,frame:f,walk:true,blink:false,breath:false});
      }
      result[name].push(cv.toDataURL('image/png'));
     }
    }return result;
   },{looks,backgrounds:fixture.backgrounds});
   for(const [bg,frames]of Object.entries(images))for(let f=0;f<4;f++){fs.writeFileSync(path.join(review,`runtime-${set}-${bg}-${f}.png`),Buffer.from(frames[f].split(',')[1],'base64'));report.frames+=looks.length*4;}
  }
  fs.writeFileSync(path.join(review,'runtime-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({revision:report.revision,frames:report.frames,browserErrors:errors},null,2));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
