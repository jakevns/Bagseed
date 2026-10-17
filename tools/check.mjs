import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const baseline = new URL('../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html', import.meta.url);
const expected = '4889b1d5c14ee0b95085ed6ef208615e19598f2bf5a656604284f22085502164';
if (createHash('sha256').update(readFileSync(baseline)).digest('hex') !== expected) throw new Error('The approved baseline has changed. Restore the untouched uploaded file.');
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const require = createRequire(import.meta.url);
require('./compile-loading-screen.cjs').verify(html);
if (!html.includes(require('./compile-bedroom-window.cjs')())) throw new Error('The live window renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-starter-tent.cjs')())) throw new Error('The starter tent renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-tent2.cjs')())) throw new Error('The 2x2 tent renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-tent4.cjs')())) throw new Error('The 4x4 tent renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-tent5.cjs')())) throw new Error('The 5x5 tent renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-tent-placement.cjs')())) throw new Error('The tent placement renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-dehumidifiers.cjs')())) throw new Error('The dehumidifier renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-humidifiers.cjs')())) throw new Error('The humidifier renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-exhaust.cjs')())) throw new Error('The exhaust renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-fans.cjs')())) throw new Error('The fan renderer differs from its source. Rebuild before publishing.');
if (!html.includes(require('./compile-grow-lights.cjs')())) throw new Error('The grow-light renderer differs from its source. Rebuild before publishing.');
const sha = value => createHash('sha256').update(value).digest('hex');
const report = JSON.parse(readFileSync(new URL('../graphics/production/build.json', import.meta.url), 'utf8'));
if (sha(html) !== report.updatedSHA) throw new Error('The playable game differs from its build report. Rebuild before publishing.');
const character = html.match(/<script id="bagseed-illustrated-production-code">([\s\S]*?)<\/script>/);
if (!character || sha(character[1].replace(/\r\n/g, '\n').trim()) !== report.characterPayloadSHA256) throw new Error('The embedded character release is missing or stale. Run the full character builder.');
const sources = ['graphics/production/sources/renderer.js', 'graphics/production/sources/face-details.js', 'graphics/production/sources/hair-batch-01.js', 'graphics/production/sources/hair-fit-rest.js', 'graphics/production/sources/build.cjs', 'graphics/production/customization-v5/detail-landmarks.json', 'graphics/production/customization-v5/manifest.json', 'graphics/production/customization-v5/hair-fit.json', 'graphics/production/customization-v5/register.py'];
sources.push('graphics/production/cast-walk-v1/manifest.json', 'graphics/production/cast-walk-v1/sources/clocks.js', 'graphics/production/walk/sources/renderer.js', 'graphics/production/walk/manifest.json', 'graphics/production/walk/rig.json', 'graphics/production/walk/stride-v4/candidate-manifest.json');
for (const file of sources) {
  const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  if (sha(source) !== report.characterSourcesSHA256?.[file]) throw new Error(`Character source changed without rebuilding: ${file}`);
}
if (character[1].match(/renderingRevision:'([^']+)'/)?.[1] !== report.characterRevision) throw new Error('The published character revision differs from the build report.');
if (report.characterDataFile) {
  const dataScript = readFileSync(new URL('../' + report.characterDataFile, import.meta.url), 'utf8');
  if (sha(dataScript) !== report.characterDataSHA256) throw new Error('Character data script differs from its build report. Rebuild before publishing.');
  if (!html.includes('src="character-data.js"')) throw new Error('The game must load its character data before the renderer.');
  new vm.Script(dataScript, { filename: report.characterDataFile });
}
let count = 0;
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
  new vm.Script(match[1], { filename: `public/index.html#script-${++count}` });
}
if (!count) throw new Error('No game scripts found.');
console.log(`Approved baseline checksum verified; ${count} game script blocks parsed.`);
console.log(`Character release ${report.characterRevision} matches its sources and embedded payload.`);
