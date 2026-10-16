/* Isolated approval preview only: swap the two tent widths without moving desks. */
(()=>{
  STARTER_BOX.splice(0,4,2,8,54,90);
  T2_BOX.splice(0,4,64,8,86,112);
  SLOT_POS.closet=[[29,92]];SLOT_POS.tent2=[[87,114],[127,114]];
  Object.assign(DEV_POS.closet,{light:[29,34],exhaust:[42,22],fan:[45,48],humid:[15,96],sensor:[35,62],ctrl:[7,46],dehum:[57,100],heater:[5,101]});
  Object.assign(DEV_POS.tent2,{light:[107,39],exhaust:[81,26],fan:[132,50],humid:[86,108],sensor:[122,66]});
  const solids=SCENES.bedroom.solids,statics=DecoZ.statics;
  SCENES.bedroom.solids=function(){return solids.call(this).map(r=>r[0]===90&&r[1]===104&&r[2]===64?[64,104,86,18]:r);};
  DecoZ.statics=function(zone){return statics.call(this,zone).map(r=>zone==='bedroom'&&r[4]==='the starter tent'?[2,r[1],54,r[3],r[4]]:zone==='bedroom'&&r[4]==='the tent'?[64,r[1],86,r[3],r[4]]:r);};
})();
