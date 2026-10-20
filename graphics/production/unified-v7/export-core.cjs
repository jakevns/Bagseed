// Rasterize the already prepared, independently owned garment source layers.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../..'),catalog=require('./core-sources.json'),documents=new Map();
for(const item of catalog){if(!documents.has(item.document))documents.set(item.document,{id:item.document,svgPath:item.svg,layers:[]});documents.get(item.document).layers.push({id:item.id,role:item.role});}
(async()=>{const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{const page=await browser.newPage();const index=[];
for(const doc of documents.values()){
 const svg=fs.readFileSync(path.join(root,doc.svgPath),'utf8');const outputs=await page.evaluate(async({svg,doc})=>{
 const outputs=[];for(const layer of doc.layers){const xml=new DOMParser().parseFromString(svg,'image/svg+xml'),root=xml.documentElement;root.setAttribute('width','288');root.setAttribute('height','324');root.setAttribute('viewBox','0 0 288 324');
 for(const node of root.children)if(node.tagName==='g')node.style.display=node.id===layer.id?'inline':'none';
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(xml)],{type:'image/svg+xml'})),image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=288;canvas.height=324;canvas.getContext('2d').drawImage(image,0,0);outputs.push({id:layer.id,role:layer.role,data:canvas.toDataURL().split(',')[1]});URL.revokeObjectURL(url);}return outputs;
 },{svg,doc});
 const dir=doc.id.replaceAll('/','-');fs.mkdirSync(path.join(__dirname,'core-sources',dir),{recursive:true});
 for(const layer of outputs){const file='core-sources/'+dir+'/'+layer.id+'.png';fs.writeFileSync(path.join(__dirname,file),Buffer.from(layer.data,'base64'));index.push({document:doc.id,id:layer.id,role:layer.role,file,svg:doc.svgPath,svgSHA256:crypto.createHash('sha256').update(svg).digest('hex')});}
}fs.writeFileSync(path.join(__dirname,'core-sources.json'),JSON.stringify(index,null,2)+'\n');console.log('Exported '+index.length+' prepared garment layers.');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
