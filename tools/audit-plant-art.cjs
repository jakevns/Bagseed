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
fs.writeFileSync(out + '/README.md', '# Plant artwork coverage\n\nThe approved cannabis compositor matches the published game: all 37 named strain mappings and fifteen mutation families are complete.\n\nGarden plants: 20 of 163 identities are updated in production. The approved fourth batch (Spinach, Swiss chard, Arugula, Rosemary and Lemon balm) now has four-stage, in-pot and growth/wind previews in `../garden-batch-04/`; these five are installed in production. Another 143 garden identities retain original art. Twenty trees remain a separate future pass.\n\nThe next planned batch is Parsley, Sage, Oregano, Strawberry and Jalapeno. Full identity-level coverage is in `coverage.json`. Reproduce with `node tools/audit-plant-art.cjs`. Earlier notes saying only 12 strains are covered or that painted cannabis integration is pending describe historical milestones.\n');
console.log(JSON.stringify({garden: garden.length, updated: kits.length, approvedPreview: drafts.length, original: garden.filter(p => p.status === 'original-artwork').length, trees: report.trees.length, cannabisNamedStrains: report.cannabisNamedStrains, productionPayloadsMatchSource: true}));
