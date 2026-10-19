/* Shared attachment planner. Deliberately independent of the existing game renderers. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BagseedLayered=factory();})(globalThis,()=>{
  'use strict';
  const COMPOSITOR_ID='bagseed-layered-v1',SIDES=['L','R'];
  const clone=v=>JSON.parse(JSON.stringify(v));
  function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v);}return value;}
  const signature=value=>JSON.stringify(value);
  const hex=(value,fallback)=>{const v=value??fallback;if(typeof v!=='string'||!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(v))throw Error('Invalid material color: '+v);return v.length===4?'#'+[...v.slice(1)].map(c=>c+c).join(''):v.toLowerCase();};
  function normalize(input={}){
    const look={anatomy:'androgynous',body:'average',pres:'neutral',stature:input.short?'short':'adult',face:'soft',topS:input.shirtS||'tee',bottomS:'jeans',shoesS:'sneakers',hairS:'short',hat:'none',glasses:'none',facial:'none',eyes:'dot',brows:'thin',nose:'default',mouth:'default',ears:'normal',expr:'neutral',acc:'none',topPat:'none',botPat:'none',hairHi:'none',...clone(input)};
    look.skin=hex(look.skin,'#cf9670');look.hairC=hex(look.hairC,'#4a2c1a');look.shirtC=hex(look.shirtC,'#3f7fbf');look.pantsC=hex(look.pantsC,'#36405a');look.shoesC=hex(look.shoesC,'#2b1d14');look.topC2=hex(look.topC2,'#e9e2d4');look.botC2=hex(look.botC2,'#e9e2d4');look.eyeC=hex(look.eyeC,'#2b1d14');look.accC=hex(look.accC,'#c94f4f');if(look.hairHi!=='none')look.hairHi=hex(look.hairHi);
    return look;
  }
  function selectPose(contract,state={}){
    const dir=state.direction||'down';if(!contract.ordering[dir])throw Error('Unsupported direction: '+dir);
    let mode=state.sniff?'sniff':state.walking?'walk':state.interact?'interact':state.seated?'seated':state.mode||'idle';
    let key=`${mode}/${dir}`;
    if(mode==='walk'){const timing=contract.timing.normal[dir];let frame=state.frame??Math.floor((state.time||0)*timing.fps);if(state.reduced)frame=['right','left'].includes(dir)?2:(Math.floor((state.time||0)*4)%2)*2+1;if(!Number.isInteger(frame))throw Error('Frame must be an integer');key+='/'+((frame%timing.count+timing.count)%timing.count);}
    const alias=contract.aliases[key];const resolved=alias?.pose||key;if(!contract.poses[resolved])throw Error('Unsupported pose: '+key);
    return {requested:key,key:resolved,overlay:alias?.overlay||null,pose:contract.poses[resolved]};
  }
  function fittedAnchors(pose,fit){const a={};for(const [key,[x,y]]of Object.entries(pose.anchors)){if(key==='jawAttach'||key==='root')continue;a[key]=[48+(x-48)*fit.width,143+(y-143)*fit.height];}a.root=[48,143];const gap=Math.round((pose.anchors.neck[1]-(pose.anchors.jawAttach?.[1]??pose.anchors.neck[1]-5))*1e6)/1e6;a.jawAttach=[a.neck[0],a.neck[1]-gap*fit.headScale];return a;}
  function headGeometry(contract,look,dir,anchors,fit){
    const [fx,fy]=contract.head.faceFits[look.face]||[];if(!fx||!fy)throw Error('Unsupported face: '+look.face);
    const h=fit.headScale/3,j=[96+(contract.head.sideJawX[dir]-96)*fx,199+(184-199)*fy];
    const origin=[anchors.jawAttach[0]-j[0]*h,anchors.jawAttach[1]-j[1]*h];
    return {origin,scale:fit.headScale,face:look.face,matrix:[h*fx,0,0,h*fy,origin[0]+96*(1-fx)*h,origin[1]+199*(1-fy)*h],nativeLandmarks:{jaw:j,eyes:[[78,135],[114,135]],nose:[96,151]}};
  }
  const apply=(m,[x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
  function resolveGeometry(shape,anchors,fit,head){
    if(shape.type==='raster'&&['rigid','frontBackCalf'].includes(shape.binding?.mode)){
      const b=shape.binding,p=anchors[b.target],s=b.uniformScale,r=b.rotation;
      if(!p||!Array.isArray(b.sourcePivot)||b.sourcePivot.length!==2||!b.sourcePivot.every(Number.isFinite)||!(s>0)||!Number.isFinite(r))throw Error('Invalid rigid art attachment');
      if(fit.width!==1||fit.height!==1||shape.frameClip||shape.frameFill||shape.frameStrokes)throw Error('Rigid art cannot use body reshaping or destination silhouettes');
      const projected=b.mode==='frontBackCalf';
      if(projected&&(!['down','up'].includes(b.direction)||b.part!=='calf'||r!==0||!(b.projectionY===1||b.projectionY>=.85&&b.projectionY<=.9)))throw Error('Only front/back calves may use the approved vertical projection');
      const a=s*Math.cos(r),bb=s*Math.sin(r),c=-bb,d=projected?s*b.projectionY:a,[x,y]=b.sourcePivot;
      return {shape:clone(shape),matrix:[a,bb,c,d,p[0]-a*x-c*y,p[1]-bb*x-d*y]};
    }
    if(shape.type==='raster'&&shape.frameClip)shape={...shape,frameFit:[fit.width,fit.height]};
    if(shape.type==='raster'&&shape.binding?.mode==='bone'){
      const resolve=ref=>typeof ref==='string'?anchors[ref]:ref.between?(()=>{const [a,b]=ref.between.map(k=>anchors[k]);return [a[0]+(b[0]-a[0])*ref.t,a[1]+(b[1]-a[1])*ref.t];})():null;
      const b=shape.binding,[s0,s1]=b.source,[t0,t1]=b.target.map(resolve);if(!t0||!t1)throw Error('Unknown bone attachment');
      const sx=s1[0]-s0[0],sy=s1[1]-s0[1],sl=Math.hypot(sx,sy),tx=t1[0]-t0[0],ty=t1[1]-t0[1],tl=Math.hypot(tx,ty);if(sl<1e-8||tl<1e-8)throw Error('Degenerate bone attachment');
      // Orthogonal longitudinal/cross-section axes, never a sheared limb cutout.
      const cross=(b.crossScale||tl/sl)*fit.width,along=tl/sl,ux=sx/sl,uy=sy/sl,vx=tx/tl,vy=ty/tl;
      const a=vx*along*ux+vy*cross*uy,c=vx*along*uy-vy*cross*ux,bb=vy*along*ux-vx*cross*uy,d=vy*along*uy+vx*cross*ux;
      return {shape:clone(shape),matrix:[a,bb,c,d,t0[0]-a*s0[0]-c*s0[1],t0[1]-bb*s0[0]-d*s0[1]]};
    }
    const point=ref=>{if(Array.isArray(ref))return ref;if(ref.anchor){const p=anchors[ref.anchor];if(!p)throw Error('Unknown anchor: '+ref.anchor);return [p[0]+(ref.dx||0)*fit.width,p[1]+(ref.dy||0)*fit.height];}if(ref.between){const [a,b]=ref.between.map(k=>anchors[k]);if(!a||!b)throw Error('Unknown segment anchor');return [a[0]+(b[0]-a[0])*ref.t+(ref.dx||0)*fit.width,a[1]+(b[1]-a[1])*ref.t+(ref.dy||0)*fit.height];}throw Error('Invalid geometry point');};
    if(shape.space==='head')return {shape:clone(shape),matrix:head.matrix};
    if(shape.type==='raster'){
      const binding=shape.binding;
      if(!binding||binding.source.length!==3||binding.target.length!==3)throw Error('Raster source requires three explicit source/target pins');
      const [s0,s1,s2]=binding.source,[t0,t1,t2]=binding.target.map(point),ax=s1[0]-s0[0],ay=s1[1]-s0[1],bx=s2[0]-s0[0],by=s2[1]-s0[1],det=ax*by-ay*bx;
      if(Math.abs(det)<1e-8)throw Error('Degenerate raster source binding');
      const ux=t1[0]-t0[0],uy=t1[1]-t0[1],vx=t2[0]-t0[0],vy=t2[1]-t0[1];
      const a=(ux*by-vx*ay)/det,c=(vx*ax-ux*bx)/det,b=(uy*by-vy*ay)/det,d=(vy*ax-uy*bx)/det;
      return {shape:clone(shape),matrix:[a,b,c,d,t0[0]-a*s0[0]-c*s0[1],t0[1]-b*s0[0]-d*s0[1]]};
    }
    if(shape.type==='capsule'){
      const start=point(shape.start),end=point(shape.end),dx=end[0]-start[0],dy=end[1]-start[1],len=Math.hypot(dx,dy);if(len<1e-8)throw Error('Zero-length capsule');
      return {shape:{type:'capsule',length:len,radius:shape.radius*fit.width},matrix:[dy/len,-dx/len,dx/len,dy/len,start[0],start[1]]};
    }
    if(shape.type==='polygon')return {shape:{type:'polygon',points:shape.points.map(point)},matrix:[1,0,0,1,0,0]};
    if(shape.type==='ellipse'){const p=point(shape.center);return {shape:{type:'ellipse',center:[0,0],rx:shape.rx*fit.width,ry:shape.ry*fit.height},matrix:[1,0,0,1,p[0],p[1]]};}
    throw Error('Unsupported geometry type: '+shape.type);
  }
  function orderLayers(layers,stages){
    const edges=new Map(),indeg=new Map();const add=id=>{if(edges.has(id))throw Error('Duplicate draw node: '+id);edges.set(id,new Set());indeg.set(id,0);};
    for(const stage of stages){add('@'+stage+':start');add('@'+stage+':end');}for(const layer of layers)add(layer.id);
    const edge=(from,to)=>{if(!edges.has(from)||!edges.has(to))throw Error('Missing draw dependency: '+from+' -> '+to);if(!edges.get(from).has(to)){edges.get(from).add(to);indeg.set(to,indeg.get(to)+1);}};
    stages.forEach((stage,i)=>{edge('@'+stage+':start','@'+stage+':end');if(i)edge('@'+stages[i-1]+':end','@'+stage+':start');});
    for(const l of layers){if(!stages.includes(l.stage))throw Error('Unknown draw stage: '+l.stage);edge('@'+l.stage+':start',l.id);edge(l.id,'@'+l.stage+':end');for(const id of l.after||[])edge(id,l.id);for(const id of l.before||[])edge(l.id,id);}
    const queue=[...indeg.keys()].filter(id=>!indeg.get(id)),result=[];while(queue.length){const id=queue.shift();result.push(id);for(const next of edges.get(id)){indeg.set(next,indeg.get(next)-1);if(!indeg.get(next))queue.push(next);}}
    if(result.length!==edges.size)throw Error('Cyclic layer coverage/order constraints');const byId=new Map(layers.map(l=>[l.id,l]));return result.filter(id=>byId.has(id)).map(id=>byId.get(id));
  }
  function createEngine(contractInput,registryInput){
    const contract=freeze(clone(contractInput)),registry=freeze(clone(registryInput));
    if(registry.contractId!==contract.id||registry.contractVersion!==contract.version)throw Error('Registry/contract version mismatch');
    let rigidScale=null;
    for(const asset of Object.values(registry.assets)){
      if(!/^[a-f0-9]{64}$/.test(asset.sourceSHA256||'')||!asset.sourcePath)throw Error('Attachment source provenance is missing: '+asset.id);
      for(const layer of asset.layers)if(['rigid','frontBackCalf'].includes(layer.geometry?.binding?.mode)){
        const scale=layer.geometry.binding.uniformScale;
        if(!(scale>0)||!Number.isFinite(scale))throw Error('Invalid rigid character scale');
        if(rigidScale!==null&&scale!==rigidScale)throw Error('Rigid parts must share one whole-character scale');
        rigidScale=scale;
      }
      for(const layer of asset.layers){if(layer.empty)continue;if(layer.alphaMask!=='geometry'||!layer.materialMasks?.length||Math.abs(layer.materialMasks.reduce((n,m)=>n+m.weight,0)-1)>1/255||layer.materialMasks.some(m=>m.mask!=='geometry'||m.role!==layer.material))throw Error('Invalid explicit material mask: '+layer.id);}
    }
    function plan(input={},state={},options={}){
      const look=normalize(input),selected=selectPose(contract,state),profile=`${look.body}/${look.pres}/${look.stature}`,fit=contract.profiles[profile];if(!fit)throw Error('Unsupported body profile: '+profile);
      const shapePose=contract.bodyPoseSets?.[look.anatomy+'/'+look.body]?.[selected.key];if(shapePose)selected.pose=shapePose;
      const anchors=fittedAnchors(selected.pose,fit),head=headGeometry(contract,look,selected.pose.direction,anchors,fit),missing=[];
      const identity={contract:contract.version,profile,pose:selected.key,anchors,head,...(registry.anatomicalFamilies?{anatomy:look.anatomy}:{})},geometrySignature=signature(identity);
      const materialValues={'skin':look.skin,'hair.primary':look.hairC,'hair.highlight':look.hairHi==='none'?look.hairC:look.hairHi,'upper.primary':look.shirtC,'upper.secondary':look.topC2,'lower.primary':look.pantsC,'lower.secondary':look.botC2,'footwear.primary':look.shoesC,'eye.iris':look.eyeC,'accessory.primary':look.accC,'fixed.ink':'#2e3542','fixed.trim':'#e9e2d4'};
      const requests=[['body',registry.anatomicalFamilies?look.anatomy:'standard'],['head','standard'],['upper',look.topS],['lower',look.bottomS],['footwear',look.shoesS],['hair',look.hairS],['headwear',look.hat],['glasses',look.glasses],['facial',look.facial],['eyes',look.eyes],['brows',look.brows],['nose',look.nose],['mouth',look.mouth],['ears',look.ears],['expression',look.expr],['accessory',look.acc]];
      for(const key of ['topPat','botPat','emb','prop'])if(look[key]&&!registry.supportedParameters[key]?.includes(look[key]))missing.push({code:'UNSUPPORTED_PARAMETER',key,value:look[key]});
      for(const key of ['pierce','marks','extras'])for(const value of look[key]||[])missing.push({code:'MISSING_ATTACHMENT',key: key+'/'+value,profile,pose:selected.key});
      const sources=[];for(const [slot,id]of requests){const key=slot+'/'+id,asset=registry.assets[key];if(!asset){missing.push({code:'MISSING_ATTACHMENT',key,profile,pose:selected.key});continue;}if(asset.contractVersion!==contract.version||!asset.compatibleProfiles.includes(profile)||!asset.poseKeys.includes(selected.key)){missing.push({code:'INCOMPATIBLE_ATTACHMENT',key,profile,pose:selected.key});continue;}if(options.production&&asset.reviewStatus!=='approved'){missing.push({code:'UNAPPROVED_SOURCE',key,status:asset.reviewStatus});continue;}sources.push(asset);}
      const baseTrace={compositorId:COMPOSITOR_ID,contractId:contract.id,contractVersion:contract.version,profile,requestedPose:selected.requested,pose:selected.key,aliasOverlay:selected.overlay,geometrySignature,anchors,headOrigin:head.origin,headTransform:head.matrix,faceSignature:signature(head),skinMaterial:look.skin,selectedSlots:Object.fromEntries(requests),missing,technicalOnly:sources.some(s=>s.reviewStatus!=='approved'),readyForMigration:false};
      if(missing.length)return freeze({complete:false,look,trace:{...baseTrace,sources:sources.map(s=>({id:s.id,hash:s.sourceSHA256})),layers:[],drawOrder:[]}});
      const direction=selected.pose.direction,nearArm=selected.pose.nearArm||contract.ordering[direction].nearSide||contract.ordering[direction].tieNear,nearLeg=selected.pose.nearLeg||contract.ordering[direction].nearSide||contract.ordering[direction].tieNear;
      const layers=[];const masks=new Map();
      for(const asset of sources)for(const mask of asset.coverageMasks||[]){if(mask.directions&&!mask.directions.includes(direction))continue;if(masks.has(mask.id))throw Error('Duplicate coverage mask');masks.set(mask.id,{...mask,sourceId:asset.id,geometry:resolveGeometry(mask.geometry,anchors,fit,head)});}
      for(const asset of sources)for(const def of asset.layers){
        if(def.directions&&!def.directions.includes(direction)||def.poseKeys&&!def.poseKeys.includes(selected.key)||def.bodyBuilds&&!def.bodyBuilds.includes(look.body))continue;
        const conditionHidden=def.when&&Object.entries(def.when).some(([key,value])=>!!state[key]!==value)?'State condition hides this attachment surface.':null;
        const stage=def.stage==='leg'?(registry.stages.includes('legs')?'legs':def.side===nearLeg?'nearLeg':'farLeg'):def.stage==='arm'?(def.side===nearArm?'nearArm':'farArm'):def.stage;
        const geometry=def.empty?null:resolveGeometry(def.geometry,anchors,fit,head),coverage=[...masks.values()].filter(m=>m.targets.includes(def.id));
        if(!def.empty&&!contract.materialRoles.includes(def.material))throw Error('Unknown material role: '+def.material);
        const headOwnedSkin=def.surfaceOwner==='head'&&['nose','mouth','eyes','brows'].includes(asset.slot)&&def.geometry?.space==='head';
        if(!['body','head','ears'].includes(asset.slot)&&!headOwnedSkin&&def.material==='skin')throw Error('Skin material in non-body attachment: '+asset.id);
        const pattern=def.patternSlot?look[def.patternSlot]:null;
        layers.push({id:def.id,slot:asset.slot,sourceId:asset.id,sourcePath:asset.sourcePath,sourceSHA256:asset.sourceSHA256,reviewStatus:asset.reviewStatus,anchorBindings:def.anchorBindings,alphaMask:def.alphaMask||null,materialMasks:def.materialMasks||[],stage,side:def.side||null,geometry,material:def.material||null,color:materialValues[def.material],empty:def.empty||conditionHidden,after:def.after||[],before:def.before||[],coverageMasks:coverage,pattern:pattern&&pattern!=='none'?{id:pattern,color:materialValues[def.patternSlot==='topPat'?'upper.secondary':'lower.secondary'],origin:anchors.neck,fit}:null});
      }
      const ordered=orderLayers(layers,registry.stages),maskIds=new Set(layers.map(l=>l.id));for(const mask of masks.values())for(const target of mask.targets)if(!maskIds.has(target))throw Error('Coverage target absent: '+target);
      const trace={...baseTrace,sources:sources.map(s=>({id:s.id,hash:s.sourceSHA256,reviewStatus:s.reviewStatus})),layers:ordered,drawOrder:ordered.map(l=>l.id),coverageMasks:[...masks.values()]};
      return freeze({complete:true,look,trace,canvas:contract.coordinateSystem.logicalCanvas,finalFigureScale:contract.coordinateSystem.finalFigureScale,overlay:selected.requested.startsWith('sniff/')?{kind:'sniff',nose:apply(head.matrix,head.nativeLandmarks.nose)}:null});
    }
    return Object.freeze({plan,contract,registry});
  }
  return {createEngine,normalize,selectPose,fittedAnchors,orderLayers,resolveGeometry,apply,signature,COMPOSITOR_ID};
});
