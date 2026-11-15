async function requestJSON(url, fetcher) {
  const response = await fetcher(url, {signal: AbortSignal.timeout(10000), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
  if (!response.ok) throw new Error('查詢服務暫時無法使用');
  return response.json();
}
export async function lookupPublicIP(fetcher = fetch) {
  let data;
  try { data = await requestJSON('https://api.ipify.org?format=json', fetcher); }
  catch { data = await requestJSON('https://api64.ipify.org?format=json', fetcher); }
  if (typeof data.ip !== 'string' || data.ip.length > 45 || !/^[\da-fA-F.:]+$/.test(data.ip)) throw new Error('查詢未傳回有效 IP');
  return data.ip;
}
export async function lookupGeo(ip, fetcher = fetch) {
  const data = await requestJSON('https://ipapi.co/'+encodeURIComponent(ip)+'/json/', fetcher);
  if (data.error || typeof data.country_code !== 'string' || !/^[A-Z]{2}$/.test(data.country_code)) throw new Error('暫時無法取得 IP 地區');
  return {country: data.country_name || data.country_code, countryCode: data.country_code, city: data.city || ''};
}
