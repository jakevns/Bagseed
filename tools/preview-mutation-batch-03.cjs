const path=require('node:path'),capture=require('./preview-mutation-batch-02.cjs');
module.exports=options=>capture({...options,batch:'03'});
if(require.main===module){const args=process.argv.slice(2),out=args.find(a=>!a.startsWith('--'));module.exports({out:out?path.resolve(out):undefined,animate:args.includes('--animate')}).then(()=>console.log('Snowtip, Fernfrond and Goldleaf native review passed.')).catch(e=>{console.error(e);process.exitCode=1;});}
