const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');

test('desk stacking and the pegboard top remain usable with aligned saved decorations', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const out = path.join(__dirname, '../artifacts/desk-tabletop-placement'); fs.mkdirSync(out, {recursive:true});
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium'});
    const page = await browser.newPage({viewport:{width:1440,height:1000}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`); await page.evaluate(()=>BagseedDesks.ready);
    await page.locator('[data-act=newGame]').click(); await page.locator('#crName').fill('Tabletop Fixture');
    await page.locator('[data-act=startGame]').click(); await page.waitForTimeout(2400);
    await page.evaluate(()=>{
      settings.speed=0; settings.reduced=true; state.tut.on=false; runtime.pauseHelpShown=true; ACT.tipOff();
      runtime.dialogQ=[]; if(runtime.curDialog) ACT.dlg(0); closePanel(); state.minute=720;
      state.room.placed=[]; state.room.own.lavalamp=3; state.room.own.succulent=1; state.room.own.moonlamp=1;
    });
    const layouts = await page.evaluate(()=>{
      const before=JSON.stringify(state), hold=runtime.deco; let count=0;
      try {
        runtime.deco={zone:'bedroom'};
        for(let tier=0;tier<3;tier++) for(let mask=0;mask<16;mask++) {
          state.gear.workbench=tier; state.inv.synth=mask&1?1:0; state.inv.organic=mask&2?1:0;
          Feed.S().batches=mask&4?[{uses:1,line:'synthetic'}]:[]; state.inv.phpen=!!(mask&8);
          const edge=DecoZ.check('lavalamp',227,67.5,null,{rot:0});
          if(!edge.ok || edge.y+DECOR.lavalamp.h!==74.5) throw Error('Lamp does not rest on tabletop');
          const middle=DecoZ.check('lavalamp',258,67.5,null,{rot:0});
          if(!middle.ok) throw Error('Existing tabletop placement was restricted');
          const available=DecoZ.surfaces('bedroom');
          if(available.find(s=>s.name==='bench').y!==74.5) throw Error('Wrong bench surface');
          if(available.some(s=>s.name==='sill') !== (tier!==2)) throw Error('Covered sill remains available');
          const upper=DecoZ.check('lavalamp',258,tier===2?45:49,null,{rot:0});
          if(!upper.ok || upper.y+14!==(tier===2?52:56)) throw Error('Upper decoration surface is missing');
          if(tier===2 && upper.on!=='benchTop') throw Error('Lamp must stay attached above the pegboard');
          count++;
        }
        state.room.placed=[{uid:'movable-table',id:'pottingbench',x:100,y:124}];
        const stacked=DecoZ.check('lavalamp',110,125,null,{rot:0});
        if(!stacked.ok || stacked.on!=='movable-table' || stacked.y+14!==132) throw Error('Custom furniture stacking changed');
      } finally {state=JSON.parse(before);runtime.deco=hold;}
      return count;
    });
    assert.equal(layouts,48);
    await page.evaluate(()=>{
      state.gear.workbench=2; state.inv.synth=1; state.inv.organic=1; state.inv.phpen=true;
      Feed.S().batches=[{uses:1,line:'synthetic'}];
      state.room.placed=[{uid:'floating-lamp',id:'lavalamp',x:256,y:42},
        {uid:'old-top-lamp',id:'lavalamp',x:284,y:66},
        {uid:'custom-shelf-item',id:'moonlamp',x:230,y:42,on:'custom-shelf'},
        {uid:'other-desk-item',id:'moonlamp',x:206,y:66}];
      SaveSys.now('legacy tabletop alignment fixture');
    });
    await page.reload(); await page.evaluate(()=>BagseedDesks.ready); await page.locator('[data-act=continueGame]').click();
    const migrated=await page.evaluate(()=>{
      settings.speed=0; ACT.tipOff(); runtime.dialogQ=[]; if(runtime.curDialog)ACT.dlg(0); closePanel();
      const records=JSON.stringify(state.room.placed); V115init.run(state,false,false);
      return {same:records===JSON.stringify(state.room.placed),placed:state.room.placed};
    });
    assert.equal(migrated.same,true,'Alignment must be idempotent');
    const above=migrated.placed.find(d=>d.uid==='floating-lamp');
    assert.equal(above.y+14,52);assert.equal(above.on,'benchTop');assert.equal(above.x,256,'Keep the lamp above the pegboard in its chosen horizontal position');
    const lower=migrated.placed.find(d=>d.uid==='old-top-lamp');
    assert.equal(lower.y+14,74.5);assert.equal(lower.on,'bench');assert.equal(lower.x,284);
    assert.deepEqual(migrated.placed.find(d=>d.uid==='custom-shelf-item'),{uid:'custom-shelf-item',id:'moonlamp',x:230,y:42,on:'custom-shelf'});
    assert.equal(migrated.placed.find(d=>d.uid==='other-desk-item').y,66);
    // Place through the actual decoration controls and confirm the saved base.
    await page.evaluate(()=>{state.room.placed=[]; Deco.open();});
    for(const [id,x,y] of [['lavalamp',258,45],['succulent',240,49],['moonlamp',277,47]]) {
      await page.locator(`[data-act=decoPick][data-arg=${id}]`).click();
      await page.evaluate(([x,y])=>{Deco.move(x,y);Deco.render();},[x,y]);
      await page.locator('[data-act=decoPlace]').click();
    }
    await page.locator('[data-act=decoDone]').click();
    assert.equal(await page.evaluate(()=>state.room.placed[0].y+14),52);
    await page.reload();await page.evaluate(()=>BagseedDesks.ready);await page.locator('[data-act=continueGame]').click();
    assert.deepEqual(await page.evaluate(()=>state.room.placed.map(d=>[d.on,d.y+decorDef(d.id).h])),[['benchTop',52],['benchTop',52],['benchTop',52]]);
    const switched=await page.evaluate(()=>{
      state.gear.workbench=0;V115init.run(state,false,false);
      const sill=state.room.placed.every(d=>d.y+decorDef(d.id).h===56 && d.on!=='benchTop');
      state.gear.workbench=2;V115init.run(state,false,false);
      return {sill,top:state.room.placed.every(d=>d.y+decorDef(d.id).h===52 && d.on==='benchTop')};
    });
    assert.deepEqual(switched,{sill:true,top:true});
    const samples=await page.evaluate(()=>{
      settings.speed=0;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
      const before=JSON.stringify(state),hits=RoomArt.hits,result=[];
      try {
        state.inv.synth=1;state.inv.organic=1;state.inv.phpen=true;Feed.S().batches=[{uses:1,line:'synthetic'}];
        for(let tier=0;tier<3;tier++) {
          state.gear.workbench=tier;
          const c=document.createElement('canvas');c.width=560;c.height=532;
          const g=c.getContext('2d');g.scale(7,7);g.translate(-218,-30);
          drawBackground(g);RoomArt.drawBench(g,0);
          if(tier===2) for(const d of state.room.placed) drawDecor(g,d,0);
          else drawDecor(g,{id:'lavalamp',x:225,y:60.5},0);
          result.push({name:EQ.workbench[tier].name,image:c.toDataURL()});
        }
      } finally {state=JSON.parse(before);RoomArt.hits=hits;}
      return result;
    });
    fs.writeFileSync(path.join(out,'pegboard-top-preview.png'),Buffer.from(samples[2].image.split(',')[1],'base64'));
    const board=await browser.newPage({viewport:{width:1192,height:1150}});
    await board.setContent(`<style>body{margin:0;padding:24px;background:#f4efdf;color:#254537;font:18px Georgia}h1{margin:0 0 8px}main{display:grid;grid-template-columns:repeat(2,560px);gap:16px}article{background:#fffaf0;border:1px solid #c4cbb4;border-radius:10px;overflow:hidden}h2{margin:12px;font-size:21px}img{display:block;width:560px;height:532px}</style><h1>Supplies + decorations on the desk</h1><p>Actual game rendering · Gardener's Bench keeps its upper ledge</p><main>${samples.map(s=>`<article><h2>${s.name}</h2><img src="${s.image}"></article>`).join('')}</main>`);
    await board.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
    await board.screenshot({path:path.join(out,'tabletop-preview.png'),fullPage:true});await board.close();
    await page.evaluate(()=>{View.snap();});await page.waitForTimeout(100);
    fs.writeFileSync(path.join(out,'room.png'),Buffer.from(await page.evaluate(()=>View.world.toDataURL().split(',')[1]),'base64'));
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({layouts,migrated:migrated.placed,idempotent:true,saveReload:true,upperDecorations:3,customStacking:true,tierSwitching:switched,errors},null,2));
  } finally {await browser?.close();await new Promise(r=>server.close(r));}
});
