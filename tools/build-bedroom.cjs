const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const marker = 'bagseed-bedroom-production-code';
function bedroomScript() {
  const art = fs.readFileSync(path.join(root, 'graphics/bedroom/assets/room-shell.png'));
  const code = fs.readFileSync(path.join(root, 'graphics/bedroom/sources/renderer.js'), 'utf8')
    .replace('__BAGSEED_BEDROOM_IMAGE__', () => JSON.stringify('data:image/png;base64,' + art.toString('base64')));
  new (require('node:vm').Script)(code);
  return `<script id="${marker}">\n${code}\n</script>\n${require('./compile-beds.cjs')()}${require('./compile-desks.cjs')()}`;
}
module.exports = bedroomScript;
if (require.main === module) {
  const output = path.join(root, 'public/index.html');
  const reportPath = path.join(root, 'graphics/production/build.json');
  const report = JSON.parse(fs.readFileSync(reportPath));
  const current = fs.readFileSync(output);
  assert.equal(sha(current), report.updatedSHA, 'Unexpected output edits; preserve before rebuilding');
  const source = fs.readFileSync(path.join(root, 'src/game.html'), 'utf8');
  const character = current.toString().match(/<script id="bagseed-illustrated-production-code">[\s\S]*?<\/script>/g);
  assert.equal(character?.length, 1, 'Expected exactly one verified character renderer');
  assert.ok(source.endsWith('</body></html>\n') || source.endsWith('</body></html>'), 'Missing insertion point');
  const html = require('./compile-main-menu.cjs')(source).replace('</body></html>', `${character[0]}\n${bedroomScript()}</body></html>`);
  assert.equal(sha(fs.readFileSync(path.join(root, 'baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html'))), report.baselineSHA);
  fs.writeFileSync(output + '.tmp', html); fs.renameSync(output + '.tmp', output);
  Object.assign(report, { workingSourceSHA: sha(source), updatedSHA: sha(html), bytes: Buffer.byteLength(html), bedroomRevision: 'bedroom-shell-1', bedRevision: 'beds-batch-04', bedCombinations: 80, deskRevision: 'seedling-desks-1', deskVariations: 3, menuRevision: 'community-menu-1' });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log('Rebuilt approved main menu, bedroom, beds and desks; verified character payload retained unchanged.');
}
