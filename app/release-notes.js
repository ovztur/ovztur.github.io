(()=>{
  'use strict';
  const VERSION='1.6.14';
  const CHANGELOG_URL='https://ovztur.github.io/app/changelog.json';
  const SESSION_KEY='MCU_TRACKER_SESSION_V1';
  const SEEN_KEY='MCU_TRACKER_CHANGELOG_SEEN_VERSION';
  let cached=null;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function loadNotes(){
    if(cached)return cached;
    try{
      const r=await fetch(CHANGELOG_URL+'?v='+encodeURIComponent(VERSION)+'&t='+Date.now(),{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      cached=await r.json();
      return cached;
    }catch{
      return {latest:VERSION,entries:[{version:VERSION,date:'2026-08-12',title:'Güncelleme Notları',items:['Güncelleme notları şu anda çevrimdışı. İnternet bağlantısı geldiğinde bu sekmeyi yeniden açabilirsin.']}]} ;
    }
  }

  function ensureButton(){
    let btn=document.getElementById('mcuReleaseNotesBtn');
    if(btn)return btn;
    const side=document.getElementById('sideMenu');
    if(!side)return null;
    btn=document.createElement('button');
    btn.id='mcuReleaseNotesBtn';
    btn.className='menu-category';
    btn.type='button';
    btn.dataset.cat='updates';
    btn.textContent='📋 Güncelleme Notları';
    const settings=side.querySelector('[data-cat="settings"]');
    if(settings)side.insertBefore(btn,settings);else{
      const admin=document.getElementById('adminMenuBtn');
      if(admin)side.insertBefore(btn,admin);else side.appendChild(btn);
    }
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      renderNotes(true);
      const menu=document.getElementById('sideMenu'),overlay=document.getElementById('menuOverlay');
      if(menu?.classList.contains('open')){menu.classList.remove('open');overlay?.classList.remove('open')}
    },true);
    return btn;
  }

  async function renderNotes(markSeen=false){
    const host=document.getElementById('movieList');
    if(!host)return;
    const data=await loadNotes();
    const entries=Array.isArray(data?.entries)?data.entries:[];
    document.querySelectorAll('.menu-category').forEach(b=>b.classList.toggle('active',b.id==='mcuReleaseNotesBtn'));
    const subtitle=document.getElementById('subtitle');if(subtitle)subtitle.textContent='GÜNCELLEME NOTLARI';
    const latest=data?.latest||VERSION;
    host.innerHTML=`<section class="profile-hero" style="grid-template-columns:72px 1fr"><div class="profile-avatar">📋</div><div><div class="profile-name">Güncelleme Notları</div><div class="profile-rank">MCU Tracker Ultimate • v${esc(latest)}</div><p class="meta" style="margin:8px 0 0">Uygulamaya eklenen özellikler, düzeltmeler ve bakım notları.</p></div></section>${entries.map((entry,i)=>`<section class="panel" style="border:${i===0?'1px solid rgba(255,255,255,.18)':''}"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h3 style="margin:0 0 4px">v${esc(entry.version)} • ${esc(entry.title||'Güncelleme')}</h3><div class="meta">${esc(entry.date||'')}</div></div>${i===0?'<span class="role-badge admin">YENİ</span>':''}</div><div style="margin-top:14px;display:grid;gap:9px">${(entry.items||[]).map(x=>`<div style="display:flex;gap:9px;align-items:flex-start"><span>•</span><span>${esc(x)}</span></div>`).join('')}</div></section>`).join('')||'<section class="panel"><p class="meta">Henüz güncelleme notu bulunmuyor.</p></section>'}`;
    document.getElementById('loadMore')?.classList.add('hidden');
    if(markSeen||localStorage.getItem(SEEN_KEY)!==latest){try{localStorage.setItem(SEEN_KEY,latest)}catch{}}
  }

  async function maybeAutoOpen(){
    ensureButton();
    if(!localStorage.getItem(SESSION_KEY))return;
    const data=await loadNotes();
    const latest=data?.latest||VERSION;
    let seen='';try{seen=localStorage.getItem(SEEN_KEY)||''}catch{}
    if(seen===latest)return;
    renderNotes(true);
  }

  function install(){
    ensureButton();
    setTimeout(maybeAutoOpen,800);
    setTimeout(maybeAutoOpen,2200);
    document.addEventListener('click',()=>setTimeout(()=>{ensureButton();maybeAutoOpen()},0),true);
    window.addEventListener('focus',ensureButton,{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
