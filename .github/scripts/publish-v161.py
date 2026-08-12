from pathlib import Path
import re, hashlib, json

app=Path('app/index.html')
s=app.read_text(encoding='utf-8')

pat=r'<script\s+src="https://ovztur\.github\.io/app/telemetry\.js\?v=[^"]+"></script>'
new='<script src="https://ovztur.github.io/app/telemetry.js?v=1.6.1"></script>'
if re.search(pat,s):
    s=re.sub(pat,new,s,count=1)
elif '</body>' in s:
    s=s.replace('</body>',new+'</body>',1)
else:
    raise SystemExit('body marker missing')

app.write_text(s,encoding='utf-8')
sha=hashlib.sha256(app.read_bytes()).hexdigest()
Path('app/index.sha256').write_text(f'{sha}  index.html\n',encoding='utf-8')
Path('app/latest.json').write_text(json.dumps({
  'version':'1.6.1',
  'url':'https://raw.githubusercontent.com/ovztur/ovztur.github.io/main/app/index.html',
  'sha256':sha,
  'notes':'Uygulama içindeki merkezi Admin Paneline canlı anonim giriş/çıkış/kayıt/açılış sayaçları bağlandı. EXE güncellemesi gerekmez.'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(sha)
