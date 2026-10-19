const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),{createServer}=require('./server.cjs');
async function main(){const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await browser.newPage({viewport:{width:1900,height:1100}});await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>window.reviewReady,null,{timeout:90000});
 const out=path.join(__dirname,'screenshots');fs.mkdirSync(out,{recursive:true});
 for(const anatomy of ['androgynous','female','male'])for(const dir of ['right','down','left','up']){
  await p.selectOption('#anatomy',anatomy);await p.selectOption('#direction',dir);
  await p.evaluate(({anatomy,dir})=>{document.getElementById('capture')?.remove();const row=document.createElement('div');row.id='capture';row.style='background:#17212b;color:white;padding:12px;width:1800px';const h=document.createElement('h2');h.textContent=anatomy+' / '+dir+' — Standing + Walk 0–7';row.append(h);const strip=document.createElement('div');strip.style='display:flex';for(const f of [null,0,1,2,3,4,5,6,7]){const fig=document.createElement('figure');fig.style='margin:2px;text-align:center';const title=document.createElement('figcaption');title.textContent=f===null?'Standing':'Walk '+f;const cv=bodyReview.render(f);cv.style='width:192px;height:288px;background:#ff00ff';fig.append(title,cv);strip.append(fig);}row.append(strip);document.body.append(row);},{anatomy,dir});
  await p.locator('#capture').screenshot({path:path.join(out,`completed-${anatomy}-${dir}.png`)});
 }console.log('Saved all 12 magenta walk strips.');
}finally{await browser.close();await new Promise(r=>server.close(r));}}main().catch(e=>{console.error(e);process.exitCode=1;});
