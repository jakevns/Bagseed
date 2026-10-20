const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright');

// Commenting on a Sprout post, posting a clip and opening Trellis used to repaint every
// feed photo through the illustrated plant renderer on each refresh (seconds per click
// on a phone), and every Trellis thumbnail stored an unused plant image in the save.
test('Sprout and Trellis stay responsive and stop growing the save with unused clip images',async()=>{
  const {createStaticServer}=await import('../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
    const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
    await page.evaluate(()=>window.BagseedPlants&&BagseedPlants.ready);
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Feed Fixture');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2400);
    await page.evaluate(()=>{settings.speed=0;runtime.pauseHelpShown=true;ACT.tipOff();runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();for(let d=0;d<20;d++)newDay();closePanel();});

    // Feed photos fill in over a few frames, then match a direct render exactly.
    await page.evaluate(()=>Panels.sprout('feed'));await page.waitForTimeout(3000);
    const photos=await page.evaluate(()=>{const h=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i++)s=(s*31+d[i])>>>0;return s;};
      return [...document.querySelectorAll('#panelBody canvas[data-draw^="npcpost"]')].map(cv=>{const f=state.social.feed[+cv.dataset.draw.split(':')[1]],o=Photo115.npc(f),fresh=document.createElement('canvas');fresh.width=cv.width;fresh.height=cv.height;
        renderPhoto115(fresh,Object.assign(demoPlant(f.lineId,o.stage,f.seed),{name:'',loc:'tent2',lightTier:3,organic:false,pest:{type:null,lvl:0}}),o);return h(cv)===h(fresh);});});
    assert.ok(photos.length>=6,'the fixture feed shows neighbor photos');
    assert.ok(photos.every(Boolean),'a cached feed photo differs from the frozen photo');

    // Opening a comment and choosing a tone no longer repaints the feed's photos.
    const timing=await page.evaluate(()=>{let painted=0;const build=PlantArt.build;PlantArt.build=function(){painted++;return build.apply(this,arguments);};
      try{let t=performance.now();document.querySelector('[data-act=sproutReply]').click();const reply=performance.now()-t;
        t=performance.now();document.querySelector('[data-act=sproutComment]').click();return {reply,tone:performance.now()-t,painted};}finally{PlantArt.build=build;}});
    assert.equal(timing.painted,0,'feed photos were repainted on a comment');
    assert.ok(timing.reply<500&&timing.tone<800,`comment interactions took ${Math.round(timing.reply)} / ${Math.round(timing.tone)} ms`);

    // Posting a clip stays quick once the feed is open.
    const post=await page.evaluate(()=>{const pl=demoPlant(LINES[0].id,6,77,{id:'feed_fixture',name:'Feed Fixture',loc:'closet',age:30});state.plants[pl.id]=pl;state.player.energy=100;
      closePanel();Panels.sprout('new');runtime.photo=Object.assign(runtime.photo||{},{pid:pl.id,angle:'front',zoom:1,filter:'none',bg:'tent',format115:'clip',tags:[],caption:'Veg clip'});
      const t=performance.now();ACT.postPhoto();const p=state.social.posts[0],m=Clip115.S()[p.id];return {ms:performance.now()-t,clip:p.format115,snapshot:!!(m&&m.png&&m.art)};});
    assert.equal(post.clip,'clip');assert.ok(post.snapshot,'a clip of your own plant keeps its frozen snapshot');
    assert.ok(post.ms<1500,`posting a clip took ${Math.round(post.ms)} ms`);

    // Trellis thumbnails without a recorded plant add no image to the save.
    const trellis=await page.evaluate(async()=>{closePanel();Panels.trellis();for(const t of ['channels','live','mine','home'])document.querySelector(`[data-act=trTab][data-arg=${t}]`)?.click();
      const media=Object.values(Clip115.S()).filter(m=>!m.post?.snap);return {count:media.length,withImage:media.filter(m=>m.png||m.art).length};});
    assert.ok(trellis.count>=8,'Trellis recorded its videos');assert.equal(trellis.withImage,0,'Trellis videos stored unused plant images');

    // Watching a video still plays it.
    await page.evaluate(()=>{Panels.trellisVideo('v1');document.querySelector('[data-act=trWatch]').click();});await page.waitForTimeout(600);
    assert.ok(await page.evaluate(()=>runtime.clip115?.id==='v1'&&runtime.clip115.playing&&runtime.clip115.time>0),'the lesson clip is playing');

    // Older saves drop the unused images on load and keep the rest of the record.
    const pruned=await page.evaluate(()=>{const s=JSON.parse(JSON.stringify(state)),m=Object.values(s.completion115.media).find(m=>!m.post?.snap);m.png='data:image/png;base64,AAAA';m.art={w:1,h:1,ax:0,ay:0};
      const n=SocialSpeed1151.prune(s);return {n,png:m.png,plant:!!m.plant,own:Object.values(s.completion115.media).filter(m=>m.post?.snap).every(m=>m.png)};});
    assert.equal(pruned.n,1);assert.equal(pruned.png,null);assert.ok(pruned.plant&&pruned.own);
    assert.deepEqual(errors,[]);
  }finally{if(browser)await browser.close();server.close();}
});
