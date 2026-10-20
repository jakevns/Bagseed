const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// A tested batch stays tested while it is back at the lab for another panel,
// cuttings keep (and learn) their mother's sex, naming a cross renames its plants,
// and players can rename a plant themselves.
test('lab retests, clone sex and cross names', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.locator('[data-act=newGame]').click(); await page.locator('#crName').fill('Lab Fixture');
    await page.locator('[data-act=startGame]').click(); await page.waitForTimeout(2400);
    const lab = await page.evaluate(() => {
      settings.speed = 0; state.tut.on = false; runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); closePanel();
      state.money = 1000; runtime.device = 'computer';
      const b = { id: 'h_fixture', lineId: 'porchlight', name: 'Fixture', jars: 3, grade: 'A', overall: .8, scores: {}, type: 'I', aromaName: 'Citrus', organic: false, day: state.day, dry: 'Good Dry' };
      state.inv.harvest.push(b); Batches.ensure(b, null);
      Lab.submit(b.id, 'potency'); advance(60 * 24);
      Lab.submit(b.id, 'full');
      const P = state.npc.patients.rosalind; P.met = true;
      const html = Panels.careOffer('rosalind');
      return { st: Batches.status(b).k, share: html.includes('rosalind:h_fixture:share'), honest: html.includes('rosalind:h_fixture:honest') };
    });
    assert.deepEqual(lab, { st: 'potency', share: true, honest: false }, 'A potency-tested batch read as untested during its full-panel retest');

    const clone = await page.evaluate(() => {
      state.player.energy = 100; Access.atPlant = () => true;
      const loc = Object.keys(state.locations).find(l => state.locations[l].slots.filter(x => !x).length >= 2), L = state.locations[loc];
      const slot = L.slots.findIndex(x => !x), p = createPlant('porchlight', loc, slot, { sex: 'F', sexKnown: false }, 'reg');
      p.stage = S.veg; p.nodes = 6; p.height = 20; runtime.plantSel = p.id; doCare('cut');
      const s = state.inv.seeds.find(x => x.kind === 'cutting');
      const before = seedInfo(s.lineId, s).includes('???');
      revealSex(p); runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0);
      const info = seedInfo(s.lineId, s).replace(/<[^>]+>/g, ' ');
      const slot2 = L.slots.findIndex(x => !x); ACT.sow(`${loc}:${slot2}:${s.id}`);
      const c = state.plants[L.slots[slot2]];
      return { before, female: info.includes('♀ Female'), clone: c && [c.sex, c.sexKnown] };
    });
    assert.deepEqual(clone, { before: true, female: true, clone: ['F', true] }, 'The cutting lost its mother\'s sex');
    const cross = await page.evaluate(() => {
      const g = Breeding.makeCross('porchlight', 'porchlight', {}); state.genetics[g.id] = g;
      const loc = Object.keys(state.locations).find(l => state.locations[l].slots.some(x => !x)), L = state.locations[loc];
      const p = createPlant(g.id, loc, L.slots.findIndex(x => !x), null, 'reg'), auto = p.name;
      ACT.nameCross(g.id); document.getElementById('crossName').value = 'Sunny Day'; ACT.saveCrossName();
      return { auto, name: p.name, line: GEN(g.id).name };
    });
    assert.equal(cross.line, 'Sunny Day');
    assert.match(cross.name, /^Sunny Day #\d+$/, `Plant kept its old cross name (${cross.auto})`);
    const renamed = await page.evaluate(() => {
      const p = Object.values(state.plants).find(x => GEN(x.lineId).name === 'Sunny Day');
      Panels.plant(p.id); const button = !!document.querySelector(`[data-act=renamePlant][data-arg="${p.id}"]`);
      ACT.renamePlant(p.id); document.getElementById('plantName').value = 'Big Sue'; ACT.savePlantName();
      const g = GEN(p.lineId); ACT.nameCross(g.id); document.getElementById('crossName').value = 'Rainy Day'; ACT.saveCrossName();
      return { button, name: p.name };
    });
    assert.deepEqual(renamed, { button: true, name: 'Big Sue' }, 'A plant\'s chosen name was lost or the rename button is missing');
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
