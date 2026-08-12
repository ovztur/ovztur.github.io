# MCU Tracker Analytics Backend

Bu klasör MCU Tracker için privacy-first anonim sayaç backend'ini içerir.

## Saklanan alanlar
Yalnızca `day`, `event`, `version`, `count`.

Kullanıcı adı, e-posta, parola, IP, cihaz kimliği, not, kişisel puan veya izlenen içerik kimliği saklanmaz.

## Cloudflare kurulumu
1. Bir D1 veritabanı oluştur.
2. `schema.sql` dosyasını D1 üzerinde çalıştır.
3. Pages/Worker projesine D1 binding adı olarak `ANALYTICS` ekle.
4. Güçlü bir `ADMIN_TOKEN` secret tanımla. Token repoya yazılmamalıdır.
5. `functions/api/event.js` ve `functions/api/stats.js` endpoint'lerini deploy et.
6. Canlı URL'ler oluşunca kökteki `config/analytics.json` dosyasını şu şekilde güncelle:

```json
{
  "enabled": true,
  "event_url": "https://<worker-domain>/api/event",
  "stats_url": "https://<worker-domain>/api/stats",
  "privacy": {
    "personal_data": false,
    "fields_sent": ["event", "version", "count"]
  }
}
```

Bu yapı sayesinde MCU Tracker EXE veya uygulama HTML'i yeniden dağıtılmadan analytics endpoint'i değiştirilebilir.
