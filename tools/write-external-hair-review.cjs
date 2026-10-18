// Publish the completed verification log, without treating walk candidates as approved.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const out = path.resolve('review/hair-external-assets');
fs.mkdirSync(out, { recursive: true });
const read = file => fs.readFileSync(file, 'utf8');
const full = read('.cache/pre-push-npm-test.txt');
const count = label => {
  const match = full.match(new RegExp('ℹ ' + label + '\\s+(\\d+)'));
  assert.ok(match, 'Full test run has not finished: missing ' + label);
  return Number(match[1]);
};
const tests = count('tests'), passed = count('pass'), failed = count('fail');
assert.equal(failed, 0); assert.equal(passed, tests);
const donor = read('.cache/pre-push-provenance.txt');
assert.match(donor, /pass\s+2\b/); assert.match(donor, /fail\s+0\b/);
for (const [from, to] of [
  ['.cache/external-hair-tests.txt', 'targeted-tests.txt'],
  ['.cache/hair-external-parity.txt', 'parity-tests.txt'],
  ['.cache/pre-push-provenance.txt', 'walk-donor-gate.txt'],
  ['.cache/pre-push-npm-test.txt', 'full-tests.txt'],
]) fs.writeFileSync(path.join(out, to), read(from).split(/\r?\n/).map(line => line.trimEnd()).join('\n'));
const build = JSON.parse(read('graphics/production/build.json'));
const walk = JSON.parse(read('review/custom-walk-rerender-v6/individual-v6c/acceptance.json'));
const report = {
  mergedMain: 'bd35adb', characterRevision: build.characterRevision, publishedImages: 1841,
  publishedBytes: { html: fs.statSync('public/index.html').size, characterData: fs.statSync('public/character-data.js').size },
  hair: { styles: 61, identicalPixelViews: 488, visualOverviewPagesReviewed: 8 },
  launchModes: JSON.parse(read(path.join(out, 'origin-check.json'))),
  fullTestRun: { command: 'npm test -- --test-concurrency=4', tests, passed, failed },
  strictWalkGate: {
    individualCandidates: walk.generated, expected: walk.expected, numericFailures: walk.failedFrames, installed: false,
    originalGuideCycles: walk.poseGuideCycles,
    donorRepairTest: 'Passed. Rejected local donor experiment withdrawn; committed atlas and matching manifest restored. Original source-art redraw remains pending.',
    generationWorkflow: 'Individual generation authorized. Pose-guide sequence correction remains unresolved.',
  },
};
fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<meta charset="utf-8"><title>Character publication verification</title>
<style>body{font:17px system-ui;max-width:960px;margin:40px auto;padding:20px;background:#f2f0e6;color:#25352e}a{color:#285f47}li{margin:12px 0}</style>
<h1>Character publication verification</h1>
<p>${tests} tests passed after merging the latest plant-art update. The graphics build and all 1,841 external image hashes were verified.</p>
<p>All 61 hairstyles were reviewed on complete figures; 488 RGBA hashes match between the served game and direct-file standalone.</p>
<p>Use the served game for the small external-image build. For direct-file play, build the standalone copy; direct file access to public/index.html taints pixel-reading canvases.</p>
<ul>
<li><a href="http://127.0.0.1:5173">Local served game</a></li>
<li><a href="../../dist/standalone/index.html">Local standalone copy (regenerate with npm run build:standalone)</a></li>
<li><a href="../custom-alignment/hair-overview/index.html">All 61 styles: eight full-figure overview pages</a></li>
<li><a href="../custom-alignment/comparisons/index.html">Full-figure outfit comparisons</a></li>
<li><a href="full-tests.txt">Complete merged test log</a></li>
<li><a href="walk-donor-gate.txt">No-donor and rear-art provenance checks</a></li>
<li><a href="origin-check.json">Canvas-origin failure and working launch modes</a></li>
</ul>
<h2>Walk redraw remains incomplete</h2>
<p>${walk.generated} individual cardigan candidates pass numeric art gates but are not installed. The original guide cycles repeat one leading foot in three of four frames. Pose sequence correction remains unresolved.</p>
<ul>
<li><a href="../custom-walk-rerender-v6/original-guides-and-cardigan.png">Original guides beside individual candidates</a></li>
<li><a href="../custom-walk-rerender-v6/individual-v6c/index.html">Unapproved individual candidates and measurements</a></li>
<li><a href="../../docs/graphics/character-publication-status.md">Scope, remaining source-art issues and reproduction commands</a></li>
</ul>
<p>The rejected overalls donor experiment is excluded. The original painting still needs a genuine redraw. Passing technical tests does not approve that artwork.</p>
`);
console.log(JSON.stringify(report, null, 2));
