const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const { chromium } = require('playwright');
const artPage = require('./helpers/art-page.cjs');

let server, browser, url;
before(async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  server = createStaticServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.BAGSEED_BROWSER_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ headless: true, executablePath });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

test('shelved Threads, Westbrook Way and unfinished garments stay out of reach while saves keep them', async () => {
  const page = await artPage(browser, { viewport: { width: 1280, height: 800 } }), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(url);
    await page.locator('[data-act=newGame]').click();
    const creator = await page.evaluate(() => ({
      tops: [...document.querySelectorAll('#screen-create [data-act="cr"][data-arg^="topS:"]')].map(b => b.dataset.arg.slice(5)),
      extras: document.querySelectorAll('#screen-create [data-act="cr"][data-arg^="hat:"],#screen-create [data-act="cr"][data-arg^="glasses:"],#screen-create [data-act="cr"][data-arg^="acc:"]').length
    }));
    assert.deepEqual(creator, { tops: ['hoodie', 'flannel', 'cardigan', 'jacket'], extras: 0 });
    await page.locator('#crName').fill('Shelf');
    await page.locator('[data-act=startGame]').click();
    await page.waitForFunction(() => screen === 'game' && state?.player);
    await page.waitForTimeout(2300);
    const result = await page.evaluate(async () => {
      settings.speed = 0; state.tut.on = false; runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); closePanel();
      const o = { owned: ['cardigan', 'jacket'].every(id => state.player.wardrobe.shirt.includes(id)) };
      state.player.topS = 'tee'; state.player.hat = 'beanie'; Panels.wardrobe('clothes');
      o.mirrorTops = [...document.querySelectorAll('#panelBody [data-act="wear"][data-arg^="shirt:"]')].map(b => b.dataset.arg.slice(6));
      o.mirrorHats = [...document.querySelectorAll('#panelBody [data-act="wear"][data-arg^="hat:"]')].map(b => b.dataset.arg.slice(4));
      closePanel();
      o.leafcartThreads = STORES.leafcart.cats.some(([k]) => k === 'clothes');
      Scene.place('town', 'bus'); state.minute = 720; runtime.sceneBusy = false; Town.use('threads'); o.afterThreads = state.scene;
      Scene.place('park', 'west'); o.parkExits = SCENES.park.exits.map(e => e.to).sort();
      runtime.sceneBusy = false; Scene.go('westway', 'east'); await new Promise(r => setTimeout(r, 900)); o.afterWest = state.scene;
      state.scene = 'westway'; for (const f of POSTLOAD115) f(); o.loadedFromWest = state.scene;
      return o;
    });
    assert.deepEqual(result, { owned: true, mirrorTops: ['tee', 'hoodie', 'flannel', 'cardigan', 'jacket'], mirrorHats: ['none', 'beanie'], leafcartThreads: false, afterThreads: 'town', parkExits: ['cgarden', 'street'], afterWest: 'park', loadedFromWest: 'park' });
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});
