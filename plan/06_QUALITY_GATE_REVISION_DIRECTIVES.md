# YORUK STRATEGY — PLAN BÖLÜM 6: KALİTE KAPISI REVİZYON EMİRLERİ
# (QUALITY GATE AUDIT & MANDATORY REVISION DIRECTIVES)

================================================================================
1. DENETİM SONUCU: REVİZYON GEREKLİ (QUALITY GATE REJECTION)
================================================================================
Yoruk Games Main Agent tarafından yapılan Kalite Kapısı (Rule 9) denetiminde `yoruk_strategy` projesinin aşağıdaki noktalarda `01_STUDIO_BOUNDARIES_AND_QUALITY.md` ("Dandik İş Çıkarma Yasağı") standartlarının altında kaldığı tespit edilmiştir:

1. **Emoji Birlik Çizimi Kusuru (`client/src/render/isometricEngine.ts`):**
   - Askeri birlikler (`AKINCI`, `ALP`, `CERI`, `ALPAGUT`) `🏹`, `🗡️`, `🛡️`, `👑` emojileriyle çizilmektedir. Emoji kullanımı kesinlikle yasaktır!
2. **Sahte "Turan Taktiği" Butonu (`client/src/main.ts` & `server/src/index.ts`):**
   - HUD üzerindeki "Turan Taktiği" butonuna basıldığında sunucuya hiçbir WebSocket mesajı gönderilmemekte, `packages/core/src/combat/turan.ts` içindeki `simulateBattle` fonksiyonu hiç çalıştırılmamaktadır.
3. **Haritada Yalnızlık Kusuru (`server/src/state/gameState.ts`):**
   - `getSnapshotForPlayer` sadece `self` döndürmekte; diğer oyuncuların obaları veya haritadaki rakip boy/garnizon kampları haritada görünmemektedir.
4. **Kamera Zoom ve Efekt Eksikliği:**
   - Fare tekerleği ile yakınlaştırma/uzaklaştırma (Zoom) yoktur. Arazi karoları (dağ, nehir, yaylak, kışlak) düz tek renk boyanmakta, savaş anında görsel efekt oluşmamaktadır.

================================================================================
2. ZORUNLU REVİZYON EMİRLERİ (TEAM LEAD EXECUTION DIRECTIVES)
================================================================================

### EMİR 1: GERÇEK TURAN TAKTİĞİ SAVAŞ SİMÜLASYONU VE RAKİP BOZKIR GARNİZONLARI (`server/`)
1. `server/src/state/gameState.ts`:
   - Harita oluşturulurken veya oyuncu bağlandığında stratejik koordinatlarda 3 adet **Rakip Boy Garnizonu (NPC Oba)** (`Karakurum Garnizonu`, `Demirboynuz Obası`, `Kuzey Akıncı Kampı`) oluşturulsun ve `otherCamps` listesinde istemciye gönderilsin.
   - `executeTuranBattle(userId: string, targetX?: number, targetY?: number)` metodu eklensin:
     * `packages/core` içindeki `simulateBattle(session.camp.army, enemySquad, true)` fonksiyonunu çağırarak gerçek **Turan Taktiği (Sahte Ricat + Pusu)** savaşını simüle etsin.
     * Zafer durumunda oyuncuya ganimet (`gold: +45`, `horse: +15`, `iron: +20`, `food: +30`) kazandırsın, sağ kalan birimlerin `experience` değerini artırsın, ordunun can/moral durumunu güncellesin ve `battleLogs` listesine kaydettiği sonucu döndürsün.
2. `server/src/index.ts`:
   - `EXECUTE_TURAN` WebSocket mesaj tipini dinlesin, `stateManager.executeTuranBattle(userId, message.x, message.y)` metodunu çalıştırsın ve istemciye `BATTLE_RESULT` mesajı (kazanan, tur sayısı, sahte ricat başarısı, pusu hasarı, kazanılan ganimet) göndersin.

### EMİR 2: İZOMETRİK MOTOR VE GÖRSEL KALİTE DEVRİMİ (`client/`)
1. `client/src/render/isometricEngine.ts`:
   - **Emoji kullanımını tamamen kaldır!**
   - Her birlik tipi için (`AKINCI`, `ALP`, `CERI`, `ALPAGUT`) özel izometrik savaşçı/atlı silüeti, kalkan/mızrak/yay çizimi, sancak flaması ve üst kısmında **Can Çubuğu (HP Bar)** çizilsin.
   - Arazi karolarına prosedürel detaylar eklensin:
     * `MOUNTAIN`: İzometrik 3B yükselti/piramit dağ tepesi ve karlı zirve çizimi.
     * `RIVER`: Animasyonlu su parıltısı akışı.
     * `SUMMER_PASTURE` & `STEPPE`: Rüzgarda sallanan bozkır ot/çiçek dokuları.
     * `WINTER_CAMP`: Korunaklı taş/ahşap kışlak tahkimatı.
   - **Fare Tekerleği Zoom (`wheel` event):** `0.6x` ile `1.8x` arasında akıcı kamera yakınlaştırma/uzaklaştırma.
   - **Savaş Görsel Efekti (`triggerBattleEffect`):** Turan taktiği tetiklendiğinde hedef koordinatta genişleyen altın/kızıl kılıç çarpışma halkası ve ok yağmuru animasyonu çizilsin.
2. `client/src/net/networkManager.ts` & `client/src/main.ts`:
   - `network.executeTuran(targetX, targetY)` metodu eklensin.
   - `BATTLE_RESULT` mesajı geldiğinde savaş sonucu (Sahte Ricat, Pusu Hasarı, Ganimet) HUD savaş günlüğüne detaylı olarak yazılsın ve `engine.triggerBattleEffect()` tetiklensin.
   - Haritadaki diğer oyuncu ve rakip garnizon obaları (`snapshot.otherCamps`) `entities` listesine eklenerek haritada kırmızı/rakip tuğlu otağlar olarak çizilsin.

### EMİR 3: DOĞRULAMA VE TESLİM
- Tüm değişikliklerden sonra `npm test` (hem `packages/core` hem `server` testleri) ve `npm run build` hatasız geçmelidir.
- Tamamlandığında Main Agent'a **"Oyun bitti, test et"** raporu sunulacaktır.
