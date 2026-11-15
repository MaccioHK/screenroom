import {parseParams, fetchCatalogue} from './api.js';
const origin='https://macciohk.github.io';
const headers={'content-type':'application/json; charset=utf-8','access-control-allow-origin':origin,'access-control-allow-methods':'GET, OPTIONS','vary':'Origin','cache-control':'no-store'};
export default {async fetch(request){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='GET')return Response.json({error:'Method not allowed'},{status:405,headers});
 const url=new URL(request.url);
 if(url.pathname==='/')return Response.json({service:'Screenroom regional catalogue API',status:'ok'},{headers});
 if(url.pathname!=='/api/catalog')return Response.json({error:'Not found'},{status:404,headers});
 try{let params;try{params=parseParams(url)}catch(e){return Response.json({error:e.message},{status:400,headers})}
 const data=await fetchCatalogue(params);return Response.json(data,{headers});
 }catch(e){return Response.json({error:e.message||'無法取得榜單'},{status:502,headers})}
}};
