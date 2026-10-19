// All limb angles are explicit. Front/back calf projection is the sole scale exception.
const scale=.13,rad=d=>d*Math.PI/180;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const rot=([x,y],r)=>[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];
const length=(a,b)=>Math.hypot(...sub(a,b));
const sideTable=[
 {name:'Contact',thigh:20,knee:3,arm:18},
 {name:'Down',thigh:15,knee:15,arm:10},
 {name:'Passing',thigh:0,knee:38,arm:0},
 {name:'Up',thigh:-15,knee:20,arm:-10},
 {name:'Push-off',thigh:-20,knee:5,arm:-18},
 {name:'Recovery',thigh:-15,knee:35,arm:-10},
 {name:'Return',thigh:0,knee:5,arm:0},
 {name:'Reach',thigh:15,knee:10,arm:10}
];
function pose(doc,frame){
 const p=doc.pins,dir=doc.id.split('/')[2],profile=['right','left'].includes(dir),sign=dir==='left'?-1:1,near=dir==='left'?'L':'R';
 const anchors={},rotations={},projection={},moving=frame!==null,offsets={},metrics={};
 const origin=[48-p.root[0]*scale,143-p.root[1]*scale];
 const world=v=>[origin[0]+v[0]*scale,origin[1]+v[1]*scale];
 for(const [k,v]of Object.entries(p))anchors[k]=world(v);
 const phaseFor=s=>((frame??0)+(s===near?0:4))%8;
 const planted=frame<4?near:(near==='R'?'L':'R');
 const sway=moving&&!profile?Math.sign(p['hip'+planted][0]-p.waist[0]):0;
 const bob=moving?[2,0,-2,0,2,0,-2,0][frame]:0;
 const torsoTurn=moving&&profile?rad([2,1,0,-1,-2,-1,0,1][frame])*sign:0;
 const hipTilt=moving&&!profile?rad([0,-1,-2,-1,0,1,2,1][frame])*(dir==='up'?-1:1):0;
 const torsoPoint=v=>add(world(p.waist),rot(sub(world(v),world(p.waist)),torsoTurn));
 for(const k of ['neck','jawAttach','waist'])anchors[k]=torsoPoint(p[k]);
 if(!profile)for(const k of ['neck','jawAttach','waist'])anchors[k][0]+=sway;
 rotations.torso=torsoTurn;rotations.neck=torsoTurn;rotations.pelvis=hipTilt;
 for(const s of ['R','L']){
  const phase=phaseFor(s),entry=moving?sideTable[phase]:{name:'Standing',thigh:0,knee:0,arm:0};
  const hip=p['hip'+s],knee=p['knee'+s],ankle=p['ankle'+s];
  let k=knee,a=ankle,footRotation=0;
  if(profile){
   const nativeBearing=Math.atan2(knee[0]-hip[0],knee[1]-hip[1]);
   const desired=Math.max(-rad(22),Math.min(rad(22),nativeBearing+sign*rad(entry.thigh)));
   const thighRotation=moving?nativeBearing-desired:0,shinRotation=thighRotation+sign*rad(entry.knee);
   k=add(hip,rot(sub(knee,hip),thighRotation));a=add(k,rot(sub(ankle,knee),shinRotation));
   rotations['thigh.'+s]=thighRotation;rotations['calf.'+s]=shinRotation;footRotation=shinRotation;
   anchors['hip'+s]=world(hip);anchors['knee'+s]=world(k);anchors['ankle'+s]=world(a);
  }else{
   const amount=moving?[0,0,0,0,0,.5,1,.5][phase]:0;
   const swing=amount>0,sy=1-.15*amount,lift=2*amount;
   anchors['hip'+s]=add(world(hip),[sway,-lift]);anchors['knee'+s]=add(world(knee),[sway,-lift]);
   anchors['ankle'+s]=[world(ankle)[0]+sway,anchors['knee'+s][1]+(ankle[1]-knee[1])*scale*sy];
   projection['calf.'+s]=sy;rotations['thigh.'+s]=0;rotations['calf.'+s]=0;
   metrics[s]={swing,calfProjection:sy,footLift:world(ankle)[1]-anchors['ankle'+s][1]};
   const sourceSole=Math.max(...(doc.footContours?.[s]||[p['heel'+s],p['toe'+s]]).map(point=>world(point)[1]));
   const baselineShift=143-sourceSole;
   for(const name of ['hip','knee','ankle'])anchors[name+s][1]+=baselineShift;
   metrics[s].baselineShift=baselineShift;
  }
  rotations['foot.'+s]=footRotation;
  for(const n of ['toe','heel'])anchors[n+s]=add(anchors['ankle'+s],rot(sub(p[n+s],ankle),footRotation).map(v=>v*scale));
  const sh=p['shoulder'+s],el=p['elbow'+s],wr=p['wrist'+s];
  const arm=moving&&profile?sign*rad(entry.arm)+torsoTurn:0;
  const bend=profile&&moving&&entry.arm<0?-sign*rad(7):0,forearm=arm+bend;
  const forward=moving?Math.max(0,entry.arm/18):0;
  const armY=moving?(-2.5*forward+Math.max(0,-entry.arm/18)):0;
  anchors['shoulder'+s]=add(torsoPoint(sh),profile?[0,0]:[sway,armY]);
  anchors['elbow'+s]=add(anchors['shoulder'+s],rot(sub(el,sh),arm).map(v=>v*scale));
  const armProjection=!profile?1-.1*forward:1;
  projection['forearm.'+s]=armProjection;
  anchors['wrist'+s]=add(anchors['elbow'+s],rot(sub(wr,el),forearm).map((v,i)=>v*scale*(i===1?armProjection:1)));
  anchors['palm'+s]=add(anchors['wrist'+s],rot(sub(p['palm'+s],wr),forearm).map(v=>v*scale));
  rotations['upperArm.'+s]=arm;rotations['forearm.'+s]=forearm;rotations['hand.'+s]=forearm;
  offsets[s]={phase,...entry};
 }
 if(profile){
  // Ground from the repaired foot's actual source contour, never an estimated
  // triangle or a fixed ankle offset. Apply one root translation to the figure.
  let lowest=-Infinity;
  for(const s of ['L','R'])for(const point of doc.footContours?.[s]||[p['heel'+s],p['toe'+s]]){
   const v=rot(sub(point,p['ankle'+s]),rotations['foot.'+s]);lowest=Math.max(lowest,anchors['ankle'+s][1]+v[1]*scale);
  }
  const shift=143-lowest;for(const v of Object.values(anchors))v[1]+=shift;
  metrics.groundShift=shift;
 }
 // Feet retain their grounded leg solution. The painted pelvis sockets overlap
 // the proximal thigh caps while the torso/pelvis carry the small walk bounce.
 for(const k of ['neck','jawAttach','waist','shoulderL','shoulderR','elbowL','elbowR','wristL','wristR','palmL','palmR'])anchors[k][1]+=bob;
 metrics.bodyBounce=bob;metrics.torsoTurn=torsoTurn;metrics.hipTilt=hipTilt;
 anchors.root=[48,143];
 return {anchors,rotations,projection,direction:dir,nearArm:near,nearLeg:near,offsets,metrics};
}
const joint={neck:'neck',torso:'neck',pelvis:'waist',upperArm:'shoulder',forearm:'elbow',hand:'wrist',thigh:'hip',calf:'knee',foot:'ankle'};
module.exports={pose,scale,joint,length,sideTable};
