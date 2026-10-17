const fs=require('node:fs'),path=require('node:path');
module.exports=function compileRoomClimate(){const code=fs.readFileSync(path.resolve(__dirname,'../graphics/room-climate/sources/placement.js'),'utf8');new(require('node:vm').Script)(code);return `<script id="bagseed-room-climate-production-code">\n${code}\n</script>\n`;};
