// Pose operates on measured native pixel vectors. It cannot resize an art part.
const scale=.13;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const rot=([x,y],r)=>[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];
const length=(a,b)=>Math.hypot(...sub(a,b));
const angle=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
function pose(doc,frame){
 const p=doc.pins,dir=doc.id.split('/')[2],profile=['right','left'].includes(dir),sign=dir==='left'?-1:1;
 const anchors={},rotations={},moving=frame!==null;
 // This one scale and translation apply to the whole source, including Standing.
 const origin=[48-p.root[0]*scale,143-p.root[1]*scale];
 const world=v=>[origin[0]+v[0]*scale,origin[1]+v[1]*scale];
 for(const [k,v]of Object.entries(p))anchors[k]=world(v);
 const offsets={};
 for(const side of ['R','L']){
  const phase=((frame??0)+(side==='L'?4:0))%8;
  // Stance goes forward -> back; airborne swing goes back -> forward.
  const stride=profile?70:18,travel=[stride,stride*.5,0,-stride*.5,-stride,-stride*.7,0,stride*.7][phase]*sign;
  const lift=[0,0,0,0,0,55,90,55][phase];
  const hip=p['hip'+side],knee=p['knee'+side],ankle=p['ankle'+side];
  let k=knee,a=ankle;
  if(moving){
   const l1=length(hip,knee),l2=length(knee,ankle),desired=[ankle[0]+travel,ankle[1]-lift-10];
   const v=sub(desired,hip),d=Math.min(Math.hypot(...v),l1+l2-.01),theta=Math.atan2(v[1],v[0]);
   const bend=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
   const bendSign=profile?-sign:(side==='R'?1:-1);
   k=add(hip,[Math.cos(theta+bendSign*bend)*l1,Math.sin(theta+bendSign*bend)*l1]);
   a=add(hip,[Math.cos(theta)*d,Math.sin(theta)*d]);
  }
  anchors['knee'+side]=world(k);anchors['ankle'+side]=world(a);
  rotations['thigh.'+side]=angle(hip,k)-angle(hip,knee);
  rotations['calf.'+side]=angle(k,a)-angle(knee,ankle);
  const footRotation=moving&&profile?sign*([0,0,0,.06,.16,.55,.13,-.10][phase]):0;
  rotations['foot.'+side]=footRotation;
  for(const n of ['toe','heel'])anchors[n+side]=world(add(a,rot(sub(p[n+side],ankle),footRotation)));
  const sh=p['shoulder'+side],el=p['elbow'+side],wr=p['wrist'+side];
  const arm=moving?-(profile?.24:.07)*sign*Math.cos(phase*Math.PI/4):0;
  const fore=arm+(moving?(profile?.12:.04)*sign*Math.sin(phase*Math.PI/4):0);
  const e=add(sh,rot(sub(el,sh),arm)),w=add(e,rot(sub(wr,el),fore));
  anchors['elbow'+side]=world(e);anchors['wrist'+side]=world(w);
  anchors['palm'+side]=world(add(w,rot(sub(p['palm'+side],wr),fore)));
  rotations['upperArm.'+side]=arm;rotations['forearm.'+side]=fore;rotations['hand.'+side]=fore;
  offsets[side]={phase,airborne:moving&&phase>=5,forward:travel*sign};
 }
 return {anchors,rotations,direction:dir,nearArm:dir==='left'?'L':'R',nearLeg:dir==='left'?'L':'R',offsets};
}
const joint={neck:'neck',torso:'neck',pelvis:'waist',upperArm:'shoulder',forearm:'elbow',hand:'wrist',thigh:'hip',calf:'knee',foot:'ankle'};
module.exports={pose,scale,joint,length};
