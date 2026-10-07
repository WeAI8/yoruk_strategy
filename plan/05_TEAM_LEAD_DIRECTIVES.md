# YORUK STRATEGY — PLAN BÖLÜM 5: TAKIM LİDERİ İŞ EMİRLERİ & YOL HARİTASI
# (TEAM LEAD DIRECTIVES & ROADMAP)

================================================================================
1. TAKIM LİDERİ'NİN (TEAM LEAD AGENT) GÖREV TANIMI
================================================================================
Sen `yoruk_strategy` projesinin **Baş Oyun Mimarı ve Takım Lideri'sin (Lead Game Architect)**.
Main Agent'ın sana bu `/plan/` klasöründe tebliğ ettiği standartlara, kalite kurallarına ve platform sözleşmesine sadık kalarak, kendi alt ekibini yönetecek ve projeyi inşa edeceksin.

Main Agent bu projenin kodlarına müdahale etmeyecektir; sen periyodik olarak durum raporu sunacaksın.

================================================================================
2. AŞAMALI İŞ LİSTESİ (EXECUTION ROADMAP)
================================================================================

### GÖREV 1: ÇALIŞMA ALANI & TRINITY İSKELETİ KURULUMU
- Root `package.json` workspace (`packages/*`, `server`, `client`) tanımını oluştur.
- `packages/core` modülünü başlat (`@yorukstrategy/core`).

### GÖREV 2: SİMÜLASYON MOTORU & %100 BİRİM TESTLERİ (NO-CODE-BEFORE-MATH)
- `/plan/04_GAME_SPECIFICATION_GDD.md` dosyasındaki matematiksel modelleri `packages/core/src/` altında kodla:
  - `src/types/resources.ts` ve `src/types/units.ts`
  - `src/economy/production.ts`
  - `src/combat/turan.ts`
- Birim testleri yaz (`tests/economy.test.ts`, `tests/combat.test.ts`).
- Tüm testlerin `npm test` ile %100 geçtiğini kanıtla.

### GÖREV 3: 100ms OTORİTER OYUN SUNUCUSU (`server/`)
- Node.js / Colyseus veya WebSocket sunucusunu ayağa kaldır.
- `/plan/02_PLATFORM_SSO_AND_SDK_CONTRACT.md` belgesine göre Yoruk Games `/api/v1/auth/exchange-ticket` uç noktasını bağla.
- 100ms Fixed-Tick döngüsünü kur.

### GÖREV 4: İZOMETRİK GÖRSEL İSTEMCİ (`client/`)
- Vite + Phaser 3 / Pixi.js ile 2:1 İzometrik Elmas Grid motorunu kur.
- Y-Sort derinlik sıralamasını ve Savaş Sisi (Fog of War) shader'ını ekle.
- `@yorukgames/game-sdk` ile URL'deki bileti yakalayıp sunucuya bağlan.

### GÖREV 5: CONTAINER & DEVOPS TESTİ
- `/plan/03_CONTAINER_AND_INFRASTRUCTURE.md` içindeki `docker-compose.yml` tanımını test et.
- Tek komutla (`docker compose up -d`) ayağa kalktığını doğrula.

================================================================================
3. TESLİMAT VE KABUL TESTİ ÇAĞRISI PROTOKOLÜ (HANDOVER CALL)
================================================================================
- Takım Lideri Ajanı (`team_lead`), tüm görevleri tamamlayıp kendi iç testlerini bitirdiğinde Main Agent'a resmi teslim çağrısı yapar:
  **"Oyun bitti, test et."**
- Bu çağrı üzerine Main Agent devreye girerek:
  1. `@yorukgames/game-sdk` ve `/exchange-ticket` uçtan uca SSO bilet takas testini çalıştırır.
  2. İzometrik motorun 60 FPS akıcılığını, draw call limitlerini (<25) ve Y-sort derinlik sıralamasını inceler.
  3. `packages/core` matematik ve ekonomi birim testlerini (`npm test`) doğrular.
  4. `docker compose up -d` ile izole ayağa kalkış testini gerçekleştirir.
- Testler tam başarıyla sonuçlandığında Main Agent oyunu Kurucu onayına sunar ve ana vitrine (`yoruk_games/frontend/src/app/games`) canlı statüsünde kaydeder.

