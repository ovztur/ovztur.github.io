from pathlib import Path
import hashlib

p=Path('app/index.html')
s=p.read_text(encoding='utf-8')

anchor='function currentTheme(){return state?.settings?.theme||"cosmic"}'
insert=r'''function currentTheme(){return state?.settings?.theme||"cosmic"}
const MCU_APP_VERSION="1.5.3";
const MCU_TELEMETRY_URL="https://svnrfyqloiludzvnylyp.supabase.co/functions/v1/mcu-telemetry";
function sendTelemetry(event){try{fetch(MCU_TELEMETRY_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event,version:MCU_APP_VERSION}),keepalive:true}).catch(()=>{})}catch{}}
async function fetchTelemetryStats(){try{const r=await fetch(MCU_TELEMETRY_URL+"?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);const j=await r.json();if(!j?.ok)throw new Error(j?.error||"stats_error");return j}catch(e){return{ok:false,error:String(e?.message||e),totals:{},daily:{}}}}
function sendAppOpenOnce(){try{const k="MCU_TELEMETRY_OPEN_153";if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1");sendTelemetry("app_open")}catch{sendTelemetry("app_open")}}'''
if anchor not in s: raise SystemExit('theme anchor missing')
s=s.replace(anchor,insert,1)

s=s.replace('saveUsers();await loginUser(key)};return}', 'saveUsers();sendTelemetry("register");await loginUser(key)};return}',1)
s=s.replace('saveUsers();await loginUser(key)}else{const u=users[key];', 'saveUsers();sendTelemetry("register");await loginUser(key)}else{const u=users[key];',1)

old_login='async function loginUser(key){enforcePrimaryAdmin();const u=users[key];if(!u)return;if(userKey(u.username)==="ovztur"){u.role="admin";u.isPrimaryAdmin=true;saveUsers()}currentUser=u;localStorage.setItem(sessionKey,key);loadCurrentUserState();applyTheme(currentTheme());updateAccountUI();hideAuth();currentCategory="doomsday";renderCurrent();updateProgress();refreshIMDbRatings(false)}'
new_login='async function loginUser(key){enforcePrimaryAdmin();const u=users[key];if(!u)return;if(userKey(u.username)==="ovztur"){u.role="admin";u.isPrimaryAdmin=true;saveUsers()}currentUser=u;localStorage.setItem(sessionKey,key);loadCurrentUserState();applyTheme(currentTheme());updateAccountUI();hideAuth();sendTelemetry("login");currentCategory="doomsday";renderCurrent();updateProgress();refreshIMDbRatings(false)}'
if old_login not in s: raise SystemExit('login anchor missing')
s=s.replace(old_login,new_login,1)

old_logout='function logout(){localStorage.removeItem(sessionKey);currentUser=null;state=blankState();document.getElementById("sideMenu").classList.remove("open");document.getElementById("menuOverlay").classList.remove("open");showAuth("login")}'
new_logout='function logout(){sendTelemetry("logout");localStorage.removeItem(sessionKey);currentUser=null;state=blankState();document.getElementById("sideMenu").classList.remove("open");document.getElementById("menuOverlay").classList.remove("open");showAuth("login")}'
if old_logout not in s: raise SystemExit('logout anchor missing')
s=s.replace(old_logout,new_logout,1)

old_boot='function bootstrapAuth(){users=loadJSON(usersKey,{});'
new_boot='function bootstrapAuth(){sendAppOpenOnce();users=loadJSON(usersKey,{});'
if old_boot not in s: raise SystemExit('bootstrap anchor missing')
s=s.replace(old_boot,new_boot,1)

start=s.index('function renderAdminPanel(){')
end=s.index('\nfunction renderAchievements()',start)
new_admin=r'''function renderAdminPanel(){
  if(!isAdmin()){currentCategory="doomsday";renderCurrent();return}
  document.getElementById("subtitle").textContent=TITLES.admin;
  const list=Object.values(users).sort((a,b)=>{const aa=userKey(a.username)==="ovztur",bb=userKey(b.username)==="ovztur";if(aa!==bb)return aa?-1:1;return (a.username||"").localeCompare(b.username||"","tr")});
  const admins=list.filter(u=>userKey(u.username)==="ovztur"||u.role==="admin");
  const rows=list.map(u=>{const k=userKey(u.username),primary=k==="ovztur",admin=primary||u.role==="admin";return `<div class="panel" style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><b>${escapeHTML(u.displayName||u.username)}</b> <span class="meta">@${escapeHTML(u.username)}</span><div style="margin-top:6px"><span class="role-badge ${admin?"admin":""}">${primary?"🛡️ Ana Admin":admin?"👑 Admin":"👤 Kullanıcı"}</span></div></div><div>${primary?`<button class="secondary" disabled>Kalıcı Ana Admin</button>`:isSuperAdmin()?`<button data-admin-key="${escapeHTML(k)}" data-admin-action="${admin?"remove":"grant"}" class="${admin?"secondary":""}">${admin?"Adminliği Kaldır":"Admin Yap"}</button>`:`<span class="meta">Yetki yönetimi yalnızca ovztur hesabında.</span>`}</div></div>`}).join("");
  document.getElementById("movieList").innerHTML=`<section class="profile-hero" style="grid-template-columns:72px 1fr"><div class="profile-avatar">🛡️</div><div><div class="profile-name">Admin Merkezi</div><div class="profile-rank">${isSuperAdmin()?"Ana Admin • ovztur":"Yetkili Admin"}</div><p class="meta" style="margin:8px 0 0">Bu cihazdaki hesap: ${list.length} • Admin: ${admins.length} • Ana Admin: 1</p></div></section><section class="panel"><h3 style="margin-top:0">🌐 Canlı Kullanım</h3><p class="meta">İnternet üzerinden yalnızca toplu sayaçlar gösterilir. Kullanıcı adı, şifre, not, film geçmişi veya kişisel puan gönderilmez.</p><div class="metric-grid" id="adminOnlineStats"><div class="metric-card"><b>…</b><small>Uygulama açılışı</small></div><div class="metric-card"><b>…</b><small>Giriş</small></div><div class="metric-card"><b>…</b><small>Çıkış</small></div><div class="metric-card"><b>…</b><small>Kayıt</small></div></div><div class="meta" id="adminOnlineStatus">Sunucu verisi alınıyor…</div></section><section class="panel"><h3 style="margin-top:0">Yetki Sistemi</h3><p><b>ovztur</b> kalıcı Ana Admin hesabıdır. Bu hesabın adminliği uygulama içinden kaldırılamaz.</p><p class="meta">Admin yaptığın hesaplar bu Admin Paneli sekmesini görür. Başka hesaplara admin verme veya adminliği kaldırma yetkisi yalnızca ovztur hesabındadır.</p></section>${rows||`<section class="panel"><p>Henüz hesap yok.</p></section>`}<section class="panel"><h3 style="margin-top:0">🔒 Gizlilik</h3><p class="meta">Bu ekran şifreleri göstermez. Hesapların izleme geçmişi, notları ve kişisel puanları burada açılmaz.</p></section>`;
  document.querySelectorAll("[data-admin-action]").forEach(btn=>btn.onclick=()=>setAccountAdmin(btn.dataset.adminKey,btn.dataset.adminAction==="grant"));
  document.getElementById("loadMore").classList.add("hidden");
  fetchTelemetryStats().then(j=>{const host=document.getElementById("adminOnlineStats"),status=document.getElementById("adminOnlineStatus");if(!host)return;if(!j?.ok){host.innerHTML=`<div class="panel"><b>Bağlantı kurulamadı</b><div class="meta">${escapeHTML(j?.error||"Bilinmeyen hata")}</div></div>`;if(status)status.textContent="Canlı sayaç servisine ulaşılamadı.";return}const t=j.totals||{};host.innerHTML=`<div class="metric-card"><b>${Number(t.app_open||0).toLocaleString("tr-TR")}</b><small>Uygulama açılışı</small></div><div class="metric-card"><b>${Number(t.login||0).toLocaleString("tr-TR")}</b><small>Giriş</small></div><div class="metric-card"><b>${Number(t.logout||0).toLocaleString("tr-TR")}</b><small>Çıkış</small></div><div class="metric-card"><b>${Number(t.register||0).toLocaleString("tr-TR")}</b><small>Kayıt</small></div>`;if(status)status.textContent="Canlı • MCU Tracker v"+MCU_APP_VERSION+" • toplu anonim sayaçlar"})
}'''
s=s[:start]+new_admin+s[end:]

s=s.replace('save();updateProgress();renderProfile();alert("Hesap ilerlemesi sıfırlandı.', 'save();sendTelemetry("progress_reset");updateProgress();renderProfile();alert("Hesap ilerlemesi sıfırlandı.',1)

p.write_text(s,encoding='utf-8')
print(hashlib.sha256(s.encode()).hexdigest())
