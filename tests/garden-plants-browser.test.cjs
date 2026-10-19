const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('approved garden art waits at startup and preserves native pots, wind, reduced motion and saved plants',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'garden-production-'));
 try{execFileSync(process.execPath,['tools/preview-garden-batch-01.cjs','--production','--no-animation','--out='+out],{cwd:path.resolve(__dirname,'..'),timeout:120000});const r=JSON.parse(fs.readFileSync(path.join(out,'verification.json')));assert.equal(r.productionRenderer,true);assert.ok(r.startupGardenRequests>=5);assert.equal(r.saveReload,true);assert.equal(r.readOnly,true);assert.equal(r.checks.length,5);assert.ok(r.checks.every(c=>c.wind&&c.stable&&c.rootFixed));assert.deepEqual(r.errors,[]);}finally{fs.rmSync(out,{recursive:true,force:true});}
});
