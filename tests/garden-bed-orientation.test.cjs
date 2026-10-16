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

async function startInBackyard(page) {
  await page.locator('[data-act="newGame"]').click();
  await page.locator('#crName').fill('Bed Designer');
  await page.locator('[data-act="startGame"]').click();
  await page.waitForFunction(() => screen === 'game' && state?.player);
  await page.waitForTimeout(2200);
  await page.evaluate(() => {
    settings.speed = 0; state.tut.on = false; runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); $('#tip').hidden = true; closePanel();
    Scene.place('backyard'); V115S();
    const I = GP.inv(); I.beds.BED007 = 2; I.beds.BED008 = 1;
    document.activeElement?.blur();
  });
}

/* walk the player (by teleport) to the first spot where the ghost bed fits */
const findSpot = page => page.evaluate(() => {
  // the turned-back footprint around the same center must fit too, so the test can turn it in place
  const roomy = g => { const r = [Math.round(g[0] + g[2] / 2 - g[3] / 2), Math.round(g[1] + g[3] / 2 - g[2] / 2), g[3], g[2]]; return Yard115.check(g, null).ok && Yard115.check(r, null).ok; };
  const W = SCENES.backyard.walk, p = state.player; p.dir = 'down';
  for (let y = W[1] + 4; y < W[3] - 20; y += 4) for (let x = W[0] + 20; x < W[2] - 20; x += 4) {
    if (Move.blocked(x, y)) continue; p.x = x; p.y = y;
    if (roomy(Yard115.ghost())) return [x, y];
  }
  return null;
});

const frame = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

test('orientation math: every bed, every orientation keeps slots inside the turned footprint', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    const out = await page.evaluate(() => {
      const bad = [], all = [];
      for (let rot = 0; rot < 4; rot++) for (const flip of [false, true]) all.push({ rot, flip });
      for (const B of GP.beds()) for (const o of all) {
        const [w, h] = GP.bedDims(B, o);
        for (let i = 0; i < B.cap; i++) { const [x, y] = GP.slotPosO(B, o, i); if (x < 0 || y < 0 || x > w || y > h) bad.push(`${B.id} ${o.rot}/${o.flip} slot ${i}: ${x},${y} outside ${w}x${h}`); }
        // the art draws without errors and only inside the footprint (the round bed's rim stones may sit 1px out; trellises rise above)
        const cv = document.createElement('canvas'); cv.width = 120; cv.height = 120; const c = cv.getContext('2d');
        GPArt.bedO(c, B, 30, 40, o, 0); const d = c.getImageData(0, 0, 120, 120).data;
        for (let yy = 0; yy < 120; yy++) for (let xx = 0; xx < 120; xx++) if (d[(yy * 120 + xx) * 4 + 3] && (xx < 29 || xx > 30 + w || yy > 40 + h || (yy < 39 && B.style !== 'trellis'))) { bad.push(`${B.id} ${o.rot}/${o.flip} paints outside at ${xx},${yy}`); yy = 120; break; }
      }
      // unturned beds look exactly like before
      const same = GP.beds().every(B => { const a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = b.width = a.height = b.height = 90; GPArt.bed(a.getContext('2d'), B.style, 10, 30, B.w, B.h, 0); GPArt.bedO(b.getContext('2d'), B, 10, 30, { rot: 0, flip: false }, 0); return a.toDataURL() === b.toDataURL(); });
      // screen-space flips: mirroring twice is a no-op, four turns is a full circle, flips compose to a half turn
      const id = { rot: 0, flip: false }, t = (o, ...h) => h.reduce((q, k) => GP.turnOri(q, k), o);
      const algebra = [t(id, 'rot', 'rot', 'rot', 'rot'), t(id, 'h', 'h'), t(id, 'v', 'v'), t(id, 'rot', 'h', 'rot', 'h')].map(JSON.stringify);
      const half = JSON.stringify(t(id, 'h', 'v'));
      // a left-right flip mirrors points on screen whatever the turn
      const B = GP.bed('BED008'), mirrorOK = all.every(o => { const [w] = GP.bedDims(B, o), f = GP.turnOri(o, 'h'), p = GP.bedPt(B, o, 5, 3), q = GP.bedPt(B, f, 5, 3); return Math.abs(q[0] - (w - p[0])) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9; });
      return { bad, same, algebra, half, mirrorOK, legacy: GP.bedOri({ bid: 'old', type: 'BED004', x: 0, y: 0, slots: [] }) };
    });
    assert.deepEqual(out.bad, []);
    assert.equal(out.same, true, 'Unturned beds must draw exactly as before');
    assert.deepEqual(out.algebra, Array(4).fill(JSON.stringify({ rot: 0, flip: false })));
    assert.equal(out.half, JSON.stringify({ rot: 2, flip: false }));
    assert.equal(out.mirrorOK, true);
    assert.deepEqual(out.legacy, { rot: 0, flip: false });
  });
});

test('place a turned bed, turn it again with plants in it, collide, save and reload', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startInBackyard(page);
    await page.evaluate(() => Yard115.start('bed', 'BED007', null));
    assert.equal(await page.locator('#place115 .ori115').isVisible(), true, 'Rotate/flip controls show while placing a bed');
    // R rotates, the Flip buttons mirror, in screen space
    await page.keyboard.press('r');
    assert.deepEqual(await page.evaluate(() => runtime.place115.ori), { rot: 1, flip: false });
    await page.locator('#place115 [data-act="yardTurn"][data-arg="h"]').click();
    assert.deepEqual(await page.evaluate(() => runtime.place115.ori), { rot: 3, flip: true });
    await page.keyboard.press('f');
    await page.keyboard.press('v');
    assert.deepEqual(await page.evaluate(() => runtime.place115.ori), { rot: 1, flip: true });
    assert.deepEqual(await page.evaluate(() => Yard115.ghost().slice(2)), [16, 52], 'The ghost footprint turns with the bed');
    assert.ok(await findSpot(page), 'A spot for the turned bed exists');
    await page.locator('#place115 [data-act="yardPlace"]').click();
    const placed = await page.evaluate(() => { const b = GP.yard().beds.at(-1); return { bid: b.bid, rot: b.rot, flip: b.flip, foot: Yard115.foot(b) }; });
    assert.equal(placed.rot, 1); assert.equal(placed.flip, true); assert.deepEqual(placed.foot.slice(2), [16, 52]);

    // collision + walkable area + hit area + depth follow the turned footprint
    await frame(page);
    const geo = await page.evaluate(bid => {
      const b = GP.yard().beds.find(x => x.bid === bid), [x, y, w, h] = Yard115.foot(b); Move.refresh();
      const hit = RoomArt.hits.find(t => t.id === 'gbed:' + bid || t.k === 'gbed:' + bid || (t.key || '') === 'gbed:' + bid);
      return { insideBlocked: Move.blocked(x + w / 2, y + h - 4), belowFree: !Move.blocked(x + w / 2, y + h + 10) || Move.blocked(x + w / 2, y + h + 10) === Move.blocked(x + w / 2, y + h + 30), solid: SCENES.backyard.solids().some(s => s[0] === x && s[1] === y && s[2] === w && s[3] === h), hit: hit ? [hit.x, hit.y, hit.w, hit.h] : JSON.stringify(RoomArt.hits.slice(-3)), foot: [x, y, w, h] };
    }, placed.bid);
    assert.equal(geo.solid, true, 'The turned footprint is a solid');
    assert.equal(geo.insideBlocked, true, 'The player cannot walk into the turned bed');
    assert.ok(Array.isArray(geo.hit), `Bed hit area missing: ${geo.hit}`);
    assert.deepEqual(geo.hit, [geo.foot[0] - 2, geo.foot[1] - 14, geo.foot[2] + 4, geo.foot[3] + 14]);

    // plant into it, then turn it in place from its panel: plants stay in their slots with their growth
    const before = await page.evaluate(bid => {
      const b = GP.yard().beds.find(x => x.bid === bid), at = { kind: 'bed', ref: bid };
      for (const [i, sp] of [[0, 'P001'], [3, 'P011'], [7, 'P013']]) { const p = GP.newPlant(sp, at, {}); p.age = 3 + i; p.water = 77; b.slots[i] = p.gid; }
      const [x, y, w, h] = Yard115.foot(b); state.player.x = Math.round(x + w + 12); state.player.y = Math.round(y + h + 8);
      Panels.gspot('bed', bid); return { slots: b.slots.slice(), plants: b.slots.filter(Boolean).map(g => JSON.stringify(GP.plant(g))) };
    }, placed.bid);
    await page.locator('#panelBody [data-act="yardTurnBed"][data-arg$=":rot"]').click();
    let after = await page.evaluate(bid => { const b = GP.yard().beds.find(x => x.bid === bid); return { ori: GP.bedOri(b), foot: Yard115.foot(b), slots: b.slots.slice(), plants: b.slots.filter(Boolean).map(g => JSON.stringify(GP.plant(g))) }; }, placed.bid);
    assert.deepEqual(after.ori, { rot: 2, flip: true });
    assert.deepEqual(after.foot.slice(2), [52, 16]);
    assert.deepEqual(after.slots, before.slots); assert.deepEqual(after.plants, before.plants);
    await page.keyboard.press('f');   // panel shortcut
    after = await page.evaluate(bid => GP.bedOri(GP.yard().beds.find(x => x.bid === bid)), placed.bid);
    assert.deepEqual(after, { rot: 2, flip: false });
    await page.evaluate(() => closePanel());

    // a turn that would hit something is refused and changes nothing
    const blocked = await page.evaluate(bid => {
      const Y = GP.yard(), b = Y.beds.find(x => x.bid === bid), [x, y, w, h] = Yard115.foot(b);
      Y.beds.push({ bid: 'ybWall', type: 'BED004', x: Math.round(x + w / 2 - 17), y: y + h + 1, slots: [null, null, null, null], weeds: 0 });
      const ok = Yard115.turnPlaced(bid, 'rot'); const res = { ok, ori: GP.bedOri(b), foot: Yard115.foot(b) };
      Y.beds.pop(); return res;
    }, placed.bid);
    assert.equal(blocked.ok, false); assert.deepEqual(blocked.ori, { rot: 2, flip: false }); assert.deepEqual(blocked.foot.slice(2), [52, 16]);

    // moving keeps the orientation and lets you change it
    await page.evaluate(bid => Yard115.start('bed', 'BED007', bid), placed.bid);
    assert.deepEqual(await page.evaluate(() => runtime.place115.ori), { rot: 2, flip: false });
    await page.evaluate(() => Yard115.cancel());

    await frame(page);
    await page.screenshot({ path: path.join(artifacts, 'garden-bed-turned.png') });
    const saved = await page.evaluate(() => { if (!SaveSys.now('bed orientation test')) throw Error('Save failed'); return JSON.stringify(GP.yard()); });
    await page.reload();
    await page.locator('[data-act="continueGame"]').click();
    await page.waitForFunction(() => screen === 'game' && state);
    const loaded = await page.evaluate(bid => { const b = GP.yard().beds.find(x => x.bid === bid); return { yard: JSON.stringify(GP.yard()), ori: GP.bedOri(b), foot: Yard115.foot(b) }; }, placed.bid);
    assert.equal(loaded.yard, saved, 'Bed orientation and plants survive a reload');
    assert.deepEqual(loaded.ori, { rot: 2, flip: false });
  });
});

test('an old save without bed orientation loads unchanged', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startInBackyard(page);
    const legacy = await page.evaluate(() => {
      const Y = GP.yard(); Y.seq = 9;
      Y.beds.push({ bid: 'yb8', type: 'BED004', x: 120, y: 200, slots: [null, null, null, null], weeds: 12 }, { bid: 'yb9', type: 'BED008', x: 200, y: 200, slots: new Array(8).fill(null), weeds: 0 });
      if (!SaveSys.now('legacy bed test')) throw Error('Save failed'); return JSON.stringify(Y.beds);
    });
    await page.reload();
    await page.locator('[data-act="continueGame"]').click();
    await page.waitForFunction(() => screen === 'game' && state);
    const out = await page.evaluate(() => { Move.refresh(); return { beds: JSON.stringify(GP.yard().beds), feet: GP.yard().beds.map(b => Yard115.foot(b)), saved: (SaveSys.now('resave') && JSON.stringify(JSON.parse(localStorage.getItem(SAVE_KEYS.main)).v115.yard.beds)) }; });
    assert.equal(out.beds, legacy, 'Legacy beds gain no fields on load');
    assert.equal(out.saved, legacy, 'Legacy beds re-save byte-identical');
    assert.deepEqual(out.feet, [[120, 200, 34, 12], [200, 200, 44, 30]]);
  });
});

test('touch layout: the placement bar fits a phone and its turn buttons respond to taps', async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await startInBackyard(page);
    await page.evaluate(() => Yard115.start('bed', 'BED008', null));
    await frame(page);
    const box = await page.locator('#place115').boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 390, `Placement bar overflows the phone: ${JSON.stringify(box)}`);
    for (const arg of ['rot', 'h', 'v']) { const b = await page.locator(`#place115 [data-act="yardTurn"][data-arg="${arg}"]`).boundingBox(); assert.ok(b.x >= 0 && b.x + b.width <= 390 && b.height >= 20, `${arg} button is not tappable: ${JSON.stringify(b)}`); }
    await page.locator('#place115 [data-act="yardTurn"][data-arg="rot"]').tap();
    await page.locator('#place115 [data-act="yardTurn"][data-arg="v"]').tap();
    assert.deepEqual(await page.evaluate(() => runtime.place115.ori), { rot: 1, flip: true });
    await page.screenshot({ path: path.join(artifacts, 'garden-bed-turn-phone.png') });
  });
});
