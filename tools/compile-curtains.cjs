const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
module.exports = function compileCurtains() {
  const root = path.resolve(__dirname, '../graphics/curtains/batch-01');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'sources/manifest.json')));
  assert.deepEqual(Object.keys(data.styles), ['basic','blackout'], 'Only two curtain sets in batch 01');
  const art = fs.readFileSync(path.join(root, data.path));
  assert.equal(createHash('sha256').update(art).digest('hex'), data.sha256, 'Curtain source changed');
  for (const { rect: [x,y,w,h] } of Object.values(data.styles)) {
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x+w <= data.size[0] && y+h <= data.size[1]);
  }
  data.image = 'data:image/png;base64,' + art.toString('base64');
  const code = fs.readFileSync(path.join(root, 'sources/renderer.js'),'utf8')
    .replace('__BAGSEED_CURTAIN_DATA__', () => JSON.stringify(data));
  new (require('node:vm').Script)(code);
  return `<script id="bagseed-curtains-batch-01-production-code">\n${code}\n</script>\n`;
};
