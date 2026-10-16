const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'../graphics/loading-screen/sources');
function parts(){
  const css=fs.readFileSync(path.join(root,'style.css'),'utf8'),screen=fs.readFileSync(path.join(root,'screen.html'),'utf8'),code=fs.readFileSync(path.join(root,'controller.js'),'utf8');
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))),sha=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
  function url(asset){const bytes=fs.readFileSync(path.resolve(root,'..',asset.path));assert.equal(sha(bytes),asset.sha256,'Loading artwork changed');return 'data:image/webp;base64,'+bytes.toString('base64');}
  const scene=fs.readFileSync(path.join(root,'scene.js'),'utf8').replace('__BAGSEED_LOADING_SCENE__',()=>JSON.stringify({...manifest,roomURL:url(manifest.art),storageURL:url(manifest.storage)}));
  assert.equal(sha(fs.readFileSync(path.resolve(root,'..',manifest.source.path))),manifest.source.sha256,'Loading illustration source changed');
  assert.equal(sha(fs.readFileSync(path.resolve(root,'../../under-desk-storage/assets/storage-atlas.png'))),manifest.storage.approvedAtlasSHA256,'Loading storage differs from approved artwork');
  new vm.Script(code);new vm.Script(scene);
  return {style:`<style id="bagseed-loading-style">\n${css}\n</style>`,shell:`${screen}\n<script id="bagseed-loading-controller">\n${code}\n</script>\n<script id="bagseed-loading-scene-code">\n${scene}\n</script>\n<!-- bagseed-loading-shell-end -->`};
}
function compile(source){
  assert.ok(!source.includes('id="bagseed-loading"'),'Loading screen already installed');
  const frame='function frameInner(ts) {';assert.equal(source.split(frame).length,2,'Expected one main frame loop');
  assert.ok(source.includes('</head>')&&source.includes('<body>'),'Missing early loading-screen insertion point');
  const {style,shell}=parts();
  return source.replace('<html lang="en">','<html lang="en" data-bagseed-loading="loading">').replace('</head>',style+'\n</head>').replace('<body>','<body>\n'+shell+'\n').replace(frame,frame+'\n  if (window.BagseedStartup && !BagseedStartup.canRender) { last = ts; return; }');
}
compile.verify=html=>{const {style,shell}=parts();assert.ok(html.includes(style)&&html.includes(shell),'Loading screen differs from its sources; rebuild');assert.ok(html.includes('if (window.BagseedStartup && !BagseedStartup.canRender) { last = ts; return; }'),'Startup frame gate missing');};
module.exports=compile;
