/* Approval-only alignment with the physical rolled flap in each shell image. */
(()=>{
 const fractions={closet:{budget:.252,standard:.250},tent2:{standard:.250,pro:.250,premium:.237},tent4:{standard:.270,pro:.276,premium:.241},tent5:{standard:.242,pro:.241,premium:.233}};
 const bounds=loc=>loc==='closet'?STARTER_BOX:loc==='tent2'?T2_BOX:loc==='tent4'?[22,6,132,128]:loc==='tent5'?[178,2,182,142]:null;
 function roof(loc){return fractions[loc]?.[Shell.of(loc)?.tier]??(loc==='tent2'?.26:.27);}
 function roofY(loc){const b=bounds(loc);return b[1]+b[3]*roof(loc);}
 window.BagseedTentPlacement=Object.freeze({bounds,roof,roofY});
})();
