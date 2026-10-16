const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
module.exports = function compileMainMenu(source) {
  const root = path.resolve(__dirname, '../graphics/main-menu');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'sources/manifest.json')));
  const art = fs.readFileSync(path.join(root, manifest.path));
  assert.equal(createHash('sha256').update(art).digest('hex'), manifest.sha256, 'Menu artwork changed');
  const [x,y,w,h] = manifest.phoneCrop;
  assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x+w <= manifest.size[0] && y+h <= manifest.size[1]);
  assert.ok(source.includes('__BAGSEED_MENU_IMAGE__'), 'Missing menu artwork hook');
  source = source.replace('__BAGSEED_MENU_IMAGE__', 'data:image/png;base64,' + art.toString('base64'));
  const details = fs.readFileSync(path.join(root, manifest.details.path));
  assert.equal(createHash('sha256').update(details).digest('hex'), manifest.details.sha256, 'Menu details changed');
  for (const [name, [sx,sy,sw,sh]] of Object.entries(manifest.details.tiles)) {
    assert.ok(sx >= 0 && sy >= 0 && sw > 0 && sh > 0 && sx+sw <= manifest.details.size[0] && sy+sh <= manifest.details.size[1], 'Invalid menu detail crop: ' + name);
  }
  assert.ok(source.includes('__BAGSEED_MENU_DETAILS__'), 'Missing mobile detail hook');
  source = source.replace('__BAGSEED_MENU_DETAILS__', 'data:image/png;base64,' + details.toString('base64'));
  const css = fs.readFileSync(path.join(root, 'sources/style.css'), 'utf8');
  const code = fs.readFileSync(path.join(root, 'sources/renderer.js'), 'utf8').replace('__BAGSEED_MENU_MANIFEST__', () => JSON.stringify(manifest));
  new (require('node:vm').Script)(code);
  return require('./compile-loading-screen.cjs')(source.replace('</body></html>', `<style id="bagseed-main-menu-style">\n${css}\n</style>\n<script id="bagseed-main-menu-production-code">\n${code}\n</script>\n</body></html>`));
};
