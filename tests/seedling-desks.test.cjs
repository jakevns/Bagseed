const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');

test('all three seedling desks share room/store/package art and preserve purchases, supplies, mixing and saves', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const out = path.join(__dirname, '../artifacts/seedling-desks'); fs.mkdirSync(out, { recursive: true });
  try {
    browser = await chromium.launch({ executablePath: process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.evaluate(() => BagseedDesks.ready);
    await page.locator('[data-act=newGame]').click(); await page.locator('#crName').fill('Desk Fixture');
    await page.locator('[data-act=startGame]').click(); await page.waitForTimeout(2400);
    await page.evaluate(() => {
      settings.speed = 0; settings.reduced = true; state.tut.on = false; runtime.pauseHelpShown = true; ACT.tipOff();
      runtime.dialogQ = []; if (runtime.curDialog) ACT.dlg(0); closePanel();
      state.minute = 720; state.money = 1000; state.sale.day = -1; updateHUD();
    });
    const report = await page.evaluate(() => {
      const before = JSON.stringify(state), hits = RoomArt.hits, frames = [], previews = [];
      try {
        for (let tier = 0; tier < 3; tier++) {
          const cv = document.createElement('canvas'); cv.width = 240; cv.height = 180;
          const g = cv.getContext('2d'); g.scale(3, 3); Gear.bench(g, 6, 34, tier);
          const pixels = g.getImageData(0, 0, 240, 180).data;
          const opaque = pixels.filter((v, i) => i % 4 === 3 && v > 180).length;
          if (opaque < 5000) throw Error('Empty desk sprite');
          // All feet and the complete pegboard must fit inside the preview.
          for (const [x, y, w, h] of [[0,0,240,1],[0,179,240,1],[0,0,1,180],[239,0,1,180]]) {
            if (g.getImageData(x,y,w,h).data.some((v,i) => i%4===3 && v)) throw Error('Clipped sprite');
          }
          frames.push(cv.toDataURL());
          const icon = document.createElement('canvas'); icon.width = 96; icon.height = 64;
          drawGearIcon(icon.getContext('2d'), icon, 'workbench', tier);
          const expected = document.createElement('canvas'); expected.width = 240; expected.height = 180;
          const e = expected.getContext('2d'); e.fillStyle = '#1a2420'; e.fillRect(0,0,240,180); e.scale(3,3); Gear.bench(e,6,34,tier);
          if (icon.toDataURL() !== expected.toDataURL()) throw Error('Preview differs from room frame');
          if (icon.width !== 240 || icon.height !== 180) throw Error('Wrong preview proportions');
          previews.push(icon.toDataURL());
          state.gear.workbench = tier; RoomArt.hits = [];
          const room = document.createElement('canvas'); room.width=ROOM.W*3; room.height=ROOM.H*3;
          const r=room.getContext('2d'); r.scale(3,3); RoomArt.drawBench(r,0);
          const hit=RoomArt.hits.find(h=>h.id==='bench');
          if (JSON.stringify([hit.x,hit.y,hit.w,hit.h]) !== '[224,68,68,16]') throw Error('Mixing interaction moved');
          if (!RoomArt.hits.some(h=>h.id==='storage') || !RoomArt.hits.some(h=>h.id==='box')) throw Error('Storage/supply box missing');
          const withSupplies=room.toDataURL(); state.inv.synth = state.inv.synth ? 0 : 1;
          r.clearRect(0,0,ROOM.W,ROOM.H); RoomArt.drawBench(r,0);
          if (room.toDataURL() === withSupplies) throw Error('Supplies no longer react to inventory');
        }
      } finally { state = JSON.parse(before); RoomArt.hits = hits; }
      return { loaded: BagseedDesks.loaded, frames: new Set(frames).size, previews: new Set(previews).size,
        unchanged: JSON.stringify(state) === before, catalog: EQ.workbench.map(it=>[it.name,it.price,it.mix]) };
    });
    assert.deepEqual(report, { loaded: true, frames: 3, previews: 3, unchanged: true,
      catalog: [['Folding Card Table',0,0],['Used Writing Desk',49,.05],["Gardener's Bench",149,.12]] });
    const layout = await page.evaluate(() => {
      const before = JSON.stringify(state), samples = []; let checked = 0;
      const batches = Feed.S().batches;
      try {
        for (let tier = 0; tier < 3; tier++) for (let mask = 0; mask < 16; mask++) {
          state.gear.workbench = tier;
          state.inv.synth = mask & 1 ? 1 : 0; state.inv.organic = mask & 2 ? 1 : 0;
          state.inv.phpen = !!(mask & 8);
          Feed.S().batches = mask & 4 ? [{ uses: 1, line: 'synthetic' }] : [];
          const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300;
          const g = cv.getContext('2d'); g.scale(5,5); Gear.bench(g,6,34,tier);
          const boxes = [], draw = g.drawImage.bind(g);
          g.drawImage = (...args) => { boxes.push(args.slice(5)); draw(...args); };
          const snapshot = JSON.stringify(state);
          Gear.benchSupplies(g,6,34);
          if (JSON.stringify(state) !== snapshot) throw Error('Supplies rendering changes inventory');
          if (boxes.length !== 3 + [1,2,4,8].filter(bit=>mask&bit).length) throw Error('Incorrect visible supplies');
          const left = boxes[0][0], right = boxes.at(-1)[0] + boxes.at(-1)[2];
          if (Math.abs((left+right)/2 - 40) > .001) throw Error('Supplies are not centered');
          if (left < 12 || right > 74) throw Error('Supplies extend to tabletop edges');
          let last = left - 2;
          for (const [x,y,w,h] of boxes) {
            if (x-last < 1.99 || Math.abs(y+h-28.5) > .001) throw Error('Supplies overlap or float');
            last = x+w;
          }
          checked++;
          if (mask === 0 || mask === 15) samples.push({ tier, stocked: mask === 15, image: cv.toDataURL() });
        }
      } finally { Feed.S().batches = batches; state = JSON.parse(before); }
      return { checked, samples };
    });
    assert.equal(layout.checked,48);
    const preview = await browser.newPage({viewport:{width:1296,height:910},deviceScaleFactor:1});
    await preview.setContent(`<style>body{margin:0;padding:24px;background:#f4efdf;color:#254537;font:18px Georgia}h1{margin:0 0 8px}p{margin:0 0 20px}main{display:grid;grid-template-columns:repeat(3,400px);gap:16px}article{border:1px solid #c4cbb4;border-radius:12px;background:#fffaf0;text-align:center;padding:8px 0}h2{font-size:21px;margin:4px}small{color:#66705b}img{display:block;width:400px;height:300px}</style><h1>Centered seedling desk supplies</h1><p>Actual game artwork · Everyday supplies above, fully stocked below</p><main>${[false,true].flatMap(stocked=>layout.samples.filter(s=>s.stocked===stocked).map(s=>`<article><h2>${report.catalog[s.tier][0]}</h2><small>${stocked?'Fully stocked':'Everyday supplies'}</small><img src="${s.image}"></article>`)).join('')}</main>`);
    await preview.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
    await preview.screenshot({path:path.join(out,'centered-supplies-preview.png'),fullPage:true}); await preview.close();
    for (let tier=0;tier<3;tier++) {
      await page.evaluate(tier=>{state.gear.workbench=tier; closePanel(); View.snap();},tier);
      await page.waitForTimeout(100);
      fs.writeFileSync(path.join(out, `room-${tier}.png`), Buffer.from(await page.evaluate(()=>View.world.toDataURL().split(',')[1]),'base64'));
    }
    await page.evaluate(()=>{state.gear.workbench=0; Panels.app('leafcart');});
    await page.locator('[data-act=shopCat][data-arg=desk]').click();
    const storeImages = {};
    for (const tier of [1,2]) {
      const cv=page.locator(`#panelBody canvas[data-draw="gear:workbench:${tier}"]`), card=cv.locator('..');
      await cv.scrollIntoViewIfNeeded();
      assert.deepEqual(await cv.evaluate(c=>[c.width,c.height]),[240,180]);
      storeImages[tier]=await cv.evaluate(c=>c.toDataURL());
      await card.screenshot({path:path.join(out,`store-${tier}.png`)});
      await card.locator(`[data-act=cartAdd115][data-arg="eq:workbench:${tier}"]`).click();
    }
    await page.locator('[data-act=cartCheckout115][data-arg=leafcart]').click();
    assert.deepEqual(await page.evaluate(()=>({money:state.money,keys:state.orders.map(o=>o.key)})),
      {money:802,keys:['eq:workbench:1','eq:workbench:2']});
    for (const tier of [1,2]) {
      await page.evaluate(tier=>{
        const i=state.orders.findIndex(o=>o.key==='eq:workbench:'+tier);
        state.packages.push(state.orders.splice(i,1)[0]); Panels.pkg(state.packages.length-1);
      },tier);
      await page.locator('[data-act=pkgOpen115]').click();
      const cv=page.locator(`#panelBody canvas[data-draw="gear:workbench:${tier}"]`);
      assert.equal(await cv.evaluate(c=>c.toDataURL()),storeImages[tier]);
      await page.locator('#panelBody').screenshot({path:path.join(out,`package-${tier}.png`)});
      await page.locator('[data-act=gearInstallPkg]').click();
      assert.equal(await page.evaluate(()=>state.gear.workbench),tier);
      await page.evaluate(()=>{closePanel(); interact('bench');});
      assert.equal(await page.locator('#panelTitle').innerText(),tier===1?'Used Writing Desk':"Gardener's Bench");
      assert.match(await page.locator('#panelBody').innerText(),/mix|nutrients/i);
    }
    await page.evaluate(()=>{closePanel(); SaveSys.now('seedling desk fixture');});
    await page.reload(); await page.evaluate(()=>BagseedDesks.ready);
    await page.locator('[data-act=continueGame]').click();
    assert.equal(await page.evaluate(()=>state.gear.workbench),2);
    await page.evaluate(()=>{settings.speed=0; ACT.tipOff(); runtime.dialogQ=[]; if(runtime.curDialog) ACT.dlg(0); closePanel(); Panels.app('leafcart');});
    await page.locator('[data-act=shopCat][data-arg=desk]').click();
    await page.setViewportSize({width:390,height:844});
    const phone=page.locator('canvas[data-draw="gear:workbench:2"]'); await phone.scrollIntoViewIfNeeded();
    await phone.locator('..').screenshot({path:path.join(out,'store-phone.png')});
    assert.ok(Math.abs(await phone.evaluate(c=>{const r=c.getBoundingClientRect();return r.width/r.height;})-4/3)<.01);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,supplyLayouts:layout.checked,purchaseTotal:198,finalTier:2,errors},null,2));
  } finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
});
