/* Renderer-independent plant-art identities. Not installed in the live game yet. */
'use strict';
const copy=value=>JSON.parse(JSON.stringify(value));
function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const transient=new Set(['stage','age','height','nodes','density','health','stress','water','nutr','burn','pest','mold','training','pruned','staked','lastDefol','loc','slot']);
function validateLibrary(library){
 if(library.schemaVersion!==1)throw Error('Unsupported plant library schema');
 for(const[key,rule]of Object.entries(library.inheritedTraits||{}))if(transient.has(key)||!['string','number','boolean'].includes(rule.type))throw Error('Invalid inherited trait: '+key);
 for(const[id,p]of Object.entries(library.parts)){
  if(p.id!==id||!['draft','approved'].includes(p.status))throw Error('Invalid part: '+id);
  if(p.status==='approved'&&(typeof p.asset!=='string'||!p.asset.trim()||!Array.isArray(p.attach)||p.attach.length!==2||p.attach.some(n=>!Number.isFinite(n)||n<0||n>1)))throw Error('Approved part needs an asset and normalized attachment: '+id);
  for(const k of Object.keys(p.when||{}))if(!library.inheritedTraits?.[k])throw Error('Temporary conditions cannot select inherited parts: '+k);
 }
 for(const[id,p]of Object.entries(library.profiles)){
  if(p.id!==id)throw Error('Invalid profile: '+id);
  for(const[role,choices]of Object.entries(p.roles)){
   if(!Array.isArray(choices)||!choices.length||new Set(choices).size!==choices.length)throw Error('Invalid choices: '+role);
   for(const part of choices)if(!library.parts[part]||library.parts[part].role!==role)throw Error('Unknown or incompatible part: '+part);
  }
 }
 for(const id of Object.values(library.strains))if(!library.profiles[id])throw Error('Unknown strain profile: '+id);
 return true;
}
function validateIdentity(identity,library){
 if(identity.schemaVersion!==1||!library.profiles[identity.profile])throw Error('Unknown saved appearance profile');
 const roles=library.profiles[identity.profile].roles;
 if(Object.keys(identity.parts||{}).length!==Object.keys(roles).length)throw Error('Incomplete saved appearance');
 for(const[role,choices]of Object.entries(roles))if(!choices.includes(identity.parts[role])||!library.parts[identity.parts[role]])throw Error('Saved appearance part missing or changed: '+role);
 if(typeof identity.seed!=='string'||!identity.seed)throw Error('Missing phenotype identity');
 return true;
}
function createIdentity(plant,expressedTraits,library,{profile}={}){
 validateLibrary(library);
 const inherited=plant.artIdentity||plant.pheno?.artIdentity;
 if(inherited){validateIdentity(inherited,library);return copy(inherited);}
 const profileId=profile||library.strains[plant.lineId],preset=library.profiles[profileId];
 if(!preset)throw Error('No artwork profile registered for strain: '+plant.lineId);
 const seed=String(plant.genome115?.id||plant.pheno?.genome115?.id||plant.pheno?.pid||plant.id||'');
 if(!seed)throw Error('A persistent plant or phenotype identity is required');
 const traits={};for(const[k,rule]of Object.entries(library.inheritedTraits)){const value=expressedTraits[k]??rule.default;if(value===undefined)continue;if(typeof value!==rule.type||typeof value==='number'&&!Number.isFinite(value))throw Error('Invalid expressed trait: '+k);traits[k]=value;}
 const parts={};for(const[role,choices]of Object.entries(preset.roles)){
  const eligible=choices.filter(id=>Object.entries(library.parts[id].when||{}).every(([key,value])=>traits[key]===value)).sort();
  if(!eligible.length)throw Error('Phenotype needs compatible artwork: '+role+' / '+traits.leafShape);
  parts[role]=eligible[hash(seed+':'+role)%eligible.length];
 }
 return{schemaVersion:1,profile:profileId,libraryRevision:library.revision,seed,traits,parts};
}
function readiness(identity,library){validateLibrary(library);validateIdentity(identity,library);const pending=Object.values(identity.parts).filter(id=>library.parts[id].status!=='approved');return{renderable:pending.length===0,pending};}
module.exports={validateLibrary,validateIdentity,createIdentity,readiness};
