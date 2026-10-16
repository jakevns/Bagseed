const artPage=require('./helpers/art-page.cjs');
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/production');
let browser,server,url,registration;
before(async()=>{
  registration=JSON.parse(fs.readFileSync(path.join(ROOT,'graphics/production/customization-v5/manifest.json')));
  fs.mkdirSync(OUT,{recursive:true});
  const {createStaticServer}=await import('../tools/server.mjs');server=createStaticServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.BAGSEED_BROWSER_PATH||'/usr/bin/chromium',args:['--disable-accelerated-2d-canvas']});
});
after(async()=>{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));});
async function inspect(fn){
  const page=await artPage(browser,),errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{await page.goto(url);await page.evaluate(()=>BagseedArt.ready);const result=await page.evaluate(fn,registration);assert.deepEqual(errors,[]);return result;}finally{await page.close();}
}

test('facial hair follows the lower face without repainting eyes, crown or back hair',async()=>{
  const result=await inspect(registration=>{
    const failures=[],facials=['stubble','mustache','shortbeard','beard','goatee','soul','chinstrap','handlebar','pencil','mutton','circle','anchor','scruff','vandyke'];let views=0,eyes=0,silverLayers=0;
    const read=canvas=>canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height).data;
    const samePixel=(a,b,n)=>a[n]===b[n]&&a[n+1]===b[n+1]&&a[n+2]===b[n+2]&&a[n+3]===b[n+3];
    for(const [hairS]of HAIRS){
      const look=BagseedArt.normalize({hairS,hairC:'#c4c4c4',facial:'none',hat:'none',face:'soft'}),back=read(BagseedArt.head(look,'up'));
      for(const dir of ['down','right','left']){
        const baseline=read(BagseedArt.head(look,dir)),features=registration.features[`hair/${hairS}/${dir}`].eyes,eyeY=Math.min(...features.map(p=>p[1]));
        for(const facial of facials){
          const a=read(BagseedArt.head({...look,facial},dir));let changed=0,neutral=0;
          for(let y=0;y<Math.floor(eyeY-8);y++)for(let x=0;x<192;x++){const n=(y*192+x)*4;if(!samePixel(a,baseline,n)){failures.push(`${hairS}/${dir}/${facial}: crown changed`);y=192;break;}}
          for(const [ex,ey]of features){
            let changedEye=false;for(let y=Math.floor(ey-5);y<=Math.ceil(ey+5);y++)for(let x=Math.floor(ex-6);x<=Math.ceil(ex+6);x++)if(!samePixel(a,baseline,(y*192+x)*4))changedEye=true;
            if(changedEye)failures.push(`${hairS}/${dir}/${facial}: eye repainted`);eyes++;
          }
          for(let y=Math.floor(eyeY+7);y<215;y++)for(let x=35;x<157;x++){const n=(y*192+x)*4;if(!samePixel(a,baseline,n)){changed++;if(a[n+3]>200&&Math.max(a[n],a[n+1],a[n+2])-Math.min(a[n],a[n+1],a[n+2])<=3)neutral++;}}
          if(changed<4)failures.push(`${hairS}/${dir}/${facial}: facial layer missing`);
          // Light stubble intentionally blends with skin. Substantial styles
          // need opaque silver strands, rather than the old fixed brown ink.
          // A pencil moustache is a thin antialiased stroke; most pixels blend
          // with the skin. Its neutral core is smaller than a filled beard's.
          const neutralFraction=facial==='pencil'?.1:.3;
          if(!['stubble','scruff'].includes(facial)&&neutral<Math.max(3,changed*neutralFraction))failures.push(`${hairS}/${dir}/${facial}: silver recolor missing (${neutral}/${changed})`);
          silverLayers++;views++;
        }
      }
      for(const facial of facials){const a=read(BagseedArt.head({...look,facial},'up'));if(a.some((v,n)=>v!==back[n]))failures.push(`${hairS}/up/${facial}: facial study leaked onto back`);}
    }
    return {views,eyes,silverLayers,backViews:HAIRS.length*facials.length,failures};
  });
  fs.writeFileSync(path.join(OUT,'facial-head-regressions.json'),JSON.stringify(result,null,2)+'\n');
  assert.deepEqual(result.failures,[]);assert.equal(result.views,2562);assert.equal(result.backViews,854);
});

test('hairstyles retain transparent canvas margins when the face is widened or lengthened',async()=>{
  const result=await inspect(()=>{
    const failures=[];let views=0;
    for(const [hairS]of HAIRS)for(const dir of ['down','right','up','left'])for(const face of ['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button']){
      const c=BagseedArt.head(BagseedArt.normalize({hairS,face,hat:'none',facial:'none'}),dir),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let left=c.width,right=-1,top=c.height,bottom=-1;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(a[(y*c.width+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      if(left<1||right>c.width-2||top<1||bottom>c.height-2)failures.push({hairS,dir,face,bounds:[left,top,right,bottom],canvas:[c.width,c.height]});views++;
    }
    return {views,failures};
  });
  fs.writeFileSync(path.join(OUT,'head-margin-regressions.json'),JSON.stringify(result,null,2)+'\n');
  assert.deepEqual(result.failures,[]);assert.equal(result.views,3660);
});

test('hats preserve the registered face scale and eye placement',async()=>{
  const result=await inspect(registration=>{
    const failures=[],hats=['beanie','cap','bucket','straw','sunhat','officer','wizard','beret'];let views=0;
    for(const [hairS]of HAIRS)for(const dir of ['down','right','left']){
      const look=BagseedArt.normalize({hairS,face:'soft',hat:'none',facial:'none'}),c=BagseedArt.head(look,dir),baseline=c.getContext('2d').getImageData(0,0,c.width,c.height).data,features=registration.features[`hair/${hairS}/${dir}`].eyes;
      for(const hat of hats){
        const image=BagseedArt.head({...look,hat},dir),a=image.getContext('2d').getImageData(0,0,image.width,image.height).data;
        for(const [ex,ey]of features){let mismatch=0;
          // The small inner-eye area is below the brim and away from hair.
          // Moving/shrinking the whole head to fit a hat changes this patch.
          for(let y=Math.ceil(ey-3);y<=Math.floor(ey+4);y++)for(let x=Math.ceil(ex-4);x<=Math.floor(ex+4);x++){const n=(y*image.width+x)*4;for(let k=0;k<4;k++)if(a[n+k]!==baseline[n+k]){mismatch++;break;}}
          if(mismatch)failures.push(`${hairS}/${dir}/${hat}: eye moved or hidden (${mismatch})`);
        }
        views++;
      }
    }
    return {views,failures};
  });
  fs.writeFileSync(path.join(OUT,'hat-face-regressions.json'),JSON.stringify(result,null,2)+'\n');
  assert.deepEqual(result.failures,[]);assert.equal(result.views,1464);
});

test('animated blinks stay inside registered eyes and leave the cheeks and mouth intact',async()=>{
  const result=await inspect(()=>{
    const failures=[];let views=0;
    for(const [hairS]of HAIRS)for(const dir of ['down','right','left'])for(const frame of [0,1,3]){
      const look=BagseedArt.normalize({hairS,hairC:'#e9e2d4',topS:'hoodie',shirtC:'#5f9c33',face:'soft'}),open=charSprite(look,dir,frame,0,0),closed=charSprite(look,dir,frame,0,1),a=open.getContext('2d').getImageData(0,0,96,open.height).data,b=closed.getContext('2d').getImageData(0,0,96,closed.height).data;
      let changed=0,outside=0;for(let y=0;y<open.height;y++)for(let x=0;x<96;x++){const at=(y*96+x)*4;if([0,1,2,3].some(k=>a[at+k]!==b[at+k])){changed++;if(!open.bagseedEyes.some(([ex,ey])=>Math.abs(x-ex)<9&&Math.abs(y-ey)<7))outside++;}}
      if(changed<5||outside)failures.push({hairS,dir,frame,changed,outside});views++;
    }
    // Full authored NPC drawings have no guessed line painted over their face.
    const look=BagseedArt.cast.find(p=>p.id==='cast-28-dev').look;
    for(const dir of ['down','right','left']){const a=charSprite(look,dir,0,0,0).toDataURL(),b=charSprite(look,dir,0,0,1).toDataURL();if(a!==b)failures.push('Heuristic blink changed authored NPC '+dir);}
    return {views,failures};
  });
  fs.writeFileSync(path.join(OUT,'blink-regressions.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(result.failures,[]);assert.equal(result.views,549);
});

test('creator retains source detail and neck, trousers and feet remain connected',async()=>{
  const result=await inspect(()=>{
    const failures=[],tops=['tee','tank','hoodie','flannel','sweater','cardigan','overalls','work','crop','jacket','garden','pjs','labcoat','suit','officer'];let outfits=0;
    const base=BagseedArt.normalize({hairS:'short',hairC:'#e9e2d4',shirtC:'#5f9c33',pantsC:'#36405a'});
    for(const topS of tops)for(const body of ['slim','average','broad','stocky','tall'])for(const dir of ['down','right','up','left']){
      const c=charSprite({...base,topS,body},dir),a=c.getContext('2d').getImageData(0,c.height-108,96,108).data,seen=new Uint8Array(96*108),todo=[];
      const opaque=at=>at>=0&&at<96*108&&a[at*4+3]>60;
      const row=60*96;let seed=48;while(seed<70&&!opaque(row+seed))seed++;todo.push(row+seed);seen[row+seed]=1;
      while(todo.length){const at=todo.pop(),x=at%96,y=Math.floor(at/96);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,n=yy*96+xx;if(xx>=0&&xx<96&&yy>=0&&yy<108&&!seen[n]&&opaque(n)){seen[n]=1;todo.push(n);}}}
      const headJoined=seen.some((v,n)=>v&&Math.floor(n/96)<30),feetJoined=seen.some((v,n)=>v&&Math.floor(n/96)>=103);
      if(!headJoined||!feetJoined)failures.push({topS,body,dir,headJoined,feetJoined});outfits++;
    }
    const normal=charSprite(base,'down'),detail=BagseedArt.sprite(base,'down',0,0,0,0,false,2),c=document.createElement('canvas');c.width=192;c.height=normal.height*2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(normal,0,0,192,c.height);
    const a=g.getImageData(0,0,192,c.height).data,b=detail.getContext('2d').getImageData(0,0,192,c.height).data;let extraDetail=0;for(let n=0;n<a.length;n+=4)if(a[n+3]>150&&b[n+3]>150&&Math.abs(a[n]-b[n])+Math.abs(a[n+1]-b[n+1])+Math.abs(a[n+2]-b[n+2])>12)extraDetail++;
    if(extraDetail<500)failures.push({extraDetail});
    return {outfits,extraDetail,failures};
  });
  fs.writeFileSync(path.join(OUT,'body-detail-regressions.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(result.failures,[]);assert.equal(result.outfits,300);
});

test('rear neck shading follows skin color rather than the selected hair color',async()=>{
  const result=await inspect(()=>{
    const failures=[];let pixels=0;
    for(const skin of ['#f0c7a0','#cf9670','#5d3829']){
      const look=BagseedArt.normalize({hairS:'short',skin,facial:'none',hat:'none'}),a=BagseedArt.baldBase({...look,hairC:'#e9e2d4'},'up').getContext('2d'),b=BagseedArt.baldBase({...look,hairC:'#3e9f7a'},'up').getContext('2d');
      // These are the saturated neck shadows previously recolored as silver
      // fur, between the illustrated haircut and the hoodie collar.
      for(const [x,y]of [[95,188],[95,190],[100,192]]){const p=[...a.getImageData(x,y,1,1).data],q=[...b.getImageData(x,y,1,1).data];if(p.some((v,i)=>v!==q[i])||p[3]<180||p[0]<=p[1]||p[1]<=p[2])failures.push({skin,x,y,p,q});pixels++;}
    }
    return {pixels,failures};
  });assert.deepEqual(result.failures,[]);assert.equal(result.pixels,9);
});

test('all hair is a transparent independent material with no retained brown pixels',async()=>{
  const result=await inspect(()=>{
    const failures=[];let layers=0,pixels=0;
    for(const [hairS]of HAIRS)for(const dir of ['down','right','up','left']){
      const look=BagseedArt.normalize({hairS,hat:'none',hairHi:'none',hairC:'#ffffff'}),image=BagseedArt.hairLayer(look,dir),a=image.getContext('2d').getImageData(0,0,192,320).data;
      for(let n=0;n<a.length;n+=4)if(a[n+3]){pixels++;if(a[n]!==a[n+1]||a[n]!==a[n+2]){failures.push(`${hairS}/${dir}: retained source hue`);break;}}
      for(const hairC of ['#1d1612','#3e9f7a','#e48ab8']){const b=BagseedArt.hairLayer({...look,hairC},dir).getContext('2d').getImageData(0,0,192,320).data;for(let n=3;n<a.length;n+=4)if(a[n]!==b[n]){failures.push(`${hairS}/${dir}/${hairC}: color changed the silhouette`);break;}}
      if(hairS==='bald'&&a.some((v,n)=>n%4===3&&v))failures.push('Bald contains hair');layers++;
    }
    // The entire rear anatomy is independent of hair color, including the
    // scalp, ears and neck underneath every transparent hairstyle opening.
    const a=BagseedArt.baldBase(BagseedArt.normalize({hairC:'#ffffff'}),'up').toDataURL(),b=BagseedArt.baldBase(BagseedArt.normalize({hairC:'#4a2c1a'}),'up').toDataURL();if(a!==b)failures.push('Rear base anatomy changes with hair color');
    return {layers,pixels,failures};
  });fs.writeFileSync(path.join(OUT,'separate-hair-regressions.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(result.failures,[]);assert.equal(result.layers,244);assert.ok(result.pixels>100000);
});

test('changing hair preserves face geometry and gives long and tied styles headroom',async()=>{
  const result=await inspect(()=>{
    const failures=[];let views=0;
    const base=BagseedArt.normalize({hairS:'bald',hat:'none',facial:'none',face:'soft'});
    for(const face of ['soft','round','angular','long','square','heart','oval','diamond','oblong','pear','triangle','wide','petite','strong','button'])for(const dir of ['down','right','up','left']){
      base.face=face;
      const reference=charSprite(base,dir),eyes=JSON.stringify(reference.bagseedEyes);
      for(const [hairS]of HAIRS){const c=charSprite({...base,hairS},dir);if(c.width!==96||c.height!==144||JSON.stringify(c.bagseedEyes)!==eyes)failures.push({hairS,face,dir,reason:'hair changed face scale or position'});views++;}
    }
    // Sparse hair belongs at temples and nape, never floating over a bald crown.
    const a=BagseedArt.hairLayer({...base,hairS:'balding'},'down').getContext('2d').getImageData(0,0,192,120).data;
    if(a.some((v,n)=>n%4===3&&v>100))failures.push('Thinning hair floats above the temples');
    return {views,failures};
  });fs.writeFileSync(path.join(OUT,'all-head-shape-geometry.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(result.failures,[]);assert.equal(result.views,3660);
});

test('close cuts fit the skull width, stay centered and finish at the nape',async()=>{
  const result=await inspect(()=>{
    const failures=[],measurements=[];
    const bounds=c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let l=c.width,r=0,t=c.height,b=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(a[(y*c.width+x)*4+3]>100){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {left:l,right:r,top:t,bottom:b,width:r-l+1,height:b-t+1};};
    for(const hairS of ['short','pixie','sidepixie','crop','caesar','fade','hightop','flattop','quiff','pomp','slick','spikes','fauxhawk','curlytop','twistsS','bowl']){
      const look=BagseedArt.normalize({hairS,hairC:'#c4c4c4',hat:'none',face:'soft'}),skull=bounds(BagseedArt.baldBase(look,'up')),hair=bounds(BagseedArt.hairLayer(look,'up'));
      const row={hairS,skull,hair};measurements.push(row);
      if(hair.width>skull.width*1.3||hair.height>skull.height*1.45||hair.bottom>skull.bottom||hair.top>skull.top+4||Math.abs((hair.left+hair.right)/2-96)>4)failures.push(row);
    }
    return {measurements,failures};
  });fs.writeFileSync(path.join(OUT,'hair-skull-fit.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(result.failures,[]);assert.equal(result.measurements.length,16);
});

test('the original opaque fringe strands survive composition over the forehead',async()=>{
  const result=await inspect(registration=>{
    const failures=[];let strands=0,views=0;
    for(const [hairS]of HAIRS)for(const dir of ['down','right','left']){
      const look=BagseedArt.normalize({hairS,hairC:'#e9e2d4',hat:'none',facial:'none',face:'soft',acc:'none'}),layer=BagseedArt.hairLayer(look,dir),hair=layer.getContext('2d').getImageData(0,0,192,320).data,head=BagseedArt.head(look,dir).getContext('2d').getImageData(0,0,192,320).data;
      const expected=document.createElement('canvas');expected.width=192;expected.height=320;const g=expected.getContext('2d');g.drawImage(BagseedArt.baldBase(look,dir),0,0);g.drawImage(layer,0,0);const composed=g.getImageData(0,0,192,320).data;
      let erased=0;
      // These cuts deliberately put real ears above hair. The forehead
      // and fringe must still retain every strand outside the ear anatomy.
      const foreground=hairS!=='bald';
      const bounds=({down:[[49,144,74,178],[119,144,146,178]],right:[[70,143,99,177]],left:[[94,143,123,177]]})[dir];
      for(let y=110;y<185;y++)for(let x=35;x<157;x++){if(foreground&&bounds.some(([l,t,r,b])=>x>=l-1&&x<=r+1&&y>=t-1&&y<=b+1))continue;const n=(y*192+x)*4;if(hair[n+3]>80){strands++;if([0,1,2,3].some(k=>Math.abs(head[n+k]-composed[n+k])>1))erased++;}}
      if(erased)failures.push({hairS,dir,erased});views++;
    }
    return {views,strands,failures};
  });fs.writeFileSync(path.join(OUT,'fringe-preservation.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(result.failures,[]);assert.equal(result.views,183);assert.ok(result.strands>10000,'The check must inspect substantial opaque hair, not just transparent background');
});

test('footwear styles keep a consistent footprint across outfits and directions',async()=>{
  const result=await inspect(()=>{
    const failures=[],measurements=[];
    for(const dir of ['down','right','up','left'])for(const bottomS of ['jeans','shorts','skirt'])for(const shoesS of ['sneakers','boots','sandals','rainboots']){
      const look=BagseedArt.normalize({bottomS,shoesS,topS:'jacket'}),c=BagseedArt.body(look,dir),a=c.getContext('2d').getImageData(0,103,96,4).data;let left=96,right=-1;
      // Long trousers now fall over the shoe top (hem <= 103); measure the sole below it.
      for(let y=0;y<4;y++)for(let x=0;x<96;x++)if(a[(y*96+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);}
      const width=right-left+1,target=dir==='down'||dir==='up'?32:28;measurements.push({dir,bottomS,shoesS,width});if(Math.abs(width-target)>1||Math.abs((left+right)/2-47.5)>1)failures.push({dir,bottomS,shoesS,left,right,width});
    }
    return {measurements,failures};
  });fs.writeFileSync(path.join(OUT,'footwear-registration.json'),JSON.stringify(result,null,2)+'\n');assert.deepEqual(result.failures,[]);assert.equal(result.measurements.length,48);
});
