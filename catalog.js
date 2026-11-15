export function shuffle(items,count=60,random=Math.random){const unique=[...new Map(items.map(f=>[f.id,f])).values()];for(let i=unique.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[unique[i],unique[j]]=[unique[j],unique[i]];}return unique.slice(0,count);}
export function interleave(a,b){const all=[];for(let i=0;i<Math.max(a.length,b.length);i++){if(a[i])all.push(a[i]);if(b[i])all.push(b[i]);}return [...new Map(all.map(f=>[f.id,f])).values()];}
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
