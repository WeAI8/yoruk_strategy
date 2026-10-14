FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core ./packages/core
COPY packages/game-sdk ./packages/game-sdk
COPY client ./client

RUN npm install
RUN npm run build --workspace=@yorukgames/game-sdk
RUN npm run build --workspace=@yorukstrategy/core
RUN npm run build --workspace=@yorukstrategy/client

FROM nginx:alpine AS runner

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
