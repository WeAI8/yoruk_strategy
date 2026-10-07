# YORUK STRATEGY — PLAN BÖLÜM 4: OYUN TASARIM ŞARTNAMESİ (GDD)
# (GAME DESIGN SPECIFICATION)

================================================================================
1. VİZYON VE TÜR
================================================================================
- **Oyun Adı:** Yoruk Strategy: Kadim Bozkır
- **Tür:** Tarihsel & Taktiksel Bozkır Stratejisi (Nomadic 4X / Tactical Strategy)
- **Tema:** Kadim bozkır kültürü, otağ yönetimi, yaylak-kışlak mevsimsel göçü ve Turan taktiği meydan muharebeleri.

================================================================================
2. 5 TEMEL KAYNAK VE FORMÜLLERİ
================================================================================
1. **At (Tulpar Soyu):** Süvari birlikleri, göç hızı ve keşif için birincil güç.
2. **Tahıl & Et:** Oba nüfusunun beslenmesi ve ordunun iaşesi. Kıtlıkta ordu dağılır.
3. **Demir:** Kılıç, zırh, üzengi ve ok uçları üretimi.
4. **Keçe & Deri:** Otağ ve çadır inşası, kalkan ve yay imalatı.
5. **Altın:** Kurultay kararları, boylar arası diplomasi ve ticaret.

### Mevsim Katsayıları:
- **Bahar:** At üremesi \(1.15\times\), otlak kalitesi \(1.20\times\).
- **Yaz:** At üremesi \(1.30\times\), otlak kalitesi \(1.50\times\), nüfus artış potansiyeli.
- **Güz:** Hasat toplama, kışlağa göç hazırlığı, tüketim \(1.10\times\).
- **Kış:** At üremesi \(0.60\times\), otlak kalitesi \(0.30\times\), tüketim \(1.40\times\), kışlakta olmayan obalara %15 donma zayiatı.

================================================================================
3. ASKERİ BİRLİKLER & TURAN TAKTİĞİ MATRİSİ
================================================================================
1. **Akıncı (Atlı Okçu):** Can: 60, Saldırı: 35, Zırh: 12, Menzil: 4, Hız: 8. Vur-kaç ve Parthian shot ustası.
2. **Alp (Bozkır Kargıcısı):** Can: 100, Saldırı: 48, Zırh: 28, Menzil: 1, Hız: 7. Zırh delici hücum gücü.
3. **Piyade Çeri:** Can: 80, Saldırı: 25, Zırh: 20, Menzil: 1, Hız: 4. Oba savunması ve tuzakçı.
4. **Alpagut (Muhafız):** Can: 140, Saldırı: 55, Zırh: 40, Menzil: 1, Hız: 6. Yüksek moral aurası.

### Turan Taktiği (Sahte Ricat):
- Merkez birlikleri kontrollü geri çekilme taklidi yapar.
- Düşman düzeni bozup peşlerinden geldiğinde; kanatlardaki gizli süvariler hilali kapatır (\(2.5\times\) hasar çarpanı, düşmanda moral çöküşü).
