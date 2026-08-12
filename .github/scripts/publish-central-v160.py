from pathlib import Path
import hashlib, json
app=Path('app/index.html')
s=app.read_text(encoding='utf-8')
js=Path('.github/scripts/central-auth-v160.js').read_text(encoding='utf-8')
start='/* MCU Tracker Central Auth v1.6.0 */'
end='/* END MCU Tracker Central Auth v1.6.0 */'
if start in s:
    a=s.index(start); b=s.index(end,a)+len(end)
    s=s[:a]+s[b:]
needle='applyTheme("cosmic");bootstrapAuth();'
if needle not in s: raise SystemExit('bootstrap marker missing')
block=js+'\n'+end+'\n'
s=s.replace(needle,block+needle,1)
app.write_text(s,encoding='utf-8')
sha=hashlib.sha256(app.read_bytes()).hexdigest()
Path('app/index.sha256').write_text(f'{sha}  index.html\n',encoding='utf-8')
Path('app/latest.json').write_text(json.dumps({
 'version':'1.6.0',
 'url':'https://ovztur.github.io/app/index.html',
 'sha256':sha,
 'notes':'Web/Central Auth: merkezi giriş, merkezi admin rolleri ve ovztur kalıcı Super Admin.'
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
