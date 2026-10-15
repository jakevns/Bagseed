const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');

test('community main menu fits desktop/phone layouts and preserves keyboard, settings, import, new game and Continue', async () => {
  const { createStaticServer } = await import('../tools/server.mjs');
  const server = createStaticServer(); await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const out=path.join(__dirname,'../artifacts/main-menu');fs.mkdirSync(out,{recursive:true});
  let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH || '/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.evaluate(()=>Promise.all([BagseedMenu.ready,BagseedArt.ready,BagseedBedroom.ready,BagseedBeds.ready,BagseedDesks.ready]));
    assert.equal(await page.locator('#btnContinue').isDisabled(),true);
    assert.equal(await page.locator('#titleCanvas').isVisible(),false);
    assert.equal(await page.locator('#screen-title h1').innerText(),'Bagseed');
    assert.equal(await page.locator('#screen-title .title-actions button').count(),4);
    const sizes=[[1440,960,'desktop'],[1280,800,'laptop'],[390,844,'phone'],[375,667,'small-phone'],[844,390,'landscape-phone'],[320,568,'narrow-phone']];
    const layouts=[];
    for(const [width,height,name] of sizes) {
      await page.setViewportSize({width,height});await page.waitForTimeout(100);
      layouts.push(await page.evaluate(({width,height})=>{
        const shell=document.querySelector('.menu-shell').getBoundingClientRect();
        if(document.documentElement.scrollWidth>innerWidth) throw Error('Horizontal page overflow');
        const buttons=[...document.querySelectorAll('#screen-title .title-actions button')];
        for(const button of buttons) {
          const r=button.getBoundingClientRect();
          if(r.x<0 || r.y<0 || r.right>innerWidth+1 || r.bottom>innerHeight+1) throw Error('Menu control clipped: '+button.textContent);
          if(r.height<44 || r.width<160) throw Error('Menu target too small');
          if(button.scrollWidth>button.clientWidth+1) throw Error('Button label clipped');
          if(r.left<shell.left || r.right>shell.right) throw Error('Button outside menu panel');
          if(!button.disabled) {
            for(const x of [r.left+8, r.left+r.width/2, r.right-8]) {
              if(document.elementFromPoint(x,r.top+r.height/2)?.closest('button')!==button) throw Error('Menu decoration blocks a button');
            }
          }
        }
        if(width<=700) {
          const cv=document.getElementById('menuScene');
          if(!cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data.some((v,i)=>i%4===3&&v)) throw Error('Phone scene is blank');
          if(getComputedStyle(cv).objectFit!=='cover') throw Error('Phone scene proportions distorted');
          const details=[...document.querySelectorAll('[data-menu-detail]')];
          if(details.length!==6) throw Error('Mobile detail pieces missing');
          for(const detail of details) {
            const style=getComputedStyle(detail),r=detail.getBoundingClientRect();
            if(style.display==='none' || style.pointerEvents!=='none') throw Error('Mobile detail hidden or intercepts touches');
            if(Math.abs(r.width/r.height-detail.width/detail.height)>.01) throw Error('Mobile detail stretched');
            if(!detail.getContext('2d').getImageData(0,0,detail.width,detail.height).data.some((v,i)=>i%4===3&&v)) throw Error('Mobile detail blank');
          }
        } else if([...document.querySelectorAll('[data-menu-detail]')].some(detail=>getComputedStyle(detail).display!=='none')) {
          throw Error('Mobile details changed desktop layout');
        }
        return {width,height,buttons:buttons.length,art:BagseedMenu.loaded};
      },{width,height}));
      await page.screenshot({path:path.join(out,`${name}.png`)});
    }
    await page.setViewportSize({width:1280,height:800});
    await page.locator('#screen-title [data-act=openSettings]').click();
    assert.match(await page.locator('#panelTitle').innerText(),/Settings|Menu/);
    await page.locator('#panel [data-act=closePanel]').click();
    await page.locator('#screen-title [data-act=importSave]').click();
    await page.locator('#importText').fill('not a save');
    await page.locator('[data-act=importPaste]').click();
    assert.match(await page.locator('#importMsg').innerText(),/valid|save/i);
    assert.equal(await page.evaluate(()=>state),null);
    await page.locator('#panel [data-act=closePanel]').click();
    await page.locator('#screen-title [data-act=newGame]').focus();await page.keyboard.press('Enter');
    await page.locator('#crName').fill('Menu Neighbor');await page.locator('[data-act=startGame]').click();
    await page.waitForTimeout(2400);
    const exported=await page.evaluate(()=>{
      settings.speed=0;state.tut.on=false;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];
      if(runtime.curDialog) ACT.dlg(0);closePanel();state.day=9;state.money=731;
      const text=SaveSys.exportText();ACT.toTitle();return text;
    });
    assert.equal(await page.locator('#btnContinue').isDisabled(),false);
    assert.match(await page.locator('#btnContinue').innerText(),/9/);
    await page.setViewportSize({width:1440,height:960});
    await page.evaluate(()=>document.getElementById('toasts').replaceChildren());
    await page.screenshot({path:path.join(out,'desktop-with-save.png')});
    await page.locator('#btnContinue').click();
    assert.deepEqual(await page.evaluate(()=>({name:state.player.name,day:state.day,money:state.money,scene:state.scene})),{name:'Menu Neighbor',day:9,money:731,scene:'bedroom'});
    await page.evaluate(()=>ACT.toTitle());
    await page.locator('#screen-title [data-act=importSave]').click();
    await page.locator('#importText').fill(exported);await page.locator('[data-act=importPaste]').click();
    await page.getByRole('button',{name:'Import it',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>[screen,state.player.name,state.day,state.money]),['game','Menu Neighbor',9,731]);
    assert.equal(await page.locator('#screen-title').isVisible(),false);
    assert.equal(await page.evaluate(()=>document.getElementById('menuArtwork').naturalWidth>0),true);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({layouts,keyboard:true,settings:true,invalidImportPreservedState:true,validImport:true,continuePreservedProgress:true,errors},null,2));
  } finally {await browser?.close();await new Promise(r=>server.close(r));}
});
