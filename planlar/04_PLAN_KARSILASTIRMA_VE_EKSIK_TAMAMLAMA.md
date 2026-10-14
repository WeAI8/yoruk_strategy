# PLAN KARŞILAŞTIRMA ANALİZİ VE EKSİK TAMAMLAMA RAPORU

> **Tarih:** 2026-10-14
> **Kapsam:** `plan/01..07` ve `planlar/00..03` dokümanları ile mevcut kod tabanının birebir denetimi ve farkların giderilmesi.
> **Durum:** `TAMAMLANDI` (`23/23 Unit Tests PASS` & `6/6 Guardian Audit PASS`)

---

## 1. Tespit Edilen ve Giderilen 6 Fark / Eksiklik

1. **Garnizon `defenseLevel` Alanı, Saldırı Menzili (`<= 10 Karo`) ve Kalıcı Savaş Hasarı (`server/src/state/gameState.ts`):**
   - `NpcGarrison` arayüzüne `defenseLevel: number` (`1`, `2`, `3`) eklendi ve `getSnapshotForPlayer` çıktısına dahil edildi.
   - `MAX_ATTACK_DISTANCE = 10` kuralı devreye alındı; oyuncu obasına 10 karodan uzak garnizonlara doğrudan saldırı engellendi ve önce göç etme zorunluluğu getirildi.
   - Savaş öncesinde yaralı birimlerin canını otomatik `%65`'e çıkaran kod kaldırıldı; savaş hasarı kalıcı hale getirilerek `Toy Düzenle` (`HOLD_FEAST`) mekaniğinin stratejik rolü güçlendirildi.
   - 3 garnizonun tamamı fethedildiğinde `isGreatKhaganVictory: true` ile **"Bozkırın Ulu Kağanı"** zafer ilanı eklendi.

2. **Karo Denetçisi (`#tileInspector`) Savunma Gücü ve Saldırı Menzili Gösterimi (`client/src/ui/hud.ts`):**
   - Haritada bir karoya tıklandığında garnizonun savunma seviyesi (`Sv.X`), muhafız birliği sayısı ve oyuncunun obasına olan mesafesi (`Saldırı Menzilinde` / `Menzil Dışı (>10 Karo)`) gösterilecek şekilde güncellendi.

3. **Fethedilen Garnizonlarda Göktürk Mavisi (`#00e5ff`) ve Altın (`#d4af37`) Sancak (`client/src/render/isometricEngine.ts`):**
   - `drawOtag` metodunda fethedilen garnizonların kubbe çerçevesi `#d4af37` (Altın) ve sancağı `#00e5ff` (Göktürk Mavisi) olarak güncellendi.

4. **Otağ Yükseltme ve Ulu Kağan Bildirim Metinleri (`client/src/net/networkManager.ts`):**
   - `UPGRADE_OTAG_RESULT` mesajındaki nüfus artışı `production.ts` ile birebir uyumlu olacak şekilde `+40 Oba Nüfusu, +0.25 Otlak Verimi, +%15 Üretim` olarak düzeltildi.
   - `BATTLE_RESULT` mesajında menzil dışı uyarı mesajları ve 3 garnizon fethedildiğinde `BOZKIRIN ULU KAĞANI İLAN EDİLDİ!` bildirimi eklendi.

5. **SDK Sözleşmesi Metot Uyumu (`packages/game-sdk/src/index.ts`):**
   - `plan/02_PLATFORM_SSO_AND_SDK_CONTRACT.md` içindeki `extractTicketFromUrl()` instance/statik metodu ve `platformUrl` / `autoExchange` opsiyonları eklendi.

6. **Docker Compose Port Eşlemeleri (`docker-compose.yml`):**
   - `plan/03_CONTAINER_AND_INFRASTRUCTURE.md` port haritasına uygun olarak `game-db` (`127.0.0.1:5433:5432`) ve `game-redis` (`127.0.0.1:6380:6379`) port tanımları eklendi.
