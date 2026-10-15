/* Modular illustrated hardware; live displays and lighting are drawn separately. */
(()=>{
  'use strict';
  const DATA=__BAGSEED_EQUIPMENT_DATA__,images={};let loaded=false;
  const oldComputer=Gear.computer,oldWallpaper=drawWallpaper,oldGearIcon=drawGearIcon,oldStyleIcon=drawStyleIcon;
  function sprite(c,id,x,y,w,h){
    const a=DATA.assets[id];h=h??w*a.rect[3]/a.rect[2];
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(images[a.atlas],...a.rect,x,y,w,h);c.restore();return {x,y,w,h};
  }
  drawWallpaper=function(c,x,y,w,h,wp,t){
    if(!loaded||!DATA.assets['wp:'+wp])return oldWallpaper(c,x,y,w,h,wp,t);
    const time=settings.reduced?0:t;
    sprite(c,'wp:'+wp,x,y,w,h);
    c.save();c.beginPath();c.roundRect(x,y,w,h,Math.min(w,h)*.025);c.clip();
    if(wp==='terminal'){
      c.fillStyle='#b6e99a';c.globalAlpha=settings.reduced?1:(.45+.55*(.5+.5*Math.sin(time*2.7)));
      c.fillRect(x+w*.12,y+h*.72,w*.08,Math.max(.15,h*.035));
    }
    if(wp==='stars')for(let i=0;i<5;i++){
      c.globalAlpha=settings.reduced?.55:.3+.4*(.5+.5*Math.sin(time*.9+i*1.8));c.fillStyle='#fff3d1';
      c.fillRect(x+w*(.13+i*.14),y+h*(.18+(i%3)*.2),Math.max(.12,w*.008),Math.max(.12,h*.014));
    }
    c.restore();
  };
  function display(c,box,id,wp,t,on,dashboard){
    const a=DATA.assets[id],[sx,sy,sw,sh]=a.screen;
    const x=box.x+sx*box.w,y=box.y+sy*box.h,w=sw*box.w,h=sh*box.h;
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    if(!on){c.fillStyle='#18221f';c.fillRect(x,y,w,h);}
    else if(dashboard){
      c.fillStyle='#172e2b';c.fillRect(x,y,w,h);
      c.fillStyle='#87ba92';c.fillRect(x+w*.06,y+h*.08,w*.35,h*.07);c.fillStyle='#d7be75';c.fillRect(x+w*.7,y+h*.08,w*.24,h*.07);
      c.strokeStyle='rgba(167,209,176,.16)';c.lineWidth=.12;
      for(let i=1;i<4;i++){c.beginPath();c.moveTo(x+w*.05,y+h*(.25+i*.16));c.lineTo(x+w*.95,y+h*(.25+i*.16));c.stroke();}
      const log=state.locations.closet.log;
      for(let i=0;i<9;i++){
        const v=log[log.length-9+i],value=v?clamp((v[1]-15)/30,.08,1):.16;
        c.fillStyle=i===8?'#e4c677':'#9badcd';const bh=h*.62*value;
        c.fillRect(x+w*(.07+i*.099),y+h*.88-bh,w*.058,bh);
      }
    }else drawWallpaper(c,x,y,w,h,wp,t);
    if(on){const shine=c.createLinearGradient(x,y,x+w,y+h);shine.addColorStop(0,'rgba(255,248,211,.1)');shine.addColorStop(.7,'rgba(255,248,211,0)');c.fillStyle=shine;c.fillRect(x,y,w,h);}
    c.restore();
  }
  function device(c,id,x,base,w,wp,t,on,dashboard=false){
    const a=DATA.assets[id],h=w*a.rect[3]/a.rect[2],box=sprite(c,id,x,base-h,w,h);
    if(a.screen)display(c,box,id,wp,t,on,dashboard);
    if(a.led){c.save();c.fillStyle=on?'#addb86':'#5b6258';c.beginPath();c.arc(box.x+box.w*a.led[0],box.y+box.h*a.led[1],box.w*.018,0,Math.PI*2);c.fill();c.restore();}
    return box;
  }
  function keyboard(c,id,x,y,w,t,height=w/23*DATA.keyboardHeight){
    const box=sprite(c,'kb:'+id,x,y,w,height);
    const rgb=state?rgbNow(t):null;
    if(id==='rgbkb'&&rgb){
      c.save();c.lineWidth=.22;
      for(let i=0;i<10;i++){
        c.strokeStyle=rgb.cycle?hsl2hex((rgb.h+i*25)%360,.65,.65):rgb.col;c.globalAlpha=rgb.a*.85;
        c.beginPath();c.moveTo(x+w*(.06+i*.062),y+box.h*.65);c.lineTo(x+w*(.1+i*.062),y+box.h*.65);c.stroke();
      }
      c.restore();
    }
    return box;
  }
  Gear.computer=function(c,x,y,tier,t,on){
    if(!loaded||![0,1,2].includes(tier))return oldComputer.call(this,c,x,y,tier,t,on);
    const room=state.room,wp=room.wallpaper||'terminal',base=y+.6,rgb=rgbNow(t);
    if(tier===0)device(c,'laptop',x+5,base,24,wp,t,on);
    else if(tier===1){
      device(c,'crt',x+3,base,23,wp,t,on);
      device(c,'tower',x+31,y+27,10,wp,t,on);
    }else{
      device(c,'monitor',x,base,21.5,wp,t,on);
      device(c,'monitor',x+23,base,21.5,wp,t,on,true);
    }
    if(rgb&&on){
      c.save();c.fillStyle=rgb.col;c.globalAlpha=rgb.a*.8;
      c.fillRect(x+(tier===0?6:tier===1?4:1),base-.7,tier===0?22:tier===1?21:42,.3);
      if(tier===1)c.fillRect(x+40.2,y+10,.22,12);c.restore();
    }
    if(room.mat&&room.mat!=='none'&&DATA.assets['mat:'+room.mat])sprite(c,'mat:'+room.mat,x-2,y+.7,36,3.2);
    if(tier>=1||room.keyboard!=='beige')keyboard(c,room.keyboard||'beige',x+7,y+.9,23,t);
  };
  drawGearIcon=function(ctx,cv,slot,tier,museum){
    if(slot!=='computer'||!loaded)return oldGearIcon.call(this,ctx,cv,slot,tier,museum);
    cv.width=320;cv.height=240;ctx.save();ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle=museum?'#2a2016':'#1a2420';ctx.fillRect(0,0,320,240);
    // Room, store and packages all render the same modular equipment at one scale.
    ctx.scale(4.5,4.5);Gear.computer(ctx,tier===0?18.55:tier===1?13.55:13.3,24,tier,0,true);ctx.restore();
  };
  drawStyleIcon=function(ctx,cv,slot,id){
    if(!loaded||!['keyboard','mat','wallpaper'].includes(slot))return oldStyleIcon.call(this,ctx,cv,slot,id);
    cv.width=320;cv.height=200;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1a2420';ctx.fillRect(0,0,320,200);
    if(slot==='wallpaper'){
      const a=DATA.assets.monitor,w=250,h=w*a.rect[3]/a.rect[2],box=sprite(ctx,'monitor',35,100-h/2,w,h);display(ctx,box,'monitor',id,0,true,false);
    }else if(slot==='keyboard'){const a=DATA.assets['kb:'+id],h=276*a.rect[3]/a.rect[2];keyboard(ctx,id,22,100-h/2,276,0,h);}
    else if(id!=='none'){const a=DATA.assets['mat:'+id],h=280*a.rect[3]/a.rect[2];sprite(ctx,'mat:'+id,20,100-h/2,280,h);}
    else{ctx.strokeStyle='#8e9e84';ctx.lineWidth=2;ctx.strokeRect(32,65,256,70);ctx.beginPath();ctx.moveTo(137,116);ctx.lineTo(183,84);ctx.stroke();}
    ctx.restore();
  };
  const ready=Promise.all(Object.entries(DATA.atlases).map(([id,a])=>new Promise((resolve,reject)=>{
    const im=images[id]=new Image();im.onload=resolve;im.onerror=()=>reject(new Error('Computer equipment atlas failed: '+id));im.src=a.image;
  }))).then(()=>{loaded=true;if(screen==='game'){hydrate(document);View.snap();}return {computers:3,keyboards:4,mats:3,wallpapers:5};});
  window.BagseedEquipment=Object.freeze({revision:DATA.revision,ready,get loaded(){return loaded;}});ready.catch(e=>console.error(e));
})();
