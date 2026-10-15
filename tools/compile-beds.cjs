const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
module.exports = function compileBeds() {
  const ids = new Set();
  return ['batch-01', 'batch-02', 'batch-03'].map(batch => {
    const root = path.resolve(__dirname, '../graphics/beds', batch);
    const data = JSON.parse(fs.readFileSync(path.join(root, 'sources/manifest.json')));
    let count = 0;
    for (const [id, frame] of Object.entries(data.frames)) {
      assert.ok(!ids.has(id), 'Duplicate bed frame across approved batches'); ids.add(id);
      const bytes = fs.readFileSync(path.join(root, frame.path));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), frame.sha256, 'Bed atlas hash changed');
      for (const [x, y, w, h] of Object.values(frame.tiles)) {
        assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= frame.size[0] && y + h <= frame.size[1], 'Invalid bed registration');
        count++;
      }
      frame.image = 'data:image/png;base64,' + bytes.toString('base64');
    }
    assert.equal(count, 20, `${batch} must contain exactly 20 combinations`);
    const code = fs.readFileSync(path.resolve(__dirname, '../graphics/beds/batch-01/sources/renderer.js'), 'utf8')
      .replace('__BAGSEED_BED_DATA__', () => JSON.stringify(data));
    new (require('node:vm').Script)(code);
    return `<script id="bagseed-beds-${batch}">\n${code}\n</script>\n`;
  }).join('');
};
