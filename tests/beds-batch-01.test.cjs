const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');

test('approved bed batch renders 20 combinations, preserves remaining frames, and supports previews, purchase, save and sleep', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer(), request = server.listeners('request')[0];
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    if (req.url === '/baseline.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(path.join(__dirname, '../baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html')));
    } else request(req, res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium' });
    const errors = [], base = `http://127.0.0.1:${server.address().port}`;
    const out = path.join(__dirname, '../artifacts/beds-batch-01'); fs.mkdirSync(out, { recursive: true });
    async function start(url) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(url);
      await page.evaluate(async () => {
        if (window.BagseedArt) await BagseedArt.ready;
        if (window.BagseedBedroom) await BagseedBedroom.ready;
        if (window.BagseedBeds) await BagseedBeds.ready;
      });
      await page.locator('[data-act=newGame]').click(); await page.locator('#crName').fill('Bed Batch Fixture');
      await page.locator('[data-act=startGame]').click(); await page.waitForTimeout(2400);
      await page.evaluate(() => {
        settings.speed = 0; runtime.pauseHelpShown = true; ACT.tipOff();
        runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); closePanel();
        state.minute = 720; updateHUD();
      });
      return page;
    }
    const baseline = await start(base + '/baseline.html'), page = await start(base);
    const remaining = () => {
      const old = { ...state.room }, hits = RoomArt.hits;
      const cv = document.createElement('canvas'); cv.width = 252; cv.height = 240;
      const g = cv.getContext('2d'); g.scale(3, 3); g.translate(0, -100);
      const images = {};
      try {
        for (const [frame] of STYLES.bed.filter(([id]) => !['starter', 'wooden'].includes(id))) {
          state.room.bed = frame;
          for (const [bedding] of STYLES.bedding) {
            state.room.bedding = bedding; g.clearRect(0, 100, 84, 80); RoomArt.hits = [];
            RoomArt.drawBed(g); images[frame + ':' + bedding] = cv.toDataURL();
          }
        }
      } finally { Object.assign(state.room, old); RoomArt.hits = hits; }
      return images;
    };
    const legacy = await baseline.evaluate(remaining);
    assert.equal(Object.keys(legacy).length, 60);
    assert.deepEqual(await page.evaluate(remaining), legacy, 'Unapproved frames were redrawn');
    await baseline.close();
    const report = await page.evaluate(() => {
      const original = JSON.stringify(state.room), previousHits = RoomArt.hits;
      const cv = document.createElement('canvas'); cv.width = 252; cv.height = 240;
      const g = cv.getContext('2d'); g.scale(3, 3); g.translate(0, -100);
      const images = [], icons = new Set();
      try {
        for (const frame of BagseedBeds.frames) for (const [bedding, name] of STYLES.bedding) {
          state.room.bed = frame; state.room.bedding = bedding; RoomArt.hits = [];
          g.clearRect(0, 100, 84, 80); RoomArt.drawBed(g);
          const hit = RoomArt.hits.find(h => h.id === 'bed');
          if (!hit || JSON.stringify([hit.x, hit.y, hit.w, hit.h, ...hit.walk]) !== '[8,126,72,50,86,160]') throw Error('Bed interaction moved');
          const pixels = g.getImageData(0, 0, cv.width, cv.height).data;
          const opaque = pixels.filter((v, i) => i % 4 === 3 && v > 200).length;
          if (opaque < 10000) throw Error('Blank or severely clipped bed: ' + frame + ':' + bedding);
          const item = { frame, bedding, name, image: cv.toDataURL(), opaque };
          const icon = document.createElement('canvas'); icon.width = 126; icon.height = 120;
          const before = JSON.stringify(state.room), hits = RoomArt.hits;
          drawStyleIcon(icon.getContext('2d'), icon, 'bedding', bedding);
          if (before !== JSON.stringify(state.room) || RoomArt.hits !== hits) throw Error('Shop preview mutated game state');
          icons.add(icon.toDataURL()); images.push(item);
        }
      } finally { Object.assign(state.room, JSON.parse(original)); RoomArt.hits = previousHits; }
      return { images, distinct: new Set(images.map(x => x.image)).size, icons: icons.size,
        preserved: original === JSON.stringify(state.room), ready: BagseedBeds.loaded };
    });
    assert.equal(report.images.length, 20); assert.equal(report.distinct, 20); assert.equal(report.icons, 20);
    assert.equal(report.preserved, true); assert.equal(report.ready, true);
    const purchase = await page.evaluate(() => {
      state.money = 1000;
      const keys = ['s:bed:wooden', ...STYLES.bedding.filter(x => x[2] > 0).map(x => 's:bedding:' + x[0])];
      for (const key of keys) {
        if (!Shop.order(key, true)) throw Error('Cannot buy ' + key);
        runtime.pkgIdx = state.packages.findIndex(o => o.key === key); openPackageInstall('home');
      }
      ACT.style('bed:starter'); const starter = state.room.bed === 'starter';
      ACT.style('bed:wooden'); ACT.style('bedding:botanical');
      if (!SaveSys.now('bed batch purchase fixture')) throw Error('Bed save failed');
      return { starter, bed: state.room.bed, bedding: state.room.bedding,
        owned: keys.every(k => !!state.room.own[k]), money: state.money };
    });
    assert.equal(purchase.starter, true); assert.equal(purchase.bed, 'wooden'); assert.equal(purchase.bedding, 'botanical');
    assert.equal(purchase.owned, true); assert.equal(purchase.money, 1000 - 60 - (12 + 12 + 18 + 18 + 18 + 20 + 20 + 15 + 20));
    await page.reload();
    await page.evaluate(() => Promise.all([BagseedArt.ready, BagseedBedroom.ready, BagseedBeds.ready]));
    await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(() => [state.room.bed, state.room.bedding]), ['wooden', 'botanical']);
    await page.evaluate(() => { settings.speed = 0; interact('bed'); });
    await page.getByRole('button', { name: 'Nap 2 hours', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Not yet', exact: true }).click();
    await page.evaluate(() => { ACT.tipOff(); state.minute = 720; updateHUD(); View.snap(); });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(out, 'in-game.png') });
    fs.writeFileSync(path.join(out, 'room-art.png'), Buffer.from(await page.evaluate(() => View.world.toDataURL().split(',')[1]), 'base64'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100); await page.screenshot({ path: path.join(out, 'phone.png') });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const board = await browser.newPage({ viewport: { width: 1200, height: 1800 } });
    await board.setContent(`<body style="margin:0;padding:24px;background:#ece8da;color:#304438;font:16px sans-serif"><h1>Bagseed · Approved bed batch 01 · Actual game art</h1><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${report.images.map(x => `<div style="background:#b8bda1;padding:12px"><b>${x.frame === 'starter' ? 'Starter Bed' : 'Wooden Frame'}</b><div>${x.name}</div><img width="252" height="240" src="${x.image}"></div>`).join('')}</div></body>`);
    await board.screenshot({ path: path.join(out, 'all-20.png'), fullPage: true });
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ combinations: 20, remainingUnchanged: 60, icons: report.icons, purchase, errors }, null, 2));
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
