from pathlib import Path
import hashlib, json, re

app=Path('app/index.html')
s=app.read_text(encoding='utf-8')

# Remove the central-auth override that replaced the working local account system.
start='/* MCU Tracker Central Auth v1.6.0 */'
end='/* END MCU Tracker Central Auth v1.6.0 */'
if start in s and end in s:
    a=s.index(start)
    b=s.index(end,a)+len(end)
    s=s[:a]+s[b:]

# Make sure the Admin menu item exists in the application itself.
if 'id="adminMenuBtn"' not in s:
    marker='<button class="menu-category" data-cat="settings">⚙️ Ayarlar</button>'
    admin='\n  <button class="menu-category admin-menu hidden" id="adminMenuBtn" data-cat="admin">🛡️ Admin Paneli</button>'
    if marker in s:
        s=s.replace(marker,marker+admin,1)

# Force the external telemetry/admin extension to refresh.
s=re.sub(r'https://ovztur\.github\.io/app/telemetry\.js\?v=[^"\']+',
         'https://ovztur.github.io/app/telemetry.js?v=1.6.2',s)

# The local account implementation already defines ovztur by username as Super Admin.
# Strengthen it in case an older generated app had a role-dependent variant.
s=re.sub(r'function isSuperAdmin\(\)\{return [^}]+\}',
         'function isSuperAdmin(){return userKey(currentUser?.username||currentUser?.key||"")==="ovztur"}',
         s,count=1)

app.write_text(s,encoding='utf-8')
sha=hashlib.sha256(app.read_bytes()).hexdigest()
Path('app/index.sha256').write_text(f'{sha}  index.html\n',encoding='utf-8')
Path('app/latest.json').write_text(json.dumps({
  'version':'1.6.2',
  'url':'https://raw.githubusercontent.com/ovztur/ovztur.github.io/main/app/index.html',
  'sha256':sha,
  'notes':'Admin düzeltmesi: yerel hesap sistemi geri yüklendi; ovztur kalıcı Ana Admin; Admin Paneli geri geldi; canlı anonim sayaçlar uygulama içinde kaldı.'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(sha)
