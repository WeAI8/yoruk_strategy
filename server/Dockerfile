FROM node:22-alpine AS builder

WORKDIR /app

# Monorepo yapılandırması
COPY package.json package-lock.json ./
COPY packages/core ./packages/core
COPY server ./server

RUN npm install
RUN npm run build --workspace=@yorukstrategy/core
RUN npm run build --workspace=@yorukstrategy/server

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json

ENV NODE_ENV=production
ENV PORT=8081

EXPOSE 8081

CMD ["node", "server/dist/index.js"]
