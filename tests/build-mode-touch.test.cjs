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
    for (const id of ['armchair', 'beanbag', 'floorlamp', 'rug', 'poster']) state.room.own[id] = 1;
    Deco.open(); $('#toasts').innerHTML = '';
  });
}

/* synthetic finger: Playwright has taps but no touch drags */
const finger = (page, steps) => page.evaluate(async steps => {
  for (const [sel, type, x, y, id] of steps) {
    const el = document.querySelector(sel);
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id || 5, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, buttons: type === 'pointerup' ? 0 : 1 }));
    await new Promise(r => setTimeout(r, 12));
  }
}, steps);

const inside = (r, w, h) => r.x >= 0 && r.y >= 0 && r.x + r.width <= w + 0.5 && r.y + r.height <= h + 0.5;

test('phone portrait: full-stage decorating, item buttons, finger drag, tap to pick up', async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    const shell = await page.evaluate(() => ({
      touch: document.body.classList.contains('touch-ui'), on: document.body.classList.contains('deco-on'),
      hidden: ['#hud', '#objective', '#touch', '#stageTools'].map(s => getComputedStyle($(s)).display),
      tray: !!$('#deco .b1-tray'), zoomIn: runtime.deco.zoomIn
    }));
    assert.equal(shell.touch, true); assert.equal(shell.on, true); assert.equal(shell.tray, true); assert.equal(shell.zoomIn, true);
    assert.deepEqual(shell.hidden, ['none', 'none', 'none', 'none'], 'HUD, goal, joystick and camera button step aside');
    for (const sel of ['[data-act="decoDone"]', '#deco .b1-tray .it[data-b1="armchair"]', '#deco .b1-msg'])
      assert.ok(inside(await page.locator(sel).boundingBox(), 390, 844), sel + ' must be on screen without scrolling');

    // tap an item in the tray: it appears in view with its own buttons
    await page.locator('#deco .b1-tray .it[data-b1="armchair"]').tap();
    await page.waitForFunction(() => $('#b1Fab') && !$('#b1Fab').hidden);
    for (const act of ['decoPlace', 'decoRot', 'decoRemove', 'decoCancel'])
      assert.ok(inside(await page.locator(`#b1Fab [data-act="${act}"]`).boundingBox(), 390, 844), act + ' button on screen');

    // drag it with a finger: it follows, floating above the fingertip
    const start = await page.evaluate(() => { const D = runtime.deco, [w, h] = Build1.ghostDims(), r = View.cv.getBoundingClientRect(), [x, y] = View.toCSS(D.ghost.x + w / 2, D.ghost.y + h / 2); return { x: r.left + x, y: r.top + y }; });
    const steps = [['#room', 'pointerdown', start.x, start.y]];
    for (let i = 1; i <= 10; i++) steps.push(['#room', 'pointermove', start.x + i * 8, start.y + i * 10]);
    steps.push(['#room', 'pointerup', start.x + 80, start.y + 100]);
    await finger(page, steps);
    const dragged = await page.evaluate(([fx, fy]) => { const D = runtime.deco, [w, h] = Build1.ghostDims(), [wx, wy] = View.toWorld(fx, fy); return { held: D.hold && D.hold.id, dx: D.ghost.x + w / 2 - wx, dy: D.ghost.y + h / 2 - wy, ok: D.ghost.ok }; }, [start.x + 80, start.y + 100]);
    assert.equal(dragged.held, 'armchair', 'Still held after the drag (✓ confirms)');
    assert.ok(Math.abs(dragged.dx) <= 3, 'Follows the finger sideways');
    assert.ok(dragged.dy < -4, 'Floats above the fingertip so it stays visible');

    // place it, then a single tap picks it back up and ✕ puts it back
    await page.evaluate(() => { const D = runtime.deco; if (!D.ghost.ok) { Deco.move(120, 150); } });
    await page.locator('#b1Fab [data-act="decoPlace"]').tap();
    const placed = await page.evaluate(() => state.room.placed.find(d => d.id === 'armchair'));
    assert.ok(placed, 'Armchair placed');
    const at = await page.evaluate(d => { const [w, h] = DecoZ.dims(Object.assign({ zone: 'bedroom' }, d), decorDef(d.id)), r = View.cv.getBoundingClientRect(), [x, y] = View.toCSS(d.x + w / 2, d.y + h / 2); return { x: r.left + x, y: r.top + y }; }, placed);
    await finger(page, [['#room', 'pointerdown', at.x, at.y], ['#room', 'pointerup', at.x, at.y]]);
    assert.equal(await page.evaluate(() => runtime.deco.hold && runtime.deco.hold.fromUid), placed.uid, 'One tap picks up a placed item');
    await page.locator('#b1Fab [data-act="decoCancel"]').tap();
    assert.ok(await page.evaluate(d => state.room.placed.some(x => x.uid === d.uid && x.x === d.x && x.y === d.y), placed), 'Cancel returns it to its spot');

    // dragging empty floor pans the view; ＋/－ switches zoom
    const pan = await page.evaluate(() => View.cam.x);
    const r = await page.evaluate(() => { const b = View.cv.getBoundingClientRect(); return { x: b.left + 30, y: b.top + 40 }; });
    await finger(page, [['#room', 'pointerdown', r.x + 200, r.y], ...Array.from({ length: 8 }, (_, i) => ['#room', 'pointermove', r.x + 200 - (i + 1) * 20, r.y]), ['#room', 'pointerup', r.x + 40, r.y]]);
    assert.ok(await page.evaluate(p => View.cam.x > p, pan), 'Dragging the floor looks around');
    const z = await page.evaluate(() => View.zoom);
    await page.locator('[data-act="b1Zoom"]').tap();
    assert.ok(await page.evaluate(z => View.zoom < z, z), '－ shows more of the room');
    await page.screenshot({ path: path.join(artifacts, 'build-mode-touch-portrait.png') });

    await page.locator('[data-act="decoDone"]').tap();
    const closed = await page.evaluate(() => ({ on: document.body.classList.contains('deco-on'), hud: getComputedStyle($('#hud')).display, fab: !$('#b1Fab') || $('#b1Fab').hidden }));
    assert.equal(closed.on, false); assert.notEqual(closed.hud, 'none'); assert.equal(closed.fab, true);
  });
});

test('phone portrait: an item dragged up out of the tray lands in the room', async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    const a = await page.locator('#deco .b1-tray .it[data-b1="beanbag"]').boundingBox(), s = await page.locator('#stage').boundingBox();
    const sx = a.x + a.width / 2, sy = a.y + a.height / 2, tx = s.x + s.width * .5, ty = s.y + s.height * .7, sel = '#deco .b1-tray .it[data-b1="beanbag"]';
    const steps = [[sel, 'pointerdown', sx, sy]];
    for (let i = 1; i <= 12; i++) steps.push([sel, 'pointermove', sx + (tx - sx) * i / 12, sy + (ty - sy) * i / 12]);
    steps.push([sel, 'pointerup', tx, ty]);
    // the tray re-renders mid-drag; later events still reach the document through the detached button
    await page.evaluate(async steps => {
      const el = document.querySelector(steps[0][0]);
      for (const [, type, x, y] of steps) { el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 6, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, buttons: type === 'pointerup' ? 0 : 1 })); await new Promise(r => setTimeout(r, 12)); }
    }, steps);
    const r = await page.evaluate(([fx, fy]) => { const D = runtime.deco, [w] = Build1.ghostDims(), [wx] = View.toWorld(fx, fy); return { held: D.hold && D.hold.id, dx: D.ghost.x + w / 2 - wx }; }, [tx, ty]);
    assert.equal(r.held, 'beanbag');
    assert.ok(Math.abs(r.dx) <= 3, 'Dropped where the finger let go');
  });
});

test('phone landscape: the side panel keeps Done and the status line on screen', async () => {
  await withPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }, async page => {
    await startDecorating(page);
    await page.locator('#deco .b1-tray .it[data-b1="armchair"]').tap();
    for (const sel of ['[data-act="decoDone"]', '#deco .b1-msg', '#b1Fab [data-act="decoPlace"]'])
      assert.ok(inside(await page.locator(sel).boundingBox(), 844, 390), sel + ' must be on screen in landscape');
    const panel = await page.locator('#deco').boundingBox();
    assert.ok(panel.width < 844 * .45, 'Panel leaves most of the screen to the room');
    await page.screenshot({ path: path.join(artifacts, 'build-mode-touch-landscape.png') });
  });
});

test('mouse play keeps the existing decorate panel', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startDecorating(page);
    const r = await page.evaluate(() => { Deco.pick('armchair'); return { tray: !!$('#deco .b1-tray'), place: !!$('#deco [data-act="decoPlace"]'), fab: !$('#b1Fab') || $('#b1Fab').hidden, hud: getComputedStyle($('#hud')).display }; });
    assert.deepEqual(r, { tray: false, place: true, fab: true, hud: r.hud });
    assert.notEqual(r.hud, 'none');
  });
});
