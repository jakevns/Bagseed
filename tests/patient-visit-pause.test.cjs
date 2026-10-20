const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// Patient visitors are not on the game clock: with time paused they still
// walk out, and a served visitor heading out never blocks the next sale.
test('patient visits finish while time is paused', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium' });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.locator('[data-act=newGame]').click(); await page.locator('#crName').fill('Visit Fixture');
    await page.locator('[data-act=startGame]').click(); await page.waitForTimeout(2400);
    await page.evaluate(() => {
      settings.speed = 0; settings.reduced = true; state.tut.on = false; runtime.pauseHelpShown = true; ACT.tipOff();
      runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); closePanel(); state.minute = 720;
      const P = state.npc.patients.rosalind; P.met = true;
      state.scene = 'bedroom'; Visits.start('rosalind', 'no-batch');
    });
    const startMinute = await page.evaluate(() => [state.day, state.minute]);
    const served = await page.waitForFunction(() => state.visitFlow && state.visitFlow.served, null, { timeout: 15000 }).then(() => true, () => false);
    assert.ok(served, 'The visitor never came in while time was paused');

    // a second sale while the first visitor is still walking out is allowed
    const second = await page.evaluate(() => { const first = state.visitFlow.id; Visits.start('rosalind', 'no-batch'); return state.visitFlow && state.visitFlow.id !== first; });
    assert.ok(second, 'A served visitor blocked the next visit');

    const left = await page.waitForFunction(() => !state.visitFlow, null, { timeout: 60000 }).then(() => true, () => false);
    assert.ok(left, 'The visitor never left while time was paused: ' + await page.evaluate(() => JSON.stringify(state.visitFlow && { phase: state.visitFlow.phase, scene: state.visitFlow.scene })));
    assert.deepEqual(await page.evaluate(() => [state.day, state.minute]), startMinute, 'The game clock moved while paused');
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
