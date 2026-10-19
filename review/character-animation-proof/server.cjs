// Keep existing local review links working; the rejected outline review is retired.
const {createServer}=require('../character-rigid-body/server.cjs');
module.exports={createProofServer:createServer};
if(require.main===module)createServer().listen(5189,'127.0.0.1',()=>console.log('Original-pixel body review: http://127.0.0.1:5189/?body-review=original-pixels'));
