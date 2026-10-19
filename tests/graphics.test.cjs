const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/production');
let browser,server,base;
before(async()=>{
  fs.mkdirSync(OUT,{recursive:true});const {createStaticServer}=await import('../tools/server.mjs');const app=createStaticServer();
  server=http.createServer((req,res)=>{if(new URL(req.url,'http://localhost').pathname==='/__baseline.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(ROOT,'baselines/Bagseed_v1.1.5.1_Night_Walker_Flashlights_Update.html')));}else app.emit('request',req,res);});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium'});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function pageFor(fn){const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});try{await page.goto(base);await page.evaluate(()=>BagseedArt.ready);await fn(page);assert.deepEqual(errors,[]);}finally{await context.close();}}
async function start(page){await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Graphics Fixture');await page.locator('[data-act=startGame]').click();await page.waitForTimeout(2200);await page.evaluate(()=>{settings.speed=0;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);state.tut.on=false;$('#tip').hidden=true;closePanel();});}

test('a save created by the original flashlight build loads with appearance and progress intact',async()=>{
  await pageFor(async page=>{
    await page.goto(base+'/__baseline.html');await start(page);
    const saved=await page.evaluate(()=>{state.money=1234.5;state.player.graphicsFixture='original-build-save';if(!SaveSys.now('original graphics compatibility fixture'))throw Error('Fixture save failed');return {look:playerLook(),day:state.day,money:state.money,scene:state.scene,plants:state.plants,inventory:state.inv,marker:state.player.graphicsFixture};});
    await page.goto(base);await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game'&&state?.player?.graphicsFixture==='original-build-save');
    const loaded=await page.evaluate(()=>({look:playerLook(),day:state.day,money:state.money,scene:state.scene,plants:state.plants,inventory:state.inv,marker:state.player.graphicsFixture}));assert.deepEqual(loaded,saved);
  });
});

test('every hairstyle, skin palette, authored clothing design and appearance choice renders',async()=>{
  const options=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/graphics/roster-audit.json'))).options;
  await pageFor(async page=>{
    await start(page);const report=await page.evaluate(options=>{
      const original=JSON.stringify(state.player),base={...playerLook(),hairS:'ponyhi'},counts={},fingerprints=new Set();
      const check=(look,dir='down')=>{const image=charSprite(look,dir,1,0,0,0),a=image.getContext('2d').getImageData(0,0,96,108).data;if(!a.some((v,i)=>i%4===3&&v))throw Error('Blank appearance asset');return image.toDataURL();};
      for(const [hairS]of HAIRS){const url=check({...base,hairS});fingerprints.add(url);for(const dir of ['up','left','right'])check({...base,hairS},dir);}counts.haircuts=HAIRS.length;counts.distinctHaircuts=fingerprints.size;
      counts.skinTones=new Set(SKIN.map(skin=>check({...base,skin}))).size;
      counts.hairColors=new Set(HAIR_COLORS115.map(([hairC])=>check({...base,hairC}))).size;
      let designs=0;for(const d of Object.values(CL)){const look=Cloth115.thumbLook(d);for(const dir of ['down','right','up','left'])check(look,dir);designs++;}counts.clothingDesigns=designs;
      for(const [option,field]of [['face','face'],['eyes','eyes'],['brows','brows'],['nose','nose'],['mouth','mouth'],['expression','expr'],['ears','ears'],['facial','facial']]){for(const [value]of options[option])check({...base,[field]:value});counts[option]=options[option].length;}
      for(const [field,values]of [['pierce',options.piercings],['marks',options.marks]])for(const [value]of values)check({...base,[field]:[value]});
      counts.presentations=new Set(['neutral','masc','fem'].map(pres=>check({...base,pres}))).size;
      counts.bodies=new Set(['slim','average','broad','curvy','stocky','tall'].map(body=>check({...base,body}))).size;
      counts.appearanceDataUnchanged=JSON.stringify(state.player)===original;return counts;
    },options);
    assert.equal(report.haircuts,61);assert.equal(report.distinctHaircuts,61);assert.equal(report.skinTones,16);assert.equal(report.hairColors,40);assert.equal(report.clothingDesigns,240);assert.equal(report.presentations,3);assert.equal(report.bodies,6);assert.equal(report.appearanceDataUnchanged,true);
    fs.writeFileSync(path.join(OUT,'appearance-checks.json'),JSON.stringify(report,null,2)+'\n');
  });
});

test('custom outfits keep a consistent face, joined legs and a single footwear layer',async()=>{
  await pageFor(async page=>{
    const report=await page.evaluate(async()=>{
      const masks={},data=__BAGSEED_ILLUSTRATED_DATA__;
      for(const[top,item]of Object.entries(data.walk.approvedOutfits.items)){
        const canvases=[];
        for(const suffix of ['','-roles']){const im=new Image();im.src=data.images['approved-outfits/'+top+suffix];await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);canvases.push(g.getImageData(0,0,c.width,c.height));}
        for(const dir of ['down','up']){
          const [source,roles]=canvases,rect=item.frames[dir+'/idle'].rect,mask=[];
          for(let y=140;y<144;y++)for(let x=0;x<96;x++){
            const X=Math.round((48+(x-48)/BagseedArt.playerFigureScale)*3)+rect[0],Y=Math.round((143+(y-143)/BagseedArt.playerFigureScale)*3)+rect[1];let inside=true;
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const n=((Y+dy)*roles.width+X+dx)*4;if(roles.data[n]!==3||source.data[n+3]<250)inside=false;}
            mask.push(inside);
          }masks[top+'/'+dir]=mask;
        }
      }
      const base={skin:'#cf9670',hairC:'#3e9f7a',hairS:'short',facial:'none',shirtC:'#5f9c33',topS:'hoodie',pantsC:'#36405a',bottomS:'jeans',shoesC:'#2b1d14',shoesS:'sneakers',glasses:'none',hat:'none',acc:'none',pres:'neutral',body:'average',eyeC:'#2b1d14',eyes:'dot',brows:'thin',face:'soft',extras:[]};
      const region=(canvas,x,y,w,h)=>Array.from(canvas.getContext('2d').getImageData(x,y+(canvas.width===96?canvas.height-108:0),w,h).data).join(',');
      const head=region(BagseedArt.portrait(base),0,0,192,124),mismatches=[],widths={};let footChecks=0;
      // Check anatomical landmarks and material masks, not just nonblank art.
      // Keep the established modular body as the part-registration reference.
      // Approved complete paintings have separately verified source geometry.
      const redTop=charSprite({...base,topS:'tee',shirtC:'#c94f4f'},'down').getContext('2d').getImageData(0,36,96,108).data;
      let waistband=108;
      for(let y=55;y<85;y++)for(let x=44;x<53;x++){const i=(y*96+x)*4;if(redTop[i+3]>128&&redTop[i+2]>redTop[i]*1.25&&redTop[i+2]>redTop[i+1]*1.1)waistband=Math.min(waistband,y);}
      if(waistband<66||waistband>71)mismatches.push('Waistband leaves the legs too short: '+waistband);
      for(const [hairS]of HAIRS){const look={...BagseedArt.normalize(base),hairS},pixels=BagseedArt.baldBase(look,'down').getContext('2d').getImageData(0,0,192,192).data,reference=BagseedArt.baldBase({...look,hairC:'#e9e2d4'},'down').getContext('2d').getImageData(0,0,192,192).data;let changedSkin=0;
        // A natural strand may cross a cheek. The skin underneath must retain
        // its own color; visible strands must not be misclassified as skin.
        for(let y=171;y<181;y++)for(let x=88;x<106;x++){const i=(y*192+x)*4;if([0,1,2,3].some(k=>pixels[i+k]!==reference[i+k]))changedSkin++;}
        if(changedSkin)mismatches.push('Hair color leaks into bald face anatomy: '+hairS+' '+changedSkin);
      }
      const tops=['tee','tank','hoodie','flannel','sweater','cardigan','overalls','work','crop','jacket','garden','pjs','labcoat','suit','officer'];
      for(const topS of tops)if(region(BagseedArt.portrait({...base,topS}),0,0,192,124)!==head)mismatches.push('face changed with '+topS);
      for(const dir of ['down','right','up','left']){
        // These width floors guard the legacy modular leg fit. The approved
        // slimmer full paintings are checked against their exact source PNGs.
        const image=charSprite({...base,topS:'tee'},dir),a=image.getContext('2d').getImageData(0,image.height-108,96,108).data,rows=[];
        for(let y=84;y<97;y++){const xs=[];for(let x=0;x<96;x++)if(a[(y*96+x)*4+3]>128)xs.push(x);rows.push(xs.length?xs.at(-1)-xs[0]+1:0);}
        widths[dir]=rows.reduce((a,b)=>a+b,0)/rows.length;
        for(const shoesS of ['sneakers','boots','sandals','rainboots']){
          const look={...base,shoesS},feet=region(charSprite({...look,topS:'tee'},dir),0,104,96,4); // unchanged modular soles below the trouser hem
          for(const topS of tops)for(const bottomS of ['jeans','joggers','cargo','shorts','skirt']){
            const rendered=charSprite({...look,topS,bottomS},dir),approved=rendered.bagseedApprovedOutfit&&__BAGSEED_ILLUSTRATED_DATA__.walk.approvedOutfits?.items[topS]?.frames[dir+'/idle'];
            // Reviewed outfits have their own painted footwear geometry;
            // changing trousers must still leave exactly one identical sole.
            const expected=approved?region(charSprite({...look,topS,bottomS:'jeans'},dir),0,104,96,4):feet;
            const actual=region(rendered,0,104,96,4),mask=approved&&masks[topS+'/'+dir];
            // Authored trouser hems may cover a few sole-edge pixels. Check
            // the source-painted opaque shoe interior, not trouser pixels.
            const shoePixels=value=>value.split(',').filter((_,n)=>mask[Math.floor(n/4)]).join(',');
            if(mask){if(mask.filter(Boolean).length<5)throw Error('Empty authored shoe check');if(shoePixels(actual)!==shoePixels(expected))mismatches.push([dir,shoesS,topS,bottomS].join('/'));}
            else if(actual!==expected)mismatches.push([dir,shoesS,topS,bottomS].join('/'));
            footChecks++;
          }
        }
        for(const frame of [1,2,3]){
          const moving=charSprite(base,dir,frame).getContext('2d').getImageData(0,36,96,108).data;
          for(let y=82;y<105;y++)if(!Array.from({length:96},(_,x)=>moving[(y*96+x)*4+3]).some(a=>a>128))mismatches.push('disconnected lower body '+dir+'/'+frame+'/'+y);
        }
      }
      return {mismatches,widths,footChecks,waistband};
    });
    fs.writeFileSync(path.join(OUT,'custom-body-regressions.json'),JSON.stringify(report,null,2)+'\n');
    assert.deepEqual(report.mismatches,[]);
    assert.ok(report.widths.down>=20&&report.widths.up>=20,'Front/back trousers must fit the torso rather than becoming thin poles');
    assert.ok(report.widths.right>=14&&report.widths.left>=14,'Profile legs must keep their full width');
    assert.equal(report.footChecks,1200);
  });
});

test('a character customized through creator controls renders, plays and survives wardrobe changes and reload',async()=>{
  await pageFor(async page=>{
    await page.evaluate(()=>{SHELVED.wardrobe=false;});
    await page.locator('[data-act=newGame]').click();await page.locator('#crName').fill('Custom Gardener');
    for(const arg of ['body:broad','hairC:#3e9f7a','topS:flannel','bottomS:cargo','shoesS:boots','glasses:round'])await page.locator(`[data-act="cr"][data-arg="${arg}"]`).first().click();
    await page.locator('[data-act=crWalk][data-arg="0"]').click();
    const expected=await page.evaluate(()=>{drawCreatorPreview(0);$('#screen-create').scrollTop=0;return creatorLook(runtime.cr);});
    assert.equal(await page.locator('#creatorPreview').evaluate(c=>c.width),540);
    await page.screenshot({path:path.join(OUT,'custom-creator.png')});
    await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game');await page.waitForTimeout(2200);
    await page.evaluate(()=>{settings.speed=0;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);state.tut.on=false;$('#tip').hidden=true;closePanel();});
    const created=await page.evaluate(()=>playerLook());assert.deepEqual(created,expected);
    await page.evaluate(()=>{ACT.wardrobe();ACT.wardTab('look');CharacterUI115.mirrorDraw();});
    assert.equal(await page.locator('#panelBody canvas[data-draw="person"]').evaluate(c=>c.width),540);
    await page.screenshot({path:path.join(OUT,'custom-mirror.png')});
    await page.evaluate(()=>{ACT.wardrobe();ACT.wear('hairS:ponyhi');ACT.wear('extra:freckles');closePanel();Scene.place('street','start');View.snap();if(!SaveSys.now('custom character regression'))throw Error('Save failed');});
    const saved=await page.evaluate(()=>({look:playerLook(),sprites:['down','right','up','left'].map(d=>charSprite(playerLook(),d,1).toDataURL())}));
    await page.screenshot({path:path.join(OUT,'custom-street.png')});
    await page.reload();await page.evaluate(()=>BagseedArt.ready);await page.locator('[data-act=continueGame]').click();await page.waitForFunction(()=>screen==='game');
    const loaded=await page.evaluate(()=>({look:playerLook(),sprites:['down','right','up','left'].map(d=>charSprite(playerLook(),d,1).toDataURL())}));assert.deepEqual(loaded,saved);
    assert.equal(loaded.look.hairS,'ponyhi');assert.ok(loaded.look.extras.includes('freckles'));
  });
});

test('seating, shop counters, scene changes and Next Track remain functional',async()=>{
  await pageFor(async page=>{
    await start(page);const result=await page.evaluate(()=>{
      const draw=()=>{View.ensureWorld();RoomArt.hits=[];curScene().draw(View.wctx,runtime.t);View.render();};
      Scene.place('hallway','start');draw();Body114.sit('couch');if(!runtime.seat)throw Error('Could not sit');draw();const seated=runtime.seat.kind;Body114.stand();const stood=!runtime.seat;
      const shops=[];for(const id of Object.keys(SHOP5)){Shop5.S().shop.id=id;Scene.place('shop115','entry');draw();shops.push({id,interactions:RoomArt.hits.length});}
      Scene.place('hallway','start');draw();Body114.sit('couch');Scene.go('bedroom','start');const transitionStood=!runtime.seat;
      Sfx.init();settings.music=true;Music115.mode='normal';Music.start();const before=Music.cur?.T?.id,next=Music.nextTrack(),after=Music.cur?.T?.id;
      return {seated,stood,shops,transitionStood,music:{before,after,next,audioState:Sfx.ctx?.state}};
    });
    assert.equal(result.seated,'couch');assert.ok(result.stood&&result.transitionStood);assert.ok(result.shops.length>=8);assert.ok(result.shops.every(s=>s.interactions>0));assert.equal(result.music.next,true);assert.notEqual(result.music.after,result.music.before);
    fs.writeFileSync(path.join(OUT,'interaction-checks.json'),JSON.stringify(result,null,2)+'\n');await page.screenshot({path:path.join(OUT,'after-interactions.png')});
  });
});

test('flashlights follow illustrated hands and retain obstacle-limited beams',async()=>{
  await pageFor(async page=>{
    await start(page);const result=await page.evaluate(()=>{
      Scene.place('street','start');state.minute=1260;View.ensureWorld();const c=View.wctx,checks=[];
      for(const id of NightLamps1151.carriers){const look=CAST_DEF[id]?.look||NB_DEF[id]&&nbLook(id);if(!look)continue;
        for(const dir of ['down','right','up','left'])for(const frame of [0,1,3]){
          const a={id,x:300,y:180,dir,moving:true,look};NightLamps1151.begin(c,'street');NightLamps1151.withActor(c,a,()=>drawPerson(c,a.x,a.y,look,1,{dir,frame}));
          const recording=NightLamps1151.frames.get(c),lamp=recording.lights.get(id),h=NightLamps1151.hand(a.x,a.y,look,{dir,frame});if(!lamp)throw Error('Missing carried lamp '+id);if(Math.hypot(lamp.x-h.x,lamp.y-h.y)>6)throw Error('Detached lamp '+id);
          const polygon=NightLamps1151.cone(recording,lamp,.23,63);if(polygon.length!==12||polygon.some(p=>!p.every(Number.isFinite)))throw Error('Invalid beam');
          checks.push({id,dir,frame,hand:h,lamp:[lamp.x,lamp.y]});NightLamps1151.frames.delete(c);
        }
      }
      NightLamps1151.begin(c,'street');const recording=NightLamps1151.frames.get(c),wall=recording.solids[0];const blocked=wall?NightLamps1151.blocked(recording,wall[0]+wall[2]/2,wall[1]+wall[3]/2):null;NightLamps1151.frames.delete(c);
      return {carriers:new Set(checks.map(c=>c.id)).size,poses:checks.length,blockedWall:blocked,checks};
    });assert.ok(result.carriers>=10);assert.ok(result.poses>=120);assert.equal(result.blockedWall,true);fs.writeFileSync(path.join(OUT,'flashlight-checks.json'),JSON.stringify(result,null,2)+'\n');
  });
});

test('a live smell encounter renders the pose and dismisses with Escape',async()=>{
  await pageFor(async page=>{
    await start(page);const encounter=await page.evaluate(()=>{
      Body114.S().lastShower=simMin()-8*1440;settings.speed=1;Smell1151.quietUntil=0;Smell1151.scanAt=Infinity;
      for(const scene of ['hallway','park','cgarden','street'])for(const minute of [720,1080,600]){
        Scene.place(scene,'start');state.minute=minute;runtime.dialogQ=[];runtime.curDialog=null;runtime.dialogOpen=false;runtime.sceneBusy=false;runtime.pending=null;runtime.talk116=null;runtime.overlay=null;runtime.seat=null;
        for(const n of Smell1151.all()){
          if(n.kind==='staff')continue;state.player.x=n.view.x+18;state.player.y=n.view.y;Move.refresh();
          if(Smell1151.start(n.id)){settings.speed=0;View.ensureWorld();RoomArt.hits=[];curScene().draw(View.wctx,runtime.t);View.render();return {id:n.id,scene,dialog:runtime.curDialog?.smell1151};}
        }
      }
      throw Error('No reachable scheduled actor for a smell encounter');
    });assert.equal(encounter.dialog,true);
    // Status changes can resize the stage after the synchronous encounter draw.
    // Require the next rendered scene before recording the pose.
    await page.waitForFunction(()=>{const c=View.cv,g=c.getContext('2d'),p=g.getImageData(0,0,c.width,c.height).data,colors=new Set();for(let i=0;i<p.length;i+=64)colors.add(p[i]+','+p[i+1]+','+p[i+2]);return colors.size>30;});
    await page.screenshot({path:path.join(OUT,'smell-encounter.png')});await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>Smell1151.active===null),true);fs.writeFileSync(path.join(OUT,'smell-check.json'),JSON.stringify({...encounter,dismissedWithEscape:true},null,2)+'\n');
  });
});
