const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('patient identities match world NPCs and unknown ids never impersonate Doug',{timeout:180000},async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
  const result=await page.evaluate(()=>{
   const shared=['marisol','theo','rosalind'].map(id=>({id,same:PATIENTS[id].look===NPC_LOOK[id],authored:BagseedArt.sprite(PATIENTS[id].look).bagseedAuthoredId}));
   const warnings=[],old=console.warn;let a,b;try{console.warn=(...args)=>warnings.push(args.join(' '));a=lookFor('missing-audit-npc');b=lookFor('missing-audit-npc');}finally{console.warn=old;}
   return {shared,warnings,stable:a===b,isDoug:a===NPC_LOOK.doug,authored:BagseedArt.sprite(a).bagseedAuthoredId,active:BagseedArt.cast.map(p=>p.id)};
  });
  assert.deepEqual(result.shared,[{id:'marisol',same:true,authored:'cast-67-marisol'},{id:'theo',same:true,authored:'cast-66-theo'},{id:'rosalind',same:true,authored:'cast-65-rosalind'}]);
  assert.equal(result.warnings.length,1);assert.match(result.warnings[0],/missing-audit-npc/);assert.equal(result.stable,true);assert.equal(result.isDoug,false);assert.equal(result.authored,null);
  for(const id of ['cast-37-rosalind','cast-38-theo','cast-39-marisol'])assert.equal(result.active.includes(id),false);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
