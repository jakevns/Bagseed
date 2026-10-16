// Fit the remaining original paintings around the existing scalp/ear roots.
// Rows: horizontal front/profile/rear scale, then upper-crown vertical scale.
// Length below the ear stays intact; only closed short cuts extend to the nape.
const remainingHairFits={
 medium:[.91,.90,.94,.96,.84,.99],long:[.88,.86,.92,1,.82,1],
 bob:[.90,.87,.92,.98,.84,.99],curly:[.89,.86,.90,.98,.86,.98],
 wavy:[.90,.86,.95,1,.84,1],bun:[.86,.84,.86,.90,.88,.92],
 ponytail:[.88,.82,.90,.98,.84,.99],braids:[.86,.83,.90,1,.82,1],
 locs:[.90,.86,.94,1,.86,1],afro:[.92,.88,.92,.96,.92,.96],
 mohawk:[.94,.90,.97,.94,.90,.96],sidecut:[.90,.90,.92,.95,.90,.98],
 balding:[.96,.98,.98,1,1,1],pixie:[.99,.96,.99,.96,.90,1],
 sidepixie:[.98,.94,.98,.96,.90,1],hightop:[1,.94,1,.96,.90,.98],
 flattop:[.96,.94,.98,1,.96,1],quiff:[.97,.92,.98,.94,.86,.96],
 pomp:[.96,.88,.98,.94,.86,.96],slick:[.99,.95,.99,.97,.92,1],
 spikes:[.97,.94,.99,.96,.90,.99],fauxhawk:[.98,.94,.99,.94,.90,.98],
 curlytop:[1,.96,1,.96,.90,.98],twistsS:[.93,.90,.96,.95,.90,.98],
 bowl:[1,.98,1,1,.94,1],curtains:[.91,.88,.94,.96,.85,.99],
 angledbob:[.90,.86,.92,.98,.84,.99],asymbob:[.92,.87,.94,.98,.84,.99],
 braidbob:[.93,.88,.94,.96,.86,.99],lob:[.87,.84,.91,1,.82,1],
 shag:[.92,.90,.94,.96,.86,.98],wolf:[.93,.90,.95,.96,.86,.99],
 mullet:[.92,.90,.94,.96,.86,.99],curlybob:[.91,.86,.94,1,.85,.99],
 twistout:[.93,.88,.95,.98,.86,.99],puff:[.86,.84,.87,.90,.88,.92],
 puffs:[.90,.88,.90,.92,.90,.94],topknot:[.86,.84,.88,.90,.88,.92],
 halfup:[.90,.85,.96,.95,.86,.98],ponyhi:[.88,.82,.90,.90,.86,.94],
 sidepony:[.90,.85,.93,.98,.86,.99],spacebuns:[.89,.86,.90,.94,.90,.95],
 bantu:[.92,.90,.94,.94,.90,.96],crownbraid:[.91,.87,.94,.96,.88,.99],
 lowbun:[.90,.85,.94,.98,.88,.99],layered:[.89,.86,.94,.99,.85,1],
 bluntlong:[.88,.86,.96,.94,.85,.98],beachwaves:[.90,.85,.94,.99,.84,1],
 longcurls:[.89,.85,.94,1,.86,1],twinbraids:[.90,.85,.92,1,.84,1],
 boxbraids:[.84,.86,.97,1,.88,1],longtwists:[.91,.87,.95,1,.86,1],
 cornrows:[1,1,1,1,1,1],loosebraid:[.90,.85,.94,1,.87,1],
 bigafro:[.94,.90,.94,.96,.94,.96]
};
const remainingClosedCuts=new Set(['pixie','sidepixie','hightop','flattop','quiff','pomp','slick','spikes','fauxhawk','curlytop','bowl']);
const intentionallyBareCuts=new Set(['balding','mohawk','sidecut','cornrows']);
const rearCapBackingCuts=new Set(['bun','braids','topknot','spacebuns','bantu','crownbraid','twinbraids']);
const remainingHairSources=new Map();
function remainingHairSource(L,dir){
 const key=L.hairS+'|'+dir;if(remainingHairSources.has(key))return remainingHairSources.get(key);
 const profile=dir==='right'||dir==='left',fit=remainingHairFits[L.hairS],index=profile?1:dir==='up'?2:0;
 const raw=profile&&!intentionallyBareCuts.has(L.hairS)?batchHairSource({...L,ears:'hidden'},dir):pixels(`wig/${L.hairS}/${dir}`);
 const painting=cv(192,HEAD_HEIGHT),p=painting.getContext('2d');p.putImageData(raw.data,0,0);
 const sx=fit[index],root=143,anchor=dir==='right'?85:dir==='left'?108:96;
 let cap=fit[index+3],top=HEAD_HEIGHT;
 for(let y=0;y<HEAD_HEIGHT&&top===HEAD_HEIGHT;y++)for(let x=0;x<192;x++)if(raw.data.data[(y*192+x)*4+3]>100){top=y;break;}
 if(!intentionallyBareCuts.has(L.hairS))cap=Math.max(cap,(root-(profile?100:97))/Math.max(1,root-top));
 const lower=dir==='up'&&remainingClosedCuts.has(L.hairS)?1.2:1,out=cv(192,HEAD_HEIGHT),g=out.getContext('2d');
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 g.drawImage(painting,0,0,192,root,anchor-anchor*sx,root-root*cap,192*sx,root*cap);
 g.drawImage(painting,0,root,192,HEAD_HEIGHT-root,anchor-anchor*sx,root,192*sx,(HEAD_HEIGHT-root)*lower);
 if(dir==='up'&&!intentionallyBareCuts.has(L.hairS)){
  // Outer volume may shrink, but the inner cap must still span the skull.
  // This row field follows the real bald contour, with a smooth transition
  // into the loose ends. It does not cut hair to the skull or fill partings.
  const original=cv(192,HEAD_HEIGHT);original.getContext('2d').drawImage(out,0,0);
  const a=g.getImageData(0,0,192,HEAD_HEIGHT).data,b=detailBase({...L,ears:'hidden'},dir).getContext('2d').getImageData(0,0,192,HEAD_HEIGHT).data,required=new Float32Array(HEAD_HEIGHT).fill(1);
  for(let y=103;y<185;y++){
   let hl=192,hr=-1,sl=192,sr=-1;
   for(let x=30;x<163;x++){const n=(y*192+x)*4;if(a[n+3]>150){hl=Math.min(hl,x);hr=Math.max(hr,x);}if(b[n+3]>220){sl=Math.min(sl,x);sr=Math.max(sr,x);}}
   if(hl<94&&hr>98&&sl<sr)required[y]=Math.min(1.35,Math.max(1,(96-sl+1.5)/(96-hl),(sr-96+1.5)/(hr-96)));
  }
  g.clearRect(0,0,192,HEAD_HEIGHT);
  for(let y=0;y<HEAD_HEIGHT;y++){
   let scale=1;for(let yy=Math.max(0,y-16);yy<=Math.min(HEAD_HEIGHT-1,y+16);yy++)scale=Math.max(scale,1+(required[yy]-1)*(1-Math.abs(y-yy)/17));
   g.drawImage(original,0,y,192,1,96-96*scale,y,192*scale,1);
  }
  if(rearCapBackingCuts.has(L.hairS)){
   // The source's tied sections may separate above the bottom of the skull.
   // Carry its own cap texture behind those sections, ending at the nape.
   const cap=cv(192,HEAD_HEIGHT),c=cap.getContext('2d');c.drawImage(out,0,22);
   const support=cv(192,HEAD_HEIGHT),s=support.getContext('2d');s.drawImage(detailBase({...L,ears:'hidden'},dir),0,0);s.globalCompositeOperation='destination-in';s.fill(new Path2D('M0 0H192V171L131 176Q119 184 110 186Q96 188 83 185Q70 179 62 172L0 171Z'));
   const im=c.getImageData(0,0,192,HEAD_HEIGHT),a=im.data,b=s.getImageData(0,0,192,HEAD_HEIGHT).data;
   for(let y=0;y<HEAD_HEIGHT;y++)for(let x=0;x<192;x++){const n=(y*192+x)*4;a[n+3]*=smooth(159,167,y)*b[n+3]/255;}c.putImageData(im,0,0);
   g.save();g.globalCompositeOperation='destination-over';g.drawImage(cap,0,0);g.restore();
  }
  if(remainingClosedCuts.has(L.hairS)){
   const support=cv(192,HEAD_HEIGHT),s=support.getContext('2d');s.drawImage(detailBase({...L,ears:'hidden'},dir),0,0);s.globalCompositeOperation='destination-in';s.fill(new Path2D('M0 0H192V171L131 176Q119 184 110 186Q96 188 83 185Q70 179 62 172L0 171Z'));
   const im=g.getImageData(0,0,192,HEAD_HEIGHT),a=im.data,b=s.getImageData(0,0,192,HEAD_HEIGHT).data;
   for(let y=143;y<HEAD_HEIGHT;y++)for(let x=0;x<192;x++){const n=(y*192+x)*4,t=smooth(143,153,y);a[n+3]*=1-t+t*b[n+3]/255;}g.putImageData(im,0,0);
  }
 }
 const result={width:192,height:HEAD_HEIGHT,data:g.getImageData(0,0,192,HEAD_HEIGHT)};remainingHairSources.set(key,result);return result;
}
