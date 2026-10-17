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
const DESK = { viewport: { width: 1280, height: 800 } };

async function startDecorating(page, own = { beanbag: 2, stool: 1, armchair: 1 }) {
  await page.locator('[data-act="newGame"]').click();
  await page.locator('#crName').fill('Arranger');
  await page.locator('[data-act="startGame"]').click();
  await page.waitForFunction(() => screen === 'game' && state?.player);
  await page.waitForTimeout(2200);
  await page.evaluate(own => {
    settings.speed = 0; state.tut.on = false; runtime.dialogQ = [];
    if (runtime.curDialog) ACT.dlg(0);
    $('#tip').hidden = true; closePanel(); document.activeElement?.blur();
    Object.assign(state.room.own, own); state.money = 500;
    Deco.open(); $('#toasts').innerHTML = '';
    /* test helper: place an item at the first spot that fits */
    window.placeSomewhere = id => { Deco.pick(id); for (const [x, y] of [[120, 150], [150, 160], [100, 165], [240, 150], [270, 165], [200, 168], [140, 140]]) { Deco.move(x, y); if (runtime.deco.ghost.ok) break; } if (!Deco.place()) throw Error('No room for ' + id); return state.room.placed[state.room.placed.length - 1]; };
  }, own);
}

/* a synthetic finger on the room canvas, in world coordinates */
const fingerWorld = (page, pts, id = 11) => page.evaluate(async ([pts, id]) => {
  const r = View.cv.getBoundingClientRect(); let i = 0;
  for (const [type, wx, wy] of pts) { const [x, y] = View.toCSS(wx, wy); View.cv.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', isPrimary: true, clientX: r.left + x, clientY: r.top + y, buttons: type === 'pointerup' ? 0 : 1 })); if (i++ % 2) await new Promise(r => setTimeout(r, 10)); }
}, [pts, id]);
const center = (page, uid) => page.evaluate(uid => { const d = state.room.placed.find(x => x.uid === uid), [w, h] = DecoZ.dims(Object.assign({ zone: 'bedroom' }, d), decorDef(d.id)); return [d.x + w / 2, d.y + h / 2]; }, uid);

test('redo brings back what undo took away; the header still fits a narrow phone', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    const d = await page.evaluate(() => placeSomewhere('beanbag'));
    await page.evaluate(() => Deco.render());
    await page.locator('[data-act="decoUndo"]').tap();
    assert.equal(await page.evaluate(uid => state.room.placed.some(x => x.uid === uid), d.uid), false, 'Undo removed it');
    assert.ok(await page.locator('[data-act="b4Redo"]').isVisible(), '↷ shows once there is something to redo');
    await page.locator('[data-act="b4Redo"]').tap();
    assert.equal(await page.evaluate(uid => state.room.placed.some(x => x.uid === uid), d.uid), true, 'Redo put it back');
    const done = await page.locator('[data-act="decoDone"]').boundingBox();
    assert.ok(done.x + done.width <= 390, 'Done fits');
  });
});

test('⧉ places the held item and picks up the next copy beside it; it hides on the last one', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    await page.locator('#deco .b1-tray .it[data-b1="beanbag"]').tap();
    await page.evaluate(() => { for (const [x, y] of [[120, 150], [150, 160], [100, 165]]) { Deco.move(x, y); if (runtime.deco.ghost.ok) break; } });
    await page.waitForFunction(() => $('#b1Fab') && !$('#b1Fab').hidden && $('#b1Fab [data-act="b4Another"]'));
    const first = await page.evaluate(() => ({ x: runtime.deco.ghost.x }));
    await page.locator('#b1Fab [data-act="b4Another"]').tap();
    const r = await page.evaluate(() => ({ placed: state.room.placed.filter(d => d.id === 'beanbag').length, held: runtime.deco.hold && runtime.deco.hold.id, x: runtime.deco.ghost.x }));
    assert.equal(r.placed, 1); assert.equal(r.held, 'beanbag', 'Second copy in hand'); assert.ok(r.x > first.x, 'Starts beside the first');
    await page.waitForTimeout(80);
    assert.equal(await page.locator('#b1Fab [data-act="b4Another"]').count(), 0, 'No ⧉ on the last copy');
  });
});

test('select mode: tap to pick several, drag one to move the group, undo puts them back', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    const a = await page.evaluate(() => placeSomewhere('beanbag')), b = await page.evaluate(() => placeSomewhere('stool'));
    await page.evaluate(() => { runtime.deco.more = true; Deco.render(); });
    await page.locator('[data-act="b4Select"]').first().tap();
    assert.equal(await page.evaluate(() => runtime.deco.select), true);
    for (const d of [a, b]) { const [x, y] = await center(page, d.uid); await fingerWorld(page, [['pointerdown', x, y], ['pointerup', x, y]]); }
    assert.deepEqual(await page.evaluate(() => [...Build4.sel()].sort()), [a.uid, b.uid].sort());
    assert.match(await page.locator('#deco .b4-selbar').textContent(), /2 selected/);

    // try a few drags until one fits; every fitting drag moves both by the same grid step
    const [sx, sy] = await center(page, a.uid); let moved = null;
    for (const [dx, dy] of [[16, 8], [-16, 8], [16, -8], [-24, 0], [24, 0], [0, 16]]) {
      const steps = [['pointerdown', sx, sy]]; for (let i = 1; i <= 6; i++) steps.push(['pointermove', sx + dx * i / 6, sy + dy * i / 6]); steps.push(['pointerup', sx + dx, sy + dy]);
      await fingerWorld(page, steps);
      const now = await page.evaluate(([a, b]) => [a, b].map(u => { const d = state.room.placed.find(x => x.uid === u); return [d.x, d.y]; }), [a.uid, b.uid]);
      if (now[0][0] !== a.x || now[0][1] !== a.y) { moved = { now, dx, dy }; break; }
    }
    assert.ok(moved, 'At least one group drag fit');
    const [[ax, ay], [bx, by]] = moved.now;
    assert.equal(ax - a.x, bx - b.x, 'Both moved the same x'); assert.equal(ay - a.y, by - b.y, 'Both moved the same y');
    assert.equal((ax - a.x) % 8, 0, 'Group moves snap to the grid');
    await page.screenshot({ path: path.join(artifacts, 'build-mode-tools-select.png') });
    await page.evaluate(() => Deco.undo());
    assert.deepEqual(await page.evaluate(([a, b]) => [a, b].map(u => { const d = state.room.placed.find(x => x.uid === u); return [d.x, d.y]; }), [a.uid, b.uid]), [[a.x, a.y], [b.x, b.y]], 'One undo restores the whole group');
  });
});

test('a group that would not fit snaps back untouched', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    const a = await page.evaluate(() => placeSomewhere('beanbag')), b = await page.evaluate(() => placeSomewhere('stool'));
    const r = await page.evaluate(([a, b]) => {
      Build4.setSelect(true); Build4.addSel(state.room.placed.find(d => d.uid === a)); Build4.addSel(state.room.placed.find(d => d.uid === b));
      Build4.beginGroup(); Build4.dragGroup(-400, 0);   // into the bed
      const ok = runtime.deco.group.chk.ok; Build4.endGroup();
      return { ok, pos: [a, b].map(u => { const d = state.room.placed.find(x => x.uid === u); return [d.x, d.y]; }) };
    }, [a.uid, b.uid]);
    assert.equal(r.ok, false);
    assert.deepEqual(r.pos, [[a.x, a.y], [b.x, b.y]]);
  });
});

test('selecting a table brings what sits on it', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    const r = await page.evaluate(() => {
      const kid = state.room.placed.find(d => d.on && state.room.placed.some(p => p.uid === d.on));
      if (!kid) return null; Build4.setSelect(true); Build4.toggleSel(state.room.placed.find(p => p.uid === kid.on));
      return { kid: kid.uid, sel: [...Build4.sel()] };
    });
    assert.ok(r, 'The starting bedroom has something on a table');
    assert.ok(r.sel.includes(r.kid), 'Tabletop item joins the selection');
  });
});

test('mouse: drag a box to select, store the selection, pack up the room and undo it', async () => {
  await withPage(DESK, async page => {
    await startDecorating(page);
    const a = await page.evaluate(() => placeSomewhere('beanbag')), b = await page.evaluate(() => placeSomewhere('stool'));
    await page.locator('#deco [data-act="b4Select"]').click();
    const box = await page.evaluate(([a, b]) => { const ds = [a, b].map(u => state.room.placed.find(x => x.uid === u)); const r = View.cv.getBoundingClientRect(); const xs = [], ys = []; for (const d of ds) { const [w, h] = DecoZ.dims(Object.assign({ zone: 'bedroom' }, d), decorDef(d.id)); for (const [x, y] of [[d.x, d.y], [d.x + w, d.y + h]]) { const [cx, cy] = View.toCSS(x, y); xs.push(r.left + cx); ys.push(r.top + cy); } } return { x0: Math.min(...xs) - 6, y0: Math.min(...ys) - 6, x1: Math.max(...xs) + 6, y1: Math.max(...ys) + 6 }; }, [a.uid, b.uid]);
    await page.mouse.move(box.x0, box.y0); await page.mouse.down(); await page.mouse.move((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2, { steps: 4 }); await page.mouse.move(box.x1, box.y1, { steps: 4 }); await page.mouse.up();
    const sel = await page.evaluate(() => [...Build4.sel()]);
    assert.ok(sel.includes(a.uid) && sel.includes(b.uid), 'Box selected both');
    const freeBefore = await page.evaluate(() => decorFree('beanbag'));
    await page.locator('#deco [data-act="b4StoreSel"]').click();
    const after = await page.evaluate(([a, b]) => ({ gone: ![a, b].some(u => state.room.placed.some(x => x.uid === u)), free: decorFree('beanbag') }), [a.uid, b.uid]);
    assert.equal(after.gone, true); assert.equal(after.free, freeBefore + 1, 'Back in the collection');
    await page.locator('#deco [data-act="b4Select"]').first().click();   // done selecting
    const n = await page.evaluate(() => state.room.placed.length); assert.ok(n > 0);
    await page.locator('#deco [data-act="b4Pack"]').click();
    assert.equal(await page.evaluate(() => state.room.placed.length), 0, 'Pack up empties the room');
    await page.locator('#deco [data-act="decoUndo"]').click();
    assert.equal(await page.evaluate(() => state.room.placed.length), n, 'Undo unpacks');
  });
});

test('layouts: save, lay out again exactly, and report what is missing', async () => {
  await withPage(PHONE, async page => {
    await startDecorating(page);
    await page.evaluate(() => { placeSomewhere('beanbag'); placeSomewhere('stool'); Deco.render(); });
    const before = await page.evaluate(() => state.room.placed.map(d => [d.id, d.x, d.y]).sort());
    await page.evaluate(() => { ACT.b4View('layouts'); });
    await page.locator('#deco [data-act="b4Save"][data-arg="0"]').tap();
    assert.equal(await page.evaluate(() => state.decoLayouts.bedroom[0].items.length), before.length);
    await page.evaluate(() => ACT.b4Pack());
    await page.evaluate(() => ACT.b4View('layouts'));
    await page.screenshot({ path: path.join(artifacts, 'build-mode-tools-layouts.png') });
    await page.locator('#deco [data-act="b4Load"][data-arg="0"]').tap();
    assert.deepEqual(await page.evaluate(() => state.room.placed.map(d => [d.id, d.x, d.y]).sort()), before, 'Laid out exactly as saved');
    // with the stool sold off, laying out again places the rest and names what's missing
    await page.evaluate(() => { ACT.b4Pack(); state.room.own.stool = 0; $('#toasts').innerHTML = ''; Build4.load(0); });
    const r = await page.evaluate(() => ({ ids: state.room.placed.map(d => d.id), toast: $('#toasts').textContent }));
    assert.ok(!r.ids.includes('stool') && r.ids.includes('beanbag'));
    assert.match(r.toast, /Missing: Wooden Stool/);
    // layouts survive a save and reload
    await page.evaluate(() => { Deco.close(); SaveSys.now('test'); });
    await page.reload(); await page.locator('[data-act="continueGame"]').click(); await page.waitForFunction(() => screen === 'game' && state?.player);
    assert.equal(await page.evaluate(() => state.decoLayouts.bedroom[0].items.length), before.length);
  });
});
