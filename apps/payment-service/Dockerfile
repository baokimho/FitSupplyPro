FROM node:20-alpine

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


RUN npm install

COPY apps/payment-service/tsconfig.json ./apps/payment-service/tsconfig.json
COPY apps/payment-service/prisma.config.ts ./apps/payment-service/prisma.config.ts
COPY apps/payment-service/prisma ./apps/payment-service/prisma
COPY apps/payment-service/src ./apps/payment-service/src
COPY packages/shared ./packages/shared

RUN npm run build --workspace @shared/utils && npm run build --workspace payment-service

EXPOSE 3006

CMD ["node", "apps/payment-service/dist/index.js"]
