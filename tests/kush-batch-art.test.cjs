const {test}=require('node:test'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
test('released Afghani, Hindu Kush and Bubba Kush preserve care, colors, mutations and genetics while updating living old saves',async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'bagseed-kush-batch-'));
 try{
  const r=await require('../tools/preview-strain-batch-06.cjs')({reviewRoot:path.resolve(__dirname,'../review/strain-batch-08'),kitKeys:['afghani','hindukush','bubbakush'],production:true,out});
  assert.equal(r.productionRenderer,true);assert.equal(r.existingSaveArtworkUpgraded,true);
  assert.equal(r.artworkUpgradePreservesGeneticsSeedTraitsAndHeight,true);assert.equal(r.coolStudies.length,6);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});
