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

const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const OWN = { poster: 1, spaceposter: 1, beanbag: 5, rug: 1, lavalamp: 1, floorlamp: 1, fern: 1, succulent: 1, stool: 1 };

async function startDecorating(page) {
  await page.locator('[data-act="newGame"]').click();
  await page.locator('#crName').fill('Homebody');
  await page.locator('[data-act="startGame"]').click();
  await page.waitForFunction(() => screen === 'game' && state?.player);
  await page.waitForTimeout(2200);
  await page.evaluate(own => {
    settings.speed = 0; state.tut.on = false; runtime.dialogQ = [];
    if (runtime.curDialog) ACT.dlg(0);
    $('#tip').hidden = true; closePanel(); document.activeElement?.blur();
    Object.assign(state.room.own, own); state.money = 100;
    Deco.open(); $('#toasts').innerHTML = '';
    /* test helper: scan the room for the first spot this item fits */
    window.placeSomewhere = id => {
      const k = decorDef(id).k, [x0, x1, y0, y1, s] = k === 'wall' ? [10, 470, 10, 85, 8] : k === 'desk' ? [150, 300, 40, 80, 4] : [20, 460, 104, 176, 8];
      Deco.pick(id);
      for (let y = y0; y <= y1; y += s) for (let x = x0; x <= x1; x += s) { Deco.move(x, y); if (runtime.deco.ghost.ok) { if (!Deco.place()) throw Error('place failed ' + id); return true; } }
      Deco.cancel(); return false;
    };
  }, OWN);
}

test('the cozy score rises as a room gains walls, seats, rugs, light, plants and touches', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    const steps = await page.evaluate(() => {
      const out = [['start', Cozy.score('bedroom').score]];
      for (const id of ['poster', 'beanbag', 'rug', 'lavalamp', 'fern', 'succulent', 'spaceposter', 'floorlamp']) { if (!placeSomewhere(id)) return { failed: id }; out.push([id, Cozy.score('bedroom').score]); }
      return out;
    });
    assert.ok(!steps.failed, 'Placed ' + steps.failed);
    require('node:fs').writeFileSync(path.join(artifacts, 'build-mode-cozy-progression.json'), JSON.stringify(steps));
    for (let i = 1; i < steps.length; i++) assert.ok(steps[i][1] > steps[i - 1][1], `${steps[i][0]} raised the score: ${JSON.stringify(steps)}`);
    const r = await page.evaluate(() => Cozy.score('bedroom'));
    assert.ok(r.stars >= 3, 'A furnished room reaches at least 3 hearts: ' + r.score);
    assert.ok(r.rules.find(x => x.key === 'glow').got >= 10, 'Glowing lamps count as night light');
  });
});

test('the ♥ chip opens a breakdown with tips; Close goes back to the tray', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    await page.evaluate(() => Deco.render());
    const chip = page.locator('#deco [data-act="b5View"]');
    assert.match(await chip.textContent(), /♥ \d+/);
    await chip.tap();
    assert.ok(await page.locator('#deco .b5-cozy').isVisible(), 'Cozy panel open');
    const rules = await page.locator('#deco .b5-rule').count(); assert.ok(rules >= 8);
    assert.match(await page.locator('#deco .b5-cozy').textContent(), /Add a houseplant/, 'Tips for what is missing');
    assert.match(await page.locator('#deco .b5-reward').textContent(), /energy you spend each day is free/);
    const done = await page.locator('[data-act="decoDone"]').boundingBox(); assert.ok(done.x + done.width <= 390, 'Done fits');
    await page.screenshot({ path: path.join(artifacts, 'build-mode-cozy-panel.png') });
    await page.locator('#deco .b5-cozy [data-act="b4View"]').tap();
    assert.ok(await page.locator('#deco .b1-tray').isVisible(), 'Back to the tray');
  });
});

test('reaching 3, 4 and 5 hearts pays a one-time housewarming gift', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    const r = await page.evaluate(() => {
      Deco.render(); const m0 = state.money, s0 = Cozy.score('bedroom').stars;
      for (const id of ['poster', 'beanbag', 'rug', 'lavalamp', 'fern', 'succulent', 'spaceposter', 'floorlamp', 'stool']) { placeSomewhere(id); Deco.render(); }
      const s1 = Cozy.score('bedroom').stars, m1 = state.money;
      ACT.b4Pack(); Deco.render(); Deco.undo(); Deco.render();          // drop below and climb back: no second payment
      return { s0, s1, paid: m1 - m0, again: state.money - m1, keys: Object.keys(Cozy.S().paid) };
    });
    const expected = [3, 4, 5].filter(s => s <= r.s1 && s > Math.min(r.s0, 2)).reduce((t, s) => t + { 3: 15, 4: 30, 5: 60 }[s], 0);
    assert.ok(r.s1 >= 3); assert.equal(r.paid, expected, JSON.stringify(r));
    assert.equal(r.again, 0, 'Gifts are paid once');
  });
});

test('a cozy bedroom makes the first few energy each day free', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    const r = await page.evaluate(() => {
      for (const id of ['poster', 'beanbag', 'rug', 'lavalamp', 'fern', 'succulent']) placeSomewhere(id);
      Deco.close(); const stars = Cozy.score('bedroom').stars;
      for (const f of MORNING115) if (f.toString().includes('Well rested')) f();
      const rest = Cozy.S().rest; state.player.energy = 50;
      spend(3, 0); const e1 = state.player.energy, rest1 = Cozy.S().rest;
      spend(rest1 + 5, 0); const e2 = state.player.energy;
      return { stars, rest, e1, rest1, e2, table: Cozy.REST };
    });
    assert.equal(r.rest, r.table[r.stars]); assert.ok(r.rest >= 4, 'At least 3 hearts gives free energy');
    assert.equal(r.e1, 50, 'Covered by rest'); assert.equal(r.rest1, r.rest - 3);
    assert.equal(r.e2, 45, 'Only the part beyond the rest costs energy');
  });
});

test('too many of the same item costs points', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    const r = await page.evaluate(() => { let n = 0; for (let i = 0; i < 5; i++) if (placeSomewhere('beanbag')) n++; const R = Cozy.score('bedroom').rules; return { n, dupes: (R.find(x => x.key === 'dupes') || {}).got }; });
    if (r.n >= 4) assert.equal(r.dupes, -3 * (r.n - 3)); else assert.equal(r.dupes, undefined);
  });
});

test('mouse play shows the ♥ chip and panel too', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startDecorating(page);
    await page.locator('#deco [data-act="b5View"]').click();
    assert.ok(await page.locator('#deco .b5-cozy').isVisible());
    await page.screenshot({ path: path.join(artifacts, 'build-mode-cozy-desktop.png') });
  });
});
