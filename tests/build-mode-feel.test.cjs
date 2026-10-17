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

async function startDecorating(page) {
  await page.locator('[data-act="newGame"]').click();
  await page.locator('#crName').fill('Builder');
  await page.locator('[data-act="startGame"]').click();
  await page.waitForFunction(() => screen === 'game' && state?.player);
  await page.waitForTimeout(2200);
  await page.evaluate(() => {
    settings.speed = 0; state.tut.on = false; runtime.dialogQ = [];
    if (runtime.curDialog) ACT.dlg(0);
    $('#tip').hidden = true; closePanel(); document.activeElement?.blur();
    for (const id of ['armchair', 'beanbag', 'floorlamp', 'rug', 'poster', 'fern']) state.room.own[id] = 1;
    Deco.open(); $('#toasts').innerHTML = '';
  });
}

/* drag the held item with a synthetic finger from its center by (dx, dy) css px */
const dragHeld = (page, dx, dy) => page.evaluate(async ([dx, dy]) => {
  const D = runtime.deco, [w, h] = Build1.ghostDims(), r = View.cv.getBoundingClientRect(), [x, y] = View.toCSS(D.ghost.x + w / 2, D.ghost.y + h / 2), sx = r.left + x, sy = r.top + y;
  const P = (type, px, py) => View.cv.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 8, pointerType: 'touch', isPrimary: true, clientX: px, clientY: py, buttons: type === 'pointerup' ? 0 : 1 }));
  P('pointerdown', sx, sy); for (let i = 1; i <= 10; i++) { P('pointermove', sx + dx * i / 10, sy + dy * i / 10); await new Promise(r => setTimeout(r, 12)); } P('pointerup', sx + dx, sy + dy);
  return { x: D.ghost.x, y: D.ghost.y, ok: D.ghost.ok, floorBottom: 178 - h };
}, [dx, dy]);

test('phone: hand moves snap to the 8px grid, ▦ switches to free placement, arrows step a cell', async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    assert.ok(await page.locator('#deco [data-act="b2Grid"]').isVisible(), 'Grid toggle sits in the header');
    const done = await page.locator('[data-act="decoDone"]').boundingBox();
    assert.ok(done.x + done.width <= 390, 'Done still fits on a narrow phone');
    await page.locator('#deco .b1-tray .it[data-b1="armchair"]').tap();
    const start = await page.evaluate(() => ({ x: runtime.deco.ghost.x, y: runtime.deco.ghost.y }));
    assert.equal(start.x % 8, 0, 'A new item starts on the grid'); assert.equal(start.y % 8, 0);
    for (const [dx, dy] of [[37, 21], [-53, 29], [11, -7]]) {
      const g = await dragHeld(page, dx, dy);
      // snapped, unless the room's floor edge (y 98 up top) clamps it
      assert.equal(g.x % 8, 0, `snapped x after drag ${dx},${dy}`); assert.ok(g.y % 8 === 0 || g.y === 98 || g.y === g.floorBottom, `snapped y after drag ${dx},${dy}: ${g.y}`);
    }
    const before = await page.evaluate(() => runtime.deco.ghost.x);
    await page.evaluate(() => ACT.decoNudge('2:0'));
    assert.equal(await page.evaluate(() => runtime.deco.ghost.x), before + 8, '→ steps a whole cell while snapping');

    await page.locator('#deco [data-act="b2Grid"]').tap();
    assert.equal(await page.evaluate(() => settings.decoGrid), false);
    assert.equal(await page.locator('#deco [data-act="b2Grid"]').getAttribute('aria-pressed'), 'false');
    const xs = new Set();
    for (const dx of [20, 14, -22, 18]) xs.add((await dragHeld(page, dx, 0)).x % 8);   // past the 8px drag threshold
    assert.ok(xs.size > 1, 'Free placement lands between grid lines');
    const b = await page.evaluate(() => runtime.deco.ghost.x); await page.evaluate(() => ACT.decoNudge('2:0'));
    assert.equal(await page.evaluate(() => runtime.deco.ghost.x), b + 2, 'Free placement nudges two pixels');
  });
});

test('scripted moves are never snapped (saves, tests and other code keep exact positions)', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startDecorating(page);
    const r = await page.evaluate(() => { Deco.pick('armchair'); const [w, h] = Build1.ghostDims(); Deco.move(117, 147); return { x: runtime.deco.ghost.x, y: runtime.deco.ghost.y, ex: Math.round((117 - w / 2) / 2) * 2, ey: Math.round((147 - h / 2) / 2) * 2 }; });
    assert.equal(r.x, r.ex); assert.equal(r.y, r.ey);
    assert.ok(await page.locator('#deco [data-act="b2Grid"]').isVisible(), 'Mouse panel has the grid toggle too');
    assert.equal((await page.locator('#deco [data-act="b2Grid"]').textContent()).trim(), '▦ Grid');
  });
});

test('landing: squash, dust and a sound that matches the material; lifting has its own sound', async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    const r = await page.evaluate(async () => {
      const log = [], tone = Sfx.tone, noise = Sfx.noise;
      Sfx.tone = (f, ...a) => log.push('t' + f); Sfx.noise = (d, v, f) => log.push('n' + f);
      const sig = {};
      try {
        for (const [id, x, y] of [['beanbag', 120, 150], ['floorlamp', 250, 150], ['fern', 60, 150], ['poster', 130, 30]]) {
          Deco.pick(id); Deco.move(x, y); if (!runtime.deco.ghost.ok) for (const [a, b] of [[100, 160], [140, 165], [200, 160], [240, 40], [100, 20]]) { Deco.move(a, b); if (runtime.deco.ghost.ok) break; }
          log.length = 0; const ok = Deco.place(); sig[id] = { ok, sound: log.join(',') };
          if (ok && id === 'beanbag') { const d = state.room.placed.find(p => p.id === 'beanbag'); sig.anim = Build2.anims.has(d.uid); sig.puffs = Build2.puffs.length; }
        }
        const d = state.room.placed.find(p => p.id === 'beanbag'); log.length = 0; Deco.pickPlaced(d); sig.lift = log.join(','); Deco.cancel();
      } finally { Sfx.tone = tone; Sfx.noise = noise; }
      return { sig, mats: ['beanbag', 'floorlamp', 'fern', 'poster', 'crate'].map(id => Build2.material(id)) };
    });
    assert.deepEqual(r.mats, ['soft', 'metal', 'plant', 'paper', 'wood']);
    for (const id of ['beanbag', 'floorlamp', 'fern', 'poster']) assert.equal(r.sig[id].ok, true, id + ' placed');
    const sounds = ['beanbag', 'floorlamp', 'fern', 'poster'].map(id => r.sig[id].sound);
    assert.equal(new Set(sounds).size, 4, 'Each material sounds different: ' + sounds.join(' | '));
    assert.ok(!sounds.some(s => s.includes('t520')), 'The old two-beep chime is gone');
    assert.equal(r.sig.anim, true, 'Placed item squashes'); assert.ok(r.sig.puffs > 0, 'Dust puffs');
    assert.equal(r.sig.lift, 't392', 'Picking up plays the lift sound');
  });
});

test('the held item draws lifted with green footprint tiles, red when it does not fit', async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    await page.locator('#deco .b1-tray .it[data-b1="armchair"]').tap();
    // draw the held item into a scratch canvas (art stubbed out) and read a footprint tile
    const px = async () => page.evaluate(() => {
      const D = runtime.deco, f = DecoZ.foot({ id: D.hold.id, zone: D.zone, rot: D.hold.rot, x: D.ghost.x, y: D.ghost.y }, decorDef(D.hold.id));
      const cv = document.createElement('canvas'); cv.width = 520; cv.height = 200; const c = cv.getContext('2d'), art = drawDecor;
      drawDecor = () => { }; try { Build2.drawGhost(c, performance.now()); } finally { drawDecor = art; }
      const d = c.getImageData(Math.floor(f[0]) + 2, Math.floor(f[1] + f[3]) - 2, 1, 1).data;
      return { ok: D.ghost.ok, rgb: [d[0], d[1], d[2]] };
    });
    await page.evaluate(() => { for (const [a, b] of [[120, 150], [100, 160], [140, 165]]) { Deco.move(a, b); if (runtime.deco.ghost.ok) break; } const D = runtime.deco; D.cam.x = D.ghost.x + 12; Build1.clampCam(); View.update(0, true); Deco.render(); });
    await page.waitForTimeout(120);
    const good = await px();
    assert.equal(good.ok, true); assert.ok(good.rgb[1] > good.rgb[0], 'Footprint tiles are green where it fits: ' + good.rgb);
    await page.screenshot({ path: path.join(artifacts, 'build-mode-feel-fits.png') });
    await page.evaluate(() => { Deco.move(185, 112); const D = runtime.deco; D.cam.x = D.ghost.x + 12; Build1.clampCam(); View.update(0, true); Deco.render(); });   // on the desk's access spot
    await page.waitForTimeout(120);
    const bad = await px();
    assert.equal(bad.ok, false); assert.ok(bad.rgb[0] > bad.rgb[1], 'Footprint tiles are red where it does not fit: ' + bad.rgb);
    await page.screenshot({ path: path.join(artifacts, 'build-mode-feel-blocked.png') });
  });
});
