from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('Windows • v1.5.1 • Auto Update','Web + Windows • v1.6.0 • Central Auth')
s=s.replace('v1.5.1 ve sonrasında yeni sürümler otomatik kontrol edilir ve SHA-256 doğrulamasıyla güncellenir.','Artık MCU Tracker doğrudan web üzerinden de çalışır. Merkezi giriş ve admin rolleri internete bağlıdır; yeni arayüz güncellemeleri için EXE çalıştırman gerekmez.')
s=s.replace('<div class="actions"><a class="btn" id="downloadBtn" href="downloads/MCU_Tracker_Ultimate_v1.5.1.exe">⬇ Windows için İndir</a><a class="btn secondary" href="#guvenlik">🛡 Güvenliği Gör</a></div>','<div class="actions"><a class="btn" href="app/">🌐 Web Uygulamayı Aç</a><a class="btn secondary" id="downloadBtn" href="downloads/MCU_Tracker_Ultimate_v1.5.1.exe">⬇ Windows</a><a class="btn secondary" href="#guvenlik">🛡 Güvenliği Gör</a></div>')
s=s.replace('Windows 10/11 x64 • v1.5.1 • SHA-256 doğrulamalı güncelleme','Tarayıcıdan direkt kullanım • Merkezi hesap sistemi • Windows launcher isteğe bağlı')
s=s.replace('<div class="rel"><div><b>v1.5.1</b><br><small>Auto Update bootstrap + privacy-first anonim istatistik altyapısı</small></div><span>Güncel</span></div>','<div class="rel"><div><b>v1.6.0</b><br><small>Web uygulaması + merkezi giriş + merkezi admin rolleri + ovztur Super Admin</small></div><span>Güncel</span></div><div class="rel"><div><b>v1.5.1</b><br><small>Auto Update bootstrap</small></div><span>Önceki</span></div>')
p.write_text(s,encoding='utf-8')
