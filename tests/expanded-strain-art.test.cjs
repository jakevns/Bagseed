const {test}=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
test('published OG Kush, White Widow and Northern Lights use dedicated parts and upgrade living old saves without rerolling genetics',async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-expanded-strains-'));
 try{
  const result=await require('../tools/preview-strain-batch-06.cjs')({out,production:true});
  assert.equal(result.productionRenderer,true);assert.equal(result.existingSaveArtworkUpgraded,true);
  assert.equal(result.artworkUpgradePreservesGeneticsSeedTraitsAndHeight,true);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});
