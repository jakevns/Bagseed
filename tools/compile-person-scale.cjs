const fs=require('node:fs'),path=require('node:path');
// People in the home grow spaces were sized for the older, smaller room art.
// 1.8 puts an adult just under the illustrated bedroom and grow-room doors.
const SCALE=1.8;
module.exports=function compilePersonScale(){const code=fs.readFileSync(path.resolve(__dirname,'../graphics/person-scale/sources/renderer.js'),'utf8').replace('__BAGSEED_PERSON_SCALE__',()=>String(SCALE));new(require('node:vm').Script)(code);return `<script id="bagseed-person-scale-code">\n${code}\n</script>\n`;};
module.exports.scale=SCALE;
