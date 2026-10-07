# YORUK STRATEGY — PLAN BÖLÜM 1: STÜDYO SINIRLARI & KALİTE BEKLENTİLERİ
# (STUDIO BOUNDARIES & QUALITY STANDARDS)

================================================================================
1. ANA PROJE VE YÖNETİM SINIRLARI
================================================================================
Bu belge, Yoruk Games Main Agent'ı tarafından hazırlanmış ve bu projenin Takım Lideri Ajanı'na (`team_lead`) tebliğ edilmiş bağlayıcı sınır sözleşmesidir:

1. **Yönetim Ayrımı:** 
   - Main Agent, ana çatı platformunun (`yoruk_games`) baş mimarıdır.
   - Bu projenin (`yoruk_strategy`) kod yazımı, geliştirme liderliği ve alt ajan yönetimi tamamen **Oyun Takım Lideri Ajanı'na (`team_lead`)** aittir.
   - Main Agent bu projenin iç kodlarına doğrudan müdahale etmez; yalnızca bu `/plan/` klasörünü günceller ve son durum raporlarını inceler.
2. **Platform İzolasyonu:**
   - Oyun projesi, ana platformun (`yoruk_games`) veritabanına, dahili Spring Boot servislerine veya iç kodlarına KESİNLİKLE doğrudan erişemez.
   - İki sistem arasındaki TEK resmi köprü: `@yorukgames/game-sdk` ve `/api/v1/auth/exchange-ticket` uç noktasıdır.

================================================================================
2. STÜDYO KALİTE STANDARDI: "DANDİK İŞ ÇIKARMA YASAĞI"
================================================================================
Kurucunun (Product Owner) en temel direktifi: **Oyun kesinlikle basit, alelacele yapılmış, kalitesiz bir prototip ("dandik") olmayacaktır.**

### Kalite ve Performans Kriterleri:
1. **Görsel Standart:**
   - Rastgele piksel veya ham geometrik kutular yasaktır.
   - Özel tasarlanmış, akıcı, derinlik hissi olan 2:1 İzometrik Elmas Grid (veya Hexagonal) kullanılacaktır.
   - Y-Sort derinlik sıralamasıyla atların/çadırların birbirine binmesi engellenecektir.
   - Sprite varlıkları 2048x2048 Texture Atlas formatında optimize edilecektir.
2. **Performans Bütçesi:**
   - Standart tarayıcılarda sabit 60 FPS.
   - WebGL Draw Call sayısı ana oyun ekranında 25'i geçemez.
   - Bellek sızıntıları (Texture/Audio memory leak) kesinlikle yasaktır.
3. **Mekanik Derinlik:**
   - Yüzeysel bir tıklama oyunu (clicker) yapılmayacaktır.
   - At yetiştiriciliği, kımız, demir, tahıl lojistiği, mevsimsel yaylak-kışlak göç döngüsü ve Turan taktiği sahte ricat mekanikleri matematiksel olarak dengelenecektir.
4. **No-Code-Before-Math Disiplini:**
   - `packages/core/` simülasyon motoru kurulup matematik ve ekonomi unit testleri (`npm test`) %100 geçmeden görsel katmana geçilemez.
