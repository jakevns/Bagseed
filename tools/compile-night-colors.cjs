const fs=require('node:fs'),path=require('node:path');
module.exports=function(){const code=['night-color.cjs','night-cooling.js'].map(n=>fs.readFileSync(path.resolve(__dirname,'../graphics/plants/sources',n),'utf8')).join('\n');new(require('node:vm').Script)(code);return `<script id="bagseed-night-colors-code">\n${code}\n</script>\n`;};
