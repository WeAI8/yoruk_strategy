# YORUK STRATEGY: KADİM BOZKIR
## Tarihsel & Derin Taktiksel Bozkır Stratejisi

Bu proje, **Yoruk Games** bağımsız stüdyosunun resmi **YGS-v1 Oyun Anayasası** standartlarına göre yapılandırılmış bağımsız (multi-repo) strateji oyunudur.

---

### MİMARİ VE KATMANLAR (THE TRINITY PATTERN)

1. **`packages/core/` (Simülasyon & Matematik Motoru):**
   - Saf TypeScript (0 Canvas / 0 DOM bağımlılığı).
   - Kaynak üretim/tüketim formülleri, yaylak-kışlak göç lojistiği.
   - Turan taktiği, sahte ricat, moral ve menzil hasar matrisleri.
   - CLI üzerinden çalışan %100 kapsayıcı Unit Testler (`npm test`).

2. **`server/` (100ms Otoriter Oyun Sunucusu):**
   - Node.js & Colyseus / WebSocket tabanlı durum yöneticisi.
   - Tek gerçek kaynak (Source of Truth) ve anti-cheat kontrol noktası.
   - `@yorukgames/game-sdk` ile Yoruk Games merkezi platformu üzerinden tek tıkla SSO bilet doğrulama.

3. **`client/` (2.5D İzometrik Görsel & İşitsel İstemci):**
   - Vite + TypeScript + Phaser 3 / Pixi.js.
   - 2:1 İzometrik Elmas Grid & Y-Sort derinlik sıralaması.
   - Dinamik Savaş Sisi (Fog of War) ve atmosferik ses motoru.

---

### ENTEGRASYON VE ÇALIŞTIRMA

- **Platform Köprüsü:** `https://play.yorukgames.com/?ticket=tkt_<UUID>`
- **Geliştirme Kuralı:** `packages/core` testleri bitmeden görsel katmanda kod yazılamaz (No-Code-Before-Math).
