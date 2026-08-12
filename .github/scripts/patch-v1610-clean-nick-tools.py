from pathlib import Path
import re, json, hashlib

VERSION = '1.6.10'

tp = Path('app/telemetry.js')
s = tp.read_text(encoding='utf-8')
s = re.sub(r"const VERSION='[^']+';", "const VERSION='1.6.10-lite';", s, count=1)

start_marker = "    const list=Object.values(users),admins=list.filter(admin),nickBox=primary(current)?`"
host_marker = "    host.innerHTML=`"
start = s.find(start_marker)
host = s.find(host_marker, start)
if start < 0 or host < 0:
    raise SystemExit('nickBox block not found')

boxes = '''    const list=Object.values(users),admins=list.filter(admin);\n    const adminNickBox=primary(current)?`<section class="panel"><h3 style="margin-top:0">👑 Nick ile Admin Yap</h3><p class="meta">Admin yapmak istediğin kayıtlı hesabın nickini yaz.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="mcuAdminNick" class="search" style="flex:1;min-width:220px" placeholder="Admin yapılacak nick / örn. peter"><button id="mcuGrantNickBtn">Admin Yap</button></div><div id="mcuAdminNickStatus" class="meta" style="margin-top:8px">${esc(message)}</div></section>`:'';\n    const deleteNickBox=primary(current)?`<section class="panel"><h3 style="margin-top:0">🗑️ Nick ile Hesap Sil</h3><p class="meta">Silmek istediğin hesabın nickini yaz. ovztur Ana Admin hesabı silinemez.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="mcuDeleteNick" class="search" style="flex:1;min-width:220px" placeholder="Silinecek nick / örn. peter"><button id="mcuDeleteNickBtn" class="secondary">🗑️ Hesabı Sil</button></div><div id="mcuDeleteNickStatus" class="meta" style="margin-top:8px"></div></section>`:'';\n'''
s = s[:start] + boxes + s[host:]

old = '${nickBox}<section class="panel"><h3 style="margin-top:0">🌐 Canlı Kullanım</h3>'
new = '${adminNickBox}${deleteNickBox}<section class="panel"><h3 style="margin-top:0">🌐 Canlı Kullanım</h3>'
if old not in s:
    raise SystemExit('host nickBox insertion not found')
s = s.replace(old, new, 1)

handler_start = "    const nickInput=document.getElementById('mcuAdminNick')"
handler_end = "    document.querySelectorAll('[data-admin-action]')"
hs = s.find(handler_start)
he = s.find(handler_end, hs)
if hs < 0 or he < 0:
    raise SystemExit('nick handler block not found')

handlers = '''    const adminNickInput=document.getElementById('mcuAdminNick'),grantBtn=document.getElementById('mcuGrantNickBtn');\n    const deleteNickInput=document.getElementById('mcuDeleteNick'),deleteBtn=document.getElementById('mcuDeleteNickBtn');\n    const doGrant=()=>{if(!adminNickInput)return;const r=grantByNick(adminNickInput.value);renderAdmin(r.msg)};\n    const doDelete=()=>{if(!deleteNickInput)return;const nick=deleteNickInput.value.trim();const status=document.getElementById('mcuDeleteNickStatus');if(!nick){if(status)status.textContent='Silmek için bir kullanıcı nicki gir.';return}if(!confirm(`@${nick} hesabı silinsin mi?\\n\\nBu hesabın yerel ilerleme, XP, kupa, favori, not ve puan verileri de silinecek.`))return;if(!confirm(`SON ONAY: @${nick} hesabını kalıcı olarak silmek istediğine emin misin?`))return;const r=deleteByNick(nick);if(r.ok)renderAdmin(r.msg);else if(status)status.textContent=r.msg};\n    if(grantBtn)grantBtn.onclick=doGrant;if(deleteBtn)deleteBtn.onclick=doDelete;\n    if(adminNickInput)adminNickInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doGrant()}});\n    if(deleteNickInput)deleteNickInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doDelete()}});\n\n'''
s = s[:hs] + handlers + s[he:]
tp.write_text(s, encoding='utf-8')

p = Path('app/index.html')
html = p.read_text(encoding='utf-8')
html = re.sub(r'https://ovztur\.github\.io/app/telemetry\.js\?v=[^"\']+', 'https://ovztur.github.io/app/telemetry.js?v=1.6.10', html)
html = re.sub(r'https://ovztur\.github\.io/app/account-delete\.js\?v=[^"\']+', 'https://ovztur.github.io/app/account-delete.js?v=1.6.10', html)
html = re.sub(r'const MCU_APP_VERSION="[^"]+";', 'const MCU_APP_VERSION="1.6.10";', html)
p.write_text(html, encoding='utf-8')

sha = hashlib.sha256(p.read_bytes()).hexdigest()
Path('app/latest.json').write_text(json.dumps({
    'version': VERSION,
    'url': 'https://raw.githubusercontent.com/ovztur/ovztur.github.io/main/app/index.html',
    'sha256': sha,
    'notes': 'Nick ile Admin Yap kutusunda yalnız Admin Yap bırakıldı. Nick ile Hesap Sil ayrı kutu olarak tutuldu.'
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
Path('app/index.sha256').write_text(f'{sha}  index.html\n', encoding='utf-8')
print('patched', VERSION, sha)
