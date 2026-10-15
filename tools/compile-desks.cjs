const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
module.exports = function compileDesks() {
  const root = path.resolve(__dirname, '../graphics/desks');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'sources/manifest.json')));
  const bytes = fs.readFileSync(path.join(root, data.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), data.sha256, 'Desk atlas hash changed');
  assert.equal(data.tiers.length, 3, 'Expected all three approved workstation tiers');
  for (const { rect: [x, y, w, h], anchorY } of data.tiers) {
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= data.size[0] && y + h <= data.size[1]);
    assert.ok(anchorY >= y && anchorY <= y + h);
  }
  data.image = 'data:image/png;base64,' + bytes.toString('base64');
  const code = fs.readFileSync(path.join(root, 'sources/renderer.js'), 'utf8')
    .replace('__BAGSEED_DESK_DATA__', () => JSON.stringify(data));
  new (require('node:vm').Script)(code);
  return `<script id="bagseed-desks-production-code">\n${code}\n</script>\n`;
};
