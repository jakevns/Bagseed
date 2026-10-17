const fs=require('node:fs'),path=require('node:path');
module.exports=()=>'<script id="bagseed-canopy-code">\n'+fs.readFileSync(path.resolve(__dirname,'../graphics/plants/sources/canopy.cjs'),'utf8')+'\n</script>\n';
