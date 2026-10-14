# YORUK STRATEGY (`Turan Tactics`) — GENEL İNCELEME VE MASTER YOL HARİTASI

> **Proje Dizini:** `d:\antigravity-projects\yoruk_strategy`
> **Mimari Standart:** YGS-v1 Trinity (`packages/core`, `server`, `client`) & GDP-v1
> **Durum:** İnceleme Tamamlandı — 3 Fazlı Düzenleme Planı Hazır

---

## 1. Mevcut Durum Analizi
`yoruk_strategy` projesi temel Trinity katmanlarına, Vitest birim testlerine (`19/19 PASS`) ve sıfır emojili izometrik vektörel çizim motoruna sahiptir. Ancak projenin hem **Çatı Platform (`yoruk_games`) ile canlı dağıtım/ağ entegrasyonunda** hem de **strateji oynanış döngüsünde (Core Gameplay Loop)** düzene sokulması gereken **5 temel darboğaz** tespit edilmiştir:

1. **Altyapı, Port ve Docker Kopukluğu (`Faz S1`):**
   - Port uyuşmazlığı (`yoruk_strategy` `3001` portunu kullanırken `yoruk_games` `5173` portuna yönlendiriyor).
   - İstemcide sabit `ws://localhost:8081/ws` WebSocket adresi (uzak sunucuda ve Nginx arkasında bağlantıyı koparıyor).
   - `client/package.json` içindeki `file:../../yoruk_games/sdk/yoruk-game-sdk` bağımlılığının Docker imaj derlemesini (`docker compose build`) kırması.
   - `docker-compose.yml` içinde `yoruk-net` ortak ağ bağlantısının ve tek komutluk `deploy.sh` betiğinin eksikliği.

2. **Savaş ve Fetih Döngüsünün Sonuçsuz Kalması (`Faz S2`):**
   - Haritadaki 3 NPC garnizonunun (`Karakurum Garnizonu`, `Demirboynuz Obası`, `Kuzey Akıncı Kampı`) savaş sonunda gerçekten hasar almaması, ele geçirilememesi ve fethedildiğinde oyuncuya vergi/haraç sağlamaması.
   - Savaş sonunda oyuncu birliklerinin canının anında `%100`'e sıfırlanması nedeniyle stratejik risk oluşmaması.
   - Mesafe/menzil kontrolü olmadan haritanın her yerinden saldırı yapılabilmesi.

3. **Göç (`MOVE_CAMP`) Kısıtlarının Eksikliği (`Faz S2`):**
   - Haritanın bir ucundan diğer ucuna mesafe sınırı ve erzak/at maliyeti olmadan ışınlanma (teleport) yapılabilmesi.

4. **Oba Geliştirme ve Altın (`Gold`) Kaynağının İşlevsizliği (`Faz S2`):**
   - Biriken `Altın (Gold)` ve `Keçe/Deri (Leather)` kaynaklarının harcanabileceği **Otağ Seviye Yükseltme (`Upgrade Otağ`)** ve **Kurultay / Toy Düzenleme (`Şölen` — Yaralı birlikleri iyileştirme ve moral doldurma)** mekaniklerinin bulunmaması.

5. **Taktiksel HUD ve Karo Denetçisi Eksikliği (`Faz S3`):**
   - Haritada tıklanan karonun arazi bonuslarını veya seçilen düşman garnizonunun savunma gücünü gösteren bir **Seçili Karo Bilgi Paneli (Tile Inspector)** olmaması.
   - Ordudaki birliklerin tip bazlı sayılarının (`Akıncı x2 | Alp x1 | Çeri x0 | Alpagut x1`) ve **Çatı Portala Dönüş (`← Yoruk Games`)** butonunun ekranda yer almaması.

---

## 2. Plan Klasörü İçindekiler (`planlar/`)

| Dosya Adı | Kapsam |
| :--- | :--- |
| [00_GENEL_INCELEME_VE_YOL_HARITASI.md](./00_GENEL_INCELEME_VE_YOL_HARITASI.md) | Genel durum tespiti, 5 darboğaz özeti ve faz sıralaması. |
| [01_FAZ_S1_ALTYAPI_PORT_VE_DOCKER_DUZENI.md](./01_FAZ_S1_ALTYAPI_PORT_VE_DOCKER_DUZENI.md) | Port (`3001`/`8081`), Nginx `/ws` proxy, Docker SDK izolasyonu ve `deploy.sh`. |
| [02_FAZ_S2_STRATEJI_FETIH_VE_EKONOMI_DONGUSU.md](./02_FAZ_S2_STRATEJI_FETIH_VE_EKONOMI_DONGUSU.md) | Garnizon fethi, haraç üretimi, menzilli göç, Otağ yükseltme ve Toy sistemi. |
| [03_FAZ_S3_TAKTIKSEL_HUD_VE_KARO_DENETCISI.md](./03_FAZ_S3_TAKTIKSEL_HUD_VE_KARO_DENETCISI.md) | Karo/Hedef bilgi paneli, detaylı ordu dökümü ve Çatı Portala dönüş butonu. |
