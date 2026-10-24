const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

test('all pollen vials can be selected, identified, discarded and saved on mobile', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium' });
    const page = await require('./helpers/art-page.cjs')(browser, { viewport: { width: 390, height: 844 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`, { timeout: 120000 });
    await page.evaluate(() => BagseedStartup.ready);
    await page.locator('[data-act=newGame]').click();
    await page.locator('#crName').fill('Pollen Test');
    await page.locator('[data-act=startGame]').click();
    await page.waitForFunction(() => screen === 'game' && !!state.player);
    const fixture = await page.evaluate(() => {
      settings.speed = 0; settings.reduced = true; state.tut.on = false;
      runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); ACT.tipOff(); closePanel();
      state.scene = 'bedroom'; state.minute = 720; state.player.energy = 100;
      const rect = locRect('closet'); state.player.x = rect[0] + rect[2] / 2; state.player.y = rect[1] + rect[3] + 6;
      const p = createPlant('porchlight', 'closet', 0);
      Object.assign(p, { stage: S.earlyflower, sex: 'F', sexKnown: true });
      const donor = Individual115.snapshot(p); donor.name = 'Exact donor';
      state.inv.pollen = Array.from({ length: 9 }, (_, i) => ({ id: 'vial-' + i, name: 'Porchlight #1', lineId: 'porchlight', day: i + 1, uses115: i === 2 ? 0 : 12, donor115: donor }));
      state.inv.pollen.push({ name: 'Historic donor', lineId: 'velvet' });
      const legacy = PollenUI.all().at(-1);
      const care = Panels.careActions(p, GEN(p.lineId), state.locations.closet);
      PollenUI.open(p.id);
      return { pid: p.id, legacy: legacy.id, care };
    });
    assert.match(fixture.care, /pollenChoose/);
    assert.doesNotMatch(fixture.care, /Pollinate with Porchlight/);
    const options = await page.locator('#pollenVial option').allTextContents();
    assert.equal(options.length, 9);
    assert.equal(new Set(options).size, 9);
    assert.ok(options.some(s => s.includes('Day 9') && s.includes('12 applications')));
    assert.ok(options.some(s => s.includes('Historic donor') && s.includes('1 applications')));
    await page.selectOption('#pollenVial', 'vial-8');
    await page.locator('[data-act=pollenApply]').click();
    assert.equal(await page.evaluate(() => runtime.plantTab), 'care');
    const used = await page.evaluate(pid => ({ donor: state.plants[pid].seeded.donor115.name, counts: state.inv.pollen.map(v => v.uses115) }), fixture.pid);
    assert.equal(used.donor, 'Exact donor'); assert.equal(used.counts[8], 11); assert.equal(used.counts[0], 12);
    await page.evaluate(() => Panels.inventory('pollen'));
    assert.equal(await page.locator('[data-act=pollenTrash]').count(), 10);
    await page.locator('[data-act=pollenTrash][data-arg=vial-0]').click();
    assert.equal(await page.evaluate(() => state.inv.pollen.length), 10);
    await page.locator('[data-act=invOpen][data-arg=pollen]').click();
    assert.equal(await page.locator('[data-act=pollenTrash]').count(), 10);
    await page.locator('[data-act=pollenTrash][data-arg=vial-2]').click();
    await page.locator('[data-act=pollenDiscard]').click();
    assert.equal(await page.locator('[data-act=pollenTrash]').count(), 9);
    const safety = await page.evaluate(pid => {
      const p = state.plants[pid]; p.seeded = null;
      // Deleting a preceding vial must not redirect a stale selection.
      const before = state.inv.pollen.map(v => v.uses115);
      Breeding.pollinate(pid, 'vial-2');
      const stale = !p.seeded && JSON.stringify(before) === JSON.stringify(state.inv.pollen.map(v => v.uses115));
      p.stage = S.lateflower; Breeding.pollinate(pid, 'vial-8'); const late = !p.seeded;
      p.stage = S.earlyflower; p.sex = 'M'; Breeding.pollinate(pid, 'vial-8'); const male = !p.seeded;
      p.sex = 'F'; state.player.energy = 0; Breeding.pollinate(pid, 'vial-8'); const tired = !p.seeded;
      state.player.energy = 100;
      const saved = JSON.stringify(state.inv.pollen); SaveSys.now('pollen test');
      return { stale, late, male, tired, saved, fits: document.querySelector('#panelBody').scrollWidth <= document.querySelector('#panelBody').clientWidth + 1 };
    }, fixture.pid);
    assert.ok(safety.stale && safety.late && safety.male && safety.tired && safety.fits);
    await page.reload(); await page.evaluate(() => BagseedStartup.ready);
    await page.locator('[data-act=continueGame]').click();
    assert.equal(await page.evaluate(() => JSON.stringify(state.inv.pollen)), safety.saved);
    await page.evaluate(() => { Panels.inventory('pollen'); state.inv.pollen = []; renderPanel(); });
    assert.match(await page.locator('#panelBody').innerText(), /No pollen vials/);
    assert.deepEqual(errors, []);
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
