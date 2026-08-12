(()=>{
  'use strict';
  const VERSION='1.6.5-lite';
  const CONFIG_URL='https://ovztur.github.io/config/analytics.json';
  const USERS_KEY='MCU_TRACKER_USERS_V1';
  const SESSION_KEY='MCU_TRACKER_SESSION_V1';
  let cfg={enabled:false,event_url:'',stats_url:''};
  const once=new Set();
  let paintQueued=false;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const keyOf=v=>String(v||'').trim().toLocaleLowerCase('tr-TR');
  const readUsers=()=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||'{}')||{}}catch{return {}}};
  const writeUsers=u=>{try{localStorage.setItem(USERS_KEY,JSON.stringify(u))}catch{}};
  const sessionKey=()=>localStorage.getItem(SESSION_KEY)||'';
  const account=()=>{const u=readUsers();const sk=sessionKey();return {users:u,key:sk,user:u[sk]||null}};
  const primary=u=>keyOf(u?.username||u?.key)==='ovztur';
  const admin=u=>primary(u)||u?.role==='admin';

  async function loadConfig(){try{const r=await fetch(CONFIG_URL+'?t='+Date.now(),{cache:'no-store'});if(r.ok)cfg=await r.json()}catch{}}
  function send(event,count=1){if(!cfg?.enabled||!cfg?.event_url)return;const body=JSON.stringify({event:String(event),version:VERSION,count:Number(count)||1});try{if(navigator.sendBeacon){const blob=new Blob([body],{type:'application/json'});if(navigator.sendBeacon(cfg.event_url,blob))return}}catch{}fetch(cfg.event_url,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,cache:'no-store'}).catch(()=>{})}
  function sendOnce(k,e){if(once.has(k))return;once.add(k);send(e)}
  async function stats(){if(!cfg?.enabled||!cfg?.stats_url)return {ok:false,totals:{}};try{const r=await fetch(cfg.stats_url+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(!j?.ok)throw new Error(j?.error||'stats_error');return j}catch(e){return {ok:false,error:String(e?.message||e),totals:{}}}}

  function normalizePrimary(){
    const {users,key,user}=account();
    if(!user||!primary(user))return user;
    const needsFix=key!=='ovztur'||user.key!=='ovztur'||user.username!=='ovztur'||user.role!=='admin'||user.isPrimaryAdmin!==true;
    if(!needsFix)return user;
    const fixed={...user,key:'ovztur',username:'ovztur',role:'admin',isPrimaryAdmin:true};
    if(key!=='ovztur'){delete users[key];users.ovztur=fixed;localStorage.setItem(SESSION_KEY,'ovztur')}else users[key]=fixed;
    writeUsers(users);
    return fixed;
  }

  function ensureAdminButton(isAdmin){
    let btn=document.getElementById('adminMenuBtn');
    if(!btn&&isAdmin){
      const side=document.getElementById('sideMenu');
      if(side){
        btn=document.createElement('button');
        btn.className='menu-category admin-menu';
        btn.id='adminMenuBtn';
        btn.dataset.cat='admin';
        btn.textContent='🛡️ Admin Paneli';
        const anchor=side.querySelector('.category-info')||side.querySelector('#logoutBtn');
        if(anchor)side.insertBefore(btn,anchor);else side.appendChild(btn);
      }
    }
    if(btn){
      btn.classList.toggle('hidden',!isAdmin);
      if(isAdmin&&!btn.dataset.mcuRescueBound){
        btn.dataset.mcuRescueBound='1';
        btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();renderRescueAdmin()},{capture:true});
      }
    }
    return btn;
  }

  function paintRoleUI(){
    paintQueued=false;
    const u=normalizePrimary()||account().user;
    if(!u)return;
    const isPrimary=primary(u),isAdmin=admin(u);
    const box=document.getElementById('menuAccount');
    if(box){const badge=box.querySelector('.role-badge');if(badge){badge.classList.toggle('admin',isAdmin);const wanted=isPrimary?'🛡️ Ana Admin':isAdmin?'👑 Admin':'👤 Kullanıcı';if(badge.textContent!==wanted)badge.textContent=wanted}}
    const profileBadge=document.querySelector('.profile-hero .role-badge');
    if(profileBadge&&isPrimary){profileBadge.classList.add('admin');if(profileBadge.textContent!=='🛡️ Ana Admin Hesabı')profileBadge.textContent='🛡️ Ana Admin Hesabı'}
    ensureAdminButton(isAdmin);
  }

  function schedulePaint(){if(paintQueued)return;paintQueued=true;requestAnimationFrame(paintRoleUI)}

  function roleRows(users,current){
    const list=Object.values(users).sort((a,b)=>{const ap=primary(a),bp=primary(b);if(ap!==bp)return ap?-1:1;return String(a.username||'').localeCompare(String(b.username||''),'tr')});
    return list.map(u=>{const k=keyOf(u.username||u.key),p=primary(u),a=admin(u);return `<div class="panel" style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><b>${esc(u.displayName||u.username||k)}</b> <span class="meta">@${esc(u.username||k)}</span><div style="margin-top:6px"><span class="role-badge ${a?'admin':''}">${p?'🛡️ Ana Admin':a?'👑 Admin':'👤 Kullanıcı'}</span></div></div><div>${p?'<button class="secondary" disabled>Kalıcı Ana Admin</button>':primary(current)?`<button data-rescue-admin-key="${esc(k)}" data-rescue-admin-action="${a?'remove':'grant'}" class="${a?'secondary':''}">${a?'Adminliği Kaldır':'Admin Yap'}</button>`:'<span class="meta">Yetki yönetimi yalnızca ovztur hesabında.</span>'}</div></div>`}).join('')
  }

  async function renderRescueAdmin(){
    const {users,user}=account();
    const current=normalizePrimary()||user;
    if(!current||!admin(current))return;
    const subtitle=document.getElementById('subtitle');if(subtitle)subtitle.textContent='ADMIN MERKEZİ';
    document.querySelectorAll('.menu-category').forEach(b=>b.classList.toggle('active',b.id==='adminMenuBtn'));
    const host=document.getElementById('movieList');if(!host)return;
    const list=Object.values(users),admins=list.filter(admin);
    host.innerHTML=`<section class="profile-hero" style="grid-template-columns:72px 1fr"><div class="profile-avatar">🛡️</div><div><div class="profile-name">Admin Merkezi</div><div class="profile-rank">${primary(current)?'Ana Admin • ovztur':'Yetkili Admin'}</div><p class="meta" style="margin:8px 0 0">Bu cihazdaki hesap: ${list.length} • Admin: ${admins.length} • Ana Admin: 1</p></div></section><section class="panel"><h3 style="margin-top:0">🌐 Canlı Kullanım</h3><p class="meta">Yalnızca toplu anonim sayaçlar tutulur. Kullanıcı adı, şifre, izleme geçmişi, not ve kişisel puan sunucuya gönderilmez.</p><div class="metric-grid" id="mcuRescueStats"><div class="metric-card"><b>…</b><small>Uygulama açılışı</small></div><div class="metric-card"><b>…</b><small>Giriş</small></div><div class="metric-card"><b>…</b><small>Çıkış</small></div><div class="metric-card"><b>…</b><small>Kayıt</small></div></div><div class="meta" id="mcuRescueStatsStatus">Sunucu verisi alınıyor…</div></section><section class="panel"><h3 style="margin-top:0">Yetki Sistemi</h3><p><b>ovztur</b> kalıcı Ana Admin hesabıdır.</p><p class="meta">Admin yaptığın hesaplar Admin Paneli sekmesini görür. Admin verme/kaldırma yetkisi yalnızca ovztur hesabındadır.</p></section>${roleRows(users,current)}<section class="panel"><h3 style="margin-top:0">🔒 Gizlilik</h3><p class="meta">Şifreler gösterilmez; izleme geçmişi, notlar ve kişisel puanlar bu panelde açılmaz.</p></section>`;
    document.getElementById('loadMore')?.classList.add('hidden');
    document.querySelectorAll('[data-rescue-admin-action]').forEach(btn=>btn.onclick=()=>{
      if(!primary(current))return;
      const k=keyOf(btn.dataset.rescueAdminKey);if(k==='ovztur')return;
      const all=readUsers(),target=all[k];if(!target)return;
      const make=btn.dataset.rescueAdminAction==='grant';
      if(!confirm(`${target.username||k} hesabı ${make?'Admin yapılsın mı?':'normal kullanıcıya çevrilsin mi?'}`))return;
      target.role=make?'admin':'user';target.isPrimaryAdmin=false;all[k]=target;writeUsers(all);renderRescueAdmin();
    });
    const j=await stats();
    const grid=document.getElementById('mcuRescueStats'),status=document.getElementById('mcuRescueStatsStatus');if(!grid)return;
    if(!j?.ok){grid.innerHTML='<div class="metric-card"><b>—</b><small>Bağlantı yok</small></div>';if(status)status.textContent='Canlı sayaç servisine ulaşılamadı.';return}
    const t=j.totals||{},fmt=v=>Number(v||0).toLocaleString('tr-TR');
    grid.innerHTML=`<div class="metric-card"><b>${fmt(t.app_open)}</b><small>Uygulama açılışı</small></div><div class="metric-card"><b>${fmt(t.login)}</b><small>Giriş</small></div><div class="metric-card"><b>${fmt(t.logout)}</b><small>Çıkış</small></div><div class="metric-card"><b>${fmt(t.register)}</b><small>Kayıt</small></div>`;
    if(status)status.textContent='Canlı • hafif kurtarma katmanı '+VERSION+' • anonim toplu sayaçlar';
  }

  function wrap(name,make){try{const orig=window[name];if(typeof orig!=='function'||orig.__mcuRescueWrapped)return;const w=make(orig);w.__mcuRescueWrapped=true;window[name]=w}catch{}}
  function install(){
    normalizePrimary();schedulePaint();sendOnce('app_open','app_open');
    wrap('loginUser',orig=>async function(key){const before=readUsers()[key];const fresh=!!before?.createdAt&&(Date.now()-Number(before.createdAt)<15000);const out=await orig.apply(this,arguments);schedulePaint();send(fresh?'register':'login');return out});
    wrap('logout',orig=>function(){send('logout');return orig.apply(this,arguments)});
    document.getElementById('hamburgerButton')?.addEventListener('click',()=>setTimeout(schedulePaint,0));
    document.getElementById('sideMenu')?.addEventListener('click',()=>setTimeout(schedulePaint,0));
    window.addEventListener('focus',schedulePaint,{passive:true});
  }

  loadConfig().finally(()=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0)});
})();