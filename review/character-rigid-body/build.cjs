// Prepare original cuts, then assemble completed painted-texture parts. No mesh.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),map=require('./native-body-map.json'),{pose,scale,joint,length}=require('./rig.cjs');
const out=path.join(__dirname,'generated');fs.mkdirSync(out,{recursive:true});
const rawOnly=process.argv.includes('--raw'),repairPath=path.join(root,'graphics/character-system/layered-sources/completed-body-parts/repairs.json');
if(!rawOnly&&!fs.existsSync(repairPath))throw Error('Run build.cjs --raw, export-cuts.cjs, repair-parts.py, then build.cjs.');
const repairs=rawOnly?null:JSON.parse(fs.readFileSync(repairPath));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const rect=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
const contract={id:'bagseed-rigid-source-review',version:'1.2.0-painted-joints',coordinateSystem:{logicalCanvas:[96,144],finalFigureScale:1},profiles:{'average/neutral/adult':{width:1,height:1,headScale:1}},head:{faceFits:{soft:[1,1]},sideJawX:{down:96,up:96,right:96,left:96}},ordering:{},timing:{normal:{}},aliases:{},poses:{},bodyPoseSets:{},materialRoles:['skin']};
const registry={contractId:contract.id,contractVersion:contract.version,anatomicalFamilies:true,stages:['farArm','farLeg','nearLeg','body','nearArm','head'],bodyFinish:{},assets:{},supportedParameters:{topPat:['none'],botPat:['none']}};
const manifest={status:'Body art review pending approval. Clothing frozen. Builds deferred.',documents:[],files:[],uniformScale:scale};
manifest.preparation=rawOnly?'Raw cuts for source repair only':{method:'same-part-patch-quilting',newGenerationCalls:3,acceptedGeneratedRepairs:0,frontBackCalfProjection:.85,frontBackForearmProjection:.9};
for(const d of map.documents){
 const [_,anatomy,dir]=d.id.split('/'),side=['right','left'].includes(dir),near=dir==='left'?'L':'R';
 registry.bodyFinish[anatomy]={color:repairs?.outlineColors?.[anatomy]||[65,60,58],widthAtDensity3:2};
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
 if(rawOnly)continue;
 contract.ordering[dir]={nearSide:near,tieNear:near};contract.timing.normal[dir]={fps:8,count:8};
 const completed=repairs?.parts.filter(r=>r.view===d.id)||[];
 const measured={...d,pins:repairs?.registeredPins[d.id]||d.pins,footContours:Object.fromEntries(completed.filter(r=>r.id.startsWith('body.foot.')).map(r=>[r.id.split('.')[2],r.contour]))};
 for(const part of parts){part.pivot=measured.pins[part.target];const source=completed.find(r=>r.id===part.id);if(source){part.completed=source;for(const key of ['path','expected','repair'])manifest.files.push({path:source[key],sha256:sha(fs.readFileSync(path.join(root,source[key])))});}}
 const poses={};contract.bodyPoseSets[anatomy+'/average']??={};
 for(const frame of [null,0,1,2,3,4,5,6,7]){const key=frame===null?`idle/${dir}`:`walk/${dir}/${frame}`,p=pose(measured,frame);poses[key]=p;contract.poses[key]??=p;contract.bodyPoseSets[anatomy+'/average'][key]=p;}
 registry.assets['body/'+anatomy]??={id:'body/'+anatomy,slot:'body',contractVersion:contract.version,compatibleProfiles:['average/neutral/adult'],poseKeys:[],sourcePath:d.source,sourceSHA256:d.sourceSHA256,reviewStatus:'unapproved',layers:[]};
 const asset=registry.assets['body/'+anatomy];asset.poseKeys.push(...Object.keys(poses));
 for(const [key,p]of Object.entries(poses))for(const part of parts){
  const arm=['upperArm','forearm','hand'].includes(part.name),leg=['thigh','calf','foot'].includes(part.name);
  const source=part.completed,projected=!side&&['calf','forearm'].includes(part.name),binding={mode:projected?(part.name==='calf'?'frontBackCalf':'frontBackForearm'):'rigid',sourcePivot:part.pivot,target:part.target,uniformScale:scale,rotation:p.rotations[part.name+(part.side?'.'+part.side:'')]||0,...(projected?{direction:dir,part:part.name,projectionY:p.projection[part.name+'.'+part.side]}:{})};
  asset.layers.push({id:`${key}/${part.id}`,stage:arm?'arm':leg?'leg':'body',side:part.side,poseKeys:[key],material:'skin',alphaMask:'geometry',materialMasks:[{mask:'geometry',role:'skin',weight:1}],geometry:{type:'raster',...(source?{image:'/source/'+source.path,imageSHA256:sha(fs.readFileSync(path.join(root,source.path))),expected:'/source/'+source.expected,repair:'/source/'+source.repair}:{image:url,imageSHA256:hash,sourceGroup:part.id,sourceKey:`${anatomy}/${dir}/${part.id}`}),mask:'self',sourceCanvas:[w,h],sourceOffset:[x,y],tint:{mode:'preserve'},...(side&&part.side&&part.side!==near?{appearance:{rgbMultiply:[.8,.8,.8],outlineStrength:.6}}:{}),binding}});
 }
 const bones={};for(const s of ['L','R'])for(const [a,b]of [['shoulder','elbow'],['elbow','wrist'],['hip','knee'],['knee','ankle']])bones[a+'-'+b+s]=length(measured.pins[a+s],measured.pins[b+s]);
 manifest.documents.push({...measured,layers:undefined,parts,bones,url,svgSHA256:hash,standingMatrix:[scale,0,0,scale,48-d.pins.root[0]*scale,143-d.pins.root[1]*scale]});
 manifest.files.push({path:d.source,sha256:d.sourceSHA256},{path:d.inputSVG,sha256:sha(input)},{path:'review/character-rigid-body/generated/'+filename,sha256:hash});
}
// Deliberately empty slots: this body-only gate never loads or refits clothing.
for(const [slot,id]of [['head','standard'],['upper','tee'],['lower','jeans'],['footwear','sneakers'],['hair','short'],['headwear','none'],['glasses','none'],['facial','none'],['eyes','dot'],['brows','thin'],['nose','default'],['mouth','default'],['ears','normal'],['expression','neutral'],['accessory','none']])registry.assets[slot+'/'+id]={id:slot+'/'+id,slot,contractVersion:contract.version,compatibleProfiles:['average/neutral/adult'],poseKeys:Object.keys(contract.poses),sourcePath:'review/character-rigid-body/build.cjs',sourceSHA256:sha(fs.readFileSync(__filename)),reviewStatus:'unapproved',layers:[]};
if(!rawOnly)for(const [name,data]of Object.entries({contract,registry,manifest}))fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(data,null,2)+'\n');
console.log(rawOnly?'Prepared 12 source-cut SVGs; active review untouched.':'Prepared 12 completed views, 15 parts per view, 108 poses. No body-shape-review output.');
