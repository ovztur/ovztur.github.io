(()=>{
  'use strict';
  const CONFIG_URL='https://ovztur.github.io/config/analytics.json';
  const VERSION='1.6.1';
  let cfg={enabled:false,event_url:'',stats_url:''};
  const once=new Set();

  async function loadConfig(){
    try{
      const r=await fetch(CONFIG_URL+'?t='+Date.now(),{cache:'no-store'});
      if(r.ok) cfg=await r.json();
    }catch{}
  }

  function send(event,count=1){
    if(!cfg?.enabled||!cfg?.event_url) return;
    const body=JSON.stringify({event:String(event),version:VERSION,count:Number(count)||1});
    try{
      if(navigator.sendBeacon){
        const blob=new Blob([body],{type:'application/json'});
        if(navigator.sendBeacon(cfg.event_url,blob)) return;
      }
    }catch{}
    fetch(cfg.event_url,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,cache:'no-store'}).catch(()=>{});
  }

  function sendOnce(key,event){
    if(once.has(key)) return;
    once.add(key);
    send(event);
  }

  async function stats(){
    if(!cfg?.enabled||!cfg?.stats_url) return {ok:false,error:'disabled',totals:{},daily:{}};
    try{
      const r=await fetch(cfg.stats_url+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j=await r.json();
      if(!j?.ok) throw new Error(j?.error||'stats_error');
      return j;
    }catch(e){
      return {ok:false,error:String(e?.message||e),totals:{},daily:{}};
    }
  }

  function wrap(name,make){
    try{
      const original=window[name];
      if(typeof original!=='function'||original.__mcuTelemetryWrapped) return;
      const wrapped=make(original);
      wrapped.__mcuTelemetryWrapped=true;
      window[name]=wrapped;
    }catch{}
  }

  function adminStatsSection(){
    const sec=document.createElement('section');
    sec.className='panel';
    sec.id='mcuLiveAdminStats';
    sec.innerHTML=`<h3 style="margin-top:0">🌐 Canlı Kullanım</h3>
      <p class="meta">Yalnızca toplu anonim sayaçlar tutulur. Kullanıcı adı, şifre, izleme geçmişi, not ve kişisel puan gönderilmez.</p>
      <div class="metric-grid" id="mcuLiveAdminStatsGrid">
        <div class="metric-card"><b>…</b><small>Uygulama açılışı</small></div>
        <div class="metric-card"><b>…</b><small>Giriş</small></div>
        <div class="metric-card"><b>…</b><small>Çıkış</small></div>
        <div class="metric-card"><b>…</b><small>Kayıt</small></div>
      </div>
      <div class="meta" id="mcuLiveAdminStatsStatus">Sunucu verisi alınıyor…</div>`;
    return sec;
  }

  async function attachAdminStats(){
    try{
      if(window.currentCategory!=='admin'||!window.isAdmin?.()) return;
      const host=document.getElementById('movieList');
      if(!host) return;
      document.getElementById('mcuLiveAdminStats')?.remove();
      const sec=adminStatsSection();
      const hero=host.querySelector('.profile-hero');
      if(hero) hero.after(sec); else host.prepend(sec);
      const j=await stats();
      if(window.currentCategory!=='admin') return;
      const grid=document.getElementById('mcuLiveAdminStatsGrid');
      const status=document.getElementById('mcuLiveAdminStatsStatus');
      if(!grid) return;
      if(!j?.ok){
        grid.innerHTML=`<div class="metric-card"><b>—</b><small>Bağlantı yok</small></div>`;
        if(status) status.textContent='Canlı sayaç servisine ulaşılamadı.';
        return;
      }
      const t=j.totals||{};
      const fmt=v=>Number(v||0).toLocaleString('tr-TR');
      grid.innerHTML=`
        <div class="metric-card"><b>${fmt(t.app_open)}</b><small>Uygulama açılışı</small></div>
        <div class="metric-card"><b>${fmt(t.login)}</b><small>Giriş</small></div>
        <div class="metric-card"><b>${fmt(t.logout)}</b><small>Çıkış</small></div>
        <div class="metric-card"><b>${fmt(t.register)}</b><small>Kayıt</small></div>`;
      if(status) status.textContent='Canlı • MCU Tracker v'+VERSION+' • anonim toplu sayaçlar';
    }catch{}
  }

  function install(){
    sendOnce('app_open','app_open');

    wrap('centralLogin',orig=>async function(){
      const out=await orig.apply(this,arguments);
      send('login');
      return out;
    });

    wrap('centralRegister',orig=>async function(){
      const out=await orig.apply(this,arguments);
      send('register');
      return out;
    });

    wrap('loginUser',orig=>async function(key){
      const u=window.users?.[key];
      const isNew=!!u?.createdAt && (Date.now()-Number(u.createdAt)<15000);
      const out=await orig.apply(this,arguments);
      send(isNew?'register':'login');
      return out;
    });

    wrap('logout',orig=>function(){
      send('logout');
      return orig.apply(this,arguments);
    });

    wrap('setMovieWatched',orig=>function(item,value){
      let before=false;
      try{before=!!window.state?.watched?.[window.idOf(item)]}catch{}
      const out=orig.apply(this,arguments);
      if(value&&!before) send('movie_complete');
      return out;
    });

    wrap('setSeriesWatched',orig=>function(show,season,value){
      let before=false;
      try{before=!!window.state?.watched?.[window.idOf(show,'series',season)]}catch{}
      const out=orig.apply(this,arguments);
      if(value&&!before) send('season_complete');
      return out;
    });

    wrap('enqueueTrophy',orig=>function(a){
      if(a&&!a.testMode) send('trophy_unlock');
      return orig.apply(this,arguments);
    });

    wrap('resetAccountProgress',orig=>function(){
      const before=JSON.stringify(window.state||{});
      const out=orig.apply(this,arguments);
      setTimeout(()=>{try{if(JSON.stringify(window.state||{})!==before)send('progress_reset')}catch{}},0);
      return out;
    });

    wrap('renderAdminPanel',orig=>async function(){
      const out=await orig.apply(this,arguments);
      await attachAdminStats();
      return out;
    });
  }

  loadConfig().finally(()=>{
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});
    else setTimeout(install,0);
  });
})();
