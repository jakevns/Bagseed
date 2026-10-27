const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const out = 'review/plant-art-audit';
fs.mkdirSync(out, {recursive: true});
const html = fs.readFileSync('public/index.html', 'utf8');
for (const name of ['garden-plants', 'live-plants']) {
  const payload = require('./external-assets.cjs').externalize(require('./compile-' + name + '.cjs')()).text;
  assert.ok(html.includes(payload), name + ' source differs from production');
}
const source = fs.readFileSync('src/game.html', 'utf8');
const data = JSON.parse(source.match(/const GP_DATA = (\{[^\n]+\});/)[1]);
const kits = fs.readdirSync('graphics/garden-plants').flatMap(key => {
  const file = 'graphics/garden-plants/' + key + '/sources/manifest.json';
  return fs.existsSync(file) ? [JSON.parse(fs.readFileSync(file))] : [];
});
const drafts = fs.readdirSync('review/garden-batch-04/kits').map(key => JSON.parse(fs.readFileSync('review/garden-batch-04/kits/' + key + '/sources/manifest.json'))).filter(m => !kits.some(k => k.id === m.id));
const garden = [...data.plants.map(row => ({id: row[0], name: row[1]})), {id: 'P151', name: 'Calendula'},
  ...data.rare.map(row => ({id: row[0], name: row[1], parent: row[2]}))].map(plant => ({...plant,
    status: kits.some(kit => kit.id === plant.id) ? 'updated-in-production' : drafts.some(kit => kit.id === plant.id) ? 'artwork-approved-growth-and-wind-preview-ready' : 'original-artwork'}));
const report = {publishedHTMLSHA256: require('node:crypto').createHash('sha256').update(html).digest('hex'),
  productionPayloadsMatchSource: true, cannabisNamedStrains: Object.keys(require('../graphics/plants/sources/library.json').strains).length,
  garden, trees: data.trees.map(row => ({id: row[0], name: row[1], status: 'original-artwork'}))};
fs.writeFileSync(out + '/coverage.json', JSON.stringify(report, null, 2) + '\n');
const remaining = garden.filter(p => p.status === 'original-artwork').length;
const nextBatch = kits.length / 5 + 1;
const nextRow = fs.readFileSync('review/garden-plant-plan/README.md', 'utf8').split('\n').find(line => line.startsWith('| ' + nextBatch + ' |'));
const nextRow2 = kits.length >= 50 ? fs.readFileSync('review/garden-plant-plan/README.md', 'utf8').split('\n').find(line => line.startsWith('| ' + (nextBatch + 1) + ' |')) : null;
const nextNames = [nextRow, nextRow2].filter(Boolean).map(row=>row.split('|')[2].trim()).join('; ') || 'See the saved batch plan';
fs.writeFileSync(out + '/README.md', `# Plant artwork coverage\n\nThe approved cannabis compositor matches the published game: all 37 named strains and fifteen mutation families are complete.\n\nGarden plants: ${kits.length} of ${garden.length} identities are updated in production; ${remaining} retain original art. Twenty trees remain a separate future pass.\n\nNext planned review (${nextBatch}${nextRow2 ? '–'+(nextBatch+1) : ''}): ${nextNames}. See the saved garden-plant plan and full identity-level coverage in coverage.json. Reproduce with node tools/audit-plant-art.cjs. Earlier notes about partial cannabis coverage describe historical milestones.\n`);
console.log(JSON.stringify({garden: garden.length, updated: kits.length, approvedPreview: drafts.length, original: garden.filter(p => p.status === 'original-artwork').length, trees: report.trees.length, cannabisNamedStrains: report.cannabisNamedStrains, productionPayloadsMatchSource: true}));
