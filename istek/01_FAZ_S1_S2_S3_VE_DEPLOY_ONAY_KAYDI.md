# İSTEK #01: FAZ S1, FAZ S2, FAZ S3 UYGULAMASI VE TEK KOMUTLUK DEPLOY ONAYI

- **Tarih:** 2026-10-14
- **Talep Eden:** Kurucu (Product Owner)
- **Durum:** TAMAMLANDI (`[PASS] 6/6 Studio Guardian Audit` & `22/22 Unit Tests`)

---

## 1. Kurucu İsteği
> *"Planda yer alan 3 fazın tamamını (Faz S1 → Faz S2 → Faz S3) sırasıyla devreye almamızı ve yoruk_strategy için de tek komutluk deploy.sh + GitHub senkronizasyonu hazırlamamızı onaylıyor musunuz? bu şekilde bana talep edilen soruyu onaylıyorum."*

---

## 2. Tamamlanan Teslimatlar (Devlog / Changelog Özeti)

### A. Faz S1 — Altyapı, Port (`3001`), WebSocket Proxy & Docker İzolasyonu
- `yoruk_games` (`DataInitializer.java` ve `frontend/src/lib/api.ts`) üzerinde `turan-tactics` başlatma adresi `http://localhost:3001` olarak eşitlendi.
- `yoruk_strategy/packages/game-sdk` altında `@yorukgames/game-sdk` dahili workspace paketi oluşturularak `client/Dockerfile` derlemesinin üst klasöre (`../../yoruk_games`) bağımlılığı ortadan kaldırıldı.
- `client/nginx.conf` içine `/ws` WebSocket reverse-proxy ve `/health` yönlendirmesi eklendi; `networkManager.ts` içine `resolveDefaultWsUrl()` dinamik WebSocket çözümlemesi eklendi.
- `yoruk_strategy/docker-compose.yml`, `.env.example` ve tek komutluk `deploy.sh` hazırlandı.

### B. Faz S2 — Çekirdek Strateji, Garnizon Fethi, Otağ Seviyesi & Toy Döngüsü
- `@yorukstrategy/core` (`production.ts`) içerisine Otağ Seviyesi (`upgradeOtagState` — `50 Altın, 30 Keçe, 20 Demir` maliyetle `+40 Nüfus, +5 Çadır, +0.25 Otlak Kalitesi`), Kurultay Toyu (`holdFeastState` — `30 Altın, 25 Aş` ile yaralı askerlerin `%100` iyileştirilmesi ve `100` moral) ve Fetih Haracı (`+5 Altın, +4 Demir, +6 Aş` / garnizon) eklendi.
- `server/src/state/gameState.ts` üzerinde 3 Rakip Garnizonun (`Karakurum`, `Demirboynuz`, `Kuzey Akıncı`) Turan Taktiği zaferiyle kalıcı olarak fethedilmesi (`conqueredBy`), savaş yorgunluğunun korunması, menzilli/iaşeli göç (`MAX_MIGRATION_DISTANCE = 14`, `10 Aş + 1 At`) ve `UPGRADE_OTAG` / `HOLD_FEAST` WebSocket komutları devreye alındı.

### C. Faz S3 — Taktiksel HUD, Karo Denetçisi, Ordu Dökümü & Portala Dönüş
- `client/index.html` ve `client/src/ui/hud.ts` üzerinde:
  * Sol üstte `← Yoruk Games Portalına Dön` bağlantısı, `Otağ Sv. X/5 | Fetih: Y/3 Garnizon` rozeti, 3 garnizon fethedildiğinde `Bozkırın Ulu Kağanı` unvanı ve `Akıncı / Alp / Çeri / Alpagut` detaylı birlik dökümü,
  * Sol altta tıklanan karonun arazi bonuslarını, göç mesafesini ve garnizon durumunu gösteren **Seçili Karo & Garnizon Denetçisi (`#tileInspector`)**,
  * Alt kontrol panelinde `⬆️ Otağ Yükselt` ve `🍖 Toy Düzenle` butonları,
  * `isometricEngine.ts` içinde fethedilen garnizonların Göktürk mavisi/altın sancakla (`isConquered`) vektörel çizimi tamamlandı.
