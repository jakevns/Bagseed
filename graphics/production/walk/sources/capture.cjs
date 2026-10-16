// Disposable browser context; never reads or modifies the user's game save.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../..'),review=path.join(root,'review/custom-walk-v1');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'review/characters-v2/sources/baseline-assets.json')));
const defaultLook=fixture.people.find(p=>p.id==='player').look;
const looks=[
 {id:'default',name:'Default · hoodie',look:defaultLook},
 {id:'long-skirt',name:'Slim · flannel/skirt',look:{...defaultLook,skin:'#6b3f2e',topS:'flannel',shirtC:'#945b8a',bottomS:'skirt',pantsC:'#678d69',shoesS:'sandals',hairS:'long',hairC:'#d5b66a',body:'slim',pres:'fem',face:'oval',acc:'necklace'}},
 {id:'pony-overalls',name:'Broad · overalls',look:{...defaultLook,skin:'#e3b7a0',topS:'overalls',shirtC:'#528eb0',hairS:'ponytail',hairC:'#a95238',body:'broad',pres:'masc',face:'square',acc:'bag'}},
 {id:'hat-plaid',name:'Hat · patterned tee',look:{...defaultLook,skin:'#b87950',topS:'tee',shirtC:'#8d6950',topPat:'plaid',topC2:'#e0bda0',hairS:'bun',hairC:'#dfdfdb',hat:'cap',hatC:'#687d9e',shoesS:'sandals',acc:'belt'}},
 ...['remy','priya'].map(id=>({id,name:id==='remy'?'Remy · approved':'Priya · approved',look:fixture.people.find(p=>p.id===id).look}))
];
(async()=>{
 const {createStaticServer}=await import('../../../../tools/server.mjs'),server=createStaticServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH,headless:true,args:['--disable-gpu','--disable-accelerated-2d-canvas']});
 try{
  const page=await require('../../../../tests/helpers/art-page.cjs')(browser,{viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load',timeout:180000});await page.evaluate(()=>BagseedArt.ready);
  const report=await page.evaluate(async({looks,backgrounds})=>{
   const decoded={};for(const[id,bg]of Object.entries(backgrounds)){const im=new Image();im.src=bg.src;await im.decode();decoded[id]=im;}
   const output={frames:{},measurements:[],errors:[],looks,revision:BagseedArt.renderingRevision};
   for(const [background,bg]of Object.entries(decoded)){
    output.frames[background]=[];
    for(let f=0;f<4;f++){
     const canvas=document.createElement('canvas');canvas.width=480;canvas.height=336;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
     for(let row=0;row<4;row++)for(let col=0;col<looks.length;col++){
      const dir=['down','right','up','left'][row],who=looks[col],x=col*80,y=row*84;
      const tile=document.createElement('canvas');tile.width=80;tile.height=84;const t=tile.getContext('2d');
      // Crop a clean floor/grass patch from the exported game background;
      // transparent edge bands in the reference are not a scene backdrop.
      for(let yy=0;yy<84;yy+=24)for(let xx=0;xx<80;xx+=64)t.drawImage(bg,24,18,64,24,xx,yy,64,24);
      g.drawImage(tile,x,y);
      g.fillStyle=background==='night'?'#eee7cc':'#251f29';g.font='6px sans-serif';g.fillText(who.name,x+3,y+8);g.fillText(dir,x+3,y+16);
      const im=BagseedArt.sprite(who.look,dir,f,0,0,0,false,3,true),height=32*im.height/im.width;g.drawImage(im,x+24,y+74-height,32,height);
      if(background==='grass'){
       const native=BagseedArt.sprite(who.look,dir,f,0,0,0,false,1,true),a=native.getContext('2d').getImageData(0,0,96,144).data;let bottom=-1,count=0;
       for(let yy=0;yy<144;yy++)for(let xx=0;xx<96;xx++)if(a[(yy*96+xx)*4+3]>100){bottom=yy;count++;}
       output.measurements.push({id:who.id,dir,frame:f,authored:native.bagseedAuthoredWalk||null,hand:native.bagseedHand,bottom,opaquePixels:count});
      }
     }
     output.frames[background].push(canvas.toDataURL('image/png'));
    }
   }
   return output;
  },{looks,backgrounds:fixture.backgrounds});
  fs.mkdirSync(review,{recursive:true});for(const[bg,frames]of Object.entries(report.frames))for(let f=0;f<frames.length;f++)fs.writeFileSync(path.join(review,`runtime-${bg}-${f}.png`),Buffer.from(frames[f].split(',')[1],'base64'));
  delete report.frames;
  await page.locator('[data-act=newGame]').click();
  const creator=await page.evaluate(look=>{Object.assign(runtime.cr,look);runtime.crWalk=true;drawCreatorPreview(0);const a=$('#creatorPreview').toDataURL();drawCreatorPreview(1/6);const b=$('#creatorPreview').toDataURL();return {a,b,animated:a!==b};},defaultLook);
  for(const [key,value]of Object.entries(creator))if(typeof value==='string')fs.writeFileSync(path.join(review,'creator-'+key+'.png'),Buffer.from(value.split(',')[1],'base64'));
  await page.locator('#crName').fill('Walk art review');await page.locator('[data-act=startGame]').click();await page.waitForFunction(()=>screen==='game'&&state?.player);
  const interaction=await page.evaluate(({looks})=>{
   settings.speed=0;runtime.dialogQ=[];if(runtime.curDialog)ACT.dlg(0);state.tut.on=false;closePanel();Object.assign(state.player,looks[1].look);Panels.wardrobe('look');runtime.mirrorWalk=true;runtime.t=0;CharacterUI115.mirrorDraw();const cv=$('#panelBody canvas[data-draw="person"]'),a=cv.toDataURL();runtime.t=1/6;CharacterUI115.mirrorDraw();const b=cv.toDataURL();const idle=$('#panelBody [data-walk-preview] button:last-child');idle.click();const stopped=runtime.mirrorWalk===false;closePanel();
   const builds=[],hands=[],skinFootprints=new Set(),dirs=['down','right','up','left'];
   for(const body of ['slim','average','broad','curvy','stocky','tall'])for(const dir of dirs)for(let frame=0;frame<4;frame++){
    const look={...looks[0].look,body},im=BagseedArt.sprite(look,dir,frame,0,0,0,false,1,true),data=im.getContext('2d').getImageData(0,0,96,144).data;let bottom=-1;
    for(let y=0;y<144;y++)for(let x=0;x<96;x++)if(data[(y*96+x)*4+3]>100)bottom=y;
    const h=NightLamps1151.hand(300,180,look,{dir,frame,walk:true}),expected=im.bagseedHand;hands.push({body,dir,frame,error:Math.hypot(h.x-(300+(expected.x-48)/3),h.y-(180+(expected.y-144)/3))});builds.push({body,dir,frame,bottom});
   }
   for(const skin of SKIN){const im=BagseedArt.sprite({...looks[0].look,skin,shoesS:'sandals'},'down',0,0,0,0,false,3,true);skinFootprints.add(Array.from(im.getContext('2d').getImageData(0,408,288,21).data).join(','));}
   return {mirror:{animated:a!==b,stopped,a,b},builds,hands,sandalToeSkinVariants:skinFootprints.size,storage:'disposable new browser context only'};
  },{looks});
  for(const key of ['a','b']){fs.writeFileSync(path.join(review,'mirror-'+key+'.png'),Buffer.from(interaction.mirror[key].split(',')[1],'base64'));delete interaction.mirror[key];}
  report.creator={animated:creator.animated};report.interaction=interaction;report.browserErrors=errors;fs.writeFileSync(path.join(review,'runtime-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({revision:report.revision,frames:report.measurements.length,creator:report.creator,mirror:interaction.mirror,buildFrames:interaction.builds.length,sandalToeSkinVariants:interaction.sandalToeSkinVariants,browserErrors:errors},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
