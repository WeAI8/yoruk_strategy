# YORUK STRATEGY — PLAN BÖLÜM 7: FAZ S1, S2, S3 ALTYAPI VE STRATEJİ DERİNLİĞİ EMİRLERİ
# (PHASE S1-S2-S3 INFRASTRUCTURE, CONQUEST LOOP & TACTICAL HUD DIRECTIVES)

================================================================================
1. AMAÇ VE KAPSAM
================================================================================
Bu doküman, Kurucu onayıyla `yoruk_strategy` (`Turan Tactics`) oyununu teknik demo görünümünden çıkarıp tam entegre, kendi kendine yeten Docker/Nginx mimarisine ve derin bir Bozkır Fetih & Oba Yönetim döngüsüne kavuşturmak için yayımlanmış bağlayıcı emirleri içerir.

================================================================================
2. FAZ S1: ALTYAPI, PORT (3001), WEBSOCKET PROXY & DOCKER İZOLASYONU
================================================================================
1. **Dahili `@yorukgames/game-sdk` Workspace Paketi (`packages/game-sdk`):**
   - `client/Dockerfile` derlemesinin üst dizine (`../../yoruk_games`) ihtiyaç duymadan bağımsız çalışabilmesi için `packages/game-sdk` altında `@yorukgames/game-sdk` paketi (`R-YG-02` uyumlu) konumlandırılacaktır.
   - `client/Dockerfile` içinde `packages/game-sdk` kopyalanacak ve `npm run build --workspace=@yorukgames/game-sdk` çalıştırılacaktır.
2. **Nginx WebSocket Reverse Proxy (`client/nginx.conf`):**
   - `/ws` yolu `http://game-server:8081` adresine WebSocket Upgrade başlıklarıyla yönlendirilecektir.
   - `/health` yolu `http://game-server:8081/health` adresine yönlendirilecektir.
3. **Dinamik WebSocket Adresi (`client/src/net/networkManager.ts`):**
   - Sabit `ws://localhost:8081/ws` yerine; yerel geliştirme portlarında (`3001`, `5173`) `ws://<hostname>:8081/ws`, üretim/Nginx ortamında ise `ws(s)://<host>/ws` adresini otomatik çözen `resolveDefaultWsUrl()` fonksiyonu kullanılacaktır.
4. **Docker Compose & Tek Komutluk Dağıtım (`docker-compose.yml` & `deploy.sh`):**
   - `yoruk_strategy` servisleri hem kendi izole ağında (`yoruk_strategy_net`) hem de çatı platformun ortak ağında (`yoruk-net`) haberleşebilecek şekilde yapılandırılacaktır.
   - Kökte `deploy.sh` ve `.env.example` dosyaları hazırlanacaktır.

================================================================================
3. FAZ S2: ÇEKİRDEK STRATEJİ, GARNİZON FETHİ, OTAĞ SEVİYESİ VE TOY DÖNGÜSÜ
================================================================================
1. **`@yorukstrategy/core` Genişletmeleri (`packages/core/src/economy/production.ts`):**
   - `CampState` içerisine `otagLevel?: number` (varsayılan `1`, maks `5`) ve `conqueredGarrisons?: number` (varsayılan `0`) eklenecektir.
   - Otağ seviyesi her kademede temel üretimi `%15` artıracaktır.
   - Fethedilen her garnizon oyuncuya her ekonomi döngüsünde `+5 Altın` ve `+4 Erzak (Food)` haraç kazandıracaktır.
   - Otağ yükseltme (`UPGRADE_OTAG_BASE_COST`) ve Toy/Şölen düzenleme (`FEAST_TOY_COST`) maliyet/uygulama fonksiyonları eklenecektir.
2. **`@yorukstrategy/server` Fetih, Menzilli Göç ve Toy Mekanikleri (`server/src/state/gameState.ts`):**
   - **Garnizon Fethi:** `executeTuranBattle` sonucunda oyuncu galip gelirse hedef NPC garnizonu `conqueredBy = userId` olarak işaretlenecek ve oyuncunun `camp.conqueredGarrisons` sayacı güncellenecektir.
   - **Kalıcı Savaş Yorgunluğu:** Savaş sonunda yaralı birimlerin canı otomatik `%100` yapılmayacak; savaş sonrası hayatta kalan birimler mevcut canlarıyla dönecektir.
   - **Kurultay Toyu (`holdFeast`):** Oyuncu `35 Altın` ve `30 Aş` harcayarak ordudaki tüm yaralı birliklerin canını `%100`'e tamamlayacak ve ordu moralini `100` yapacaktır.
   - **Otağ Yükseltme (`upgradeOtag`):** Oyuncu Altın, Keçe ve Demir harcayarak Otağ seviyesini artıracak, çadır (`+5`) ve nüfus (`+30`) kapasitesini büyütecektir.
   - **Menzilli Göç (`moveCamp`):** Göç mesafesi en fazla `8` karo (`MAX_MIGRATION_DISTANCE = 8`) ile sınırlandırılacak ve göç başına `15 Aş` + `2 At` iaşe maliyeti kesilecektir.

================================================================================
4. FAZ S3: TAKTİKSEL HUD, KARO DENETÇİSİ VE PORTALA DÖNÜŞ (`client/`)
================================================================================
1. **Seçili Karo ve Garnizon Denetçisi (Tile Inspector):**
   - Haritada bir karoya tıklandığında karonun arazi bonusları, göç mesafesi ve üzerindeki garnizon/oba durumu sol alt bilgi kartında gösterilecektir.
2. **Detaylı Ordu Dökümü ve Otağ Seviyesi:**
   - Sol üst Oba Künyesinde `Otağ Sv. X`, `Fetih: Y/3` ve `Akıncı / Alp / Çeri / Alpagut` sayıları ayrı ayrı yazılacaktır.
3. **Yeni Komut Butonları ve Portala Dönüş:**
   - Alt barda `⬆️ Otağ Yükselt` ve `🍖 Toy Düzenle` butonları yer alacaktır.
   - Sol üstte `← Yoruk Games Portalı` dönüş bağlantısı bulunacaktır.
4. **Sıfır Emoji Kuralı (`R-YG-05`):**
   - `client/src/render/isometricEngine.ts` içinde kesinlikle Unicode emoji kullanılmayacak; fethedilen garnizonlar oyuncunun sancağıyla (`isConquered`) vektörel olarak çizilecektir.
