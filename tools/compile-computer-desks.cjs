const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
module.exports = function compileComputerDesks() {
  const root = path.resolve(__dirname, '../graphics/computer-desks');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'sources/manifest.json')));
  const bytes = fs.readFileSync(path.join(root, data.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), data.sha256, 'Computer desk atlas changed');
  assert.equal(data.desks.length, 4);
  for (const {rect: [x,y,w,h]} of data.desks) assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x+w <= data.size[0] && y+h <= data.size[1]);
  data.image = 'data:image/png;base64,' + bytes.toString('base64');
  const code = fs.readFileSync(path.join(root, 'sources/renderer.js'), 'utf8').replace('__BAGSEED_COMPUTER_DESKS_DATA__', () => JSON.stringify(data));
  new (require('node:vm').Script)(code);
  return `<script id="bagseed-computer-desks-production-code">\n${code}\n</script>\n`;
};
