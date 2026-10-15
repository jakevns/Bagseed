const assert=require('node:assert/strict');
module.exports=async function checkPreviewMotion(page,styles){
  await page.evaluate(styles=>{
    const original=RoomArt.drawCurtains,old={id:state.room.curtains,weather:state.weather,reduced:settings.reduced};
    const cv=document.createElement('canvas');cv.width=80;cv.height=68;const g=cv.getContext('2d');let samples=[],last=0;
    function position(id){
      const blinds=styles[id].kind==='blinds',data=g.getImageData(blinds?40:0,blinds?35:22,40,blinds?15:1).data;
      let total=0,sum=0;for(let i=0;i<data.length;i+=4){const a=data[i+3];total+=a;sum+=(Math.floor(i/4)%40)*a;}
      if(!total)throw Error('Missing moving cloth/cord');return sum/total;
    }
    RoomArt.drawCurtains=function(c,x,y,w,h,t){
      const value=original.call(this,c,x,y,w,h,t),id=state.room.curtains;
      if(c===View.wctx&&styles[id]&&performance.now()-last>90){
        last=performance.now();g.clearRect(0,0,80,68);original.call(this,g,14,10,52,42,t);
        const fixedHeight=styles[id].kind==='blinds'?Math.floor(4+54*styles[id].rect[3]/styles[id].rect[2]):8;
        samples.push({t,x:position(id),fixed:Array.from(g.getImageData(0,0,80,fixedHeight).data).join(','),image:cv.toDataURL()});
      }return value;
    };
    window.curtainPreviewMotion={start(id,weather,reduced){state.room.curtains=id;state.weather=weather;settings.reduced=reduced;
      runtime.t=1.5*Math.PI/(weather==='Windy'?1.8:1.1);samples=[];last=0;},take(){return samples;},restore(){
      RoomArt.drawCurtains=original;state.room.curtains=old.id;state.weather=old.weather;settings.reduced=old.reduced;}};
  },styles);
  const results=[];
  try {
    for(const [id,def] of Object.entries(styles)){
      await page.evaluate(id=>curtainPreviewMotion.start(id,'Sunny',false),id);
      await page.waitForFunction(()=>{const s=curtainPreviewMotion.take();return s.length>=20&&s.at(-1).t-s[0].t>3;},null,{timeout:15000});
      const calm=await page.evaluate(()=>curtainPreviewMotion.take());
      await page.evaluate(id=>curtainPreviewMotion.start(id,'Windy',false),id);
      await page.waitForFunction(()=>{const s=curtainPreviewMotion.take();return s.length>=15&&s.at(-1).t-s[0].t>2;},null,{timeout:15000});
      const wind=await page.evaluate(()=>curtainPreviewMotion.take());
      await page.evaluate(id=>curtainPreviewMotion.start(id,'Windy',true),id);
      await page.waitForFunction(()=>curtainPreviewMotion.take().length>=3,null,{timeout:5000});
      const still=await page.evaluate(()=>curtainPreviewMotion.take());
      const extent=frames=>Math.max(...frames.map(f=>f.x))-Math.min(...frames.map(f=>f.x));
      const calmPixels=extent(calm),windPixels=extent(wind);
      assert.ok(calm.length>=15&&calm.at(-1).t-calm[0].t>2.7,id+' real frame clock stalled');
      assert.ok(calmPixels>.65,id+' motion is too small at native resolution');
      assert.ok(windPixels>calmPixels*1.65,id+' wind is not visibly stronger');
      assert.equal(new Set([...calm,...wind].map(f=>f.fixed)).size,1,id+' fixed hardware moves');
      assert.ok(still.length>=2);assert.equal(new Set(still.map(f=>f.image)).size,1,id+' reduced motion moves');
      results.push({id,type:def.kind,realFrames:calm.length+wind.length,calmNativePixels:calmPixels,windNativePixels:windPixels,fixedHardware:true,reducedMotionStill:true});
    }
  }finally{await page.evaluate(()=>curtainPreviewMotion.restore());}
  return {realGameLoop:true,nativeResolution:true,results};
};
