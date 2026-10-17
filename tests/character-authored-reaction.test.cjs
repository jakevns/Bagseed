const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('authored NPC reactions never switch to procedural figures when pose art is missing',{timeout:180000},async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
 const result=await page.evaluate(()=>{const data=window.__BAGSEED_ILLUSTRATED_DATA__,failures=[];let checked=0,fallbacks=0;
 for(const p of [...data.approved,...data.cast].filter(p=>p.id!=='player'))for(const dir of ['down','right','up','left']){const image=BagseedArt.sprite({...p.look,prop:null},dir,0,0,0,0,true);if(image.bagseedAuthoredId!==p.id)failures.push({id:p.id,dir,reason:'lost authored identity'});
  if(!p.actions?.[dir]){fallbacks++;if(!image.bagseedAuthoredNoseFallback)failures.push({id:p.id,dir,reason:'missing idle emote'});const idle=BagseedArt.sprite({...p.look,prop:null},dir),a=idle.getContext('2d').getImageData(0,0,idle.width,idle.height).data,b=image.getContext('2d').getImageData(0,0,image.width,image.height).data;let changed=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3])changed++;if(changed>100)failures.push({id:p.id,dir,changed});}checked++;
 }return {checked,fallbacks,failures};});assert.ok(result.checked>=280);assert.deepEqual(result.failures,[]);console.log(JSON.stringify(result));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
