// Reproduce all source repairs. Supply --python <path> when python is not on PATH.
const path=require('node:path'),{spawnSync}=require('node:child_process');
const dir=__dirname,root=path.resolve(dir,'../..'),arg=process.argv.indexOf('--python'),python=arg>=0?process.argv[arg+1]:'python';
function run(command,args){const result=spawnSync(command,args,{cwd:root,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);}
run(process.execPath,[path.join(dir,'build.cjs'),'--raw']);
run(process.execPath,[path.join(dir,'export-cuts.cjs')]);
run(python,[path.join(dir,'repair-parts.py')]);
run(process.execPath,[path.join(dir,'build.cjs')]);
