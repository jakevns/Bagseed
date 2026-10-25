const {test}=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
test('published Skunk #1 uses dedicated parts and updates older living saves without changing biology',async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-skunk1-'));
 try{
  const r=await require('../tools/preview-strain-batch-06.cjs')({reviewRoot:path.resolve(__dirname,'../review/strain-batch-07'),kitKeys:['skunk1'],production:true,out});
  assert.equal(r.productionRenderer,true);assert.equal(r.existingSaveArtworkUpgraded,true);
  assert.equal(r.artworkUpgradePreservesGeneticsSeedTraitsAndHeight,true);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});
