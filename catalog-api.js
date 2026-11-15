export async function requestCatalogue(url,options={},fetcher=fetch){
 let response;
 const backend=globalThis.SCREENROOM_API_ORIGIN;
 if(!backend)throw new Error('片單服務尚未完成連線設定。');
 const target=new URL(url,backend);
 try{response=await fetcher(target.href,{credentials:'omit',...options});}
 catch(error){if(error.name==='AbortError')throw error;throw new Error('無法連接片單服務，請檢查網路或 VPN，然後重試。');}
 if(response.status===401||response.status===403)throw new Error('網站登入已過期或未獲授權，請重新開啟網站並登入後重試。');
 if(!(response.headers.get('content-type')||'').includes('application/json'))throw new Error(`片單服務暫時未能回傳資料（HTTP ${response.status}），請稍後重試。`);
 let data;
 try{data=await response.json();}catch{throw new Error('片單服務回傳的資料不完整，請重新載入。');}
 if(!response.ok)throw new Error(data.error||`片單服務發生錯誤（HTTP ${response.status}），請重試。`);
 if(!data||!['movies','shows','trendingMovies','trendingShows'].every(key=>Array.isArray(data[key])))throw new Error('片單資料格式不完整，請重新載入。');
 return data;
}
