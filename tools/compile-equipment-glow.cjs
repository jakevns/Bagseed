const fs=require('node:fs'),path=require('node:path');
module.exports=function compileEquipmentGlow(){const code=fs.readFileSync(path.resolve(__dirname,'../graphics/equipment-glow/sources/renderer.js'),'utf8');new(require('node:vm').Script)(code);return `<script id="bagseed-equipment-glow-production-code">\n${code}\n</script>\n`;};
