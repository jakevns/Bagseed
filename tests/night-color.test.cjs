const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../graphics/plants/sources/night-color.cjs'),model=require('../graphics/plants/porchlight/sources/model.cjs');
const red={colorName:'Red accents'},input={loc:'tent2',stage:9,temp:78,lightOn:true,stamp:60};
const day=()=>core.advance(null,input,red);
test('10F actual lights-off differential is inclusive and independent of absolute temperature',()=>{
 for(const [temp,hours]of [[68.1,0],[68,1],[67.9,1]]){const state=core.advance(day(),{...input,lightOn:false,temp,stamp:120},red);assert.equal(state.hours,hours);assert.equal(state.qualifying,!!hours);}
 const warm=core.advance(null,{...input,temp:88},red);assert.equal(core.advance(warm,{...input,lightOn:false,temp:78,stamp:120},red).hours,1);
 assert.equal(core.advance(day(),{...input,temp:60,stamp:120},red).hours,0);
});
test('only receptive flowering phenotypes express colors, with no universal purple conversion',()=>{
 for(const colorName of ['Forest green','Lime green'])assert.equal(core.advance(day(),{...input,lightOn:false,temp:65,stamp:120},{colorName}).hours,0);
 for(const [colorName,name]of [['Purple','purple'],['Red accents','wine red'],['Dark purple','near-black purple'],['Blue-green','blue violet']]){
  const state=core.advance(day(),{...input,lightOn:false,temp:68,stamp:120},{colorName});assert.equal(state.hours,1);assert.equal(core.expression({stage:9,nightColor:{hours:24}},{colorName}).palette,name);
 }
 for(const stage of [2,5,6,7,11,12])assert.equal(core.advance(day(),{...input,stage,lightOn:false,temp:60,stamp:120},red).hours,0);
 assert.equal(core.expression({stage:5,nightColor:{hours:24}},red).strength,0);
});
test('exposure accumulates without rerender farming, expires stale references and learns a fresh daytime mean',()=>{
 const a=day(),b=core.advance(a,{...input,temp:82,stamp:120},red);assert.equal(b.dayTemp,80);
 const night=core.advance(b,{...input,lightOn:false,temp:70,stamp:180},red);assert.equal(night.hours,1);assert.deepEqual(core.advance(night,{...input,lightOn:false,temp:60,stamp:180},red),night);
 const newDay=core.advance(night,{...input,temp:76,stamp:1500},red);assert.equal(newDay.dayTemp,76);assert.equal(newDay.dayN,1);
 assert.equal(core.advance(b,{...input,lightOn:false,temp:60,stamp:2000},red).hours,0);
 assert.equal(core.advance(b,{...input,loc:'tent4',lightOn:false,temp:60,stamp:180},red).hours,0);
 assert.equal(core.advance({...b,hours:72},{...input,lightOn:false,temp:60,stamp:180},red).hours,72);
 assert.deepEqual(core.advance(b,{...input,temp:NaN,stamp:180},red),b);
});
test('color progress is persistent, capped, pure and separate from senescence/health/genetic selection',()=>{
 const a=day(),before=JSON.stringify(a);let state=a;
 for(let i=1;i<=12;i++)state=core.advance(state,{...input,lightOn:false,temp:68,stamp:60+i*60},red);
 assert.equal(state.hours,12);state=core.advance(state,{...input,stamp:1500},red);
 for(let i=1;i<=12;i++)state=core.advance(state,{...input,lightOn:false,temp:68,stamp:1500+i*60},red);
 assert.equal(state.hours,24);const saved=JSON.parse(JSON.stringify(state));assert.deepEqual(core.expression({stage:10,nightColor:saved},red),core.expression({stage:10,nightColor:state},red));
 assert.equal(core.expression({stage:10,nightColor:state},red).strength,1);assert.equal(core.expression({stage:12,nightColor:state},red).strength,1);assert.equal(JSON.stringify(a),before);
 const p={stage:10,nightColor:state,artIdentity:{traits:red}},cool=model.senescence(p,red,core),warm=model.senescence({...p,nightColor:null},red,core);
 assert.notDeepEqual(cool.rgb,warm.rgb);assert.equal(cool.palette,'red-cool');assert.equal(model.senescence({stage:10},{colorName:'Forest green'},core).palette,'gold');
 assert.equal(core.expression({...p,health:5,nutr:0,stress:90},red).strength,1);
});


test('Sprout color bonus grows with captured expression, is genetics-gated, and disappears in monochrome',()=>{
 const snapshot={stage:10,nightColor:{hours:0}},options={filter:'none'};
 assert.equal(core.socialBonus(snapshot,red,options),0);
 const subtle=core.socialBonus({...snapshot,nightColor:{hours:6}},red,options),full=core.socialBonus({...snapshot,nightColor:{hours:24}},red,options);
 assert.ok(subtle>0&&subtle<full);assert.equal(full,.08);
 assert.equal(core.socialBonus({...snapshot,nightColor:{hours:24}},red,{filter:'mono'}),0);
 assert.equal(core.socialBonus({...snapshot,nightColor:{hours:24}},{colorName:'Forest green'},options),0);
 assert.equal(core.socialBonus({...snapshot,stage:5,nightColor:{hours:24}},red,options),0);
 const saved=JSON.parse(JSON.stringify({...snapshot,nightColor:{hours:24}}));snapshot.nightColor.hours=72;assert.equal(core.socialBonus(saved,red,options),.08);
});
