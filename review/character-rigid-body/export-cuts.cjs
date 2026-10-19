// Decode the existing SVG ownership masks at their native source resolution.
const fs=require('node:fs'),path=require('node:path');
async function main(){
 const {chromium}=require('playwright'),{createServer}=require('./server.cjs'),server=createServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const page=await browser.newPage();await page.route('**/app.js',r=>r.fulfill({contentType:'text/javascript',body:''}));await page.goto('http://127.0.0.1:'+server.address().port);
  const out=path.join(__dirname,'generated/raw-cuts');fs.mkdirSync(out,{recursive:true});
  const docs=require('./native-body-map.json').documents;
  for(const doc of docs){const result=await page.evaluate(async doc=>{
    const [,anatomy,dir]=doc.id.split('/'),text=await fetch('/generated/'+anatomy+'-'+dir+'.svg').then(r=>r.text()),outputs=[];
    for(const l of doc.layers){const parsed=new DOMParser().parseFromString(text,'image/svg+xml');for(const g of parsed.querySelectorAll(':scope > g[data-material], svg > g[data-material]'))g.style.display=g.id===l.id?'inline':'none';
     const blob=new Blob([new XMLSerializer().serializeToString(parsed)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=doc.crop[2];c.height=doc.crop[3];c.getContext('2d').drawImage(img,0,0);outputs.push({id:l.id,png:c.toDataURL().split(',')[1]});URL.revokeObjectURL(url);
    }return outputs;
   },doc);
   const dir=path.join(out,doc.id.replaceAll('/','-'));fs.mkdirSync(dir,{recursive:true});for(const r of result)fs.writeFileSync(path.join(dir,r.id+'.png'),Buffer.from(r.png,'base64'));
  }console.log('Exported 180 native-resolution pixel cuts.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
}main().catch(e=>{console.error(e);process.exitCode=1;});
