const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

let server, browser, baseURL;
const artifacts = path.resolve(__dirname, '../artifacts');
before(async () => {
  mkdirSync(artifacts, { recursive: true });
  const { createStaticServer } = await import('../tools/server.mjs');
  server = createStaticServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.BAGSEED_BROWSER_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ headless: true, executablePath });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

test('garden plants can be grown in the grow-tent pots instead of cannabis', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(baseURL);
    await page.locator('[data-act="newGame"]').click();
    await page.locator('#crName').fill('Plant Person');
    await page.locator('[data-act="startGame"]').click();
    await page.waitForFunction(() => screen === 'game' && state?.player);
    await page.waitForTimeout(2200);
    await page.evaluate(() => {
      settings.speed = 0; state.tut.on = false; runtime.dialogQ = [];
      if (runtime.curDialog) ACT.dlg(0);
      $('#tip').hidden = true; closePanel(); document.activeElement?.blur();
      const L = state.locations.closet; L.equip.pot = 2; L.equip.light = 1;
      state.player.energy = 100;
      const I = GP.inv(); I.seeds.P051 = 2; I.seeds.P095 = 1; I.seeds.P028 = 1;
      const r = locRect('closet'); state.player.x = r[0] + r[2] / 2; state.player.y = r[1] + r[3] + 4;
    });

    // An empty pot offers garden plants next to cannabis seeds; big and climbing plants are refused.
    const offer = await page.evaluate(() => {
      Scene.interact('slot', 'closet', '0', 'slot:closet:0');
      const root = $('#overlay');
      return {
        basil: !!root.querySelector('[data-act="gSowPot"][data-arg="closet:0:P051"]:not([disabled])'),
        sunflower: !!root.querySelector('[data-act="gSowPot"][data-arg="closet:0:P095"][disabled]'),
        peas: !!root.querySelector('[data-act="gSowPot"][data-arg="closet:0:P028"][disabled]'),
        text: root.textContent
      };
    });
    assert.ok(offer.basil, 'basil can be planted in the starter-tent pot');
    assert.ok(offer.sunflower, 'large plants stay out of a single grow pot');
    assert.ok(offer.peas, 'climbers need a trellis bed');
    assert.match(offer.text, /Garden plants/);

    await page.locator('[data-act="gSowPot"][data-arg="closet:0:P051"]').click();
    const sown = await page.evaluate(() => {
      const gid = state.v115.mpots.closet[0], p = GP.plant(gid);
      RoomArt.hits.length = 0; RoomArt.drawSlots(View.wctx, 'closet', 0);
      return { gid, kind: p?.at.kind, sp: p?.sp, seedsLeft: GP.inv().seeds.P051, cannabis: state.locations.closet.slots[0], hit: RoomArt.hits.some(h => h.id === 'gslot:closet:0'), empty: RoomArt.hits.some(h => h.id === 'slot:closet:0') };
    });
    assert.ok(sown.gid);
    assert.equal(sown.kind, 'slot');
    assert.equal(sown.sp, 'P051');
    assert.equal(sown.seedsLeft, 1);
    assert.equal(sown.cannabis, null, 'the pot holds no cannabis plant');
    assert.ok(sown.hit, 'the basil is drawn and clickable in the pot');
    assert.ok(!sown.empty, 'the pot is no longer shown as empty');

    // Cannabis can't be sown on top of it, and plant moves skip that pot.
    const blocked = await page.evaluate(() => {
      const s = state.inv.seeds[0]; if (s) ACT.sow(`closet:0:${s.id}`);
      return { hadSeed: !!s, slot: state.locations.closet.slots[0] };
    });
    assert.equal(blocked.slot, null);

    // It grows under the light, needs watering, and harvests into the garden inventory.
    const grown = await page.evaluate(() => {
      const gid = state.v115.mpots.closet[0], p = GP.plant(gid);
      for (let d = 0; d < 12; d++) { GP.daily(); p.water = 100; }
      const stage = GP.stageOf(p), kindAfter = p.at.kind;
      Scene.interact('gslot', 'closet', '0', 'gslot:closet:0');
      const panel = $('#overlay').textContent;
      ACT.gHarvest(`slot:closet:${gid}`);
      const regrowing = state.v115.mpots.closet[0] === gid && GP.stageOf(p) === 2;
      GP.remove(gid);
      return { stage, kindAfter, panel, harvested: GP.inv().harvest.P051?.n || 0, regrowing, freed: state.v115.mpots.closet[0], left: !!GP.plant(gid) };
    });
    assert.equal(grown.stage, 3);
    assert.equal(grown.kindAfter, 'slot');
    assert.match(grown.panel, /Basil/);
    assert.ok(grown.harvested > 0, 'basil harvest lands in the garden inventory');
    assert.ok(grown.regrowing, 'basil regrows in its pot after a harvest');
    assert.equal(grown.freed, null, 'the pot is free again after pulling the plant');
    assert.equal(grown.left, false);

    await page.screenshot({ path: path.join(artifacts, 'grow-pot-garden.png') });
    assert.deepEqual(errors, [], 'The game logged a browser error');
  } finally { await context.close(); }
});
