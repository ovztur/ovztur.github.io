(()=>{
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function json(url){
    const r=await fetch(url+'?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }

  async function syncReleaseInfo(){
    try{
      const [manifest,changelog]=await Promise.all([
        json('app/latest.json'),
        json('app/changelog.json')
      ]);
      const version=String(manifest?.version||changelog?.latest||'').trim();
      if(version){
        document.querySelectorAll('[data-current-version]').forEach(el=>el.textContent='v'+version);
        document.title='MCU Tracker Ultimate • v'+version;
      }

      const entries=Array.isArray(changelog?.entries)?changelog.entries:[];
      const latest=entries[0];
      const latestTitle=document.getElementById('siteLatestTitle');
      const latestItems=document.getElementById('siteLatestItems');
      if(latestTitle&&latest){
        latestTitle.textContent=`v${latest.version} • ${latest.title||'Güncelleme'}`;
      }
      if(latestItems&&latest){
        latestItems.innerHTML=(latest.items||[]).slice(0,4).map(x=>`<li>${esc(String(x).replace(/ovztur/gi,'Ana Admin'))}</li>`).join('');
      }

      const release=document.getElementById('siteReleaseList');
      if(release&&entries.length){
        release.innerHTML=entries.slice(0,6).map((entry,i)=>{
          const first=(entry.items||[])[0]||'';
          return `<div class="rel"><div><b>v${esc(entry.version)}</b><br><small>${esc(String(entry.title||first||'Güncelleme').replace(/ovztur/gi,'Ana Admin'))}</small></div><span>${i===0?'Güncel':'Önceki'}</span></div>`;
        }).join('');
      }
    }catch(err){
      console.warn('Site sürüm bilgisi alınamadı:',err);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncReleaseInfo,{once:true});else syncReleaseInfo();
})();
