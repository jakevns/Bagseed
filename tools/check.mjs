import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const baseline = new URL('../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html', import.meta.url);
const expected = '4889b1d5c14ee0b95085ed6ef208615e19598f2bf5a656604284f22085502164';
if (createHash('sha256').update(readFileSync(baseline)).digest('hex') !== expected) throw new Error('The approved baseline has changed. Restore the untouched uploaded file.');
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
let count = 0;
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
  new vm.Script(match[1], { filename: `public/index.html#script-${++count}` });
}
if (!count) throw new Error('No game scripts found.');
console.log(`Approved baseline checksum verified; ${count} game script blocks parsed.`);
