import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const baseline = new URL('../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html', import.meta.url);
const expected = '4889b1d5c14ee0b95085ed6ef208615e19598f2bf5a656604284f22085502164';
if (createHash('sha256').update(readFileSync(baseline)).digest('hex') !== expected) throw new Error('The approved baseline has changed. Restore the untouched uploaded file.');
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');
const report = JSON.parse(readFileSync(new URL('../graphics/production/build.json', import.meta.url), 'utf8'));
if (sha(html) !== report.updatedSHA) throw new Error('The playable game differs from its build report. Rebuild before publishing.');
const character = html.match(/<script id="bagseed-illustrated-production-code">([\s\S]*?)<\/script>/);
if (!character || sha(character[1].replace(/\r\n/g, '\n').trim()) !== report.characterPayloadSHA256) throw new Error('The embedded character release is missing or stale. Run the full character builder.');
const sources = ['graphics/production/sources/renderer.js', 'graphics/production/sources/face-details.js', 'graphics/production/sources/build.cjs', 'graphics/production/customization-v5/detail-landmarks.json', 'graphics/production/customization-v5/manifest.json'];
for (const file of sources) {
  const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  if (sha(source) !== report.characterSourcesSHA256?.[file]) throw new Error(`Character source changed without rebuilding: ${file}`);
}
if (character[1].match(/renderingRevision:'([^']+)'/)?.[1] !== report.characterRevision) throw new Error('The published character revision differs from the build report.');
let count = 0;
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
  new vm.Script(match[1], { filename: `public/index.html#script-${++count}` });
}
if (!count) throw new Error('No game scripts found.');
console.log(`Approved baseline checksum verified; ${count} game script blocks parsed.`);
console.log(`Character release ${report.characterRevision} matches its sources and embedded payload.`);
