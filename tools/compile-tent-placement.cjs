const fs=require('node:fs'),path=require('node:path');
module.exports=function compileTentPlacement(){const source=fs.readFileSync(path.resolve(__dirname,'../graphics/tents/shared/placement.js'),'utf8');new(require('node:vm').Script)(source);return `<script id="bagseed-tent-placement-code">\n${source}\n</script>\n`.replace(/\r\n/g,'\n');};
