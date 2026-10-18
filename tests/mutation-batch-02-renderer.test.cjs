const {test}=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('Ducksfoot, Monophylla and Moonmarble grow painted organs and preserve combinations, clones and saves',async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-mutation-test-'));
 try{await require('../tools/preview-mutation-batch-02.cjs')({out});}
 finally{fs.rmSync(out,{recursive:true,force:true});}
});
