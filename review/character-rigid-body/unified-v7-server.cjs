const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const pack = path.resolve(__dirname, '../../graphics/character-system/sources/unified-body-v7');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
function html() {
  const audit = JSON.parse(fs.readFileSync(path.join(pack, 'audit.json')));
  const rig = JSON.parse(fs.readFileSync(path.join(pack, 'rig-review.json')));
  const allPass = audit.results.every(r=>r.automatedGatesPass);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Unified body v7: six-view source review</title>
  <style>body{font:17px system-ui;background:#18232e;color:#edf1f5;margin:24px}p{max-width:1100px;line-height:1.5}a{color:#b3dcff}img{display:block;width:100%;max-width:1600px}section{margin:40px 0}strong{color:#ffd08a}li{margin:7px 0}summary{cursor:pointer}code{overflow-wrap:anywhere}</style>
  <h1>Unified body v7 — source cuts and joint tests</h1>
  <p><strong>${allPass?'Automated gates pass. Awaiting visual review; not approved.':'Unapproved work in progress. Automated failures are listed below.'}</strong> No clothing changes, game changes or walk integration. No image-service calls. The approved v4 hand files are unchanged. Five panels per view: armless; Standing beside untouched original; thigh ±25°; near arm ±20°; review-only Walk 0 and Walk 4.</p>
  <p>Female-left and male-left use reflected right-side repairs with one uniform scale and translation. Before using them, comparison with the left original measured 14.89% and 5.38% silhouette difference respectively. These source asymmetries cannot be removed by rigid alignment. <a href="/mirror-measurements.json">Mirror measurements</a>.</p>
  <p>The latest requested outer-edge cleanup deliberately changes the old mask-external edge pixels. Colour correction stays inside the repair mask. The original v6 files are preserved. Hand edge distance is informational only under your revised acceptance rules; width, wrist alignment, join, rotation and visibility are checked separately.</p>
  <nav>${audit.results.map(r=>`<a href="#${r.key}">${r.key}</a>`).join(' · ')}</nav>
  ${audit.results.map(r=>{const poses=rig.find(p=>p.key===r.key);return `<section id="${r.key}"><h2>${r.key}</h2><p>Repair colour difference: ${(r.repairColorMeanDifference*100).toFixed(2)}%. Knuckle width difference: ${(r.knuckleWidthDifference*100).toFixed(2)}%; wrist error: ${r.handWristError.toFixed(2)} px; wrist outline step: ${r.wristJoinMaxRowStep} px. Hand edge distance (information only): ${r.handEdgeDistances.max?.toFixed(2)} px. Standing silhouette difference: ${(r.standingOutlineDifference*100).toFixed(2)}%. Near-arm ordering errors: ${r.nearArmOrderErrors}. Hip notch depths: ${r.hipNotchDepths.map(n=>n.toFixed(2)).join(', ')} px.</p><ul>${r.failures.map(f=>`<li>${escape(f)}</li>`).join('')||'<li>Automated gates pass; visual approval remains pending.</li>'}</ul><a href="/${r.board}"><img loading="eager" src="/${r.board}" alt="${r.key}: five-panel body comparison"></a><details><summary>Native parts and pivots</summary><p>Shoulder ${escape(JSON.stringify(poses.shoulderPivot))}; hip ${escape(JSON.stringify(poses.hipPivot))}. <a href="/${r.key}-torso.png">Torso</a> · <a href="/${r.key}-hips.png">Hips</a> · <a href="/${r.key}-thigh.png">Thigh</a> · <a href="/${r.key}-upper-arm.png">Upper arm</a> · <a href="/${r.key}-hand.png">Hand</a></p></details></section>`}).join('')}
  <p><a href="/audit.json">Independent PNG audit</a> · <a href="/rig-review.json">Rig and draw-order checks</a> · <a href="/prepared.json">Source preparation</a></p></html>`;
}
function createServer() {
  return http.createServer((req,res)=>{try {
    const u=new URL(req.url,'http://localhost');
    if(u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html());}
    const name=decodeURIComponent(u.pathname.slice(1));if(name!==path.basename(name))throw Error('Invalid path');
    const b=fs.readFileSync(path.join(pack,name));res.writeHead(200,{'Content-Type':name.endsWith('.png')?'image/png':'application/json','Cache-Control':'no-store'});res.end(b);
  }catch(e){res.writeHead(404);res.end(e.message);}});
}
module.exports={createServer};
if(require.main===module)createServer().listen(5193,'127.0.0.1',()=>console.log('Unified body v7 http://127.0.0.1:5193/'));
