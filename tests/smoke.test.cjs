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

async function startGame(page, name = 'Test Gardener') {
  await page.locator('[data-act="newGame"]').click();
  await page.locator('#crName').fill(name);
  await page.locator('[data-act="startGame"]').click();
  await page.waitForFunction(() => screen === 'game' && state?.player);
  // Start-dialog timers belong to the baseline. Dismiss them in this disposable test save.
  await page.waitForTimeout(2200);
  await page.evaluate(() => {
    settings.speed = 0;
    state.tut.on = false;
    runtime.dialogQ = [];
    if (runtime.curDialog) ACT.dlg(0);
    $('#tip').hidden = true;
    closePanel();
    document.activeElement?.blur();
  });
}

test('title, character creation, and a new playable bedroom', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    assert.match(await page.title(), /Bagseed/);
    assert.equal(await page.locator('[data-act="newGame"]').count(), 1);
    await startGame(page);
    const result = await page.evaluate(() => ({ name: state.player.name, scene: state.scene, pixels: View.wctx.getImageData(0, 0, View.world.width, View.world.height).data.some(v => v > 0), hits: RoomArt.hits.length }));
    assert.equal(result.name, 'Test Gardener');
    assert.equal(result.scene, 'bedroom');
    assert.equal(result.pixels, true);
    assert.ok(result.hits > 0, 'Interaction targets must be rendered');
    await page.screenshot({ path: path.join(artifacts, 'desktop-bedroom.png') });
  });
});

test('the standalone local file creates a bald character and retains its saved appearance',async()=>{
  await withPage({viewport:{width:1280,height:800}},async page=>{
    await page.goto(require('node:url').pathToFileURL(require('../tools/build-standalone.cjs')(path.join(require('node:os').tmpdir(),'bagseed-standalone-smoke'))).href);
    await page.evaluate(()=>BagseedArt.ready);
    await page.locator('[data-act="newGame"]').click();
    await page.locator('[data-act="hairGrp"][data-arg="short"]').click();
    for(const arg of ['hairS:bald','hairC:#e9e2d4','hat:cap'])await page.locator(`[data-act="cr"][data-arg="${arg}"]`).click();
    await page.locator('[data-act="crWalk"][data-arg="0"]').click();
    const preview=await page.locator('#creatorPreview').evaluate(c=>{drawCreatorPreview(0);const r=c.getBoundingClientRect();return {width:c.width,height:c.height,ratio:r.width/r.height,look:creatorLook(runtime.cr)};});
    assert.equal(preview.width,540);assert.equal(preview.height,336);assert.ok(Math.abs(preview.ratio-180/112)<.02);assert.equal(preview.look.hairS,'bald');
    await page.locator('#creatorPreview').screenshot({path:path.join(artifacts,'standalone-bald-cap.png')});
    await page.locator('[data-act="startGame"]').click();await page.waitForFunction(()=>screen==='game'&&state?.player);
    const saved=await page.evaluate(()=>{settings.speed=0;if(!SaveSys.now('standalone character test'))throw Error('File save failed');return playerLook();});
    await page.reload();await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act="continueGame"]').click();await page.waitForFunction(()=>screen==='game');
    assert.deepEqual(await page.evaluate(()=>playerLook()),saved);assert.equal(saved.hairS,'bald');assert.equal(saved.hat,'cap');
  });
});

test('keyboard movement works in all four directions', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startGame(page);
    const position = await page.evaluate(() => {
      Scene.place('street', 'start');
      Move.refresh();
      const w = curScene().walk;
      for (let y = w[1] + 16; y < w[3] - 16; y += 4) for (let x = w[0] + 16; x < w[2] - 16; x += 4) {
        if ([[0,0],[14,0],[-14,0],[0,14],[0,-14]].every(([dx,dy]) => !Move.blocked(x+dx,y+dy))) return { x, y };
      }
      throw new Error('No clear movement fixture found');
    });
    for (const [key, dir, axis, sign] of [['ArrowRight','right','x',1], ['ArrowLeft','left','x',-1], ['ArrowDown','down','y',1], ['ArrowUp','up','y',-1]]) {
      await page.evaluate(p => { state.player.x = p.x; state.player.y = p.y; runtime.path = null; View.snap(); }, position);
      await page.keyboard.down(key);
      await page.waitForTimeout(120);
      await page.keyboard.up(key);
      const result = await page.evaluate(() => ({ x: state.player.x, y: state.player.y, dir: state.player.dir }));
      assert.equal(result.dir, dir);
      assert.ok((result[axis] - position[axis]) * sign > 0, `${dir} movement did not advance the player`);
    }
  });
});

test('wardrobe appearance and progress survive save, reload, and Continue', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startGame(page, 'Save Gardener');
    await page.evaluate(() => {
      ACT.wardrobe();
      ACT.wear('hairS:ponyhi');
      ACT.wear('hairC:#3e9f7a');
      ACT.wear('shirt:flannel');
      ACT.wear('extra:freckles');
      closePanel();
      state.player.testGraphicsMarker = 'retained';
      if (!SaveSys.now('browser smoke test')) throw new Error('Save write failed');
    });
    const original = await page.evaluate(() => ({ look: playerLook(), scene: state.scene, day: state.day, plants: state.plants, marker: state.player.testGraphicsMarker }));
    await page.reload();
    await page.locator('[data-act="continueGame"]').click();
    await page.waitForFunction(() => screen === 'game' && state);
    const loaded = await page.evaluate(() => ({ look: playerLook(), scene: state.scene, day: state.day, plants: state.plants, marker: state.player.testGraphicsMarker }));
    assert.deepEqual(loaded, original);
  });
});

test('authored cast and all haircuts render without changing their appearance data', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startGame(page);
    const result = await page.evaluate(() => {
      const looks = [playerLook(), ROOMMATE.look, ...Object.keys(NB_DEF).map(nbLook), ...Object.values(CAST_DEF).map(d => ({ ...d.look, short: !!d.kid })), ...Object.values(NPC_LOOK), ...GUESTS.map(g => g.look), ...Object.values(CHANNELS).map(d => d.look)];
      const before = JSON.stringify(looks);
      let frames = 0;
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      for (const look of looks) {
        for (const dir of ['down','up','left','right']) for (let f = 0; f < 4; f++) {
          const sprite = charSprite(look, dir, f, 0, 0, 0);
          if (!sprite.getContext('2d').getImageData(0,0,sprite.width,sprite.height).data.some(v => v)) throw new Error('An empty sprite was returned');
          frames++;
        }
        drawPortrait(cv, look);
        if (!cv.getContext('2d').getImageData(0,0,64,64).data.some(v => v)) throw new Error('An empty portrait was returned');
      }
      for (const [hairS] of HAIRS) for (const dir of ['down','up','left','right']) { charSprite({ ...playerLook(), hairS }, dir, 1, 0, 0, 0); frames++; }
      return { appearanceUnchanged: JSON.stringify(looks) === before, looks: looks.length, haircuts: HAIRS.length, frames };
    });
    assert.ok(result.looks >= 60);
    assert.equal(result.haircuts, 61);
    assert.ok(result.frames >= 1200);
    assert.equal(result.appearanceUnchanged, true);
  });
});

test('indoor and outdoor scenes render in daylight and at night', async () => {
  await withPage({ viewport: { width: 1280, height: 800 } }, async page => {
    await startGame(page);
    const rendered = await page.evaluate(() => {
      const scenes = ['bedroom','hallway','street','park','westway','town','cgarden'];
      let count = 0;
      for (const scene of scenes) for (const minute of [720, 1260]) {
        Scene.place(scene, 'start'); state.minute = minute;
        View.ensureWorld(); RoomArt.hits = [];
        curScene().draw(View.wctx, runtime.t);
        View.render();
        if (!View.wctx.getImageData(0,0,View.world.width,View.world.height).data.some(v=>v)) throw new Error(`${scene} rendered empty`);
        count++;
      }
      return count;
    });
    assert.equal(rendered, 14);
    await page.screenshot({ path: path.join(artifacts, 'night-community-garden.png') });
  });
});

for (const [name, viewport] of [['portrait', {width:390,height:844}], ['landscape', {width:844,height:390}]]) {
  test(`mobile ${name} creation, gameplay, and viewport layout`, async () => {
    await withPage({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, async page => {
      await startGame(page);
      const dimensions = await page.evaluate(() => {
        const r = $('#room').getBoundingClientRect();
        return { width: r.width, height: r.height, viewport: innerWidth, document: document.documentElement.scrollWidth, pixels: View.wctx.getImageData(0,0,View.world.width,View.world.height).data.some(v=>v) };
      });
      assert.ok(dimensions.width > 100 && dimensions.height > 80);
      assert.ok(dimensions.document <= dimensions.viewport + 1, 'Unexpected horizontal page overflow');
      assert.equal(dimensions.pixels, true);
      await page.screenshot({ path: path.join(artifacts, `mobile-${name}.png`) });
    });
  });
}
