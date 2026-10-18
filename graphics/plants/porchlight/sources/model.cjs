/* Porchlight attachment model. Physical dimensions are inches, independent of camera zoom. */
'use strict';
const Canopy=typeof window==='object'?window.BagseedCanopy:require('../../sources/canopy.cjs');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0)/4294967296;}
const lerp=(a,b,t)=>a+(b-a)*t;
function bezier(a,b,c,t){const u=1-t;return{x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};}
function build(p,traits={},options={}){
 const height=Math.max(.2,Number(p.height)||.2),nodes=clamp(Number(p.nodes)||1,1,11),count=Math.ceil(nodes),stage=p.stage??5;
 const seed=String(p.artIdentity?.seed||p.genome115?.id||p.pheno?.pid||p.seed||p.id||'porchlight');
 const model={revision:'attached-popcorn-2',height,nodes,seed,joints:[],branches:[],organs:[],training:p.training||'natural'};
 const branching=clamp((traits.branching||1.1)*(p.pheno?.b||1),.6,1.5),giant=p.loc==='outdoor'?1+Math.max(0,height-50)/140:1,leafLength=clamp(height*.13,1.1,9.2),density=clamp(p.density??.82,.2,1);
 const mutationArts=new Set(p.visualState?.mutationArts||[]),forked=(model.training==='topped'||mutationArts.has('twin'))&&nodes>=4;
 const lean=model.training==='lst'?-height*.28:0;
 const trunkY=height*(forked?.60:.89),trunkX=f=>lean*Math.pow(f,1.4)+(hash(seed+':lean')-.5)*height*.025*Math.sin(f*Math.PI);
 model.joints.push({id:'root',parent:null,x:0,y:0});
 for(let i=1;i<=count;i++){
  const u=Math.min(i,nodes)/(nodes+.7),y=trunkY*u;
  model.joints.push({id:'node:'+i,parent:i===1?'root':'node:'+(i-1),x:trunkX(u),y});
 }
 model.joints.push({id:'apex',parent:'node:'+count,x:trunkX(1),y:trunkY});
 if(forked)for(const side of [-1,1])model.branches.push({id:'leader:'+side,parent:'apex',at:0,dx:side*height*.17,dy:height*.31,width:clamp(height*.007,.18,.6),side,z:side*.1,cut:false,order:0,growth:1});
 const addLeaf=(id,parent,at,role,length,angle,z,growth=1)=>{
  if(growth<=.001)return;
  const parentBranch=model.branches.find(b=>b.id===parent),baseNode=Number(parent.match(/(?:node:|branch:)(\d+)/)?.[1]||nodes);
  const removed=p.visualState?.removedLeaves?.includes(id)||Canopy.removed(p,baseNode/(nodes+.7),parentBranch?.order===2?parentBranch.at:at||1);
  model.organs.push({id,parent,at,role,length:length*growth*(mutationArts.has('dwarf')?.72:mutationArts.has('triploid')?1.12:1),angle,z,removed,kind:'leaf',...(mutationArts.has('albino')?{maturity:clamp((nodes-baseNode)/2.5,0,1)}:{})});
 };
 for(let i=1;i<=count;i++){
  const growth=clamp(nodes-i+1,0,1),node='node:'+i,older=i<=Math.ceil(nodes*.4),cut=(!!p.pruned&&older)||Canopy.removed(p,i/(nodes+.7));
  const role=i===1?'singleLeaf':i===2?'threeLeaf':i===3?'fiveLeaf':'sevenLeaf',fanLength=i===1?Math.min(2,leafLength):i===2?Math.min(3.5,leafLength):i===3?Math.min(6,leafLength):leafLength;
  for(const side of [-1,1])if(!cut&&stage>2)addLeaf('fan:'+i+':'+side,node,0,role,fanLength*(.88+.12*hash(seed+':leafsize:'+i+':'+side)),side*(.92+hash(seed+':angle:'+i+':'+side)*.34),(i%2===0?side:-side)*.1,growth);
  if(mutationArts.has('whorl')&&!cut&&stage>2)addLeaf('fan:'+i+':whorl',node,0,role,fanLength*.82,.08,.4,growth);
  if(stage<3||i<2||i>=nodes-.2)continue;
  for(const side of [-1,1]){
   const id='branch:'+i+':'+side,age=clamp((nodes-i+.3)/3,0,1),length=height*.53*Math.pow(1-i/(nodes+1),.66)*branching*giant*age;
   if(length<.45)continue;
   const sideways=model.training==='lst'||model.training==='scrog';
   const spread=.72+.28*hash(seed+':spread:'+id),dx=side*length*(sideways?1.2:.62*spread),dy=sideways?Math.max(.3,height*.76-model.joints[i].y):length*(.86+(hash(seed+':rise:'+id)-.5)*.20);
   model.branches.push({id,parent:node,at:0,dx,dy,width:clamp(height*.005,.13,.45),side,z:side*.1,cut,order:1,growth:age});
   const sites=Math.min(12,Math.floor(length/4.4));
   for(let j=1;j<=sites;j++){
    const dist=j*4.4,at=clamp(dist/length,.12,.92),birth=clamp((length-dist)/2.4,0,1),sub=id+'/shoot:'+j;
    if(birth<=.001)continue;
    const sd=j%2===0?-side:side,subLength=Math.min(leafLength*.88,(length-dist)*.62)*birth;
    model.branches.push({id:sub,parent:id,at,dx:sd*subLength*.55,dy:subLength*.68,width:.12,side:sd,z:(j%2?-.2:.2),cut:cut||Canopy.removed(p,i/(nodes+.7),at),order:2,growth:birth});
    if(!cut&&hash(seed+':cover:'+sub)<density+.14){
     addLeaf(sub+'/fan',sub,1,j===1?'fiveLeaf':'sevenLeaf',leafLength*(.68+.13*hash(seed+':size:'+sub)),sd*(.55+hash(seed+':rot:'+sub)*.65),j%2?-.2:.2,birth);
     if(hash(seed+':paired:'+sub)>.56)addLeaf(sub+'/rear',id,at,'fiveLeaf',leafLength*.54,-sd*.65,-.3,birth);
    }
   }
   if(!cut){addLeaf(id+'/tip:left',id,1,'threeLeaf',leafLength*.58,-.42,.3,clamp(length/5,0,1));addLeaf(id+'/tip:right',id,1,'fiveLeaf',leafLength*.55,.40,.1,clamp(length/5,0,1));}
  }
 }
 if(stage===2&&height<12)model.organs.push({id:'cotyledons',parent:'node:1',at:0,role:'cotyledon',length:Math.min(2.5,height*.25),angle:0,z:0,kind:'leaf'});
 if(stage<=2){addLeaf('seedling:true:left','apex',0,'singleLeaf',height*.40,-.72,.3);addLeaf('seedling:true:right','apex',0,'singleLeaf',height*.40,.72,.1);}else if(forked){for(const side of [-1,1]){addLeaf('leader:'+side+'/fan:left','leader:'+side,1,'threeLeaf',leafLength*.57,-.35,.3);addLeaf('leader:'+side+'/fan:right','leader:'+side,1,'fiveLeaf',leafLength*.54,.36,.1);}}else{addLeaf('apex:fan:left','apex',0,'threeLeaf',leafLength*.57,-.35,.3);addLeaf('apex:fan:right','apex',0,'fiveLeaf',leafLength*.54,.36,.1);}
 // Each leader keeps its own connected nodes after topping or a natural fork.
 if(forked)for(const side of [-1,1])for(const [j,at]of [.25,.5,.75].entries())for(const sd of [-1,1])
  addLeaf('leader:'+side+'/node:'+j+':'+sd,'leader:'+side,at,nodes>=8?'sevenLeaf':'fiveLeaf',leafLength*(.74-at*.16),sd*.78,sd*.15);
 if(stage>=6&&stage<=10){
  const male=p.sex==='M',role=male?(stage>=9?'maleOpen':'maleClosed'):stage<=7?'femaleEarly':stage===8?'femaleMid':'femaleLate';
  const factor=male?.65:({6:.20,7:.42,8:.7,9:.9,10:1}[stage]);
  const flower=(id,parent,at,length,heightFraction,branchFraction=1,apical=false)=>{
   if(!male&&!apical&&Canopy.removed(p,heightFraction,branchFraction))return;
   model.organs.push({id,parent,at,role,length:length*factor,angle:0,z:.55,kind:'flower',site:apical?'apical':branchFraction<.5||heightFraction<.4?'popcorn':'lateral'});
  };
  for(const b of model.branches)if(!b.cut&&b.order===1){
   const u=Number(b.parent.split(':')[1])/(nodes+.7),base=Math.min(8,height*.13);
   flower(b.id+'/flower',b.id,1,base*(male?1:Canopy.budScale(u,1)*Canopy.topScale(p)),u);
   if(!male){
    // Stable positions on the same branch curve; never free-floating flower stamps.
    for(const [j,at]of [.20,.42,.64,.82].entries())
     flower(b.id+'/bud:'+j,b.id,at,base*(.20+.35*at)*Canopy.budScale(u,at),u,at);
   }
  }
  if(forked)for(const side of [-1,1]){
   const id='leader:'+side,base=Math.min(9,height*.15);
   flower(id+'/flower',id,1,base*(male?1:Canopy.topScale(p)),1,1,true);
   if(!male)for(const [j,at]of [.2,.45,.7].entries())flower(id+'/bud:'+j,id,at,base*(.2+.4*at),1,at);
  }
  else flower('apex:flower','apex',0,Math.min(11,height*.18)*(male?1:Canopy.topScale(p)),1,1,true);
  if(mutationArts.has('crest'))for(const o of model.organs)if(o.site==='apical')o.widthScale=2.1;
  if(mutationArts.has('triploid'))for(const o of model.organs)if(o.kind==='flower')o.widthScale=1.25;
  // Painted mutation sugar leaves belong to their flower's attachment, not a
  // free-floating overlay. Retain the same IDs and parents throughout bloom.
  if(!male&&['freak','duck','mono','variegated','fern','albino','gold'].some(k=>mutationArts.has(k)))for(const bud of model.organs.filter(o=>o.kind==='flower'&&o.site!=='popcorn'))for(const side of [-1,1]){
   addLeaf(bud.id+'/sugar:'+side,bud.parent,bud.at,'sugarLeaf',bud.length*.62,side*.50,.4);
   const leaf=model.organs[model.organs.length-1];if(leaf.id===bud.id+'/sugar:'+side)leaf.offsetY=bud.length*.18;
  }
 }
 // Bound the complete assembled canopy, not just the stem, to the labeled height.
 const pose0=pose(model,p,0,0,true);let top=trunkY;
 for(const organ of model.organs){const a=pose0.organs.get(organ.id);if(organ.removed||!a)continue;const outline=(options.partFor?.(organ)||options.parts?.[organ.role])?.outline;if(outline){const ca=Math.cos(a.angle),sa=Math.sin(a.angle);for(const[x,y]of outline)top=Math.max(top,a.y+organ.length*(y*ca-x*sa));}else top=Math.max(top,a.y+organ.length*(Math.max(0,Math.cos(a.angle))+.58*Math.abs(Math.sin(a.angle))));}
 const scale=height/top;
 for(const j of model.joints){j.x*=scale;j.y*=scale;}
 for(const b of model.branches){b.dx*=scale;b.dy*=scale;b.width*=scale;}
 for(const o of model.organs){o.length*=scale;if(o.offsetY)o.offsetY*=scale;}
 model.canopyScale=scale;return model;
}
function pose(model,p,t=0,wind=1,reduced=false){
 const joints=new Map(),branches=new Map(),organs=new Map(),H=model.height,phase=hash(model.seed+':wind')*Math.PI*2;
 const amp=reduced?0:clamp(wind,0,2.5),supported=p.staked||model.training==='scrog',support=supported?.22:1;
 for(const j of model.joints){const u=j.y/H,bend=Math.sin(t*1.15+phase)*H*.009*Math.pow(u,1.8)*amp*support;joints.set(j.id,{x:j.x+bend,y:j.y});}
 function at(id,u=0){if(joints.has(id))return joints.get(id);const b=branches.get(id);if(!b)throw Error('Missing attachment parent: '+id);return bezier(b.start,b.control,b.end,u);}
 for(const b of model.branches){
  const start=at(b.parent,b.at),length=Math.hypot(b.dx,b.dy),phi=hash(model.seed+':'+b.id)*Math.PI*2;
  const sway=Math.sin(t*1.38+phi)*length*.025*amp*support,end={x:start.x+b.dx+sway,y:start.y+b.dy+Math.sin(t*1.15+phi)*length*.008*amp*support};
  const control={x:lerp(start.x,end.x,.45)-b.side*length*.055,y:lerp(start.y,end.y,.45)-length*.07};branches.set(b.id,{...b,start,control,end});
 }
 const droop=clamp((22-(p.water??60))/22,0,1)*.55+(p.water>93?.22:0)+clamp((p.stress||0)/200,0,.4);
 for(const o of model.organs){const base=at(o.parent,o.at),flutter=Math.sin(t*2.3+hash(model.seed+':'+o.id)*6.28)*.065*amp,sgn=o.angle<0?-1:1;organs.set(o.id,{...base,y:base.y+(o.offsetY||0),angle:o.angle+sgn*droop+flutter});}
 return{joints,branches,organs};
}
function counts(model){return{joints:model.joints.length,primaryBranches:model.branches.filter(b=>b.order===1&&!b.cut).length,secondaryBranches:model.branches.filter(b=>b.order===2&&!b.cut).length,leaves:model.organs.filter(o=>o.kind==='leaf'&&!o.removed).length,flowers:model.organs.filter(o=>o.kind==='flower').length};}
// Finishing color is an expressed phenotype, not low nutrition or a new inherited roll.
// visualState.senescence is a review/prospective adapter input, not a change to stage durations.
function senescence(p,traits=p.artIdentity?.traits||{},nightColor=null){
 const stage=p.stage??5,late=stage===9||stage===10;
 const override=p.visualState?.senescence;
 const amount=late?(Number.isFinite(override)?clamp(override,0,1):stage===9?.65:.9):0;
 const color=traits.colorName||'Forest green',mutation=p.pheno?.mut;
 const palettes={
  'Lime green':['gold',[218,185,65]],'Forest green':['gold',[218,180,66]],
  'Blue-green':['ochre',[204,166,77]],'Lavender':['lavender',[158,116,183]],
  'Purple':['purple',[124,67,140]],'Dark purple':['deep-purple',[77,44,92]],
  'Pink accents':['rose',[192,103,130]],'Red accents':['red',[174,68,48]]
 };
 const [palette,rgb]=mutation==='ink'?['near-black',[44,32,52]]:(palettes[color]||palettes['Forest green']);
 const pigment=nightColor?.expression(p,traits);
 if(pigment?.strength)return{amount:Math.max(amount,pigment.strength*.85),palette:palette+'-cool',rgb:rgb.map((v,i)=>Math.round(lerp(v,pigment.rgb[i],pigment.strength*.9)))};
 return{amount,palette,rgb:rgb.slice()};
}
module.exports={build,pose,counts,senescence};
