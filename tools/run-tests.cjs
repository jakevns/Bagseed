// Keep the roster gate and full test inventory, forwarding runner options
// before file paths. Node ignores those options when npm appends them after
// tests/*.test.cjs, which silently left requested parallel runs serial.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');let concurrency=1;
for(const arg of process.argv.slice(2)){
 const match=/^--test-concurrency=([1-8])$/.exec(arg);
 if(!match)throw new Error('Supported option: --test-concurrency=1 through 8');
 concurrency=Number(match[1]);
}
function run(args){const r=spawnSync(process.execPath,args,{cwd:root,env:process.env,stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);}
run(['tools/audit-characters.cjs','--check']);
const files=fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.test.cjs')).sort().map(f=>'tests/'+f);
run(['--test','--test-concurrency='+concurrency,...files]);
