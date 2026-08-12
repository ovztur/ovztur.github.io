# MCU Tracker Ultimate — Gizlilik

MCU Tracker Ultimate, hesap ve ilerleme verilerini cihazdaki yerel depolamada tutar.

## Uygulama verileri
Kullanıcı adı, profil adı, parola özeti, izlenen içerikler, favoriler, notlar, kişisel puanlar, XP, kupalar ve tema seçimi cihazda tutulur. Bu veriler anonim istatistik servisine gönderilmez.

## Anonim kullanım istatistikleri
Anonim sayaç sistemi etkinleştirildiğinde yalnızca şu alanlar gönderilir ve toplu olarak saklanır:

- olay türü (`app_open`, `login`, `logout`, `movie_completed`, `season_completed`, `trophy_unlocked`, güncelleme olayları vb.)
- uygulama sürümü
- adet
- sunucuda toplama için gün

Kullanıcı adı, e-posta, parola, IP adresi, cihaz kimliği, notlar, kişisel film puanları ve hangi filmin/dizinin izlendiği analitik verisi olarak saklanmaz.

## Admin paneli
Admin paneli kişi listesi oluşturmaz. Yalnızca toplu sayaçları ve sürüm dağılımını gösterir.

## Güncelleme güvenliği
MCU Tracker güncelleme manifestlerini HTTPS üzerinden kontrol eder ve indirilen uygulama dosyalarını SHA-256 değeriyle doğrular.

MCU Tracker bağımsız bir fan takip aracıdır; Marvel veya Disney tarafından desteklenmiş ya da onaylanmış değildir.
