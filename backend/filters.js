export const GENRES={all:{code:null,label:'ALL 全部類型'},family:{code:'fml',label:'Family 家庭'},animation:{code:'ani',label:'動畫 / Cartoon'},horror:{code:'hrr',label:'恐怖'},thriller:{code:'trl',label:'驚悚 / 懸疑'},comedy:{code:'cmy',label:'喜劇'},action:{code:'act',label:'動作 / 冒險'},scifi:{code:'scf',label:'科幻'},fantasy:{code:'fnt',label:'奇幻'},romance:{code:'rma',label:'愛情'},crime:{code:'crm',label:'犯罪'},documentary:{code:'doc',label:'紀錄片'},drama:{code:'drm',label:'劇情'},war:{code:'war',label:'戰爭 / 軍事'},western:{code:'wsn',label:'西部'},sport:{code:'spt',label:'運動'},history:{code:'hst',label:'歷史'},reality:{code:'rly',label:'真人秀 / 實境節目'},music:{code:'msc',label:'音樂 / 歌舞'},europe:{code:'eur',label:'歐洲製作（產地分類）'}};
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
