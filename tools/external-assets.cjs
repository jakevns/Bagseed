// Published images live beside the page instead of inside it. Builders still
// assemble scripts with inline data: URIs; just before anything is written to
// public/, each embedded image moves to public/assets/embedded/<hash>.<ext>
// and the URI becomes that relative path. Names are content hashes, so the
// result is deterministic, browsers can cache each image for good, and an
// unchanged image never produces a new file in git.
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const publicRoot = path.resolve(__dirname, '../public');
const DIR = 'assets/embedded';
const TYPES = { png: 'png', webp: 'webp', jpeg: 'jpg', gif: 'gif' };
const URI = /data:image\/(png|webp|jpeg|gif);base64,([A-Za-z0-9+/]+={0,2})/g;
const REF = /assets\/embedded\/([0-9a-f]{16})\.(png|webp|jpg|gif)/g;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function externalize(text) {
  const files = new Map();
  const out = text.replace(URI, (all, type, b64) => {
    const bytes = Buffer.from(b64, 'base64');
    // Only canonical base64 round-trips; anything else stays inline untouched.
    if (bytes.toString('base64') !== b64) return all;
    const name = `${DIR}/${sha(bytes).slice(0, 16)}.${TYPES[type]}`;
    files.set(name, bytes);
    return name;
  });
  return { text: out, files };
}

function write(files) {
  for (const [name, bytes] of files) {
    const file = path.join(publicRoot, name);
    if (fs.existsSync(file) && sha(fs.readFileSync(file)) === sha(bytes)) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file + '.tmp', bytes); fs.renameSync(file + '.tmp', file);
  }
}

// Externalize, write the images, and return the text to publish.
function publish(text) { const result = externalize(text); write(result.files); return result.text; }

const references = texts => new Set(texts.flatMap(text => [...text.matchAll(REF)].map(m => m[0])));

// Remove images no published file refers to any more.
function prune(texts) {
  const used = references(texts), dir = path.join(publicRoot, DIR);
  if (!fs.existsSync(dir)) return 0;
  let removed = 0;
  for (const file of fs.readdirSync(dir)) if (!used.has(`${DIR}/${file}`)) { fs.unlinkSync(path.join(dir, file)); removed++; }
  return removed;
}

// Every referenced image exists and still matches the hash in its name.
function verify(texts) {
  const used = references(texts);
  for (const name of used) {
    const file = path.join(publicRoot, name);
    if (!fs.existsSync(file)) throw new Error(`Missing published image ${name}. Rebuild before publishing.`);
    if (!sha(fs.readFileSync(file)).startsWith(path.basename(name).split('.')[0])) throw new Error(`Published image ${name} does not match its name. Rebuild before publishing.`);
  }
  return used.size;
}

// The reverse: embed every published image again. Browsers refuse to read
// pixels from images loaded off file:// pages, so a copy of the game opened
// straight from disk needs its images inline. See tools/build-standalone.cjs.
const MIME = { png: 'png', webp: 'webp', jpg: 'jpeg', gif: 'gif' };
const inline = text => text.replace(REF, (name, hash, ext) => `data:image/${MIME[ext]};base64,${fs.readFileSync(path.join(publicRoot, name)).toString('base64')}`);

module.exports = { DIR, externalize, write, publish, prune, verify, references, inline };
