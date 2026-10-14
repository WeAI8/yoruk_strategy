# FAZ S3: TAKTİKSEL HUD, KARO DENETÇİSİ VE PORTAL NAVİGASYONU

> **Faz Kodu:** `FAZ-S3`
> **Öncelik:** Yüksek (Görsel Geri Bildirim & Kullanılabilirlik)
> **Hedef Katmanlar:** `client/index.html`, `client/src/ui/hud.ts`, `client/src/main.ts`, `client/src/render/isometricEngine.ts`

---

## 1. Sorun Tanımı
1. Oyuncu haritada bir karoya veya garnizona tıkladığında, seçilen koordinatta ne olduğu, arazi bonusları veya garnizonun kime ait olduğu hakkında hiçbir görsel bilgi kartı açılmamaktadır.
2. Sol üstteki Oba Künyesinde sadece toplam birlik sayısı (`Ordu: 4 Birlik`) yazmakta; oyuncunun elinde kaç `Akıncı`, kaç `Alp`, kaç `Çeri`, kaç `Alpagut` olduğu ve Otağ Seviyesi görülmemektedir.
3. Alt aksiyon panelinde `Otağ Yükselt` ve `Toy Düzenle (İyileştir)` butonları eksiktir.
4. Oyuncunun tek tıkla ana stüdyo portalına (`yoruk_games`) dönebileceği bir üst navigasyon butonu bulunmamaktadır.

---

## 2. Teknik Uygulama Adımları

### Adım 3.1: Seçili Karo ve Hedef Bilgi Paneli (Tile & Target Inspector)
- Sol-alt köşeye (veya Oba Künyesinin altına) **Seçili Karo Denetçisi (`#tileInspector`)** paneli eklenir.
- Oyuncu haritada bir karoya tıkladığında:
  - **Koordinat ve Arazi Türü:** Örn. `(10, 6) — Yaylak Otlakları (+50% At Üremesi, +20% Otlak Verimi)` veya `Kışlak Vadisi (Kış Donma Koruması)`.
  - **Garnizon / Oba Durumu:** Eğer karoda veya yakınında bir garnizon varsa; adı (`Karakurum Garnizonu`), durumu (`Düşman Garnizonu` veya `Fethedildi — Sancağımız Altında`), savunma birliği sayısı ve oyuncunun obasına olan **Mesafesi (`Örn: 5 Karo — Saldırı Menzilinde`)** gösterilir.

### Adım 3.2: Detaylı Ordu Dökümü ve Otağ Seviyesi Gösterimi
- Sol üstteki Oba Künyesi (`#campInfo`) güncellenir:
  - `Otağ Seviyesi: Sv. 1 (Nüfus: 120)`
  - `Fethedilen Garnizon: 0 / 3`
  - `Ordu Dökümü: Akıncı: 1 | Alp: 1 | Çeri: 0 | Alpagut: 0`

### Adım 3.3: Yeni Aksiyon Butonları (`Otağ Yükselt` & `Toy Düzenle`)
- Alt kontrol paneline (`#bottomPanel`) Faz S2'deki yeni mekanikleri tetikleyen 2 buton eklenir:
  - **🏕️ Otağ Yükselt:** `50 Altın, 30 Keçe, 20 Demir`
  - **🍖 Toy Düzenle:** `30 Altın, 25 Aş (Orduyu İyileştir)`

### Adım 3.4: Fethedilen Garnizonların Haritada Gök-Mavi Sancakla Çizilmesi
- `isometricEngine.ts` içinde fethedilen garnizonların (`conqueredBy === self.userId`) çadır/otağ kubbesi ve sancağı düşman kızılı (`#dc2626`) yerine **Göktürk Mavisi / Altın (`#00e5ff` & `#d4af37`)** olarak render edilir.

### Adım 3.5: Çatı Portala Dönüş Butonu (`← Yoruk Games`)
- Üst barın soluna veya sağ üst köşeye, oyuncuyu `yoruk_games` ana portalına (`/dashboard` veya `/games/turan-tactics`) geri götüren şık bir **`← Portal'a Dön`** butonu eklenir.

---

## 3. Kabul Kriterleri (DoD)
- [x] Haritada herhangi bir karoya tıklandığında `#tileInspector` paneli anında arazi ve mesafe bilgisini göstermeli.
- [x] Fethedilen garnizonların rengi izometrik haritada mavi/altın sancağa dönüşmeli.
- [x] `npm run build` (`core`, `server`, `client`) 0 hata ile tamamlanmalı ve `yoruk_guardian_audit.py` denetiminden **6/6 PASS** almalı.
