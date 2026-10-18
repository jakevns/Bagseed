const {test}=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('Snowtip greens attached leaves with age while Fernfrond and Goldleaf keep painted anatomy, wind and saved identity',async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-mutation03-test-'));
 try{await require('../tools/preview-mutation-batch-03.cjs')({out});}
 finally{fs.rmSync(out,{recursive:true,force:true});}
});
