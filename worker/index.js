import {parseParams,fetchCatalogue} from './api.js';
import {assets} from './assets.js';
const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8',...extra}});
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
  if(url.pathname==='/api/catalog'){
   try{
    let params;
    try{params=parseParams(url);}catch(e){return json({error:e.message},400);}
    // Sites does not allow caches.default. Cache successful responses in the browser only.
    const result=await fetchCatalogue(params);
    console.info(JSON.stringify({event:'catalogue_loaded',country:params.country,provider:params.provider,movies:result.movies.length,shows:result.shows.length}));
    return json(result,200,{'cache-control':'private, max-age=900'});
   }catch(e){
    console.error(JSON.stringify({event:'catalogue_fetch_failed',country:url.searchParams.get('country'),error:e.message}));
    return json({error:e.message||'無法讀取榜單，請稍後重試。'},502,{'cache-control':'no-store'});
   }
  }
  const path=url.pathname==='/'?'/index.html':url.pathname;
  const asset=assets[path];
  if(!asset)return new Response('Not found',{status:404});
  const bytes=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
  return new Response(request.method==='HEAD'?null:bytes,{headers:{'content-type':asset.type,'cache-control':'no-cache','x-content-type-options':'nosniff'}});
 }
};
