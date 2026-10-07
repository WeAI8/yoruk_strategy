# YORUK STRATEGY — AGENT & DEVELOPER CONSTITUTION (YGS-v1)

================================================================================
# 1. BAĞLAM VE TEMEL KURALLAR (IRON RULES)
================================================================================
Bu repository "Yoruk Games" bağımsız oyun stüdyosunun ilk amiral gemisi strateji oyunudur.
Bu projede çalışan her yapay zeka ajanı (AI Agent) veya geliştirici şu kurallara sorgusuz sualsiz uymak zorundadır:

1. **PLATFORM İZOLASYONU (KIRILMAZ KURAL):**
   - Bu proje Yoruk Games ana platformundan (`d:\antigravity-projects\yoruk_games`) tamamen bağımsızdır.
   - Platformun veritabanına, Spring Boot kodlarına veya dahili servislerine ASLA doğrudan erişilemez.
   - Kimlik ve oyuncu doğrulama YALNIZCA `@yorukgames/game-sdk` kütüphanesi ve platformun `/api/v1/auth/exchange-ticket` uç noktası üzerinden yürütülür.

2. **3 KATMANLI MİMARİ (TRINITY PATTERN):**
   - `packages/core/`: Saf TypeScript simülasyon ve formül kütüphanesi (DOM/Canvas yasaktır).
   - `server/`: 100ms Fixed-Tick otoriter sunucu. Tek gerçek kaynaktır (Source of Truth).
   - `client/`: Yalnızca görselleştirme ve girdi katmanıdır.

3. **SİMÜLASYON ÖNCELİĞİ (NO-CODE-BEFORE-MATH):**
   - Bir mekanik (ekonomi, oba göçü, Turan taktiği) önce `packages/core` altında saf matematiksel olarak kodlanmalı ve `npm test` ile %100 test edilmiş olmalıdır.
   - Testleri olmayan hiçbir mekanik `client/` veya `server/` katmanına aktarılamaz.

4. **OTORİTER SUNUCU & SIFIR İSTEMCİ GÜVENİ:**
   - İstemciye (client) asla güvenilmez.
   - İstemci yalnızca kullanıcı niyetlerini (`INPUT_COMMAND`) sunucuya gönderir.
   - Kaynaklar, birim sağlıkları, hasar ve konum onayları sunucu tarafından doğrulanır.

5. **PERFORMANS & ASSET BÜTÇESİ:**
   - WebGL draw call sayısı 25'i geçemez.
   - Sabit 60 FPS hedeflenir. Bellek sızıntıları kesinlikle kabul edilmez.
   - Görsel varlıklar mutlaka 2048x2048 Sprite Atlas formatında paketlenir.
