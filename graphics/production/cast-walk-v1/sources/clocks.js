  // Eight-frame actors retain displacement-driven phases. Old four-frame
  // actors continue through their established clocks and rendering paths.
  let castWalkDrawing=null;
  function castWalkFrameCount(look){return canonical.get(approvalKey(normalize(look)))?.walkFrameCount||4;}
  function castWalkState(a,t){
    if(castWalkFrameCount(a.look)!==8)return null;
    let distance=a.walkDistance116;
    if(a.id==='remy'&&runtime.remyW)distance=runtime.remyW.distance115||0;
    if(a.id==='visitflow'&&typeof VisitFlow!=='undefined'){const f=VisitFlow.S();if(f)distance=f.distance115||0;}
    const frame=!a.moving?0:settings.reduced?2:Number.isFinite(distance)?Math.floor(distance/(a.walkStride116||2.5))%8:Math.floor(t*8)%8;
    return {id:canonical.get(approvalKey(normalize(a.look))).id,frame,walk:!!a.moving};
  }
  for(const[owner,name]of [[Actors,'npc'],[Cast115,'drawNPC']]){
    const original=owner[name];owner[name]=function(c,a,t){const state=castWalkState(a,t),prior=castWalkDrawing;if(state)castWalkDrawing=state;try{return original.call(this,c,state?{...a,frame116:state.frame}:a,t);}finally{castWalkDrawing=prior;}};
  }
  if(typeof Motion116!=='undefined'){
    const view=Motion116.view;Motion116.view=function(a){const result=view.call(this,a);if(castWalkFrameCount(result.look)===8){const stride=(a.kind==='cast'&&CAST_DEF[a.id].kid?MOT116.KSTRIDE:MOT116.STRIDE)/2;result.walkDistance116=a.dist||0;result.walkStride116=stride;result.frame116=a.moving&&!settings.reduced?Math.floor(result.walkDistance116/stride)%8:a.moving?2:0;}return result;};
  }
