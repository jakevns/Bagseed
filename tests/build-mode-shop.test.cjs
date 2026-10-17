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

async function withPage(options, fn) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(baseURL);
    await fn(page);
    assert.deepEqual(errors, [], 'The game logged a browser error');
  } finally { await context.close(); }
}

async function startDecorating(page, own = ['beanbag', 'rug', 'poster']) {
  await page.locator('[data-act="newGame"]').click();
  await page.locator('#crName').fill('Shopper');
  await page.locator('[data-act="startGame"]').click();
  await page.waitForFunction(() => screen === 'game' && state?.player);
  await page.waitForTimeout(2200);
  await page.evaluate(own => {
    settings.speed = 0; state.tut.on = false; runtime.dialogQ = [];
    if (runtime.curDialog) ACT.dlg(0);
    $('#tip').hidden = true; closePanel(); document.activeElement?.blur();
    for (const id of own) state.room.own[id] = 1;
    state.money = 500; Deco.open(); $('#toasts').innerHTML = '';
  }, own);
}

const inside = (r, w, h) => r && r.x >= 0 && r.y >= 0 && r.x + r.width <= w + 0.5 && r.y + r.height <= h + 0.5;

test('phone: tabs follow what things are, and every item says where it goes', async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    const chips = await page.locator('#deco .b1-cats .chip:not(.b5-chip)').allTextContents()   // the Phase 5 ♥ chip leads the row;
    // a new game already owns a few things (calendar, crate, nightstand); tabs are exactly the categories of what you own, in catalogue order
    const expected = await page.evaluate(() => { const ids = Object.keys(state.room.own).filter(k => decorDef(k) && decorZones(decorDef(k)).includes('bedroom')), have = new Set(ids.map(k => decorDef(k).cat)); return DECOR_CATS.filter(([k]) => have.has(k)).map(c => c[1]); });
    assert.deepEqual(chips.map(s => s.trim()), ['🛒 Shop', 'All', ...expected]);
    for (const n of ['Rugs', 'Posters', 'Seating']) assert.ok(expected.includes(n), n + ' tab');
    const where = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#deco .b1-tray .it')].map(b => [b.dataset.b1, b.querySelector('.wh').textContent])));
    assert.equal(where.beanbag, 'Floor'); assert.equal(where.rug, 'Rug'); assert.equal(where.poster, 'Wall');
    await page.locator('#deco .b1-cats .chip', { hasText: 'Rugs' }).tap();
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#deco .b1-tray .it')].map(b => b.dataset.b1)), ['rug']);
  });
});

test('phone: buy now for 25% more lands the item in your hands; ordering costs list price and arrives tomorrow', async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    await page.locator('#deco .b1-cats .chip', { hasText: 'Shop' }).tap();
    const list = await page.evaluate(() => [...document.querySelectorAll('#deco .b3-shop [data-act="b3Now"]')].map(b => b.dataset.arg));
    assert.ok(list.length > 10, 'The bedroom catalogue is listed');
    const prices = await page.evaluate(ids => ids.map(id => decorDef(id).p), list);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b), 'Cheapest first');
    assert.ok(await page.evaluate(ids => ids.every(id => decorZones(decorDef(id)).includes('bedroom')), list), 'Only things that fit this room');

    // buy now
    const id = 'armchair', D = await page.evaluate(id => ({ p: decorDef(id).p }), id);
    const btn = page.locator(`#deco [data-act="b3Now"][data-arg="${id}"]`);
    await btn.scrollIntoViewIfNeeded(); await btn.tap();
    const now = await page.evaluate(id => ({ money: state.money, own: state.room.own[id], held: runtime.deco.hold && runtime.deco.hold.id, fab: !$('#b1Fab').hidden }), id);
    assert.equal(now.money, 500 - Math.ceil(D.p * 1.25), 'Now costs list price + 25%, rounded up');
    assert.equal(now.own, 1); assert.equal(now.held, id); assert.equal(now.fab, true);
    await page.evaluate(() => { for (const [a, b] of [[120, 150], [100, 160], [140, 165], [250, 150]]) { Deco.move(a, b); if (runtime.deco.ghost.ok) break; } });
    await page.locator('#b1Fab [data-act="decoPlace"]').tap();
    assert.ok(await page.evaluate(id => state.room.placed.some(d => d.id === id), id), 'Bought-now item placed');

    // order for tomorrow
    await page.locator('#deco .b1-cats .chip', { hasText: 'Shop' }).tap();
    const before = await page.evaluate(() => state.money), o = 'fern', op = await page.evaluate(id => decorDef(id).p, o);
    const ob = page.locator(`#deco [data-act="b3Order"][data-arg="${o}"]`); await ob.scrollIntoViewIfNeeded(); await ob.tap();
    const ord = await page.evaluate(id => ({ money: state.money, orders: state.orders.filter(x => x.key === 'd:' + id).length, own: state.room.own[id] || 0, deco: !!runtime.deco, note: document.querySelector(`#deco [data-act="b3Order"][data-arg="${id}"]`).closest('.b3-shop').textContent }), o);
    assert.ok(before - ord.money <= op + 0.001 && before - ord.money > 0, 'Order charges list price (or less with a coupon)');
    assert.equal(ord.orders, 1); assert.equal(ord.own, 0, 'Ordered item is not in hand yet'); assert.equal(ord.deco, true, 'Still decorating');
    assert.match(ord.note, /1 arriving/);
    await page.screenshot({ path: path.join(artifacts, 'build-mode-shop-phone.png') });
  });
});

test('buying now without enough money changes nothing', async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    await page.evaluate(() => { state.money = 1; ACT.b1Cat('shop'); ACT.b3Now('armchair'); });
    assert.deepEqual(await page.evaluate(() => ({ money: state.money, own: state.room.own.armchair || 0, held: !!runtime.deco.hold })), { money: 1, own: 0, held: false });
  });
});

test('phone landscape: shop cards and their buttons fit beside the room', async () => {
  await withPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    await page.locator('#deco .b1-cats .chip', { hasText: 'Shop' }).tap();
    const first = page.locator('#deco .b3-shop').first();
    for (const sel of ['[data-act="b3Now"]', '[data-act="b3Order"]']) assert.ok(inside(await first.locator(sel).boundingBox(), 844, 390), sel + ' on screen');
    assert.ok(inside(await page.locator('[data-act="decoDone"]').boundingBox(), 844, 390), 'Done on screen');
    await page.screenshot({ path: path.join(artifacts, 'build-mode-shop-landscape.png') });
  });
});

test('mouse play: same tray and shop, with Room styles, grid toggle and the Place row', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startDecorating(page);
    for (const sel of ['#deco .b1-tray', '#deco [data-act="decoTab"][data-arg="styles"]', '#deco [data-act="b2Grid"]', '#deco .b3-mouse [data-act="decoPlace"]'])
      assert.ok(await page.locator(sel).isVisible(), sel + ' visible');
    await page.locator('#deco [data-act="decoPick"][data-arg="beanbag"]').click();
    await page.evaluate(() => { for (const [a, b] of [[120, 150], [100, 160], [140, 165]]) { Deco.move(a, b); if (runtime.deco.ghost.ok) break; } Deco.render(); });
    await page.locator('#deco .b3-mouse [data-act="decoPlace"]').click();
    assert.ok(await page.evaluate(() => state.room.placed.some(d => d.id === 'beanbag')), 'Placed with the mouse Place button');
    await page.locator('#deco .b1-cats .chip', { hasText: 'Shop' }).click();
    assert.ok(await page.locator('#deco .b3-shop').count() > 10);
    await page.screenshot({ path: path.join(artifacts, 'build-mode-shop-desktop.png') });
  });
});
