# FAZ S2: ÇEKİRDEK STRATEJİ, GARNİZON FETHİ VE EKONOMİ DÖNGÜSÜ

> **Faz Kodu:** `FAZ-S2`
> **Öncelik:** Yüksek (Oynanış Derinliği)
> **Hedef Katmanlar:** `packages/core/src/`, `server/src/state/gameState.ts`, `server/src/index.ts`

---

## 1. Sorun Tanımı
Mevcut oyunda oyuncu birlik eğitebilmekte, göç edebilmekte ve Turan Taktiği savaşı başlatabilmektedir; ancak eylemlerin kalıcı stratejik sonuçları eksiktir:
1. **Garnizonlar Ele Geçirilemiyor:** Haritadaki 3 garnizon (`Karakurum`, `Demirboynuz`, `Kuzey Akıncı`) yenilse dahi haritada düşman olarak kalmakta ve oyuncuya kalıcı bir avantaj sağlamamaktadır.
2. **Savaşta Risk / Kayıp Yok:** Savaş biter bitmez oyuncunun tüm birliklerinin canı `%100`'e (`unit.currentHp = unit.maxHp`) eşitlenmektedir.
3. **Göç Menzili ve Maliyeti Yok:** Oyuncu haritanın bir ucundan diğer ucuna bedelsiz ışınlanabilmektedir.
4. **Altın (`Gold`) Kaynağı Harcanamıyor:** Oyuncunun biriktirdiği Altın kaynağı hiçbir eğitim veya geliştirme aksiyonunda kullanılmamaktadır.

---

## 2. Teknik Uygulama Adımları

### Adım 2.1: Garnizon Kuşatma, Fetih ve Haraç (Tribute) Sistemi
- `NpcGarrison` arayüzüne `conqueredBy?: string` (Fetheden oyuncu ID), `conqueredByName?: string` ve `defenseLevel: number` alanları eklenir.
- Oyuncu bir garnizonu `"⚔️ TURAN"` ile mağlup ettiğinde:
  - Garnizon oyuncunun hakimiyetine geçer (`conqueredBy = userId`).
  - Fethedilen her garnizon, her ekonomi döngüsünde (`advanceTick`) oyuncunun obasına **Haraç Bonus Üretimi (`+5 Altın, +4 Demir, +6 Erzak`)** sağlar.
  - Tüm 3 garnizon fethedildiğinde oyuncu **"Bozkırın Ulu Kağanı"** unvanını kazanır ve genel savaş günlüğünde zafer ilan edilir.

### Adım 2.2: Gerçekçi Savaş Hasarı ve Menzil Kuralı
- Turan savaşı başlatmak için seçilen hedef garnizonun oyuncu obasına **en fazla 10 karo (`Manhattan/Euclidean <= 10`)** mesafede olması şartı getirilir; uzaktaysa oyuncuya *"Hedef garnizon çok uzakta! Önce obanızı hedefe yaklaştırın"* uyarısı döner.
- Savaş sonrasında oyuncu birliklerinin canı otomatik `%100` yapılmaz; savaşta aldıkları hasar kalıcı olur (ölen birimler ordudan düşer, kalanlar ganimet ve `+25 XP` kazanır).

### Adım 2.3: Menzilli ve Maliyetli Göç (`MOVE_CAMP`)
- Göç mesafesi tek seferde **en fazla 6 karo** ile sınırlandırılır.
- Her göç eylemi **15 Erzak (`food`) ve 5 At (`horse`)** iaşe bedeli gerektirir.

### Adım 2.4: Otağ Seviye Yükseltme (`UPGRADE_CAMP`) ve Toy / Şölen (`HOLD_FEAST`)
Altın (`Gold`) ve Keçe/Deri (`Leather`) kaynaklarını stratejik döngüye bağlayan 2 yeni sunucu komutu eklenir:
1. **`UPGRADE_CAMP` (Otağ Yükselt):**
   - Maliyet: `50 Altın + 30 Keçe/Deri + 20 Demir` (Seviye başına çarpanlı).
   - Etkisi: Otağ seviyesini (`campLevel: 1 -> 5`), oba nüfusunu (`+40`), çadır sayısını (`+5`) ve otlak verimini (`+0.25`) kalıcı olarak artırır.
2. **`HOLD_FEAST` (Toy / Şölen Düzenle):**
   - Maliyet: `30 Altın + 25 Erzak`.
   - Etkisi: Ordudaki tüm yaralı birliklerin canını `%100`'e tamamlar ve ordu moralini `100` yapar.

---

## 3. Kabul Kriterleri (DoD)
- [x] Garnizon fethedildiğinde `otherCamps` listesinde `conqueredBy` bilgisi istemciye dönmeli ve her tick haraç geliri eklenmeli.
- [x] `UPGRADE_CAMP` ve `HOLD_FEAST` komutları için `server/tests/server.test.ts` içinde birim testleri yazılıp `npm test` %100 geçmeli.
