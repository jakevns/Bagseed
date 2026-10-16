// Renders standing and walking frames (density 3) for the custom player and the approved walkers.
// Usage: node review/custom-walk-v2-brief/capture-proportions.cjs <outDir>   (disposable browser, no save data)
const fs=require('node:fs'),path=require('node:path'),{chromium}=require(process.cwd()+'/node_modules/playwright');
const root=process.cwd(),out=process.argv[2];
const fixture=JSON.parse(fs.readFileSync(path.join(root,'review/characters-v2/sources/baseline-assets.json')));
const P=id=>fixture.people.find(p=>p.id===id).look;
(async()=>{
 const {createStaticServer}=await import(root+'/tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/opt/pw-browsers/chromium',headless:true,args:['--disable-gpu']});
 const page=await require(root+'/tests/helpers/art-page.cjs')(browser,{viewport:{width:1280,height:900}});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load',timeout:300000});await page.evaluate(()=>BagseedArt.ready);
 const res=await page.evaluate(({looks})=>{const o={};for(const[id,look]of Object.entries(looks))for(const dir of['down','right','up','left']){
   const s=BagseedArt.sprite(look,dir,0,0,0,0,false,3,false);o[`${id}-${dir}-stand`]=s.toDataURL();
   for(let f=0;f<4;f++){const w=BagseedArt.sprite(look,dir,f,0,0,0,false,3,true);o[`${id}-${dir}-walk${f}`]=w.toDataURL();}
 }return o;},{looks:{player:P('player'),remy:P('remy'),priya:P('priya'),doug:P('doug')}});
 for(const[k,v]of Object.entries(res))fs.writeFileSync(path.join(out,k+'.png'),Buffer.from(v.split(',')[1],'base64'));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
