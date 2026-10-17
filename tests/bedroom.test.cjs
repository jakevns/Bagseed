const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

test('bedroom shell preserves interactions and finishes, with responsive light and phone rendering', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer();
  const normalRequest = server.listeners('request')[0];
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    if (req.url === '/baseline.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(path.join(__dirname, '../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html')));
    } else normalRequest(req, res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium' });
    const errors = [], base = `http://127.0.0.1:${server.address().port}`;
    const out = path.join(__dirname, '../artifacts/bedroom'); fs.mkdirSync(out, { recursive: true });
    async function start(url) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.evaluate(async () => { if (window.BagseedArt) await BagseedArt.ready; if (window.BagseedBedroom) await BagseedBedroom.ready; });
      await page.locator('[data-act=newGame]').click();
      await page.locator('#crName').fill('Bedroom Test');
      await page.locator('[data-act=startGame]').click();
      await page.waitForTimeout(2400);
      await page.evaluate(() => {
        settings.speed = 0; state.tut.on = false; runtime.pauseHelpShown = true;
        runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0);
        ACT.tipOff(); closePanel(); state.minute = 720; state.weather = 'Sunny'; updateHUD();
      });
      return page;
    }
    const old = await start(base + '/baseline.html'), page = await start(base);
    const geometry = () => {
      const canvas = document.createElement('canvas'); canvas.width = ROOM.W * 3; canvas.height = ROOM.H * 3;
      const g = canvas.getContext('2d'); g.scale(3, 3); RoomArt.draw(g, 0);
      const ids = ['door', 'window', 'bed', 'computer', 'bench', 'storage', 'wardrobe', 'closet', 'can', 'powerstrip'];
      return { size: [ROOM.W, ROOM.H, ROOM.floorY], room: state.room,
        hits: RoomArt.hits.filter(h => ids.includes(h.id)).map(({ id, x, y, w, h, walk }) => ({ id, x, y, w, h, walk })) };
    };
    const currentGeometry = await page.evaluate(geometry);
    assert.ok(currentGeometry.hits.some(h => h.id === 'door') && currentGeometry.hits.some(h => h.id === 'window'));
    const expectedGeometry=await old.evaluate(geometry);
    fs.writeFileSync(path.join(out,'interaction-geometry.json'),JSON.stringify({current:currentGeometry,baseline:expectedGeometry},null,2));
    // Water & Pots replaces the can art and fits its hitbox to the new sprite.
    // Every other archived interaction and saved finish must still match.
    expectedGeometry.hits=expectedGeometry.hits.map(hit=>hit.id==='can'?{...hit,x:290,y:102.99212598425197,w:15,h:11.007874015748031,walk:[297.5,120]}:hit);
    assert.deepEqual(currentGeometry, expectedGeometry, 'Existing furniture/save choices and approved interaction geometry changed');
    await old.close();
    const result = await page.evaluate(() => {
      const cv = document.createElement('canvas'); cv.width = ROOM.W * 3; cv.height = ROOM.H * 3;
      const g = cv.getContext('2d'); g.scale(3, 3);
      const background = () => { g.clearRect(0, 0, ROOM.W, ROOM.H); drawBackground(g); return cv.toDataURL(); };
      const light = () => { g.clearRect(0, 0, ROOM.W, ROOM.H); BagseedBedroom.drawLight(g, state.minute / 60); return g.getImageData(0, 0, cv.width, cv.height).data.some((v, i) => i % 4 === 3 && v); };
      const original = JSON.stringify(state.room), first = background();
      state.room.wall = 'navy'; const navy = background();
      state.room.wall = 'sage'; state.room.floor = 'carpet'; const carpet = background();
      state.room.floor = 'wood'; const restored = background();
      const noonLight = light(); state.room.curtains = 'blackout'; const blackoutLight = light();
      state.room.curtains = 'basic'; state.weather = 'Rain'; const rainLight = light();
      state.weather = 'Sunny'; state.minute = 1380; const moonLight = light(), nightBackground = background();
      state.minute = 720;
      return { loaded: BagseedBedroom.loaded, alternatives: navy !== first && carpet !== first,
        restored: restored === first, noBakedLight: nightBackground === first,
        unchanged: JSON.stringify(state.room) === original, noonLight, blackoutLight, rainLight, moonLight };
    });
    assert.deepEqual(result, { loaded: true, alternatives: true, restored: true, noBakedLight: true,
      unchanged: true, noonLight: true, blackoutLight: false, rainLight: false, moonLight: true });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(out, 'daylight.png') });
    const roomImage = await page.evaluate(() => View.world.toDataURL('image/png').split(',')[1]);
    fs.writeFileSync(path.join(out, 'room-art.png'), Buffer.from(roomImage, 'base64'));
    await page.evaluate(() => { state.minute = 1380; updateHUD(); });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(out, 'night.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { state.minute = 720; updateHUD(); View.resize(); View.snap(); });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(out, 'phone.png') });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close(); await new Promise(resolve => server.close(resolve));
  }
});
