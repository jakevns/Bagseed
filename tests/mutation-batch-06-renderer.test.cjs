const {test}=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('Pocket Dwarf has compact connected growth; Triploid retains inherited anatomy and reveals only its known-genetics badge',async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-mutation06-test-'));
 try{await require('../tools/preview-mutation-batch-06.cjs')({out});}
 finally{fs.rmSync(out,{recursive:true,force:true});}
});
