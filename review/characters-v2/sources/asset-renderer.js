/* Illustrated Bagseed asset renderer, study 02. Uses the same PNG assets
   exported for the proposed game integration. No procedural character art. */
(function(root){
  const images=new Map(),tints=new Map();
  async function load(src){if(images.has(src))return images.get(src);const pending=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Unable to load character asset'));im.src=src;});images.set(src,pending);return pending;}
  async function prepare(data){
    for(const person of data.people){person.frames={};person.standing={};person.portraits={};for(const dir of ['down','right','up','left']){person.frames[dir]=await Promise.all(person.art.walk[dir].map(load));person.standing[dir]=await load(person.art.idle[dir]);}for(const expression of ['neutral','friendly','concerned'])person.portraits[expression]=await load(person.art.portraits[expression]);}
  }
  function tinted(image,key,table){
    if(tints.has(key))return tints.get(key);const cv=document.createElement('canvas');cv.width=image.width;cv.height=image.height;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const im=c.getImageData(0,0,cv.width,cv.height),d=im.data;
    for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;d[i]=table[d[i]][0];d[i+1]=table[d[i+1]][1];d[i+2]=table[d[i+2]][2];}c.putImageData(im,0,0);tints.set(key,cv);return cv;
  }
  function draw(c,person,x,y,z,options={}){
    const dir=options.dir||'down',frame=(options.frame||0)%4;let source=options.motion==='walk'?person.frames[dir][frame]:person.standing[dir];
    if(options.night)source=tinted(source,[person.id,dir,options.motion==='walk'?frame:'idle'].join('|'),options.nightColors);
    c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    if(options.motion==='idle'&&[2,3,4].includes((options.frame||0)%8)){
      // Small breathing motion in the upper drawing; feet stay on the anchor.
      const seam=77; c.drawImage(source,0,0,96,seam,x-16*z,y-36*z-z/3,32*z,(seam+1)*z/3);c.drawImage(source,0,seam,96,108-seam,x-16*z,y-(108-seam)*z/3,32*z,(108-seam)*z/3);
    }else c.drawImage(source,x-16*z,y-36*z,32*z,36*z);
    c.restore();
  }
  root.BagseedIllustrated=Object.freeze({prepare,draw,load,tinted,nativeSprite:[96,108],worldDrawBox:[32,36],nativePortrait:[192,192]});
})(window);
