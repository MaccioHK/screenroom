export const GENRES={all:{code:null,label:'ALL 全部類型'},family:{code:'fml',label:'Family 家庭'},animation:{code:'ani',label:'動畫 / Cartoon'},horror:{code:'hrr',label:'恐怖'},thriller:{code:'trl',label:'驚悚 / 懸疑'},comedy:{code:'cmy',label:'喜劇'},action:{code:'act',label:'動作 / 冒險'},scifi:{code:'scf',label:'科幻'},fantasy:{code:'fnt',label:'奇幻'},romance:{code:'rma',label:'愛情'},crime:{code:'crm',label:'犯罪'},documentary:{code:'doc',label:'紀錄片'},drama:{code:'drm',label:'劇情'}};
// Regional classifications are retained on the film; these are the low-age labels we can interpret.
const FAMILY_CERTIFICATES=new Set(['G','PG','TV-Y','TV-Y7','TV-G','TV-PG','U','UC','ALL','P','0','6','7','0+','6+','7+','普遍級','保護級','普','護']);
export function matchesGenre(film,genre='all'){
 if(genre==='all')return true;
 const category=GENRES[genre];if(!category)return false;
 const genres=film.genres||[];if(!genres.includes(category.code))return false;
 if(genre!=='family')return true;
 return !genres.some(g=>g==='hrr'||g==='trl')&&FAMILY_CERTIFICATES.has(String(film.ageCertification||'').trim().toUpperCase());
}
export function primaryRating(film){
 for(const source of ['IMDb','TMDB']){const value=film.ratings?.[source];if(typeof value?.score==='number'&&Number.isFinite(value.score)&&value.score>0&&value.score<=10)return {source,...value};}
 return null;
}
