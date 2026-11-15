import {lookupPublicIP, lookupGeo} from './network-api.js';
const $ = id => document.getElementById(id);
let countryCode = null;
function regionName(){return $('region').selectedOptions[0].textContent;}
function compareRegion(){
  $('catalogRegion').textContent=regionName();
  if (!countryCode) return;
  $('networkMessage').textContent=countryCode===$('region').value
    ? 'IP 推測地區與片單選項相符。Netflix 是否識別為此地區，請到 Netflix 確認。'
    : 'IP 推測地區與片單選項不同。請檢查這個裝置的 VPN／分流設定；片單選項不會切換網路出口。';
}
$('region').addEventListener('change', compareRegion);
$('checkIP').addEventListener('click', async () => {
  const button=$('checkIP');button.disabled=true;button.textContent='查詢中…';
  countryCode=null;$('networkResult').hidden=false;$('publicIP').textContent='查詢中…';$('ipLocation').textContent='—';$('networkChecked').textContent='';$('networkMessage').textContent='正在由目前瀏覽器查詢，並非網站伺服器的 IP。';compareRegion();
  try {
    const ip=await lookupPublicIP();$('publicIP').textContent=ip;
    $('networkChecked').textContent='查詢時間：'+new Date().toLocaleString('zh-Hant')+' · IP：ipify；地區：ipapi.co';
    $('ipLocation').textContent='查詢中…';
    try {
      const geo=await lookupGeo(ip);countryCode=geo.countryCode;
      $('ipLocation').textContent=[geo.countryCode==='TW'?'台灣':geo.country,geo.city].filter(Boolean).join(' · ');
      compareRegion();
    } catch {
      $('ipLocation').textContent='未能取得地區';$('networkMessage').textContent='已取得對外 IP，但地區查詢可能受限或暫時不可用；不能據此確認 VPN 國家。';
    }
  } catch {
    $('publicIP').textContent='查詢失敗';$('ipLocation').textContent='未能確認';$('networkMessage').textContent='無法連接 IP 查詢服務，可能是網路、VPN 或瀏覽器封鎖。請稍後重試；這不代表 VPN 未啟用。';
  } finally {button.disabled=false;button.textContent='↻ 重新檢查 IP';}
});
