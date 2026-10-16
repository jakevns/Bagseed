const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function(){
  const code=fs.readFileSync(path.resolve(__dirname,'../graphics/bedroom-window/sources/renderer.js'),'utf8');new vm.Script(code);
  return `<script id="bagseed-bedroom-window-production-code">\n${code}\n</script>\n`;
};
