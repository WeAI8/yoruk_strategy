# YORUK STRATEGY: KADİM BOZKIR
## Kapsamlı Oyun Tasarım Dokümanı (GDD - Game Design Document v1.0)

---

### 1. OYUN KİMLİĞİ VE VİZYON
- **Tür:** Tarihsel & Taktiksel Bozkır Stratejisi (Nomadic 4X / Tactical Strategy)
- **Tema:** Kadim Türk Bozkır Kültürü, Göktürk ve Hun Çağı, Göçebe Oba Yaşamı ve Turan Taktikleri.
- **Hedef:** "A-Sınıfı Bağımsız Oyun (Premium Indie)" kalitesinde; derin ekonomi, taktiksel savaş ve mevsimsel göç dinamikleri.

---

### 2. EKONOMİ VE 5 TEMEL KAYNAK FORMÜLLERİ

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BOZKIR KAYNAK DÖNGÜSÜ                           │
├──────────────┬──────────────────┬──────────────────────────────────────┤
│ Kaynak       │ Üretim Yolu      │ Stratejik Rolü                        │
├──────────────┼──────────────────┼──────────────────────────────────────┤
│ 1. At        │ Yılkı Sürüleri   │ Süvari eğitimi, göç hızı, keşif      │
│ 2. Tahıl/Et  │ Mera & Avcılık   │ Nüfus doyurma, ordu iaşesi           │
│ 3. Demir     │ Dağ Ocakları     │ Kılıç, zırh, üzengi, kargı imalatı   │
│ 4. Keçe/Deri │ Hayvancılık      │ Çadır (otağ), kalkan, yay yapımı     │
│ 5. Altın     │ Ticaret Kervanı  │ Boylar meclisi, rüşvet, diplomasi     │
└──────────────┴──────────────────┴──────────────────────────────────────┘
```

#### Kaynak Formülleri:
1. **At Üreme Katsayısı (\(R_{at}\)):**
   \[
   R_{at} = N_{at} \times (1 + M_{mevsim}) \times O_{otlak}
   \]
   - \(M_{yaz} = +0.25\) (Yaylakta bol otlak), \(M_{kis} = -0.40\) (Kışlakta sert kış açlığı).
2. **Nüfus & İaşe Tüketimi (\(C_{yeme}\)):**
   - Her çadır / asker tick başına temel yiyecek tüketir.
   - Yiyecek 0'a düşerse ordu isyan veya kaçış (desertion) riski yaşar.

---

### 3. MEVSİMLER VE GÖÇEBE OBA MEKANİĞİ

Bozkırda sabit kalmak ölüm demektir. Yıl 4 mevsimlik bir döngüde ilerler (her mevsim oyun içi 1000 tick):
- **Bahar (Ergenekon):** Karlar erir, yaylağa göç hazırlığı başlar, sürüler yavrular.
- **Yaz (Yaylak):** Sürülerin semirdiği, atlı akınlarının ve kurultay meclislerinin toplandığı en verimli dönem.
- **Güz (Hazan):** Kışlağa göç zamanı. Keçe çadırlar toplanır, hayvanlar kuytu vadilere sürülür.
- **Kış (Zemheri):** Dışarıda kalan birlikler donma hasarı (frostbite) alır. Odun ve et stokları hayatta kalmayı belirler.

---

### 4. TURAN TAKTİĞİ & SAVAŞ MATRİSİ

Savaşlar sadece sayı üstünlüğüne dayanmaz. Muharebe şu formüllerle çözülür:

#### Askeri Birlikler:
1. **Atlı Okçu (Akıncı):** Çok hızlı, menzilli vur-kaç, Parthian shot (geriye dönük ok atışı).
2. **Bozkır Kargıcısı (Alp):** Yüksek hücum (charge) gücü, zırhlı düşman hatlarını yarma.
3. **Piyade Çeri:** Oba savunması, tuzak kurma ve kalkan duvarı.
4. **Alpagut (Muhafız):** Kurultay ve Kağan koruması, yüksek moral aurası.

#### Turan Taktiği (Sahte Ricat):
- Oyuncu "Sahte Ricat" emri verdiğinde; merkez birlikleri düzensiz geri çekilme taklidi yapar.
- Düşman disiplinsiz hücuma kalkarsa; kanatlarda gizlenen süvariler hilali kapatır (\(2.5\times\) kuşatma hasarı çarpanı).
