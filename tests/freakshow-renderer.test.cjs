const {test}=require('node:test');
test('Freakshow paints its own growing organs, gates startup and preserves genotype, clones and legacy saves',async()=>{
 await require('../tools/preview-freakshow.cjs')();
});
