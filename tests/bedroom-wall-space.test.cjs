const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const { chromium } = require('playwright');

let server, browser, baseURL;
before(async () => {
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

test('the widened bedroom wall accepts decor between the window, door and closet', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(baseURL);
    await page.locator('[data-act="newGame"]').click();
    await page.locator('#crName').fill('Decorator');
    await page.locator('[data-act="startGame"]').click();
    await page.waitForFunction(() => screen === 'game' && state?.player);
    const r = await page.evaluate(() => {
      state.gear.workbench = 2; state.locations.tent2.owned = true;
      const at = (px, py) => DecoZ.check('mushroom', px, py, null, null);
      const door = RoomArt.hits.find(h => h.id === 'door'), closet = RoomArt.hits.find(h => h.id === 'wardrobe');
      return { gapWindowDoor: at(312, 40), gapDoorCloset: at(394, 40), onDoor: at(350, 50), onCloset: at(450, 50), onWindow: at(250, 30), door: door && [door.x, door.w], closet: closet && [closet.x, closet.w] };
    });
    assert.equal(r.gapWindowDoor.ok, true, r.gapWindowDoor.why);
    assert.equal(r.gapDoorCloset.ok, true, r.gapDoorCloset.why);
    assert.match(r.onDoor.why, /door/);
    assert.match(r.onCloset.why, /closet/);
    assert.match(r.onWindow.why, /window/);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
