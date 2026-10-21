const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

test('beneficials treat seedling thrips and companion plants count in both pot types', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium' });
    const page = await require('./helpers/art-page.cjs')(browser, { viewport: { width: 1100, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`, { timeout: 120000 });
    await page.evaluate(() => BagseedStartup.ready);
    await page.locator('[data-act=newGame]').click();
    await page.locator('#crName').fill('Tiny Allies');
    await page.locator('[data-act=startGame]').click();
    await page.waitForFunction(() => screen === 'game' && !!state.player);
    const ids = await page.evaluate(() => {
      settings.speed = 0; settings.reduced = true; state.tut.on = false;
      state.scene = 'bedroom'; state.minute = 720; state.player.energy = 100;
      runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); ACT.tipOff(); closePanel();
      for (const loc of ['closet', 'tent2']) {
        const L = state.locations[loc]; L.owned = true;
        Object.assign(L.equip, { pot: 2, light: 2, fan: 1 });
      }
      const p = createPlant('porchlight', 'tent2', 0), other = createPlant('velvet', 'closet', 0);
      p.stage = S.seedling; p.pest = { type: 'thrips', lvl: .9, known: false };
      other.stage = S.seedling; other.pest = { type: 'thrips', lvl: .8, known: true };
      state.inv.mites = 2;
      const r = locRect('tent2'); state.player.x = r[0] + r[2] / 2; state.player.y = r[1] + r[3] + 6;
      Panels.plant(p.id, 'care');
      return { p: p.id, other: other.id };
    });
    assert.equal(await page.locator('[data-act=care][data-arg=mites]').count(), 0);
    await page.locator('[data-act=inspect]').click();
    assert.match(await page.locator('#panel').innerText(), /Thrips.*pest level 90%/);
    assert.match(await page.locator('#panel').innerText(), /Companion plants in tents reduce stress/);
    await page.locator('[data-act=care][data-arg=mites]').click();
    const treated = await page.evaluate(ids => ({
      pest: state.plants[ids.p].pest, other: state.plants[ids.other].pest.lvl,
      sachets: state.inv.mites, inspect: runtime.inspect, energy: state.player.energy
    }), ids);
    assert.ok(Math.abs(treated.pest.lvl - .2) < 1e-9);
    assert.equal(treated.pest.known, true);
    assert.equal(treated.sachets, 1);
    assert.equal(treated.other, .8);
    assert.equal(treated.inspect, null, 'old infestation notes are discarded after treatment');
    await page.locator('[data-act=plantTab][data-arg=overview]').click();
    assert.match(await page.locator('#panel').innerText(), /Pest level.*20%/s);
    await page.locator('[data-act=plantTab][data-arg=care]').click();
    await page.locator('[data-act=care][data-arg=mites]').click();
    assert.deepEqual(await page.evaluate(id => ({ pest: state.plants[id].pest, sachets: state.inv.mites }), ids.p), {
      pest: { type: null, lvl: 0, known: false }, sachets: 0
    });
    const guards = await page.evaluate(id => {
      const p = state.plants[id], results = [];
      const attempt = (pest, inventory, stage = S.seedling, energy = 100) => {
        p.pest = pest; p.stage = stage; state.inv.mites = inventory; state.player.energy = energy;
        const before = JSON.stringify({ pest: p.pest, inventory: state.inv.mites, energy: state.player.energy, minute: state.minute });
        doCare('mites');
        results.push(before === JSON.stringify({ pest: p.pest, inventory: state.inv.mites, energy: state.player.energy, minute: state.minute }));
      };
      attempt({ type: null, lvl: 0, known: false }, 2);
      attempt({ type: 'gnats', lvl: .8, known: true }, 2);
      attempt({ type: 'thrips', lvl: .8, known: false }, 2);
      attempt({ type: 'thrips', lvl: .8, known: true }, 0);
      attempt({ type: 'thrips', lvl: .8, known: true }, -1);
      attempt({ type: 'thrips', lvl: .8, known: true }, 2, S.drying);
      attempt({ type: 'thrips', lvl: .8, known: true }, 2, S.seedling, 0);
      attempt({ type: 'thrips', lvl: .8, known: true }, 2, S.seed);
      p.stage = S.seedling; p.pest = { type: 'mites', lvl: .08, known: true };
      state.player.energy = 100; state.inv.mites = 2; doCare('mites');
      const spiderMitesCleared = !p.pest.type && state.inv.mites === 1;
      p.pest = { type: 'thrips', lvl: .08, known: true }; state.scene = 'hallway';
      const before = JSON.stringify([p.pest, state.inv.mites, state.player.energy]); doCare('mites');
      const remoteDenied = before === JSON.stringify([p.pest, state.inv.mites, state.player.energy]); state.scene = 'bedroom';
      p.pest = { type: null, lvl: 0, known: false }; state.inv.traps = 2;
      doCare('traps'); const staleTrapDenied = state.inv.traps === 2;
      p.pest = { type: 'thrips', lvl: .6, known: true }; doCare('traps');
      const trapsWork = state.inv.traps === 1 && Math.abs(p.pest.lvl - .25) < 1e-9;
      p.pest = { type: null, lvl: 0, known: false };
      return { results, spiderMitesCleared, remoteDenied, staleTrapDenied, trapsWork };
    }, ids.p);
    assert.deepEqual(guards, { results: Array(8).fill(true), spiderMitesCleared: true, remoteDenied: true, staleTrapDenied: true, trapsWork: true });

    const companion = await page.evaluate(ids => {
      const p = state.plants[ids.p], other = state.plants[ids.other];
      const full = GP.newPlant('P058', { kind: 'slot', ref: 'tent2' });
      GrowPotGarden.arr('tent2')[1] = full.gid;
      const young = Companion.indoorBonus('tent2', p);
      full.age = GP.sp(full.sp).days * .5;
      const grown = Companion.indoorBonus('tent2', p), isolated = Companion.indoorBonus('closet', other);
      p.stress = other.stress = 10; p.pest = { type: 'thrips', lvl: .5, known: true };
      Companion.daily();
      const daily = { stress: p.stress, other: other.stress, pest: p.pest.lvl };
      const small = GP.newPlant('P057', { kind: 'pot', ref: 'tent2' });
      small.age = GP.sp(small.sp).days; GP.pots().tent2[0] = small.gid;
      const capped = Companion.indoorBonus('tent2', p);
      const non = GP.newPlant('P001', { kind: 'slot', ref: 'tent2' }); non.age = GP.sp(non.sp).days;
      GP.remove(full.gid); GrowPotGarden.arr('tent2')[1] = non.gid;
      const withoutFull = Companion.indoorBonus('tent2', p);
      GP.remove(non.gid); GrowPotGarden.arr('tent2')[1] = full.gid; GP.S().list[full.gid] = full;
      // Moving a companion to another tent transfers the effect immediately.
      GP.pots().tent2[0] = null; GP.pots().closet[0] = small.gid; small.at.ref = 'closet';
      const moved = { source: Companion.indoorBonus('tent2', p), dest: Companion.indoorBonus('closet', other) };
      const beforeStress = p.stress; p.stage = S.drying; Companion.daily();
      const dryingSkipped = p.stress === beforeStress; p.stage = S.seedling;
      GP.remove(small.gid);
      const footer = GrowPotGarden.html('tent2');
      const seedNotes = Catalog115.education(GP.sp('P058'));
      const setup = []; Companion.setupItems('tent2', (...args) => setup.push(args));
      // Outdoor flowers retain the existing proximity-limited pest buffer.
      state.locations.outdoor.owned = true;
      const outdoor = createPlant('porchlight', 'outdoor', 0); outdoor.stage = S.seedling;
      const [x, y] = SLOT_POS.outdoor[0], b = { bid: 'beneficial-test', type: 'BED004', x: x - 17, y: y - 6, slots: [] };
      GP.yard().beds.push(b);
      const flower = GP.newPlant('P058', { kind: 'bed', ref: b.bid }); b.slots = [flower.gid];
      const youngOutdoor = Companion.outdoorBonus(outdoor); flower.age = GP.sp(flower.sp).days;
      const buffer = Companion.outdoorBonus(outdoor); outdoor.pest = { type: 'thrips', lvl: .5, known: true };
      Companion.daily(); const outdoorAfter = outdoor.pest.lvl;
      b.x += 1000; const distant = Companion.outdoorBonus(outdoor); GP.remove(flower.gid);
      const removed = Companion.outdoorBonus(outdoor);
      p.stress = 10; p.pest = { type: null, lvl: 0, known: false };
      SaveSys.now('beneficial regression');
      return { young, grown, isolated, daily, capped, withoutFull, moved, dryingSkipped, footer, seedNotes, setup, fullId: full.gid, youngOutdoor, buffer, outdoorAfter, distant, removed };
    }, ids);
    assert.equal(companion.young, 0);
    assert.equal(companion.grown, .03);
    assert.equal(companion.isolated, 0);
    assert.deepEqual(companion.daily, { stress: 9.4, other: 10, pest: .5 });
    assert.equal(companion.capped, .05);
    assert.equal(companion.withoutFull, .03);
    assert.deepEqual(companion.moved, { source: .03, dest: .015 });
    assert.equal(companion.dryingSkipped, true);
    assert.match(companion.footer, /Companion effect/);
    assert.match(companion.footer, /−0.6 stress\/day/);
    assert.match(companion.seedNotes, /full-size grow pot/);
    assert.match(companion.setup[0][3], /1 companion growing in small or full-size pots/);
    assert.equal(companion.youngOutdoor, 0);
    assert.ok(companion.buffer > 0 && companion.buffer <= .05);
    assert.ok(Math.abs(companion.outdoorAfter - .5 * (1 - 2 * companion.buffer)) < 1e-9);
    assert.equal(companion.distant, 0);
    assert.equal(companion.removed, 0);

    await page.reload({ timeout: 120000 }); await page.evaluate(() => BagseedStartup.ready);
    await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(ids => ({
      full: GrowPotGarden.at('tent2', 1)?.gid,
      bonus: Companion.indoorBonus('tent2', state.plants[ids.p]),
      pest: state.plants[ids.p].pest.type
    }), ids), { full: companion.fullId, bonus: .03, pest: null });
    await page.setViewportSize({ width: 440, height: 960 });
    await page.evaluate(id => {
      const p = state.plants[id]; p.pest = { type: 'thrips', lvl: .08, known: true }; state.inv.mites = 1;
      const r = locRect('tent2'); state.player.x = r[0] + r[2] / 2; state.player.y = r[1] + r[3] + 6;
      Panels.plant(id, 'overview');
    }, ids.p);
    await page.getByRole('button', { name: 'Treat pests', exact: true }).click();
    assert.equal(await page.locator('[data-act=care][data-arg=mites]').isEnabled(), true);
    const overflow = await page.locator('#panel').evaluate(el => el.scrollWidth - el.clientWidth);
    assert.ok(overflow <= 1, 'treatment instructions fit a phone screen');
    await page.locator('[data-act=care][data-arg=mites]').click();
    assert.equal(await page.evaluate(id => state.plants[id].pest.type, ids.p), null);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close(); await new Promise(resolve => server.close(resolve));
  }
});
