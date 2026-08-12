from pathlib import Path
import re, json, hashlib

VERSION='1.6.11'
p=Path('app/index.html')
s=p.read_text(encoding='utf-8')
s=re.sub(r'https://ovztur\.github\.io/app/telemetry\.js\?v=[^"\']+', 'https://ovztur.github.io/app/telemetry.js?v=1.6.11', s)
s=re.sub(r'https://ovztur\.github\.io/app/account-delete\.js\?v=[^"\']+', 'https://ovztur.github.io/app/account-delete.js?v=1.6.11', s)
s=re.sub(r'const MCU_APP_VERSION="[^"]+";', 'const MCU_APP_VERSION="1.6.11";', s)
p.write_text(s,encoding='utf-8')
sha=hashlib.sha256(p.read_bytes()).hexdigest()
Path('app/latest.json').write_text(json.dumps({
  'version':VERSION,
  'url':'https://raw.githubusercontent.com/ovztur/ovztur.github.io/main/app/index.html',
  'sha256':sha,
  'notes':'Hesap silme kontrollerindeki tekrar kaldırıldı; her hesap için tek Hesabı Sil düğmesi bırakıldı.'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
Path('app/index.sha256').write_text(f'{sha}  index.html\n',encoding='utf-8')
print('patched',VERSION,sha)
