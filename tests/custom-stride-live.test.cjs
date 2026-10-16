const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
test('approved custom side stride is live in file game, creator and mirror',{timeout:180000},async()=>{
 const root=path.resolve(__dirname,'..');let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});
  const page=await require('./helpers/art-page.cjs')(browser,{viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'public/index.html')).href,{timeout:120000});await page.evaluate(()=>BagseedArt.ready);
  await page.locator('[data-act=newGame]').click();
  const creator=await page.evaluate(()=>{
   Object.assign(runtime.cr,{topS:'hoodie',bottomS:'jeans',shoesS:'sneakers',hairS:'short',acc:'none'});runtime.crWalk=true;
   const images=[];for(let i=0;i<8;i++){drawCreatorPreview(i/8+.001);images.push($('#creatorPreview').toDataURL());}return new Set(images).size;
  });assert.equal(creator,8);
  await page.locator('#crName').fill('Live stride check');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&!!state?.player);
  const result=await page.evaluate(()=>{
   settings.speed=0;settings.reduced=false;state.tut.on=false;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);closePanel();
   Object.assign(state.player,{topS:'hoodie',bottomS:'jeans',shoesS:'sneakers',hairS:'short',acc:'none'});
   const look=playerLook(),checks=[],board=document.createElement('canvas');board.width=2304;board.height=864;const g=board.getContext('2d');g.fillStyle='#292330';g.fillRect(0,0,board.width,board.height);
   runtime.walking=true;
   for(const[row,dir]of ['right','left'].entries()){
    state.player.dir=dir;const hashes=[];
    for(let i=0;i<8;i++){
     const anim=playerAnim(i/8+.001),im=BagseedArt.sprite(look,dir,anim.frame,0,0,0,false,3,anim.walk);g.drawImage(im,i*288,row*432);hashes.push(im.toDataURL());
     const hand=im.bagseedHand,lamp=NightLamps1151.hand(300,180,look,anim);checks.push({dir,frame:anim.frame,authored:im.bagseedAuthoredWalk,profile:im.bagseedWalkProfile,error:Math.hypot(lamp.x-(300+(hand.x-48)/3),lamp.y-(180+(hand.y-144)/3))});
    }if(new Set(hashes).size!==8)throw Error('Repeated live side pose');
   }
   const fallback=BagseedArt.customWalkFrameCount({...look,topS:'tee'},'right'),front=BagseedArt.customWalkFrameCount(look,'down');
   settings.reduced=true;const reduced=playerAnim(.8).frame;settings.reduced=false;runtime.walking=false;
   Panels.wardrobe('look');runtime.mirrorWalk=true;const mirror=[];for(let i=0;i<8;i++){runtime.t=i/8+.001;CharacterUI115.mirrorDraw();mirror.push($('#panelBody canvas[data-draw="person"]').toDataURL());}
   return {checks,fallback,front,reduced,mirror:new Set(mirror).size,board:board.toDataURL()};
  });
  assert.deepEqual(result.checks.map(c=>c.frame),[0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7]);
  for(const c of result.checks){assert.equal(c.authored,c.dir+'/'+c.frame);assert.equal(c.profile,'stride/');assert.ok(c.error<.001);}
  assert.equal(result.fallback,4);assert.equal(result.front,4);assert.equal(result.reduced,2);assert.equal(result.mirror,8);assert.deepEqual(errors,[]);
  const out=path.join(root,'review/custom-walk-v4');fs.writeFileSync(path.join(out,'live-game-poses.png'),Buffer.from(result.board.split(',')[1],'base64'));delete result.board;
  fs.writeFileSync(path.join(out,'live-game-checks.json'),JSON.stringify({...result,creator,browserErrors:errors},null,2)+'\n');
 }finally{await browser?.close();}
});
