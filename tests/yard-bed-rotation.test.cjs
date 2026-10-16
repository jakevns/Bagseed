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

test('backyard planters rotate while placing and moving, and keep their plants', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(baseURL);
    await page.locator('[data-act="newGame"]').click();
    await page.locator('#crName').fill('Yard Planner');
    await page.locator('[data-act="startGame"]').click();
    await page.waitForFunction(() => screen === 'game' && state?.player);
    await page.waitForTimeout(2200);
    await page.evaluate(() => { settings.speed = 0; state.tut.on = false; runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); $('#tip').hidden = true; closePanel(); Scene.go('backyard'); });
    await page.waitForFunction(() => state.scene === 'backyard' && !runtime.overlay);
    const placed = await page.evaluate(() => {
      const I = GP.inv(); I.beds.BED008 = 1; state.player.energy = 100;
      state.player.x = 240; state.player.y = 120; state.player.dir = 'down';
      Yard115.start('bed', 'BED008');
      const rotateShown = !$('#place115 [data-act="yardRotate"]').hidden;
      const before = Yard115.ghost();
      ACT.yardRotate();
      const after = Yard115.ghost();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' })); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
      const back = runtime.place115.rot;
      ACT.yardRotate();
      const chk = Yard115.check(Yard115.ghost(), null);
      Yard115.confirm();
      const b = GP.yard().beds.at(-1);
      return { rotateShown, before, after, back, chk, rot: b && b.rot, foot: b && Yard115.foot(b) };
    });
    assert.ok(placed.rotateShown, 'the placement bar offers Rotate for beds');
    assert.deepEqual([placed.after[2], placed.after[3]], [placed.before[3], placed.before[2]], 'a quarter turn swaps the footprint');
    assert.equal(placed.back, 3, 'the R key also rotates');
    assert.ok(placed.chk.ok, placed.chk.why);
    assert.equal(placed.rot, 0, 'four turns come back to the start');

    const moved = await page.evaluate(() => {
      const b = GP.yard().beds.at(-1), I = GP.inv(); I.seeds.P051 = 1;
      const slots = [0]; slots.arr = b.slots; const p = GP.sow('P051', { kind: 'bed', ref: b.bid }, slots);
      Yard115.start('bed', 'BED008', b.bid); ACT.yardRotate();
      const g = Yard115.ghost(), chk = Yard115.check(g, b.bid); Yard115.confirm();
      RoomArt.hits.length = 0; const items = []; Yard115.addTo(items, View.wctx, 0); for (const it of items) it.d();
      const hit = RoomArt.hits.find(h => h.id === 'gbed:' + b.bid), f = Yard115.foot(b), [sx, sy] = Yard115.slotXY(b, 0);
      return { chk, rot: b.rot, kept: b.slots[0] === p.gid, foot: f, hit: hit && [hit.x, hit.y, hit.w, hit.h], slotInside: sx >= 0 && sx <= f[2] && sy >= 0 && sy <= f[3] };
    });
    assert.ok(moved.chk.ok, moved.chk.why);
    assert.equal(moved.rot, 1);
    assert.ok(moved.kept, 'plants stay in the bed when it is turned');
    assert.equal(moved.hit[2], moved.foot[2] + 4, 'the clickable area follows the turned footprint');
    assert.ok(moved.slotInside, 'planted slots stay inside the turned bed');
    await page.screenshot({ path: path.join(artifacts, 'yard-bed-rotation.png') });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
