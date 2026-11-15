import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {GENRES,matchesGenre,primaryRating} from '../filters.js';
import {normalize,parseParams,fetchCatalogue} from '../backend/api.js';
import {shuffle,interleave,escapeHTML} from '../catalog.js';
const family={id:'family-movie',title:'Family Movie',en:'Family Movie',type:'movie',genres:['fml','ani'],ageCertification:'G',offers:[{provider:'Netflix'}],ratings:{IMDb:{score:8.1,votes:2500}},year:2024};
const familyShow={...family,id:'family-show',title:'Family Series',type:'drama'};
const horror={...family,id:'horror-movie',title:'Horror Movie',genres:['fml','ani','hrr']};
const adult={...family,id:'adult-movie',title:'Adult Movie',ageCertification:'R'};
const thriller={...family,id:'thriller',genres:['fml','trl']};
test('Family excludes horror/thriller, adult and unclassified works',()=>{assert.equal(matchesGenre(family,'family'),true);for(const ageCertification of ['PG','P','0+','6+','7+'])assert.equal(matchesGenre({...family,ageCertification},'family'),true);for(const f of [horror,adult,thriller,{...family,ageCertification:null}])assert.equal(matchesGenre(f,'family'),false);});
test('Animation is independent from Family and ALL includes unrated old saves',()=>{assert.equal(matchesGenre(horror,'animation'),true);assert.equal(matchesGenre(horror,'horror'),true);assert.equal(matchesGenre({},'all'),true);assert.equal(matchesGenre({},'family'),false);assert.equal(matchesGenre(family,'invalid'),false);});
test('Ratings prefer IMDb, fall back to TMDB, and never invent a score',()=>{assert.equal(primaryRating(family).source,'IMDb');assert.equal(primaryRating({ratings:{IMDb:{score:0},TMDB:{score:7.3}}}).source,'TMDB');for(const score of [null,0,11,NaN,'8.2'])assert.equal(primaryRating({ratings:{IMDb:{score}}}),null);});
test('Source normalization retains true scores, votes, genres and safe IMDb link',()=>{const f=normalize({id:'tm1',objectType:'MOVIE',content:{genres:[{shortName:'ani'}],ageCertification:'PG',scoring:{imdbScore:7.8,imdbVotes:1000,tmdbScore:8.2},externalIds:{imdbId:'tt12345'}}},'TW');assert.equal(f.ratings.IMDb.score,7.8);assert.equal(f.ratings.IMDb.votes,1000);assert.equal(f.ratings.IMDb.url,'https://www.imdb.com/title/tt12345/');assert.deepEqual(f.genres,['ani']);assert.equal(f.ageCertification,'PG');assert.deepEqual(normalize({id:'tm2',content:{scoring:{imdbScore:0}}},'TW').ratings,{});});
test('API defaults to ALL, rejects unknown genres and combines source filters',async()=>{assert.equal(parseParams(new URL('https://site/api/catalog')).genre,'all');assert.throws(()=>parseParams(new URL('https://site/api/catalog?genre=bad')));let vars;const result=await fetchCatalogue({country:'TW',provider:'Netflix',q:'toy',genre:'family'},async(_url,opts)=>{vars=JSON.parse(opts.body).variables;return Response.json({data:Object.fromEntries(['movies','shows','trendingMovies','trendingShows'].map(k=>[k,{edges:[]}]))});});assert.deepEqual(vars.movie,{packages:['nfx'],searchQuery:'toy',genres:['fml'],objectTypes:['MOVIE']});assert.equal(result.genre,'family');});
test('The global Family filter survives all eight tab renders and Lucky draws',()=>{
 const nodes=new Map();const element=()=>({innerHTML:'',textContent:'',hidden:false,value:'',dataset:{},style:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){},querySelector(){return null}});
 const document={querySelector:s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)},querySelectorAll:()=>[],addEventListener(){}};
 document.querySelector('#sort').value='default';
 const context=vm.createContext({document,console,Intl,Option:class{},localStorage:{getItem:()=>null},setTimeout,clearTimeout,GENRES,matchesGenre,primaryRating,shuffle,interleave,esc:escapeHTML,legacy:[],fixture:{movies:[family,horror,adult],shows:[familyShow],trendingMovies:[horror,family],trendingShows:[familyShow]},libraryFixture:{a:{status:'later',film:family},b:{status:'later',film:horror},c:{status:'seen',film:familyShow},d:{status:'seen',film:adult},e:{status:'hidden',film:{...family,id:'hidden-family',title:'Hidden Family'}},f:{status:'hidden',film:horror}}});
 let source=fs.readFileSync('app.js','utf8').replace(/^import .*;\n/gm,'').replace('render();checkIP();','render();');
 vm.runInContext(source,context);assert.equal(vm.runInContext('selectedGenre',context),'all');
 vm.runInContext("selectedGenre='family';catalog=fixture;library=libraryFixture;",context);
 for(const view of ['all','movie','drama','lucky-movie','lucky-drama','later','seen','hidden']){vm.runInContext(`view=${JSON.stringify(view)};render();`,context);const html=nodes.get('#content').innerHTML;assert.ok(!html.includes('Horror Movie'),view);assert.ok(!html.includes('Adult Movie'),view);assert.match(html,/Family/,view);assert.equal(vm.runInContext('selectedGenre',context),'family');}
});

test('Filter covers all 19 categories in the verified source taxonomy',()=>{const taxonomy=JSON.parse(fs.readFileSync('tests/genre-taxonomy.json','utf8'));const expected=taxonomy.genres.map(g=>g.shortName).sort();const actual=Object.values(GENRES).map(g=>g.code).filter(Boolean).sort();assert.equal(expected.length,19);assert.deepEqual(actual,expected);for(const [key,g] of Object.entries(GENRES)){if(key==='all'||key==='family'||key==='others')continue;assert.equal(matchesGenre({genres:[g.code]},key),true,key);}assert.equal(matchesGenre({genres:['future-category']},'all'),true);});

test('Others is the complement of actual named predicates, not just unknown tags',()=>{
 const named=Object.keys(GENRES).filter(k=>k!=='all'&&k!=='others');
 const examples=[{}, {genres:[]}, {genres:['future']}, {genres:['future','hrr']}, {genres:['fml'],ageCertification:'G'}, {genres:['fml'],ageCertification:'R'}, {genres:['fml']}, {genres:['fml','ani'],ageCertification:'R'}, ...named.map(k=>({genres:[GENRES[k].code]}))];
 for(const film of examples){const inC=named.some(k=>matchesGenre(film,k)),inO=matchesGenre(film,'others');assert.equal(inC&&inO,false);assert.equal(inC||inO,matchesGenre(film,'all'));}
 assert.equal(matchesGenre({genres:['future','hrr']},'others'),false);
 assert.equal(matchesGenre({genres:['fml'],ageCertification:'R'},'others'),true);
 assert.equal(matchesGenre({genres:['fml','ani'],ageCertification:'R'},'others'),false);
});
test('ALL equals classified union Others for the same raw API response',async()=>{
 const nodes=[{id:'unknown',objectType:'MOVIE',content:{title:'Future',genres:[{shortName:'future'}]}},{id:'missing',objectType:'MOVIE',content:{title:'No category'}},{id:'mixed',objectType:'MOVIE',content:{title:'Mixed',genres:[{shortName:'future'},{shortName:'hrr'}]}},{id:'family-R',objectType:'MOVIE',content:{title:'Family only, mature',genres:[{shortName:'fml'}],ageCertification:'R'}},{id:'ordinary',objectType:'MOVIE',content:{title:'Comedy',genres:[{shortName:'cmy'}]}}];
 const fixture={data:Object.fromEntries(['movies','shows','trendingMovies','trendingShows'].map(key=>[key,{edges:nodes.map(node=>({node}))}]))};let variables;
 const fetcher=async(_url,opts)=>{variables=JSON.parse(opts.body).variables;return Response.json(fixture)};
 const params={country:'TW',provider:'Netflix',q:'test'};
 const all=await fetchCatalogue({...params,genre:'all'},fetcher),other=await fetchCatalogue({...params,genre:'others'},fetcher);
 assert.equal(Object.hasOwn(variables.movie,'genres'),false);assert.deepEqual(variables.movie.packages,['nfx']);assert.equal(variables.movie.searchQuery,'test');
 for(const key of ['movies','shows','trendingMovies','trendingShows']){assert.deepEqual(other[key].map(f=>f.id),['unknown','missing','family-R']);const named=Object.keys(GENRES).filter(k=>k!=='all'&&k!=='others');const classified=all[key].filter(f=>named.some(k=>matchesGenre(f,k)));assert.deepEqual([...classified,...other[key]].map(f=>f.id).sort(),all[key].map(f=>f.id).sort());assert.equal(new Set([...classified,...other[key]].map(f=>f.id)).size,all[key].length);assert.deepEqual(other.coverage[key],{all:5,classified:2,others:3});}
});
test('Others may be empty when every item matches a named category',async()=>{
 const node={id:'known',objectType:'MOVIE',content:{genres:[{shortName:'hrr'}]}};const data=await fetchCatalogue({country:'TW',provider:'all',q:'',genre:'others'},async()=>Response.json({data:Object.fromEntries(['movies','shows','trendingMovies','trendingShows'].map(k=>[k,{edges:[{node}]}]))}));assert.equal(data.movies.length,0);assert.deepEqual(data.coverage.movies,{all:1,classified:1,others:0});
});
