const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../'),walk=path.join(root,'graphics/production/walk'),out=path.join(root,'review/custom-walk-v5');
let html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const {data,start,end}=require('../../../../../tools/read-character-data.cjs')(html,root),manifest=JSON.parse(fs.readFileSync(path.join(walk,'wardrobe-v5/manifest.json')));
data.walk.stride={...manifest,imagePrefix:'stride/'};
for(const[id,item]of Object.entries(manifest.items)){
 data.images['stride/'+id]='data:image/png;base64,'+fs.readFileSync(path.join(walk,item.atlas)).toString('base64');
 // Diagnostic preview: exercise drawings even where registration needs review.
 data.walk.stride.items[id].accepted=true;
}
html=html.slice(0,start)+JSON.stringify(data).replace(/</g,'\\u003c')+html.slice(end);
const a=html.indexOf('  // Authored wardrobe walking.'),b=html.indexOf('  function generic(',a);
html=html.slice(0,a)+fs.readFileSync(path.join(walk,'sources/renderer.js'),'utf8')+'\n'+html.slice(b);
html=html.replace(/<script id="bagseed-illustrated-character-data"[^>]*><\/script>/,'');
(async()=>{
 const {createStaticServer}=await import('../../../../../tools/server.mjs'),staticServer=createStaticServer();
 const server=http.createServer((req,res)=>{if(req.url!=='/')return staticServer.emit('request',req,res);if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}res.writeHead(200,{'Content-Type':'text/html'});res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});const page=await require('../../../../../tests/helpers/art-page.cjs')(browser,{viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port,{timeout:180000});await page.evaluate(()=>BagseedArt.ready);
  const inventory=JSON.parse(fs.readFileSync(path.join(root,'review/custom-walk-v1/inventory.json')));
  const result=await page.evaluate(inv=>{
   const base=BagseedArt.normalize({topS:'hoodie',bottomS:'jeans',shoesS:'sneakers',hairS:'short',skin:'#cf9670',shirtC:'#5086bf',pantsC:'#36405a',shoesC:'#2b1d14',body:'average',pres:'neutral',acc:'none'}),boards={};
   const sets=[...inv.top.map(v=>['top-'+v,{...base,topS:v}]),...inv.bottom.map(v=>['bottom-'+v,{...base,bottomS:v}]),...inv.shoe.map(v=>['shoe-'+v,{...base,shoesS:v}])];
   for(let group=0;group<sets.length;group+=4){
    const board=document.createElement('canvas');board.width=2304;board.height=Math.min(4,sets.length-group)*432;const g=board.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,board.width,board.height);
    sets.slice(group,group+4).forEach(([id,L],row)=>{for(let frame=0;frame<8;frame++)g.drawImage(BagseedArt.sprite(L,'right',frame,0,0,0,false,3,true),frame*288,row*432);g.fillStyle='#efe7d7';g.font='18px sans-serif';g.fillText(id,8,row*432+25);});boards['group-'+group]=board.toDataURL();
   }return {boards};
  },inventory);fs.mkdirSync(out,{recursive:true});for(const[id,url]of Object.entries(result.boards)){fs.writeFileSync(path.join(out,id+'.png.tmp'),Buffer.from(url.split(',')[1],'base64'));fs.renameSync(path.join(out,id+'.png.tmp'),path.join(out,id+'.png'));}if(errors.length)throw Error(errors.join('\n'));console.log('Captured all 24 garments, 8 poses each, through the real compositor.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
