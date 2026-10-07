# YORUK STRATEGY — PLAN BÖLÜM 2: PLATFORM SSO & SDK ENTEGRASYON SÖZLEŞMESİ
# (PLATFORM SSO & SDK INTEGRATION CONTRACT)

================================================================================
1. MERKEZİ KİMLİK & SIFIR BAĞIMSIZ GİRİŞ KURALI (ZERO-LOGIN RULE)
================================================================================
- Bu oyunda **bağımsız bir kullanıcı kayıt (`/register`) veya giriş (`/login`) ekranı KESİNLİKLE OLAMAZ**.
- Oyun, Yoruk Games çatı platformunun oyuncu havuzunu ve merkezi kimlik altyapısını kullanır.
- Oyuncunun oyuna giriş akışı:
  ```
  [Oyuncu] -> Yoruk Games Portal (Dashboard) -> "Oyunu Başlat" Butonu
           -> URL: https://play.yorukgames.com/?ticket=tkt_8a9f4c2...
           -> Oyun İstemcisi SDK ile bileti okur
           -> Oyun Sunucusu bileti platformda takas eder (/exchange-ticket)
           -> Oturum Açılır ve Oyuncu Bozkır Haritasına Yerleşir!
  ```

================================================================================
2. İSTEMCİDE `@yorukgames/game-sdk` TÜKETİMİ
================================================================================
Oyun istemcisi (`client/`), ana platformun ürettiği ve derlediği `@yorukgames/game-sdk` kütüphanesini kullanır:

```typescript
import { YorukGameClient } from '@yorukgames/game-sdk';

const client = new YorukGameClient({
  platformUrl: process.env.VITE_PLATFORM_API_URL || 'http://localhost:8080',
  autoExchange: false, // Bilet sunucu üzerinden takas edilecek (daha güvenli)
});

// URL'den bileti otomatik ayıkla
const ticket = client.extractTicketFromUrl();
if (!ticket) {
  // Bilet yoksa oyuncuyu platform girişine yönlendir
  window.location.href = 'https://yorukgames.com/login?redirect=play';
}

// Bileti oyun sunucusuna WebSocket açarken ilet
const socket = new WebSocket(`wss://game.yorukgames.com/ws?ticket=${ticket}`);
```

================================================================================
3. OYUN SUNUCUSU BİLET TAKASI (`/api/v1/auth/exchange-ticket`)
================================================================================
Oyun sunucusu (`server/`), oyuncudan gelen bileti doğrudan Yoruk Games REST API'sine sorarak kimliği doğrular:

- **Endpoint:** `POST /api/v1/auth/exchange-ticket`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "ticket": "tkt_8a9f4c2e-9d21-4f11-...",
    "clientId": "game-client-strategy-01",
    "clientSecret": "yoruk_strategy_secret_key"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "username": "kursat_kagan",
    "email": "oyuncu@yorukgames.com",
    "roles": ["ROLE_USER"]
  }
  ```
- **Hata Durumu:** Bilet 60 saniyeden eskiyse, daha önce kullanılmışsa veya geçersizse `401 Unauthorized` döner. Oyun sunucusu WebSocket bağlantısını derhal kapatmalıdır (`code: 4001, reason: Unauthorized Ticket`).
