const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');

test('LeafCart cards, search/sort, cart checkout and package previews use the approved bed art at its proper proportions', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const out = path.join(__dirname, '../artifacts/store-art'); fs.mkdirSync(out, { recursive: true });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.evaluate(() => Promise.all([BagseedArt.ready, BagseedBedroom.ready, BagseedBeds.ready]));
    await page.locator('[data-act=newGame]').click(); await page.locator('#crName').fill('LeafCart Art Fixture');
    await page.locator('[data-act=startGame]').click(); await page.waitForTimeout(2400);
    await page.evaluate(() => {
      settings.speed = 0; ACT.tipOff(); runtime.pauseHelpShown = true;
      runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); closePanel();
      state.money = 1000; Panels.app('leafcart');
    });
    await page.locator('[data-act=shopCat][data-arg=decor]').click();
    await page.locator('[data-act=decorCat][data-arg=styles]').click();
    assert.match(await page.locator('#panelTitle').innerText(), /LeafCart/);
    const report = await page.evaluate(() => {
      const original = JSON.stringify(state.room), previousHits = RoomArt.hits;
      const checked = new Set(); let samples = 0;
      function check(canvas) {
        const [, slot, id] = canvas.dataset.draw.split(':');
        const frame = slot === 'bed' ? id : state.room.bed;
        if (!BagseedBeds.frames.includes(frame)) return;
        const bedding = slot === 'bedding' ? id : state.room.bedding;
        if (canvas.width !== 252 || canvas.height !== 240) throw Error('Store resolution/proportions are wrong');
        const box = canvas.getBoundingClientRect();
        if (Math.abs(box.width / box.height - 84 / 80) > .01) throw Error('Store CSS stretches bed art');
        const room = { ...state.room }, hits = RoomArt.hits;
        const expected = document.createElement('canvas'); expected.width = 252; expected.height = 240;
        const g = expected.getContext('2d'); g.scale(3, 3); g.translate(0, -100);
        try {
          state.room[slot] = id; RoomArt.hits = [];
          drawBackground(g); RoomArt.drawBed(g);
        } finally { Object.assign(state.room, room); RoomArt.hits = hits; }
        if (canvas.toDataURL() !== expected.toDataURL()) throw Error('Store card differs from room art: ' + canvas.dataset.draw);
        checked.add(frame + ':' + bedding); samples++;
      }
      try {
        // Product cards must match the active quilt; bedding cards must match
        // every approved frame, including the free starter's paid quilts.
        for (const [bedding] of STYLES.bedding) {
          state.room.bedding = bedding; renderPanel();
          document.querySelectorAll('canvas[data-draw^="style:bed:"]').forEach(check);
        }
        for (const frame of BagseedBeds.frames) {
          state.room.bed = frame; renderPanel();
          document.querySelectorAll('canvas[data-draw^="style:bedding:"]').forEach(check);
        }
      } finally { Object.assign(state.room, JSON.parse(original)); RoomArt.hits = previousHits; renderPanel(); }
      return { samples, combinations: checked.size, preserved: original === JSON.stringify(state.room) };
    });
    assert.deepEqual(report, { samples: 142, combinations: 79, preserved: true });
    const search = page.locator('[data-input115=shopq]');
    await search.fill('Canopy');
    await page.waitForFunction(() => document.querySelectorAll('#panelBody canvas[data-draw^="style:"]').length === 1);
    await page.locator('[data-act=shopSort][data-arg=low]').click();
    const card = page.locator('canvas[data-draw="style:bed:fancy"]').locator('..');
    await card.screenshot({ path: path.join(out, 'canopy-card.png') });
    assert.deepEqual(await card.locator('canvas').evaluate(c => [c.width, c.height]), [252, 240]);
    await card.locator('[data-act=cartAdd115][data-arg="s:bed:fancy"]').click();
    for (const [name, id] of [['Rattan', 'cane'], ['Tufted', 'tufted']]) {
      await search.fill(name);
      await page.waitForFunction(id => !!document.querySelector(`canvas[data-draw="style:bed:${id}"]`), id);
      const frameCard = page.locator(`canvas[data-draw="style:bed:${id}"]`).locator('..');
      await frameCard.screenshot({ path: path.join(out, `${id}-card.png`) });
      await frameCard.locator(`[data-act=cartAdd115][data-arg="s:bed:${id}"]`).click();
    }
    await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();
    const order = await page.evaluate(() => {
      const receipt = state.completion115.receipts.at(-1);
      return { money: state.money, cart: Cart115.S('leafcart').length,
        keys: state.orders.map(o => o.key), total: receipt.total, channel: receipt.channel };
    });
    assert.deepEqual(order, { money: 610, cart: 0, keys: ['s:bed:fancy', 's:bed:cane', 's:bed:tufted'], total: 390, channel: 'leafcart' });
    await page.screenshot({ path: path.join(out, 'checkout.png') });
    for (const id of ['fancy', 'cane', 'tufted']) {
      await page.evaluate(id => {
        const index = state.orders.findIndex(o => o.key === 's:bed:' + id);
        state.packages.push(state.orders.splice(index, 1)[0]);
        Panels.pkg(state.packages.length - 1);
      }, id);
      await page.locator('[data-act=pkgOpen115]').click();
      const packageArt = page.locator(`#panelBody canvas[data-draw="style:bed:${id}"]`);
      await packageArt.waitFor();
      assert.deepEqual(await packageArt.evaluate(c => [c.width, c.height]), [252, 240]);
      await page.locator('#panelBody').screenshot({ path: path.join(out, id === 'fancy' ? 'package-preview.png' : `${id}-package-preview.png`) });
      assert.equal(await page.evaluate(id => styleOwned('bed', id), id), true);
    }
    await page.evaluate(() => { closePanel(); runtime.shopQ = ''; Panels.app('leafcart'); });
    await page.locator('[data-act=shopCat][data-arg=decor]').click();
    await page.locator('[data-act=decorCat][data-arg=styles]').click();
    const inStore = page.locator('canvas[data-draw="style:bed:fancy"]');
    await inStore.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(out, 'store-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await inStore.scrollIntoViewIfNeeded();
    await inStore.locator('..').screenshot({ path: path.join(out, 'store-phone-card.png') });
    const ratio = await inStore.evaluate(c => { const r = c.getBoundingClientRect(); return r.width / r.height; });
    assert.ok(Math.abs(ratio - 84 / 80) < .01);
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ ...report, order, errors }, null, 2));
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
