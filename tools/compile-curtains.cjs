const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
module.exports = function compileCurtains(batch = '01') {
  const styles = { '01': ['basic','blackout'], '02': ['floral','sheer'] }[batch];
  assert.ok(styles, 'Unknown curtain batch');
  const root = path.resolve(__dirname, '../graphics/curtains/batch-' + batch);
  const data = JSON.parse(fs.readFileSync(path.join(root, 'sources/manifest.json')));
  assert.deepEqual(Object.keys(data.styles), styles, 'Only two curtain sets in batch ' + batch);
  const art = fs.readFileSync(path.join(root, data.path));
  assert.equal(createHash('sha256').update(art).digest('hex'), data.sha256, 'Curtain source changed');
  for (const { rect: [x,y,w,h] } of Object.values(data.styles)) {
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x+w <= data.size[0] && y+h <= data.size[1]);
  }
  if (batch === '02') {
    assert.deepEqual(data.frame,[72,61], 'Curtain display frame changed');
    for (const { motion, clothOpacity } of Object.values(data.styles)) {
      assert.ok(Number.isFinite(motion) && motion > 0 && motion <= 2);
      assert.ok(Number.isFinite(clothOpacity) && clothOpacity > 0 && clothOpacity <= 1);
    }
  }
  data.image = 'data:image/png;base64,' + art.toString('base64');
  const code = fs.readFileSync(path.join(root, 'sources/renderer.js'),'utf8')
    .replace('__BAGSEED_CURTAIN_DATA__', () => JSON.stringify(data));
  new (require('node:vm').Script)(code);
  return `<script id="bagseed-curtains-batch-${batch}-production-code">\n${code}\n</script>\n`;
};
