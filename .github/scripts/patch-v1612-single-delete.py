from pathlib import Path
import re, json, hashlib

VERSION='1.6.12'

tp=Path('app/telemetry.js')
s=tp.read_text(encoding='utf-8')
s=re.sub(r"const VERSION='[^']+';", "const VERSION='1.6.12-lite';", s, count=1)

# Keep only Admin grant/remove in account rows. Delete is handled only by the single nick delete box.
old = '''<button data-admin-key="${esc(storedKey)}" data-admin-action="${a?'remove':'grant'}" class="${a?'secondary':''}">${a?'Adminliği Kaldır':'Admin Yap'}</button><button data-delete-key="${esc(storedKey)}" class="secondary">🗑️ Hesabı Sil</button>'''
new = '''<button data-admin-key="${esc(storedKey)}" data-admin-action="${a?'remove':'grant'}" class="${a?'secondary':''}">${a?'Adminliği Kaldır':'Admin Yap'}</button>'''
s=s.replace(old,new)

# Remove obsolete row-delete event binding if present.
s=re.sub(r"\n\s*document\.querySelectorAll\('\[data-delete-key\]'\)\.forEach\(btn=>btn\.onclick=.*?\);\n", "\n", s, count=1, flags=re.S)

# Safety checks: exactly one nick delete panel, no row delete controls.
if s.count('🗑️ Nick ile Hesap Sil') != 1:
    raise SystemExit(f"expected exactly 1 Nick ile Hesap Sil, found {s.count('🗑️ Nick ile Hesap Sil')}")
if 'data-delete-key=' in s:
    raise SystemExit('row-level delete control still present in telemetry.js')

tp.write_text(s,encoding='utf-8')

# account-delete.js should only provide self-delete for non-primary accounts.
ap=Path('app/account-delete.js')
a=ap.read_text(encoding='utf-8')
a=re.sub(r"const VERSION='[^']+';", "const VERSION='1.6.12';", a, count=1)
# Remove any admin-row injection function body if an old variant remains.
a=re.sub(r"function injectPrimaryAdminDeletes\(\)\{.*?\n  \}", "function injectPrimaryAdminDeletes(){}", a, count=1, flags=re.S)
ap.write_text(a,encoding='utf-8')

# Deduplicate external script tags in the app HTML and cache-bust them.
p=Path('app/index.html')
html=p.read_text(encoding='utf-8')
html=re.sub(r'<script\s+src="https://ovztur\.github\.io/app/telemetry\.js\?v=[^"]+"\s*></script>', '', html)
html=re.sub(r'<script\s+src="https://ovztur\.github\.io/app/account-delete\.js\?v=[^"]+"\s*></script>', '', html)
tags='<script src="https://ovztur.github.io/app/telemetry.js?v=1.6.12"></script><script src="https://ovztur.github.io/app/account-delete.js?v=1.6.12"></script>'
if '</body>' in html:
    html=html.replace('</body>',tags+'</body>',1)
else:
    html+=tags
html=re.sub(r'const MCU_APP_VERSION="[^"]+";', 'const MCU_APP_VERSION="1.6.12";', html)

if html.count('app/telemetry.js?v=1.6.12') != 1:
    raise SystemExit('telemetry script tag not unique')
if html.count('app/account-delete.js?v=1.6.12') != 1:
    raise SystemExit('account-delete script tag not unique')

p.write_text(html,encoding='utf-8')
sha=hashlib.sha256(p.read_bytes()).hexdigest()
Path('app/latest.json').write_text(json.dumps({
  'version':VERSION,
  'url':'https://raw.githubusercontent.com/ovztur/ovztur.github.io/main/app/index.html',
  'sha256':sha,
  'notes':'Hesap silme arayüzü tekilleştirildi: Ana Admin için yalnızca tek Nick ile Hesap Sil kutusu kaldı; hesap satırlarındaki ek silme düğmeleri kaldırıldı.'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
Path('app/index.sha256').write_text(f'{sha}  index.html\n',encoding='utf-8')
print('patched',VERSION,sha)
