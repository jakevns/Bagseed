// Source-only preparation. No tracing, new silhouettes, painting, or per-part scaling.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),map=require('./native-body-map.json'),{pose,scale,joint,length}=require('./rig.cjs');
const out=path.join(__dirname,'generated');fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const rect=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
const contract={id:'bagseed-rigid-source-review',version:'1.0.0',coordinateSystem:{logicalCanvas:[96,144],finalFigureScale:1},profiles:{'average/neutral/adult':{width:1,height:1,headScale:1}},head:{faceFits:{soft:[1,1]},sideJawX:{down:96,up:96,right:96,left:96}},ordering:{},timing:{normal:{}},aliases:{},poses:{},bodyPoseSets:{},materialRoles:['skin']};
const registry={contractId:contract.id,contractVersion:contract.version,anatomicalFamilies:true,stages:['farArm','farLeg','body','nearLeg','nearArm','head'],assets:{},supportedParameters:{topPat:['none'],botPat:['none']}};
const manifest={status:'Body art review pending approval. Clothing frozen. Builds deferred.',documents:[],files:[],uniformScale:scale};
for(const d of map.documents){
 const [_,anatomy,dir]=d.id.split('/'),side=['right','left'].includes(dir),near=dir==='left'?'L':'R';
 const input=fs.readFileSync(path.join(root,d.inputSVG),'utf8'),png=fs.readFileSync(path.join(root,d.source));
 if(sha(png)!==d.sourceSHA256)throw Error('Approved PNG changed: '+d.source);
 const image=input.match(/<image id="original"[^>]*\/>/)?.[0];
 if(!image||!image.includes(png.toString('base64')))throw Error('Layered source does not embed the approved PNG');
 const [x,y,w,h]=d.crop,clips=[],groups=[],parts=[];
 for(const l of d.layers){
  const [,name,s]=l.id.split('.'),native=side&&s?d.layers.find(n=>n.id===`body.${name}.${near}`):l;
  let mask=native.mask,intersection=native.intersection,exclude=native.exclude||[];
  // Extend the CUT into existing adjacent pixels. This never draws new skin.
  if(name==='neck')mask=rect(x,20,w,95);
  if(name==='torso')mask=rect(x,85,w,285);
  if(name==='pelvis')mask=rect(x,330,w,137);
  if(['upperArm','forearm','hand'].includes(name)){
   const band=name==='upperArm'?[85,225]:name==='forearm'?[260,185]:[400,130];intersection=rect(x,band[0],w,band[1]);
  }
  if(['thigh','calf','foot'].includes(name)){
   const start=side?x:(d.pins['hip'+s][0]<d.pins.neck[0]?x:d.pins.neck[0]);
   const width=side?w:(start===x?d.pins.neck[0]-x:x+w-start);
   const band=name==='thigh'?[405,210]:name==='calf'?[565,250]:[765,122];mask=rect(start,band[0],width,band[1]);
  }
  const id=l.id.replaceAll('.','-'),cut='cut-'+id;
  clips.push(`<clipPath id="${cut}"><path d="${mask}"/></clipPath>`);
  if(intersection)clips.push(`<clipPath id="band-${id}"><path d="${intersection}"/></clipPath>`);
  if(exclude.length)clips.push(`<mask id="exclude-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1774" height="887"><rect width="1774" height="887" fill="white"/>${exclude.map(d=>`<path d="${d}" fill="black"/>`).join('')}</mask>`);
  groups.push(`<g id="${l.id}" data-material="skin" data-pixel-source="${native.id}"${exclude.length?` mask="url(#exclude-${id})"`:''}>${intersection?`<g clip-path="url(#band-${id})">`:''}<use href="#original" clip-path="url(#${cut})"/>${intersection?'</g>':''}</g>`);
  const target=joint[name]+(s||''),pivot=d.pins[target];
  parts.push({id:l.id,name,side:s||null,pivot,target,reusedVisiblePixels:side&&!!s&&s!==near,sourcePart:native.id});
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><title>${d.id} — original pixels only</title><defs>${image}${clips.join('')}</defs>${groups.join('\n')}</svg>\n`;
 const filename=`${anatomy}-${dir}.svg`,url='/generated/'+filename,hash=sha(svg);fs.writeFileSync(path.join(out,filename),svg);
 contract.ordering[dir]={nearSide:near,tieNear:near};contract.timing.normal[dir]={fps:8,count:8};
 const poses={};contract.bodyPoseSets[anatomy+'/average']??={};
 for(const frame of [null,0,1,2,3,4,5,6,7]){const key=frame===null?`idle/${dir}`:`walk/${dir}/${frame}`,p=pose(d,frame);poses[key]=p;contract.poses[key]??=p;contract.bodyPoseSets[anatomy+'/average'][key]=p;}
 registry.assets['body/'+anatomy]??={id:'body/'+anatomy,slot:'body',contractVersion:contract.version,compatibleProfiles:['average/neutral/adult'],poseKeys:[],sourcePath:d.source,sourceSHA256:d.sourceSHA256,reviewStatus:'unapproved',layers:[]};
 const asset=registry.assets['body/'+anatomy];asset.poseKeys.push(...Object.keys(poses));
 for(const [key,p]of Object.entries(poses))for(const part of parts){
  const arm=['upperArm','forearm','hand'].includes(part.name),leg=['thigh','calf','foot'].includes(part.name);
  asset.layers.push({id:`${key}/${part.id}`,stage:arm?'arm':leg?'leg':'body',side:part.side,poseKeys:[key],material:'skin',alphaMask:'geometry',materialMasks:[{mask:'geometry',role:'skin',weight:1}],geometry:{type:'raster',image:url,imageSHA256:hash,mask:'self',sourceGroup:part.id,sourceKey:`${anatomy}/${dir}/${part.id}`,sourceCanvas:[w,h],sourceOffset:[x,y],tint:{mode:'preserve'},binding:{mode:'rigid',sourcePivot:part.pivot,target:part.target,uniformScale:scale,rotation:p.rotations[part.name+(part.side?'.'+part.side:'')]||0}}});
 }
 const bones={};for(const s of ['L','R'])for(const [a,b]of [['shoulder','elbow'],['elbow','wrist'],['hip','knee'],['knee','ankle']])bones[a+'-'+b+s]=length(d.pins[a+s],d.pins[b+s]);
 manifest.documents.push({...d,layers:undefined,parts,bones,url,svgSHA256:hash,standingMatrix:[scale,0,0,scale,48-d.pins.root[0]*scale,143-d.pins.root[1]*scale]});
 manifest.files.push({path:d.source,sha256:d.sourceSHA256},{path:d.inputSVG,sha256:sha(input)},{path:'review/character-rigid-body/generated/'+filename,sha256:hash});
}
// Deliberately empty slots: this body-only gate never loads or refits clothing.
for(const [slot,id]of [['head','standard'],['upper','tee'],['lower','jeans'],['footwear','sneakers'],['hair','short'],['headwear','none'],['glasses','none'],['facial','none'],['eyes','dot'],['brows','thin'],['nose','default'],['mouth','default'],['ears','normal'],['expression','neutral'],['accessory','none']])registry.assets[slot+'/'+id]={id:slot+'/'+id,slot,contractVersion:contract.version,compatibleProfiles:['average/neutral/adult'],poseKeys:Object.keys(contract.poses),sourcePath:'review/character-rigid-body/build.cjs',sourceSHA256:sha(fs.readFileSync(__filename)),reviewStatus:'unapproved',layers:[]};
for(const [name,data]of Object.entries({contract,registry,manifest}))fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(data,null,2)+'\n');
console.log('Prepared 12 native views, 15 pixel parts per view, 108 poses. No body-shape-review output.');
