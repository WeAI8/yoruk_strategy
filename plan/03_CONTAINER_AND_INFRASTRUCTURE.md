# YORUK STRATEGY — PLAN BÖLÜM 3: ALTYAPI & CONTAINER MİMARİSİ
# (CONTAINER ARCHITECTURE & DEVOPS SPECIFICATION)

================================================================================
1. DOCKER & SERVİS İZOLASYON PRENSİBİ
================================================================================
Oyun projesinin altyapısı, ana platformdan izole servislerle ayağa kalkacak şekilde tasarlanmalıdır. Platform veritabanı ile oyun veritabanı kesinlikle ayrı konteynerlerde yaşar.

### Port Haritası (Çakışma Önleme):
- **Yoruk Games Platformu (Mevcut):**
  - Frontend: `3000`
  - Backend API: `8080`
  - Platform DB: `5432`
  - Platform Redis: `6379`
- **Yoruk Strategy (Oyun Servisleri):**
  - Oyun İstemcisi (`client`): `3001`
  - Oyun Sunucusu (`server`): `8081`
  - Oyun Veritabanı (`game-db`): `5433` (Veritabanı adı: `yoruk_strategy_db`)
  - Oyun Redis State (`game-redis`): `6380`

================================================================================
2. TAVSİYE EDİLEN DOCKER COMPOSE ŞABLONU (`docker-compose.yml`)
================================================================================
Takım Lideri Ajanı (`team_lead`), projede aşağıdaki `docker-compose.yml` mimarisini uygulamalıdır:

```yaml
version: '3.8'

services:
  game-db:
    image: postgres:16-alpine
    container_name: yoruk_strategy_db
    environment:
      POSTGRES_DB: yoruk_strategy_db
      POSTGRES_USER: strategy_admin
      POSTGRES_PASSWORD: strategy_secret_password
    ports:
      - "5433:5432"
    volumes:
      - strategy_db_data:/var/lib/postgresql/data
    networks:
      - yoruk_strategy_net
      - yoruk_network # Platformla haberleşmek için ortak ağ

  game-redis:
    image: redis:7-alpine
    container_name: yoruk_strategy_redis
    ports:
      - "6380:6379"
    networks:
      - yoruk_strategy_net

  game-server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: yoruk_strategy_server
    ports:
      - "8081:8081"
    environment:
      PORT: 8081
      DATABASE_URL: postgres://strategy_admin:strategy_secret_password@game-db:5432/yoruk_strategy_db
      REDIS_URL: redis://game-redis:6379
      PLATFORM_AUTH_URL: http://backend:8080/api/v1/auth/exchange-ticket
      CLIENT_ID: game-client-strategy-01
      CLIENT_SECRET: yoruk_strategy_secret_key
    depends_on:
      - game-db
      - game-redis
    networks:
      - yoruk_strategy_net
      - yoruk_network

  game-client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: yoruk_strategy_client
    ports:
      - "3001:80"
    depends_on:
      - game-server
    networks:
      - yoruk_strategy_net

networks:
  yoruk_strategy_net:
    driver: bridge
  yoruk_network:
    external: true # yoruk_games docker-compose tarafından oluşturulan ağ

volumes:
  strategy_db_data:
```
