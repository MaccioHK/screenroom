import {GENRES,matchesGenre} from './filters.js';
export const PROVIDERS={all:null,Netflix:['nfx'],'Prime Video':['prv','amp'],'Disney+':['dnp']};
const fields=`id objectType content(country:$country,language:zh) {title originalTitle originalReleaseYear posterUrl shortDescription fullPath ageCertification genres {shortName} scoring {imdbScore imdbVotes tmdbScore} externalIds {imdbId}} offers(country:$country,platform:WEB) {standardWebURL monetizationType package {clearName shortName}}`;
export const CATALOG_QUERY=`query Catalogue($country:Country!,$movie:TitleFilter!,$show:TitleFilter!){
 movies:popularTitles(country:$country,first:100,sortBy:POPULAR,filter:$movie){edges{node{${fields}}}}
 shows:popularTitles(country:$country,first:100,sortBy:POPULAR,filter:$show){edges{node{${fields}}}}
 trendingMovies:popularTitles(country:$country,first:24,sortBy:TRENDING,filter:$movie){edges{node{${fields}}}}
 trendingShows:popularTitles(country:$country,first:24,sortBy:TRENDING,filter:$show){edges{node{${fields}}}}
}`;
export function parseParams(url){
 const country=(url.searchParams.get('country')||'TW').toUpperCase(),provider=url.searchParams.get('provider')||'all',q=(url.searchParams.get('q')||'').trim(),genre=url.searchParams.get('genre')||'all';
 if(!/^[A-Z]{2}$/.test(country)||!Object.hasOwn(PROVIDERS,provider)||!Object.hasOwn(GENRES,genre)||q.length>100)throw Error('無效的查詢條件');
 return {country,provider,q,genre};
}
function providerName(p){const n=p?.shortName;if(n==='nfx'||/^netflix/i.test(p?.clearName||''))return 'Netflix';if(n==='amp'||n==='prv'||/amazon prime video/i.test(p?.clearName||''))return 'Prime Video';if(n==='dnp'||/^disney\+/i.test(p?.clearName||''))return 'Disney+';return null;}
export function safeOfferURL(value,provider){try{const u=new URL(value);if(u.protocol!=='https:')return null;const host=u.hostname.toLowerCase();const matches=domain=>host===domain||host.endsWith('.'+domain);const allowed=provider==='Netflix'?matches('netflix.com'):provider==='Disney+'?matches('disneyplus.com'):matches('primevideo.com')||['amazon.com','amazon.co.uk','amazon.de','amazon.co.jp','amazon.fr','amazon.it','amazon.es','amazon.com.au','amazon.ca'].some(matches);return allowed?u.href:null;}catch{return null;}}
function score(value){return typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=10?value:null;}
export function normalize(node,country){
 const c=node.content||{},offers=[];
 for(const o of node.offers||[]){if(o.monetizationType!=='FLATRATE')continue;const provider=providerName(o.package),url=safeOfferURL(o.standardWebURL,provider);if(provider&&url&&!offers.some(x=>x.provider===provider))offers.push({provider,url});}
 const s=c.scoring||{},ratings={};const imdb=score(s.imdbScore),tmdb=score(s.tmdbScore),imdbId=c.externalIds?.imdbId;
 if(imdb!==null)ratings.IMDb={score:imdb,votes:Number.isInteger(s.imdbVotes)&&s.imdbVotes>0?s.imdbVotes:null,url:typeof imdbId==='string'&&/^tt\d+$/.test(imdbId)?'https://www.imdb.com/title/'+imdbId+'/':null};
 if(tmdb!==null)ratings.TMDB={score:tmdb};
 return {id:node.id,title:c.title||c.originalTitle||'未命名作品',en:c.originalTitle||'',year:c.originalReleaseYear||null,type:node.objectType==='MOVIE'?'movie':'drama',poster:c.posterUrl?'https://images.justwatch.com'+c.posterUrl.replace('{profile}','s332').replace('{format}','webp'):null,desc:c.shortDescription||'目前沒有簡介。',sourceURL:typeof c.fullPath==='string'&&c.fullPath.startsWith('/')?'https://www.justwatch.com'+c.fullPath:'https://www.justwatch.com/',offers,country,genres:(c.genres||[]).map(g=>g.shortName).filter(g=>typeof g==='string'),ageCertification:c.ageCertification||null,ratings};
}
export async function fetchCatalogue(params,fetcher=fetch){
 const {country,provider,q,genre='all'}=params;
 const filter={...(PROVIDERS[provider]?{packages:PROVIDERS[provider]}:{}),...(q?{searchQuery:q}:{}),...(GENRES[genre]?.code?{genres:[GENRES[genre].code]}:{})};
 const response=await fetcher('https://apis.justwatch.com/graphql',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:CATALOG_QUERY,variables:{country,movie:{...filter,objectTypes:['MOVIE']},show:{...filter,objectTypes:['SHOW']}}}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('榜單來源暫時無法連線');const body=await response.json();
 if(body.errors?.length||!body.data)throw Error('這個地區的榜單暫時無法取得，請重試或手動選擇地區');
 const result={country,provider,q,genre,fetchedAt:new Date().toISOString(),source:'JustWatch',sourceURL:'https://www.justwatch.com/'+(country==='GB'?'uk':country.toLowerCase())};
 for(const key of ['movies','shows','trendingMovies','trendingShows']){
  const seen=new Set();const pool=(body.data[key]?.edges||[]).map(e=>normalize(e.node,country)).filter(f=>!seen.has(f.id)&&seen.add(f.id));
  if(genre==='all'||genre==='others'){result.coverage??={};const others=pool.filter(f=>matchesGenre(f,'others')).length;result.coverage[key]={all:pool.length,classified:pool.length-others,others};}
  result[key]=pool.filter(f=>matchesGenre(f,genre)).map((f,index)=>({...f,rank:index+1}));
 }
 return result;
}
