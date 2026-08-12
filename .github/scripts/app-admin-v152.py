from pathlib import Path
import hashlib, json, re

p=Path('app/index.html')
s=p.read_text(encoding='utf-8')

# Side-menu admin tab (hidden unless authorized)
if 'id="adminMenuBtn"' not in s:
    s=s.replace('  <button class="menu-category" data-cat="settings">⚙️ Ayarlar</button>\n', '  <button class="menu-category" data-cat="settings">⚙️ Ayarlar</button>\n  <button class="menu-category admin-menu hidden" id="adminMenuBtn" data-cat="admin">🛡️ Admin Paneli</button>\n')

s=s.replace('settings:"AYARLAR & TEMA"};','settings:"AYARLAR & TEMA",admin:"ADMIN PANELİ"};')

if 'function isSuperAdmin()' not in s:
    s=s.replace('function isAdmin(){return currentUser?.role==="admin"}', 'function isSuperAdmin(){return userKey(currentUser?.username||"")==="ovztur"}\nfunction isAdmin(){return isSuperAdmin()||currentUser?.role==="admin"}\nfunction enforcePrimaryAdmin(){const k=userKey("ovztur");if(users[k]){users[k].role="admin";users[k].isPrimaryAdmin=true;users[k].username="ovztur";if(!users[k].displayName)users[k].displayName="ovztur";saveUsers()}}')

old='function updateAccountUI(){const box=document.getElementById("menuAccount");if(!box||!currentUser)return;box.innerHTML=`<strong>${escapeHTML(currentUser.displayName||currentUser.username)}</strong><small>@${escapeHTML(currentUser.username)}</small><span class="role-badge ${isAdmin()?"admin":""}">${isAdmin()?"👑 Admin":"👤 Kullanıcı"}</span>`}'
new='function updateAccountUI(){const box=document.getElementById("menuAccount"),adminBtn=document.getElementById("adminMenuBtn");if(!box||!currentUser)return;const superAdmin=isSuperAdmin();box.innerHTML=`<strong>${escapeHTML(currentUser.displayName||currentUser.username)}</strong><small>@${escapeHTML(currentUser.username)}</small><span class="role-badge ${isAdmin()?"admin":""}">${superAdmin?"🛡️ Ana Admin":isAdmin()?"👑 Admin":"👤 Kullanıcı"}</span>`;if(adminBtn)adminBtn.classList.toggle("hidden",!isAdmin())}'
s=s.replace(old,new)

s=s.replace('async function loginUser(key){const u=users[key];if(!u)return;currentUser=u;', 'async function loginUser(key){enforcePrimaryAdmin();const u=users[key];if(!u)return;if(userKey(u.username)==="ovztur"){u.role="admin";u.isPrimaryAdmin=true;saveUsers()}currentUser=u;')
s=s.replace('saveUsers()}const hasAdmin=', 'saveUsers()}enforcePrimaryAdmin();const hasAdmin=')
s=s.replace('if(currentCategory==="settings"){renderSettings();return}renderList', 'if(currentCategory==="settings"){renderSettings();return}if(currentCategory==="admin"){renderAdminPanel();return}renderList')
s=s.replace('${isAdmin()?"👑 Admin Hesabı":"👤 Kullanıcı Hesabı"}', '${isSuperAdmin()?"🛡️ Ana Admin Hesabı":isAdmin()?"👑 Admin Hesabı":"👤 Kullanıcı Hesabı"}')

if 'function renderAdminPanel()' not in s:
    marker='function renderAchievements(){'
    admin_func='''function setAccountAdmin(accountKey,makeAdmin){\n  if(!isSuperAdmin())return;\n  const k=userKey(accountKey),u=users[k];if(!u)return;\n  if(k==="ovztur"){alert("ovztur Ana Admin hesabının adminliği kaldırılamaz.");return}\n  u.role=makeAdmin?"admin":"user";u.isPrimaryAdmin=false;saveUsers();renderAdminPanel()\n}\nfunction renderAdminPanel(){\n  if(!isAdmin()){currentCategory="doomsday";renderCurrent();return}\n  document.getElementById("subtitle").textContent=TITLES.admin;\n  const list=Object.values(users).sort((a,b)=>{const aa=userKey(a.username)==="ovztur",bb=userKey(b.username)==="ovztur";if(aa!==bb)return aa?-1:1;return (a.username||"").localeCompare(b.username||"","tr")});\n  const admins=list.filter(u=>userKey(u.username)==="ovztur"||u.role==="admin");\n  const rows=list.map(u=>{const k=userKey(u.username),primary=k==="ovztur",admin=primary||u.role==="admin";return `<div class="panel" style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><b>${escapeHTML(u.displayName||u.username)}</b> <span class="meta">@${escapeHTML(u.username)}</span><div style="margin-top:6px"><span class="role-badge ${admin?"admin":""}">${primary?"🛡️ Ana Admin":admin?"👑 Admin":"👤 Kullanıcı"}</span></div></div><div>${primary?`<button class="secondary" disabled>Kalıcı Ana Admin</button>`:isSuperAdmin()?`<button data-admin-key="${escapeHTML(k)}" data-admin-action="${admin?"remove":"grant"}" class="${admin?"secondary":""}">${admin?"Adminliği Kaldır":"Admin Yap"}</button>`:`<span class="meta">Yetki yönetimi yalnızca ovztur hesabında.</span>`}</div></div>`}).join("");\n  document.getElementById("movieList").innerHTML=`<section class="profile-hero" style="grid-template-columns:72px 1fr"><div class="profile-avatar">🛡️</div><div><div class="profile-name">Admin Merkezi</div><div class="profile-rank">${isSuperAdmin()?"Ana Admin • ovztur":"Yetkili Admin"}</div><p class="meta" style="margin:8px 0 0">Toplam hesap: ${list.length} • Admin: ${admins.length} • Ana Admin: 1</p></div></section><section class="panel"><h3 style="margin-top:0">Yetki Sistemi</h3><p><b>ovztur</b> kalıcı Ana Admin hesabıdır. Bu hesabın adminliği uygulama içinden kaldırılamaz.</p><p class="meta">Admin yaptığın hesaplar bu Admin Paneli sekmesini görür. Başka hesaplara admin verme veya adminliği kaldırma yetkisi yalnızca ovztur hesabındadır.</p></section>${rows||`<section class="panel"><p>Henüz hesap yok.</p></section>`}<section class="panel"><h3 style="margin-top:0">🔒 Gizlilik</h3><p class="meta">Bu ekran şifreleri göstermez. Hesapların izleme geçmişi, notları ve kişisel puanları burada açılmaz.</p></section>`;\n  document.querySelectorAll("[data-admin-action]").forEach(btn=>btn.onclick=()=>setAccountAdmin(btn.dataset.adminKey,btn.dataset.adminAction==="grant"));\n  document.getElementById("loadMore").classList.add("hidden")\n}\n'''
    s=s.replace(marker,admin_func+marker)

p.write_text(s,encoding='utf-8')
sha=hashlib.sha256(s.encode()).hexdigest()
Path('app/latest.json').write_text(json.dumps({
  'version':'1.5.2',
  'url':'https://ovztur.github.io/app/index.html',
  'sha256':sha,
  'notes':'Ana Admin ovztur + devredilebilir admin yetkileri + Admin Paneli sekmesi.'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
Path('app/index.sha256').write_text(f'{sha}  index.html\n',encoding='utf-8')
