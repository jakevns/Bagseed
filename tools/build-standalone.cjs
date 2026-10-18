// Builds a copy of the game that plays when opened straight from disk
// (file://): images moved to assets/embedded are inlined again, and the rest
// of public/ is copied beside them. The output is large and never committed.
//   npm run build:standalone [-- <output dir>]   (default: dist/standalone)
const fs = require('node:fs'), path = require('node:path');
const { inline, DIR } = require('./external-assets.cjs');
const root = path.resolve(__dirname, '..');

function buildStandalone(out = path.join(root, 'dist/standalone')) {
  const pub = path.join(root, 'public');
  fs.rmSync(out, { recursive: true, force: true });
  // Everything else in public/ is copied as-is beside the inlined pages.
  fs.cpSync(pub, out, { recursive: true, filter: source => path.relative(pub, source) !== path.normalize(DIR) });
  for (const file of ['index.html', 'character-data.js']) {
    const source = path.join(pub, file);
    if (fs.existsSync(source)) fs.writeFileSync(path.join(out, file), inline(fs.readFileSync(source, 'utf8')));
  }
  return path.join(out, 'index.html');
}

module.exports = buildStandalone;
if (require.main === module) console.log('Standalone game written to ' + path.relative(root, buildStandalone(process.argv[2] && path.resolve(process.argv[2]))));
