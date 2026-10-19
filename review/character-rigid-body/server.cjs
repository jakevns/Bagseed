const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function createServer(){return http.createServer((req,res)=>{
 try{const url=new URL(req.url,'http://localhost'),key=decodeURIComponent(url.pathname);let file;
  if(key==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(key==='/'||key==='/app.js')file=path.join(__dirname,key==='/'?'index.html':'app.js');
  else if(['/compositor.js','/raster-sources.js','/canvas-renderer.js'].includes(key))file=path.join(root,'src/character-system',key.slice(1));
  else if(key.startsWith('/generated/'))file=path.join(__dirname,key);
  else if(key.startsWith('/source/')){const relative=key.slice(8),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'generated/manifest.json')));if(!manifest.files.some(f=>f.path===relative))throw Error('Source outside manifest');file=path.join(root,relative);}
  else{res.writeHead(404);return res.end('Not in this body review');}
  file=path.resolve(file);if(!file.startsWith(root+path.sep))throw Error('Outside workspace');
  const data=fs.readFileSync(file),type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)]||'text/plain';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Body-Review':'rigid-approved-pixels-v1'});res.end(data);
 }catch(e){res.writeHead(500);res.end(e.message);}
 });}
module.exports={createServer};if(require.main===module)createServer().listen(5189,'127.0.0.1',()=>console.log('Original-pixel body review: http://127.0.0.1:5189/?body-review=original-pixels'));
