# Stage 1: install workspace dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY apps/auth-service/package.json ./apps/auth-service/package.json
COPY apps/catalog-service/package.json ./apps/catalog-service/package.json
COPY apps/inventory-service/package.json ./apps/inventory-service/package.json
COPY apps/order-service/package.json ./apps/order-service/package.json
COPY apps/cart-service/package.json ./apps/cart-service/package.json
COPY apps/payment-service/package.json ./apps/payment-service/package.json
COPY apps/shipping-service/package.json ./apps/shipping-service/package.json
COPY apps/notification-service/package.json ./apps/notification-service/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci
# Stage 2: build application
FROM deps AS build
COPY apps/auth-service ./apps/auth-service
COPY packages/shared ./packages/shared
RUN npm exec --workspace auth-service -- prisma generate \
    --config prisma.config.ts \
    --schema prisma/schema.prisma
RUN npm run build --workspace @shared/utils \
    && npm run build --workspace auth-service
# Stage 3: production runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/auth-service/package.json ./apps/auth-service/package.json
COPY --from=build /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=build /app/apps/auth-service/prisma.config.ts ./apps/auth-service/prisma.config.ts
COPY --from=build /app/apps/auth-service/prisma ./apps/auth-service/prisma
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
EXPOSE 3001
CMD ["node", "apps/auth-service/dist/index.js"]