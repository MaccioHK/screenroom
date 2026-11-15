import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=path=>import('data:text/javascript;base64,'+fs.readFileSync(path).toString('base64'));
const worker=(await load('dist/server/index.js')).default;
const {requestCatalogue}=await load('public/catalog-api.js');
const movie={id:'tm1',objectType:'MOVIE',content:{title:'Test Movie',originalTitle:'Test Movie',originalReleaseYear:2025,fullPath:'/tw/movie/test'},offers:[]};
const show={...movie,id:'ts1',objectType:'SHOW'};
const fixture={data:{movies:{edges:[{node:movie}]},shows:{edges:[{node:show}]},trendingMovies:{edges:[{node:movie}]},trendingShows:{edges:[{node:show}]}}};
test('catalogue still loads when the hosting runtime denies caches.default',async()=>{
 const fetchBefore=globalThis.fetch,cachesBefore=Object.getOwnPropertyDescriptor(globalThis,'caches');
 let touches=0,variables;
 Object.defineProperty(globalThis,'caches',{configurable:true,value:{get default(){touches++;throw Error('This Worker is not permitted to access the default cache.');}}});
 globalThis.fetch=async(_url,options)=>{variables=JSON.parse(options.body).variables;return Response.json(fixture);};
 try{
  for(const country of ['TW','GB']){
   const response=await worker.fetch(new Request(`https://site/api/catalog?country=${country}&provider=Netflix`),{},{});
   assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/^private/);
   const data=await requestCatalogue('/api/catalog',{},async()=>response);
   assert.equal(data.movies[0].type,'movie');assert.equal(data.shows[0].type,'drama');
   assert.equal(variables.country,country);assert.deepEqual(variables.movie.packages,['nfx']);
  }
  assert.equal(touches,0);
 }finally{globalThis.fetch=fetchBefore;if(cachesBefore)Object.defineProperty(globalThis,'caches',cachesBefore);else delete globalThis.caches;}
});
test('upstream failure returns structured JSON instead of crashing',async()=>{
 const before=globalThis.fetch;globalThis.fetch=async()=>new Response('upstream unavailable',{status:503});
 try{const r=await worker.fetch(new Request('https://site/api/catalog?country=TW'),{},{});assert.equal(r.status,502);assert.equal(r.headers.get('cache-control'),'no-store');assert.match((await r.json()).error,/榜單來源/);}finally{globalThis.fetch=before;}
});
test('invalid country returns a JSON 400',async()=>{const r=await worker.fetch(new Request('https://site/api/catalog?country=invalid'),{},{});assert.equal(r.status,400);assert.ok((await r.json()).error);});
test('HTML server errors get a readable error before JSON parsing',async()=>{await assert.rejects(requestCatalogue('/api/catalog',{},async()=>new Response('<html>server failed</html>',{status:500,headers:{'content-type':'text/html'}})),/HTTP 500/);});
test('expired sign-in is distinguished from a source failure',async()=>{await assert.rejects(requestCatalogue('/api/catalog',{},async()=>new Response('sign in',{status:401})),/登入/);});
test('malformed JSON does not leak the browser parser error',async()=>{await assert.rejects(requestCatalogue('/api/catalog',{},async()=>new Response('{',{headers:{'content-type':'application/json'}})),/資料不完整/);});
test('malformed catalogue is rejected',async()=>{await assert.rejects(requestCatalogue('/api/catalog',{},async()=>Response.json({movies:[]})),/資料格式不完整/);});
test('request cancellation stays silent upstream',async()=>{await assert.rejects(requestCatalogue('/api/catalog',{},async()=>{throw new DOMException('Cancelled','AbortError');}),{name:'AbortError'});});
