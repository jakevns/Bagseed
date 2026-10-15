const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
module.exports = function compileBeds() {
  const root = path.resolve(__dirname, '../graphics/beds/batch-01');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'sources/manifest.json')));
  let count = 0;
  for (const frame of Object.values(data.frames)) {
    const bytes = fs.readFileSync(path.join(root, frame.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), frame.sha256, 'Bed atlas hash changed');
    for (const [x, y, w, h] of Object.values(frame.tiles)) {
      assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= frame.size[0] && y + h <= frame.size[1], 'Invalid bed registration');
      count++;
    }
    frame.image = 'data:image/png;base64,' + bytes.toString('base64');
  }
  assert.equal(count, 20, 'Batch 01 must contain exactly 20 combinations');
  const code = fs.readFileSync(path.join(root, 'sources/renderer.js'), 'utf8')
    .replace('__BAGSEED_BED_DATA__', () => JSON.stringify(data));
  new (require('node:vm').Script)(code);
  return `<script id="bagseed-beds-batch-01">\n${code}\n</script>\n`;
};
