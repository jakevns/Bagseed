/* Shared painter: the loading room and live bedroom use the same decoded art. */
function createWindowScenery(DATA,outside,cloudImage){
  const sky=new Path2D(DATA.skyPath),foreground=new Path2D();
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const clouds=[null,'#efb69e','#87859d','#61718d'].map(tint=>{
    const c=document.createElement('canvas');c.width=cloudImage.width;c.height=cloudImage.height;
    const g=c.getContext('2d');g.drawImage(cloudImage,0,0);
    if(tint){g.globalCompositeOperation='source-atop';g.globalAlpha=.78;g.fillStyle=tint;g.fillRect(0,0,c.width,c.height);}return c;
  });
  // Trace only the near pickets, rails and shrubs. Gaps stay open to actors.
  foreground.addPath(new Path2D('M0 338 L24 330 L42 345 L67 341 L88 366 L125 365 L139 385 L177 381 L196 400 L230 404 L250 427 L304 421 L320 447 L323 512 L0 512 Z'));
  foreground.addPath(new Path2D('M768 310 L768 512 L504 512 L528 473 L537 443 L569 428 L578 403 L608 397 L628 374 L654 379 L676 354 L701 359 L725 335 L744 326 Z'));
  foreground.rect(0,344,768,13);foreground.rect(0,384,768,12);
  // The near garden lies in front of the walking lane, hiding feet below the
  // fence while the upper gaps still reveal the neighbors behind its pickets.
  foreground.rect(0,376,768,136);
  for(let x=27;x<790;x+=53.3)foreground.addPath(new Path2D(`M${x} 307 L${x+14} 321 L${x+14} 404 L${x-14} 404 L${x-14} 321 Z`));
  function weights(n){const stops=[0,.5,.85,1];let index=0;while(index<2&&n>stops[index+1])index++;return [index,smooth((n-stops[index])/(stops[index+1]-stops[index]))];}
  function tiles(c,dest,n){const [index,blend]=weights(n),alpha=c.globalAlpha;c.drawImage(outside,...DATA.tiles[index],...dest);c.globalAlpha=alpha*blend;c.drawImage(outside,...DATA.tiles[index+1],...dest);c.globalAlpha=alpha;return [index,blend];}
  function drawBackground(c,dest,n,cloudTime){
    c.save();const [x,y,w,h]=dest;c.beginPath();c.rect(x,y,w,h);c.clip();
    const [index,blend]=tiles(c,dest,n),alpha=c.globalAlpha;c.translate(x,y);c.scale(w/768,h/512);c.clip(sky);
    for(let i=0;i<2;i++){
      const width=i?250:350,height=width*clouds[0].height/clouds[0].width,offset=((cloudTime/3+i*.53)%1+1)%1,px=-width+offset*(768+width),py=i?55:4;
      c.globalAlpha=alpha*.72*(1-blend);c.drawImage(clouds[index],px,py,width,height);c.globalAlpha=alpha*.72*blend;c.drawImage(clouds[index+1],px,py,width,height);
    }c.restore();
  }
  function drawForeground(c,dest,n){
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';const [x,y,w,h]=dest;
    c.translate(x,y);c.scale(w/768,h/512);c.clip(foreground);tiles(c,[0,0,768,512],n);c.restore();
  }
  function timeOfDay(hour){
    hour=((hour%24)+24)%24;
    const keys=[[0,1],[5,1],[5.75,.85],[6.5,.5],[8,0],[17,0],[18.75,.5],[20,.85],[21,1],[24,1]];
    for(let i=1;i<keys.length;i++)if(hour<=keys[i][0]){const [a,n]=keys[i-1],[b,m]=keys[i];return n+(m-n)*(hour-a)/(b-a);}return 1;
  }
  return Object.freeze({drawBackground,drawForeground,timeOfDay});
}
