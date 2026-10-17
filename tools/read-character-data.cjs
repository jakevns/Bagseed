// Read both historical single-file builds and the GitHub-sized data package.
const fs=require('node:fs'),path=require('node:path');
module.exports=function readCharacterData(html,root=path.resolve(__dirname,'..')){
 const marker=html.indexOf('<script id="bagseed-illustrated-production-code">'),start=html.indexOf('const DATA = ',marker)+'const DATA = '.length,end=html.indexOf(';\n  const DIRS',start),expression=html.slice(start,end).trim();
 if(expression==='window.__BAGSEED_ILLUSTRATED_DATA__'){
  const text=fs.readFileSync(path.join(root,'public/character-data.js'),'utf8'),prefix='window.__BAGSEED_ILLUSTRATED_DATA__ = ';
  if(!text.startsWith(prefix))throw Error('Invalid character data script');return {data:JSON.parse(text.slice(prefix.length).trim().replace(/;$/,'')),start,end};
 }
 return {data:JSON.parse(expression),start,end};
};
