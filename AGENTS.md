# YORUK STRATEGY — LOCAL AGENT & ARCHITECTURE CONSTITUTION (YGS/GDP-v1)

================================================================================
# 1. YÖNETİM, ROLLER VE DELEGASYON
================================================================================
Bu repository "Yoruk Games" bağımsız oyun stüdyosunun ilk amiral gemisi strateji oyunudur.

```
┌──────────────────────────────────────────────┐
│            YORUK GAMES MAIN AGENT            │
│         (Çatı Platform Baş Mimarı)           │
│  - Yalnızca /plan Dizinine Müdahale Eder     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼ (/plan Yönergeleri ile)
┌──────────────────────────────────────────────┐
│           STRATEGY TEAM LEAD AGENT           │
│         (Bu Projenin Tekil Yetkilisi)        │
│  - packages/core (Simülasyon & Matematik)    │
│  - server/ (100ms Otoriter Sunucu)           │
│  - client/ (İzometrik Görsel İstemci)        │
└──────────────────────────────────────────────┘
```

1. **PROJE LİDERİ:** 
   - Bu projedeki tüm teknik kararlar, mimari yönetim ve kodlama **Oyun Takım Lideri Ajanı (`strategy_team_lead`)** tarafından yürütülür.
   - Main Agent bu projenin iç kodlarına doğrudan müdahale etmez; sınırları `plan/` altında çizer ve ilerlemeyi denetler.

2. **BAĞLAYICI PLANLAMA DOKÜMANLARI:**
   Geliştirme ekibi `plan/` altındaki şu 5 sözleşmeyi kanun kabul eder:
   - `plan/01_STUDIO_BOUNDARIES_AND_QUALITY.md`: Stüdyo sınırları ve kalite standartları.
   - `plan/02_PLATFORM_SSO_AND_SDK_CONTRACT.md`: `@yorukgames/game-sdk` ve bilet takas protokolü.
   - `plan/03_CONTAINER_AND_INFRASTRUCTURE.md`: Docker Compose ve port haritası.
   - `plan/04_GAME_SPECIFICATION_GDD.md`: Oyun tasarım şartnamesi, kaynaklar ve savaş formülleri.
   - `plan/05_TEAM_LEAD_DIRECTIVES.md`: Aşamalı iş listesi ve teslim kriterleri.

================================================================================
2. 5 KIRILMAZ KURAL
================================================================================
1. **Platform İzolasyonu:** Ana platform (`yoruk_games`) veritabanına veya koduna doğrudan dokunulamaz.
2. **Sıfır Bağımsız Giriş:** Kayıt/Giriş ekranı yapılamaz; sadece platformdan gelen SSO biletleri (`?ticket=tkt_...`) kabul edilir.
3. **Trinity Katmanı:** `packages/core/` (Simülasyon), `server/` (Sunucu), `client/` (Görsel) ayrımı zorunludur.
4. **No-Code-Before-Math:** Formüller ve unit testler (`npm test`) bitmeden görsel arayüz yazılamaz.
5. **Dandik İş Çıkarma Yasağı:** 60 FPS, WebGL batching, zengin izometrik derinlik ve derin oyun mekanikleri esastır.
