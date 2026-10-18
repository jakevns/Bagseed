const {test}=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('Ember vascular texture, female Pink Pistil hairs and Inkleaf pigment grow on native plants and preserve saves',async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-mutation04-test-'));
 try{await require('../tools/preview-mutation-batch-04.cjs')({out});}
 finally{fs.rmSync(out,{recursive:true,force:true});}
});
