# FAZ S1: ALTYAPI, PORT SENKRONİZASYONU VE DOCKER DAĞITIM DÜZENİ

> **Faz Kodu:** `FAZ-S1`
> **Öncelik:** Kritik (Öncül Faz)
> **Hedef Katmanlar:** `client/`, `server/`, `docker-compose.yml`, `deploy.sh` ve `yoruk_games` Katalog Kaydı

---

## 1. Sorun Tanımı
1. `yoruk_strategy/client/package.json` ve `docker-compose.yml` istemciyi **`3001`** portunda ayağa kaldırırken, `yoruk_games` (`DataInitializer.java` ve `frontend/src/lib/api.ts`) oyunu `http://localhost:5173` adresinde aramaktadır.
2. `client/src/net/networkManager.ts` içinde WebSocket adresi sabit `ws://localhost:8081/ws` olarak kodlanmıştır. Bu durum Nginx ters vekil (reverse proxy) veya uzak sunucu (`https://...`) arkasında bağlantının reddedilmesine sebep olur.
3. `client/package.json` içindeki `"@yorukgames/game-sdk": "file:../../yoruk_games/sdk/yoruk-game-sdk"` referansı, Docker build (`client/Dockerfile`) sırasında üst dizine erişilemediği için konteyner derlemesini kırmaktadır.
4. `docker-compose.yml` içindeki `game-server` konteyneri, SSO biletini doğrulamak için `http://backend:8080/api/v1/auth/exchange-ticket` adresine istek atmakta ancak `yoruk-net` ağına dahil olmadığı için `backend` konteynerini çözümleyememektedir.

---

## 2. Teknik Uygulama Adımları

### Adım 1.1: `@yorukgames/game-sdk` Paketinin Workspace İçine Alınması
- `packages/game-sdk/` altına SDK paketi (`package.json`, `tsconfig.json`, `src/index.ts`) yerleştirilerek `yoruk_strategy` monorepo'sunun dış dizinlere bağımlı olmadan tek başına (`docker compose build` ile) derlenmesi sağlanır.
- `client/package.json` içinde bağımlılık `"@yorukgames/game-sdk": "*"` olarak güncellenir.
- `client/Dockerfile` içinde `COPY packages/game-sdk ./packages/game-sdk` ve `RUN npm run build --workspace=@yorukgames/game-sdk` adımı eklenir.

### Adım 1.2: Dinamik WebSocket URL & Nginx `/ws` Proxy Yapılandırması
- `client/nginx.conf` dosyasına WebSocket yönlendirme bloğu eklenir:
  ```nginx
  location /ws {
      proxy_pass http://game-server:8081/ws;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
  }
  ```
- `client/src/net/networkManager.ts` içinde WebSocket adresi:
  - Eğer `import.meta.env.VITE_WS_URL` tanımlıysa onu kullanır,
  - Geliştirme portlarında (`3001` veya `5173`) doğrudan `ws://${window.location.hostname}:8081/ws` adresine bağlanır,
  - Üretim/Nginx ortamında ise `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws` üzerinden güvenli bağlanır.

### Adım 1.3: Port (`3001`) ve Docker Ağ (`yoruk-net`) Senkronizasyonu
- `yoruk_games` içindeki `DataInitializer.java` ve `frontend/src/lib/api.ts` dosyalarında `turan-tactics` varsayılan `launchUrl` adresi `http://localhost:3001` olarak eşitlenir.
- `yoruk_strategy/docker-compose.yml` dosyasında `game-server` servisi `yoruk-net` (`external: true`) ağına bağlanır.

### Adım 1.4: Tek Komutluk Kurulum Betiği (`deploy.sh`)
- `yoruk_strategy/deploy.sh` oluşturularak tıpkı çatı platformda olduğu gibi `./deploy.sh` komutuyla:
  1. `yoruk-net` ağ kontrolü,
  2. `git pull`,
  3. `docker compose build --pull`,
  4. `docker compose up -d --remove-orphans`
  adımlarını tek seferde çalıştırması sağlanır.

---

## 3. Kabul Kriterleri (DoD)
- [x] `docker compose build` komutu `yoruk_strategy` dizininde 0 hata ile tamamlanmalı.
- [x] Çatı platformdan (`http://localhost:3000` veya `:3080`) "Hemen Oyna" tıklandığında `http://localhost:3001?ticket=...` açılmalı ve SSO bilet takası hatasız gerçekleşmeli.
