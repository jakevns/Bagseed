const {test}=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('Twin Leader forks, fasciated Crested Cola and three-way Whorl nodes stay connected through growth, wind and saves',async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-mutation05-test-'));
 try{await require('../tools/preview-mutation-batch-05.cjs')({out});}
 finally{fs.rmSync(out,{recursive:true,force:true});}
});
