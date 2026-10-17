const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright');
test('NPC definitions retain authored art with original, null and undefined props, including child draws',{timeout:180000},async()=>{
 const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu']});const page=await require('./helpers/art-page.cjs')(browser);await page.goto('http://127.0.0.1:'+server.address().port,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
 const result=await page.evaluate(()=>{const looks=[...Object.entries(NPC_LOOK).map(([id,look])=>({id:'NPC_LOOK.'+id,look})),...Object.entries(NB_DEF).map(([id,p])=>({id:'NB_DEF.'+id,look:p.look||NPC_LOOK[id],kid:p.kid||p.age==='kid'})),...Object.entries(CAST_DEF).map(([id,p])=>({id:'CAST_DEF.'+id,look:p.look||NPC_LOOK[id],kid:p.kid||p.age==='kid'})),...Object.entries(PATIENTS).map(([id,p])=>({id:'PATIENTS.'+id,look:p.look||NPC_LOOK[id]||NB_DEF[id]?.look||CAST_DEF[id]?.look}))],failures=[];let checks=0;
 for(const p of looks){if(!p.look){failures.push({id:p.id,reason:'missing look'});continue;}const variants=[p.look,{...p.look,prop:null},{...p.look,prop:undefined}];if(p.kid)variants.push(...variants.map(look=>({...look,short:true})));
  for(const look of variants){const art=BagseedArt.sprite(look);if(!art.bagseedAuthoredId)failures.push({id:p.id,prop:look.prop,short:look.short});checks++;}}
 const original=drawPerson,probe={prop:'can'};let passed;try{drawPerson=(c,x,y,look)=>{passed=look;};drawTinyPerson(null,0,0,probe);if(passed!==probe)failures.push({tiny:'omitted prop replaced look'});drawTinyPerson(null,0,0,probe,0,null);if(passed.prop!==null)failures.push({tiny:'explicit null ignored'});}finally{drawPerson=original;}
 return {checks,failures};});assert.deepEqual(result.failures,[]);assert.ok(result.checks>150);console.log('Authored lookup checks:',result.checks);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
